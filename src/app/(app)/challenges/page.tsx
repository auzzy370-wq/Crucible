import { prisma } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";
import { Problemset } from "@/components/challenges/problemset";
import { isCodingProblem } from "@/server/challenges/coding-problems";

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();

  const challenges = await prisma.challenge.findMany({
    where: {
      isPublished: true,
      ...(sp.track ? { track: sp.track as never } : {}),
    },
    include: {
      assessments: {
        where: { status: "PUBLISHED" },
        take: 1,
      },
    },
    orderBy: [{ difficulty: "asc" }, { title: "asc" }],
  });

  const workspaceByAssessment = new Map<string, string>();
  if (user) {
    const myAssignments = await prisma.assessmentAssignment.findMany({
      where: {
        candidateId: user.id,
        assessmentId: { in: challenges.flatMap((c) => c.assessments.map((a) => a.id)) },
      },
      include: { workspace: true },
    });
    for (const a of myAssignments) {
      if (a.workspace) workspaceByAssessment.set(a.assessmentId, a.workspace.id);
    }
  }

  const rows = challenges.map((c) => {
    const assessment = c.assessments[0];
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      description: c.description,
      type: c.type,
      track: c.track,
      difficulty: c.difficulty,
      tags: c.tags,
      languages: c.languages,
      estimatedDays: c.estimatedDays,
      owaspMappings: c.owaspMappings,
      mitreMappings: c.mitreMappings,
      assessmentId: assessment?.id ?? null,
      workspaceId: assessment ? workspaceByAssessment.get(assessment.id) ?? null : null,
    };
  });

  const problems = rows.filter((r) => isCodingProblem(r));
  const projects = rows.filter((r) => !isCodingProblem(r));

  return (
    <Problemset
      problems={problems}
      projects={projects}
      initialMode={sp.view === "projects" ? "projects" : "problemset"}
    />
  );
}
