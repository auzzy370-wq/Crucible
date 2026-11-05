import { prisma } from "@/lib/db";
import { enqueueExecution } from "@/server/execution/runner";
import { evaluateSubmission } from "@/server/ai/evaluate";
import { logger } from "@/lib/logger";

async function waitForJob(id: string, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await prisma.executionJob.findUnique({ where: { id }, select: { status: true } });
    if (job && (job.status === "SUCCEEDED" || job.status === "FAILED" || job.status === "TIMEOUT")) {
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

export type AutoScoreRow = {
  assignmentId: string;
  assessmentTitle: string;
  candidateEmail: string;
  overall: number | null;
  qualified: boolean | null;
  error?: string;
};

/**
 * Admin-only: for every active assignment with a workspace, run public + hidden
 * tests (and deploy check when relevant), then post a ScoreReport.
 */
export async function autoScoreAllAssignments(opts?: { limit?: number }): Promise<{
  results: AutoScoreRow[];
  summary: string;
}> {
  const limit = Math.min(opts?.limit ?? 50, 100);
  const assignments = await prisma.assessmentAssignment.findMany({
    where: {
      status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "GRADING", "COMPLETED"] },
      workspace: { isNot: null },
    },
    include: {
      assessment: { select: { title: true } },
      candidate: { select: { email: true } },
      workspace: { select: { id: true } },
      scoreReport: { select: { overall: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const results: AutoScoreRow[] = [];

  for (const a of assignments) {
    if (!a.workspace) continue;
    try {
      await prisma.assessmentAssignment.update({
        where: { id: a.id },
        data: { status: "GRADING", submittedAt: a.submittedAt ?? new Date() },
      });

      const submission = await prisma.submission.create({
        data: { assignmentId: a.id, notes: "admin-auto-score" },
      });

      const testJob = await enqueueExecution({ workspaceId: a.workspace.id, type: "test" });
      const hiddenJob = await enqueueExecution({ workspaceId: a.workspace.id, type: "hidden_test" });
      const deployJob = await enqueueExecution({ workspaceId: a.workspace.id, type: "deploy_check" });

      for (const id of [testJob.id, hiddenJob.id, deployJob.id]) {
        await waitForJob(id);
      }

      const report = await evaluateSubmission(submission.id);
      results.push({
        assignmentId: a.id,
        assessmentTitle: a.assessment.title,
        candidateEmail: a.candidate.email,
        overall: report.overall ?? null,
        qualified: report.qualified ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("auto-score failed", { assignmentId: a.id, message });
      results.push({
        assignmentId: a.id,
        assessmentTitle: a.assessment.title,
        candidateEmail: a.candidate.email,
        overall: a.scoreReport?.overall ?? null,
        qualified: null,
        error: message.slice(0, 240),
      });
    }
  }

  const scored = results.filter((r) => r.overall != null && !r.error).length;
  return {
    results,
    summary: `Scored ${scored}/${results.length} assignments`,
  };
}
