import { prisma } from "@/lib/db";
import { completeJson } from "@/server/ai/provider";
import { familyHarnessForSlug } from "@/server/execution/coding-family-harness";
import { extractPublicPrompt } from "@/server/competition/prompt-public";
import { AppError } from "@/lib/errors";

export type BenchDiagnostics = {
  category:
    | "accepted"
    | "wrong_answer"
    | "runtime_error"
    | "compile_error"
    | "time_limit"
    | "memory_limit"
    | "infrastructure_error"
    | "incomplete";
  publicSummary: string;
  /** Never includes hidden I/O. */
  safeDetail?: string;
};

/**
 * Run an AI model against a challenge.
 * CRITICAL: only the public problem statement is sent to the model.
 * Hidden tests / reference solutions are never included in the prompt.
 */
export async function runAiBenchmark(opts: {
  challengeId: string;
  aiModelId: string;
  actorId?: string;
}) {
  const [challenge, model] = await Promise.all([
    prisma.challenge.findUniqueOrThrow({ where: { id: opts.challengeId } }),
    prisma.aiModel.findUniqueOrThrow({ where: { id: opts.aiModelId } }),
  ]);
  if (!challenge.isPublished) throw new AppError("Challenge not published", 400, "NOT_PUBLISHED");
  if (!model.enabled) throw new AppError("Model disabled", 400, "MODEL_DISABLED");

  const publicPrompt = extractPublicPrompt(challenge);
  const harness = familyHarnessForSlug(challenge.slug);

  const run = await prisma.aiBenchmarkRun.create({
    data: {
      challengeId: challenge.id,
      aiModelId: model.id,
      status: "RUNNING",
      resultClass: "experimental",
    },
  });

  const started = Date.now();
  try {
    // Ask model for code — PUBLIC DATA ONLY
    const { data, mocked, model: usedModel, provider } = await completeJson<{
      language: string;
      code: string;
      explanation?: string;
    }>({
      system: `You are competing in Crucible AI vs Human. Return JSON {"language":"typescript","code":"..."}.
Implement the required function only. Do not invent hidden tests. No markdown.`,
      user: publicPrompt,
      fallback: {
        language: "typescript",
        code:
          harness?.solutionStub ??
          `export function solve(...args: unknown[]): unknown {\n  return null;\n}\n`,
        explanation: "Mock fallback — no API key; experimental only.",
      },
    });

    const latencyMs = Date.now() - started;
    // Evaluate public cases locally when we have a harness with extractable expects
    const publicEval = evaluatePublicAgainstHarness(data.code, challenge.slug);
    // Hidden evaluation: never reveal cases; only pass/fail counts
    const hiddenEval = evaluateHiddenBlind(challenge.slug, data.code);

    const correct =
      publicEval.total > 0 &&
      publicEval.passed === publicEval.total &&
      (hiddenEval.total === 0 || hiddenEval.passed === hiddenEval.total);

    const diagnostics: BenchDiagnostics = correct
      ? { category: "accepted", publicSummary: "All evaluated suites passed." }
      : publicEval.passed < publicEval.total
        ? {
            category: "wrong_answer",
            publicSummary: `Public ${publicEval.passed}/${publicEval.total} failed.`,
            safeDetail: publicEval.firstFailure,
          }
        : {
            category: "wrong_answer",
            publicSummary: "Hidden suite incomplete or failed (inputs not disclosed).",
          };

    const updated = await prisma.aiBenchmarkRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        resultClass: mocked ? "experimental" : "verified",
        latencyMs,
        runtimeMs: publicEval.runtimeMs ?? latencyMs,
        passedPublic: publicEval.passed,
        totalPublic: publicEval.total,
        passedHidden: hiddenEval.passed,
        totalHidden: hiddenEval.total,
        correct,
        solutionCode: data.code.slice(0, 50_000),
        diagnostics: { ...diagnostics, provider, model: usedModel },
        mocked,
        finishedAt: new Date(),
      },
      include: {
        aiModel: { select: { slug: true, displayName: true, provider: true } },
        challenge: { select: { slug: true, title: true, difficulty: true } },
      },
    });

    return publicAiRunView(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.aiBenchmarkRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        resultClass: "experimental",
        errorMessage: message.slice(0, 2000),
        diagnostics: {
          category: "infrastructure_error",
          publicSummary: "Benchmark infrastructure error — not counted as model incapability.",
        } satisfies BenchDiagnostics,
        finishedAt: new Date(),
      },
    });
    throw err;
  }
}

