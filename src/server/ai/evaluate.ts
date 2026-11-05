import { prisma } from "@/lib/db";
import { completeJson } from "./provider";
import {
  ScoreBreakdown,
  computeOverall,
  evaluateMandatory,
  DEFAULT_WEIGHTS,
  weightsForTrack,
} from "@/server/scoring/policy";
import { buildAssignmentPinpoint, persistPinpoint, type CaseResult } from "@/server/scoring/diagnostics";

export async function evaluateSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      testRuns: true,
      assignment: {
        include: {
          assessment: { include: { challenge: true, scoringPolicy: true } },
          workspace: { include: { files: true, commits: true } },
          deployments: true,
          reviews: true,
          followUps: { include: { answers: true } },
        },
      },
    },
  });
  if (!submission) throw new Error("Submission not found");

  const testRuns = submission.testRuns;
  const latest = testRuns[testRuns.length - 1];
  const deploymentOk = submission.assignment.deployments.some((d) => d.success);
  const hiddenTestsOk = !!latest && latest.hiddenFailed === 0 && latest.hiddenPassed > 0;
  const publicPassRate =
    latest && latest.passed + latest.failed > 0
      ? latest.passed / (latest.passed + latest.failed)
      : 0;

  const fileCount = submission.assignment.workspace?.files.length ?? 0;
  const commitCount = submission.assignment.workspace?.commits.length ?? 0;
  const hasAuth = submission.assignment.workspace?.files.some((f) =>
    /auth|session|login/i.test(f.path + f.content),
  );
  const hasTests = submission.assignment.workspace?.files.some((f) =>
    /test|spec/i.test(f.path),
  );
  const hasDockerfile = submission.assignment.workspace?.files.some((f) =>
    /dockerfile|compose/i.test(f.path),
  );

  // Deterministic evidence-based baseline (never invents test results)
  const scores: ScoreBreakdown = {
    frontend: clamp(40 + publicPassRate * 30 + (fileCount > 3 ? 10 : 0)),
    backend: clamp(45 + publicPassRate * 35 + (hasAuth ? 10 : 0)),
    database: clamp(40 + (hasAuth ? 15 : 0) + publicPassRate * 20),
    architecture: clamp(35 + (fileCount > 5 ? 20 : 10) + (commitCount > 1 ? 10 : 0)),
    infrastructure: clamp(30 + (hasDockerfile ? 40 : 10) + (deploymentOk ? 25 : 0)),
    security: clamp(35 + (hasAuth ? 25 : 0) + (hiddenTestsOk ? 20 : 0)),
    testing: clamp(20 + publicPassRate * 50 + (hasTests ? 20 : 0) + (hiddenTestsOk ? 10 : 0)),
    problemSolving: clamp(40 + submission.assignment.currentLevel * 5 + publicPassRate * 20),
    performance: clamp(40 + (deploymentOk ? 20 : 0)),
    collaboration: clamp(50), // updated by team assessment when present
  };

  const incident = await prisma.incidentRun.findFirst({
    where: { candidateId: submission.assignment.candidateId, recovered: true },
  });
  const architecture = await prisma.architectureSubmission.findFirst({
    where: { assignmentId: submission.assignmentId },
  });
  const teamMembership = await prisma.teamMember.findFirst({
    where: { userId: submission.assignment.candidateId },
  });
  const humanApproved = submission.assignment.reviews.some((r) => r.decision === "APPROVE");

  if (teamMembership) scores.collaboration = clamp(scores.collaboration + 25);
  if (architecture) scores.architecture = clamp(Math.max(scores.architecture, architecture.score ?? 70));
  if (incident?.recovered) scores.problemSolving = clamp(scores.problemSolving + 15);

  const track = submission.assignment.assessment.track;
  const weights = weightsForTrack(track);
  // Cybersecurity track elevates security evidence signals
  if (track === "CYBERSECURITY") {
    scores.security = clamp(scores.security + (hiddenTestsOk ? 10 : 0) + (hasAuth ? 5 : 0));
  }
  const overall = computeOverall(scores, weights);
  const teamRequired = submission.assignment.assessment.allowTeam || track !== "CYBERSECURITY";
  const mandatory = evaluateMandatory({
    overall,
    scores,
    weights,
    deploymentOk,
    hiddenTestsOk,
    incidentOk: !!incident?.recovered,
    architectureOk: !!architecture,
    teamOk: teamRequired ? !!teamMembership : true,
    humanApproved,
    criticalSecurity: false,
  });

  const evidencePack = {
    verifiedFacts: {
      publicTestsPassed: latest?.passed ?? 0,
      publicTestsFailed: latest?.failed ?? 0,
      hiddenTestsPassed: latest?.hiddenPassed ?? 0,
      hiddenTestsFailed: latest?.hiddenFailed ?? 0,
      deploymentOk,
      commitCount,
      fileCount,
      humanApproved,
    },
    inferences: {
      hasAuthPatterns: !!hasAuth,
      hasTestFiles: !!hasTests,
      hasContainerization: !!hasDockerfile,
    },
    unknown: [
      "Production load behavior under real traffic",
      "Long-term maintainability without additional review",
    ],
  };

  const ai = await completeJson<{
    narrative: string;
    strengths: string[];
    weaknesses: string[];
    followUpQuestions: string[];
    categoryNotes: Record<string, string>;
  }>({
    system:
      "You are an elite engineering assessment assistant. Use only provided evidence. Distinguish facts, inferences, and unknowns. Never invent test results. Return JSON.",
    user: JSON.stringify({
      challenge: submission.assignment.assessment.challenge.title,
      scores,
      evidencePack,
      mandatory,
    }),
    fallback: {
      narrative:
        "Evidence-based automated evaluation completed. Scores derive from observed repository contents, automated test outcomes, deployment verification, and mandatory gate status. AI did not invent test execution results.",
      strengths: [
        publicPassRate > 0.7 ? "Strong automated public test pass rate" : "Submission present with measurable artifacts",
        deploymentOk ? "Deployment verification succeeded" : "Workspace contains implementable project structure",
      ],
      weaknesses: [
        !hiddenTestsOk ? "Hidden tests incomplete or failing" : "Further human review recommended",
        !humanApproved ? "Awaiting human technical reviewer approval" : "Calibrate against reference solution difficulty",
      ],
      followUpQuestions: [
        "Explain your authentication and session security model.",
        "Where could race conditions occur in your data layer?",
        "How would your system recover if the payment provider fails mid-transaction?",
        "Identify one vulnerability in your own implementation and how you would fix it.",
      ],
      categoryNotes: {
        testing: `Verified facts: passed=${latest?.passed ?? 0}, failed=${latest?.failed ?? 0}, hiddenPassed=${latest?.hiddenPassed ?? 0}, hiddenFailed=${latest?.hiddenFailed ?? 0}`,
      },
    },
  });

  await prisma.aiEvaluation.create({
    data: {
      submissionId,
      provider: ai.provider,
      model: ai.model,
      report: {
        scores,
        overall,
        mandatory,
        evidencePack,
        ai: ai.data,
        mocked: ai.mocked,
      },
      rawResponse: JSON.stringify(ai.data),
    },
  });

  const strengths = Array.isArray(ai.data?.strengths) ? ai.data.strengths : [];
  const weaknesses = Array.isArray(ai.data?.weaknesses) ? ai.data.weaknesses : [];
  const followUps = Array.isArray(ai.data?.followUpQuestions) ? ai.data.followUpQuestions : [];
  const narrative =
    typeof ai.data?.narrative === "string" && ai.data.narrative
      ? ai.data.narrative
      : "Evidence-based automated evaluation completed.";
  const categoryNotes =
    ai.data?.categoryNotes && typeof ai.data.categoryNotes === "object" ? ai.data.categoryNotes : {};

  const report = await prisma.scoreReport.upsert({
    where: { assignmentId: submission.assignmentId },
    create: {
      assignmentId: submission.assignmentId,
      overall,
      ...scores,
      qualified: mandatory.qualified,
      tier: mandatory.tier,
      mandatoryFailures: mandatory.failures,
      calibrated: true,
      categories: {
        create: Object.entries(scores).map(([criterion, score]) => ({
          criterion,
          score,
          maxScore: (weights as Record<string, number>)[criterion] ?? DEFAULT_WEIGHTS[criterion as keyof typeof DEFAULT_WEIGHTS],
          evidenceKind: "FACT" as const,
          observed: evidencePack.verifiedFacts
            ? JSON.stringify(evidencePack.verifiedFacts)
            : "See evaluation report",
          automated: categoryNotes[criterion],
          strengths: strengths.slice(0, 2),
          weaknesses: weaknesses.slice(0, 2),
          explanation: narrative,
          followUps: followUps.slice(0, 2),
        })),
      },
    },
    update: {
      overall,
      ...scores,
      qualified: mandatory.qualified,
      tier: mandatory.tier,
      mandatoryFailures: mandatory.failures,
      calibrated: true,
    },
    include: { categories: true },
  });

  // Persist follow-up questions for verification of real engineering knowledge
  for (const prompt of followUps.slice(0, 4)) {
    if (!prompt) continue;
    await prisma.followUpQuestion.create({
      data: { assignmentId: submission.assignmentId, prompt, difficulty: 3 },
    });
  }

  // Pinpoint exactly what tests prove this developer knows
  const challenge = submission.assignment.assessment.challenge;
  const cases = await collectCaseResults(
    submission.assignmentId,
    submission.assignment.workspace?.id ?? null,
  );
  const pinpoint = buildAssignmentPinpoint({
    challengeSlug: challenge.slug,
    challengeTitle: challenge.title,
    difficulty: challenge.difficulty,
    tags: challenge.tags,
    cases,
  });
  await persistPinpoint({
    assignmentId: submission.assignmentId,
    candidateId: submission.assignment.candidateId,
    pinpoint,
  });

  await prisma.scoreReport.update({
    where: { id: report.id },
    data: { diagnostics: pinpoint as object },
  });

  await prisma.assessmentAssignment.update({
    where: { id: submission.assignmentId },
    data: { status: humanApproved && mandatory.qualified ? "COMPLETED" : "UNDER_REVIEW" },
  });

  return { ...report, diagnostics: pinpoint };
}

