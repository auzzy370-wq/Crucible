import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, canReview, isPremium } from "@/server/auth/session";
import { WorkspaceIde } from "@/components/workspace/ide";
import { isCodingProblem } from "@/server/challenges/coding-problems";

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      files: { orderBy: { path: "asc" } },
      commits: { orderBy: { createdAt: "desc" }, take: 20 },
      jobs: { orderBy: { createdAt: "desc" }, take: 12 },
      assignment: { include: { assessment: { include: { challenge: true } } } },
    },
  });
  if (!workspace) notFound();
  if (workspace.assignment.candidateId !== user!.id && !canReview(user!.role)) {
    notFound();
  }

  const challenge = workspace.assignment.assessment.challenge;
  const codingMode = isCodingProblem(challenge);
  const premium = isPremium(user);

  return (
    <WorkspaceIde
      workspaceId={workspace.id}
      assignmentId={workspace.assignmentId}
      title={workspace.assignment.assessment.title}
      track={workspace.assignment.assessment.track}
      language={workspace.language}
      files={workspace.files}
      commits={workspace.commits.map((c) => ({
        sha: c.sha,
        message: c.message,
        createdAt: c.createdAt.toISOString(),
      }))}
      jobs={workspace.jobs}
      role={user!.role}
      timedMinutes={workspace.assignment.assessment.timedMinutes}
      dueAt={workspace.assignment.dueAt?.toISOString() ?? null}
      startedAt={workspace.assignment.startedAt?.toISOString() ?? null}
      codingMode={codingMode}
      difficulty={challenge.difficulty}
      tags={challenge.tags}
      problemDescription={challenge.description}
      problemSummary={challenge.summary}
      premium={premium}
      companies={challenge.companies}
      isPremiumContent={challenge.isPremium}
    />
  );
}