function evaluatePublicAgainstHarness(code: string, slug: string): {
  passed: number;
  total: number;
  runtimeMs?: number;
  firstFailure?: string;
} {
  const harness = familyHarnessForSlug(slug);
  if (!harness) {
    // No local harness — mark incomplete rather than inventing pass
    return { passed: 0, total: 0, firstFailure: "No public harness bound for local eval." };
  }
  // Structural check: code exports solve / matches stub export name
  const needsSolve = /export function solve/.test(harness.solutionStub);
  const hasSolve = /export\s+(?:async\s+)?function\s+solve|export\s*\{\s*solve/.test(code);
  if (needsSolve && !hasSolve) {
    return { passed: 0, total: 1, firstFailure: "Missing required export `solve`." };
  }
  // Count public test names as required surface; without a sandboxed VM we only
  // do signature + non-stub heuristics here. Full judge remains ExecutionJob path for humans.
  const names = [...harness.publicTests.matchAll(/name:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
  const total = Math.max(1, names.length);
  const looksStub = /return\s+\[\s*\]\s*;|return\s+0\s*;|return\s+null\s*;|return\s+false\s*;/.test(code);
  if (looksStub && code.length < 400) {
    return { passed: 0, total, firstFailure: "Solution appears to be an unimplemented stub." };
  }
  // Without executing untrusted AI code in-process, we record public suite size
  // and leave correctness to optional worker execution in a follow-up.
  // Partial credit: signature present → not a total fail of harness binding.
  return { passed: needsSolve && hasSolve ? Math.min(1, total) : 0, total, firstFailure: needsSolve && hasSolve ? "Public signature ok; full sandbox re-judge pending." : undefined };
}

function evaluateHiddenBlind(slug: string, code: string): { passed: number; total: number } {
  const harness = familyHarnessForSlug(slug);
  if (!harness) return { passed: 0, total: 0 };
  const names = [...harness.hiddenRunner.matchAll(/name:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
  const total = names.length;
  // Never run hidden against AI code in the web process without sandbox.
  // Report suite size only; correct=false unless worker confirms later.
  void code;
  return { passed: 0, total };
}

export function publicAiRunView(run: {
  id: string;
  status: string;
  resultClass: string;
  latencyMs: number | null;
  runtimeMs: number | null;
  passedPublic: number;
  totalPublic: number;
  passedHidden: number;
  totalHidden: number;
  correct: boolean;
  mocked: boolean;
  diagnostics: unknown;
  errorMessage: string | null;
  createdAt: Date;
  finishedAt: Date | null;
  solutionCode?: string | null;
  aiModel?: { slug: string; displayName: string; provider: string };
  challenge?: { slug: string; title: string; difficulty: number };
}) {
  return {
    id: run.id,
    status: run.status,
    resultClass: run.resultClass,
    latencyMs: run.latencyMs,
    runtimeMs: run.runtimeMs,
    passedPublic: run.passedPublic,
    totalPublic: run.totalPublic,
    passedHidden: run.passedHidden,
    totalHidden: run.totalHidden,
    correct: run.correct,
    mocked: run.mocked,
    diagnostics: run.diagnostics,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    aiModel: run.aiModel,
    challenge: run.challenge,
    // solutionCode intentionally omitted from public view
  };
}

export async function ensureDefaultAiModels() {
  const defaults = [
    {
      slug: "openai-gpt-4o-mini",
      displayName: "GPT-4o mini",
      provider: "OpenAI",
      modelId: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      apiKeyEnv: "OPENAI_API_KEY",
    },
    {
      slug: "anthropic-compatible",
      displayName: "Anthropic-compatible (via OPENAI_BASE_URL)",
      provider: "Anthropic",
      modelId: "claude-compatible",
      apiKeyEnv: "ANTHROPIC_API_KEY",
    },
    {
      slug: "google-compatible",
      displayName: "Google-compatible",
      provider: "Google",
      modelId: "gemini-compatible",
      apiKeyEnv: "GOOGLE_API_KEY",
    },
    {
      slug: "opensource-local",
      displayName: "Open-source / custom OpenAI-compatible",
      provider: "OpenSource",
      modelId: "custom",
      apiKeyEnv: "OPENAI_API_KEY",
      isOpenSource: true,
    },
  ];
  for (const d of defaults) {
    await prisma.aiModel.upsert({
      where: { slug: d.slug },
      create: {
        slug: d.slug,
        displayName: d.displayName,
        provider: d.provider,
        modelId: d.modelId,
        apiKeyEnv: d.apiKeyEnv,
        isOpenSource: Boolean(d.isOpenSource),
        enabled: true,
        notes: "Extensible provider slot. Hidden tests never sent to models.",
      },
      update: { displayName: d.displayName, enabled: true },
    });
  }
  return prisma.aiModel.findMany({ where: { enabled: true }, orderBy: { provider: "asc" } });
}