async function collectCaseResults(assignmentId: string, workspaceId: string | null): Promise<CaseResult[]> {
  if (!workspaceId) return [];
  const jobs = await prisma.executionJob.findMany({
    where: { workspaceId, type: { in: ["test", "hidden_test"] } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const merged: CaseResult[] = [];
  for (const job of jobs) {
    const hidden = job.type === "hidden_test";
    for (const r of parseCases(job.stdout)) {
      const row = { ...r, hidden: r.hidden ?? hidden };
      if (!merged.find((m) => m.name === row.name && Boolean(m.hidden) === Boolean(row.hidden))) {
        merged.push(row);
      }
    }
  }
  // Also fold TestRun counters into synthetic cases when stdout missing
  const runs = await prisma.testRun.findMany({
    where: { submission: { assignmentId } },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  for (const run of runs) {
    if (!merged.length) {
      for (let i = 0; i < run.passed; i++) merged.push({ name: `public_pass_${i + 1}`, pass: true });
      for (let i = 0; i < run.failed; i++) merged.push({ name: `public_fail_${i + 1}`, pass: false });
      for (let i = 0; i < run.hiddenPassed; i++) merged.push({ name: `hidden_pass_${i + 1}`, pass: true, hidden: true });
      for (let i = 0; i < run.hiddenFailed; i++) merged.push({ name: `hidden_fail_${i + 1}`, pass: false, hidden: true });
    }
  }
  return merged;
}

function parseCases(stdout: string | null | undefined): CaseResult[] {
  if (!stdout) return [];
  try {
    const line = stdout
      .trim()
      .split("\n")
      .reverse()
      .find((l) => l.trim().startsWith("{"));
    if (!line) return [];
    const parsed = JSON.parse(line) as { results?: CaseResult[] };
    return parsed.results ?? [];
  } catch {
    return [];
  }
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}
