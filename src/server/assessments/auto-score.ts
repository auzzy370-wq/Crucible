import { prisma } from "@/lib/db";
import { enqueueExecution } from "@/server/execution/runner";
import { evaluateSubmission } from "@/server/ai/evaluate";
import { logger } from "@/lib/logger";

async function waitForJob(id: string, timeoutMs = 45_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await prisma.executionJob.findUnique({ where: { id }, select: { status: true } });
    if (job && (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "TIMEOUT")) {
      return job.status;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return "TIMEOUT";
}

export type AutoScoreRow = {
  assignmentId: string;
  assessmentTitle: string;
  candidateEmail: string;
  overall: number | null;
  qualified: boolean | null;
  error?: string;
};

async function scoreOneAssignment(a: {
  id: string;
  submittedAt: Date | null;
  assessment: { title: string; challenge: { type: string } };
  candidate: { email: string };
  workspace: { id: string } | null;
  scoreReport: { overall: number } | null;
  skipFreshRuns?: boolean;
}): Promise<AutoScoreRow> {
  if (!a.workspace) {
    return {
      assignmentId: a.id,
      assessmentTitle: a.assessment.title,
      candidateEmail: a.candidate.email,
      overall: a.scoreReport?.overall ?? null,
      qualified: null,
      error: "No workspace",
    };
  }

  try {
    await prisma.assessmentAssignment.update({
      where: { id: a.id },
      data: { status: "GRADING", submittedAt: a.submittedAt ?? new Date() },
    });

    const submission = await prisma.submission.create({
      data: { assignmentId: a.id, notes: "admin-auto-score" },
    });

    const recent = await prisma.executionJob.findFirst({
      where: {
        workspaceId: a.workspace.id,
        type: "test",
        status: { in: ["SUCCEEDED", "FAILED"] },
        createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent && a.skipFreshRuns) {
      // Reuse recent harness output — attach runs to this submission for scoring
      const latestRuns = await prisma.testRun.findMany({
        where: { job: { workspaceId: a.workspace.id } },
        orderBy: { createdAt: "desc" },
        take: 4,
      });
      for (const run of latestRuns) {
        await prisma.testRun.update({
          where: { id: run.id },
          data: { submissionId: submission.id },
        });
      }
    } else {
      const isCoding = a.assessment.challenge.type === "CODING_PROBLEM";
      const testJob = await enqueueExecution({ workspaceId: a.workspace.id, type: "test" });
      await waitForJob(testJob.id);
      const hiddenJob = await enqueueExecution({ workspaceId: a.workspace.id, type: "hidden_test" });
      await waitForJob(hiddenJob.id);
      if (!isCoding) {
        const deployJob = await enqueueExecution({ workspaceId: a.workspace.id, type: "deploy_check" });
        await waitForJob(deployJob.id);
      }
    }

    const report = await evaluateSubmission(submission.id);
    await prisma.assessmentAssignment.update({
      where: { id: a.id },
      data: { status: report.qualified ? "COMPLETED" : "UNDER_REVIEW" },
    });
    return {
      assignmentId: a.id,
      assessmentTitle: a.assessment.title,
      candidateEmail: a.candidate.email,
      overall: report.overall ?? null,
      qualified: report.qualified ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("auto-score failed", { assignmentId: a.id, message });
    return {
      assignmentId: a.id,
      assessmentTitle: a.assessment.title,
      candidateEmail: a.candidate.email,
      overall: a.scoreReport?.overall ?? null,
      qualified: null,
      error: message.slice(0, 240),
    };
  }
}

/**
 * Admin-only: for every active assignment with a workspace, run public + hidden
 * tests (and deploy check when relevant), then post a ScoreReport.
 * Runs a small concurrency pool so large batches finish within serverless limits.
 */
export async function autoScoreAllAssignments(opts?: {
  limit?: number;
  concurrency?: number;
  /** Prefer posting scores from recent runs instead of re-executing every harness. */
  reuseRecentRuns?: boolean;
}): Promise<{
  results: AutoScoreRow[];
  summary: string;
}> {
  const limit = Math.min(opts?.limit ?? 200, 500);
  const concurrency = Math.min(Math.max(opts?.concurrency ?? 4, 1), 8);
  const reuseRecentRuns = opts?.reuseRecentRuns !== false;
  const assignments = await prisma.assessmentAssignment.findMany({
    where: {
      status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "GRADING", "COMPLETED"] },
      workspace: { isNot: null },
    },
    include: {
      assessment: { select: { title: true, challenge: { select: { type: true } } } },
      candidate: { select: { email: true } },
      workspace: { select: { id: true } },
      scoreReport: { select: { overall: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const results: AutoScoreRow[] = [];
  for (let i = 0; i < assignments.length; i += concurrency) {
    const chunk = assignments.slice(i, i + concurrency);
    const scored = await Promise.all(
      chunk.map((a) => scoreOneAssignment({ ...a, skipFreshRuns: reuseRecentRuns })),
    );
    results.push(...scored);
  }

  const scored = results.filter((r) => r.overall != null && !r.error).length;
  return {
    results,
    summary: `Scored ${scored}/${results.length} assignments`,
  };
}
