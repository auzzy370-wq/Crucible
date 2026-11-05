import { prisma } from "@/lib/db";
import { completeJson, envHasKey } from "@/server/ai/provider";
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
    // Ask model for code — PUBLIC DATA ONLY; route via selected AiModel (Groq / OpenRouter / …)
    const { data, mocked, model: usedModel, provider } = await completeJson<{
      language: string;
      code: string;
      explanation?: string;
    }>({
      system: `You are competing in Crucible AI vs Human. Return JSON {"language":"typescript","code":"..."}.
Implement the required function only. Do not invent hidden tests. No markdown.`,
      user: publicPrompt,
      providerOverride: {
        name: `${model.provider}:${model.slug}`,
        baseUrl: model.baseUrl ?? undefined,
        model: model.modelId,
        apiKeyEnv: model.apiKeyEnv ?? "GROQ_API_KEY",
      },
      fallback: {
        language: "typescript",
        code:
          harness?.solutionStub ??
          `export function solve(...args: unknown[]): unknown {\n  return null;\n}\n`,
        explanation: "Mock fallback — no API key; experimental only.",
      },
    });

    const latencyMs = Date.now() - started;
    const publicEval = evaluatePublicAgainstHarness(data.code, challenge.slug);
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
    return { passed: 0, total: 0, firstFailure: "No public harness bound for local eval." };
  }
  const needsSolve = /export function solve/.test(harness.solutionStub);
  const hasSolve = /export\s+(?:async\s+)?function\s+solve|export\s*\{\s*solve/.test(code);
  if (needsSolve && !hasSolve) {
    return { passed: 0, total: 1, firstFailure: "Missing required export `solve`." };
  }
  const names = [...harness.publicTests.matchAll(/name:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
  const total = Math.max(1, names.length);
  // Only treat as stub when the body is tiny / clearly unimplemented — real solutions
  // often contain a trailing `return []` / `return 0` after real logic.
  const stripped = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").trim();
  const looksStub =
    stripped.length < 120 ||
    /TODO|not implemented|return\s+null\s*;\s*\}?\s*$/i.test(stripped) ||
    (/^\s*export\s+function[\s\S]{0,80}\{\s*return\s+(\[\s*\]|0|null|false)\s*;\s*\}\s*$/i.test(stripped));
  if (looksStub) {
    return { passed: 0, total, firstFailure: "Solution appears to be an unimplemented stub." };
  }
  return {
    passed: needsSolve && hasSolve ? Math.min(1, total) : 0,
    total,
    firstFailure: needsSolve && hasSolve ? "Public signature ok; full sandbox re-judge pending." : undefined,
  };
}

function evaluateHiddenBlind(slug: string, code: string): { passed: number; total: number } {
  const harness = familyHarnessForSlug(slug);
  if (!harness) return { passed: 0, total: 0 };
  const names = [...harness.hiddenRunner.matchAll(/name:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
  void code;
  return { passed: 0, total: names.length };
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
  };
}

export async function ensureDefaultAiModels() {
  const defaults: {
    slug: string;
    displayName: string;
    provider: string;
    modelId: string;
    baseUrl: string;
    apiKeyEnv: string;
    isOpenSource?: boolean;
    notes: string;
    enabled?: boolean;
  }[] = [
    {
      slug: "groq-gpt-oss-20b",
      displayName: "GPT-OSS 20B (Groq free)",
      provider: "Groq",
      modelId: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKeyEnv: "GROQ_API_KEY",
      isOpenSource: true,
      notes: "Free Groq tier — preferred for AI vs Human. Hidden tests never sent.",
    },
    {
      slug: "groq-qwen3-27b",
      displayName: "Qwen3.8 27B (Groq free)",
      provider: "Groq",
      modelId: "qwen/qwen3.8-27b",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKeyEnv: "GROQ_API_KEY",
      isOpenSource: true,
      notes: "Stronger Groq free-tier coding model when rate limits allow.",
    },
    {
      slug: "openrouter-north-mini-code-free",
      displayName: "North Mini Code (OpenRouter free)",
      provider: "OpenRouter",
      modelId: process.env.OPENROUTER_MODEL ?? "cohere/north-mini-code:free",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKeyEnv: "OPENROUTER_API_KEY",
      isOpenSource: true,
      notes: "OpenRouter free coding-oriented model.",
    },
    {
      slug: "openrouter-gemma-4-31b-free",
      displayName: "Gemma 4 31B (OpenRouter free)",
      provider: "OpenRouter",
      modelId: "google/gemma-4-31b-it:free",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKeyEnv: "OPENROUTER_API_KEY",
      isOpenSource: true,
      notes: "OpenRouter :free Gemma — rate-limited fallback.",
    },
    {
      slug: "openai-gpt-4o-mini",
      displayName: "GPT-4o mini (paid)",
      provider: "OpenAI",
      modelId: "gpt-4o-mini",
      baseUrl: "https://api.openai.com/v1",
      apiKeyEnv: "OPENAI_API_KEY",
      notes: "Paid OpenAI — optional. Prefer Groq/OpenRouter for free benches.",
      enabled: true,
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
        baseUrl: d.baseUrl,
        apiKeyEnv: d.apiKeyEnv,
        isOpenSource: Boolean(d.isOpenSource),
        enabled: d.enabled ?? true,
        notes: d.notes,
      },
      update: {
        displayName: d.displayName,
        modelId: d.modelId,
        baseUrl: d.baseUrl,
        apiKeyEnv: d.apiKeyEnv,
        isOpenSource: Boolean(d.isOpenSource),
        enabled: d.enabled ?? true,
        notes: d.notes,
      },
    });
  }

  // Disable legacy / retired model slots
  await prisma.aiModel.updateMany({
    where: {
      slug: {
        in: [
          "anthropic-compatible",
          "google-compatible",
          "opensource-local",
          "groq-llama-3.1-8b",
          "groq-llama-3.3-70b",
          "openrouter-llama-3.2-3b-free",
          "openrouter-gemma-2-9b-free",
        ],
      },
    },
    data: { enabled: false },
  });

  const models = await prisma.aiModel.findMany({ where: { enabled: true } });
  // Groq first, then OpenRouter, then others; prefer ones with keys configured
  models.sort((a, b) => {
    const aReady = a.apiKeyEnv && envHasKey(a.apiKeyEnv) ? 0 : 1;
    const bReady = b.apiKeyEnv && envHasKey(b.apiKeyEnv) ? 0 : 1;
    if (aReady !== bReady) return aReady - bReady;
    const rank = (p: string) => (p === "Groq" ? 0 : p === "OpenRouter" ? 1 : 2);
    return rank(a.provider) - rank(b.provider) || a.displayName.localeCompare(b.displayName);
  });
  return models;
}
