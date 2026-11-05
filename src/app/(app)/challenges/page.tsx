import { prisma } from "@/lib/db";
import { getSessionUser, isPremium } from "@/server/auth/session";
import { Problemset } from "@/components/challenges/problemset";
import { isCodingProblem } from "@/server/challenges/coding-problems";
import { editorialSlugByChallengeSlug, resolveEditorialSlug } from "@/server/saas/editorials";

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();

  // Lean list payload only — full descriptions load inside the IDE, not the bank.
  const [challenges, editorialMap] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        isPublished: true,
        ...(sp.track ? { track: sp.track as never } : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        type: true,
        track: true,
        difficulty: true,
        tags: true,
        languages: true,
        estimatedDays: true,
        companies: true,
        frequency: true,
        avgMinutes: true,
        isPremium: true,
        owaspMappings: true,
        mitreMappings: true,
        assessments: {
          where: { status: "PUBLISHED" },
          take: 1,
          select: { id: true },
        },
      },
      orderBy: [{ difficulty: "asc" }, { title: "asc" }],
    }),
    editorialSlugByChallengeSlug(),
  ]);

  const workspaceByAssessment = new Map<string, string>();
  if (user) {
    const assessmentIds = challenges.flatMap((c) => c.assessments.map((a) => a.id));
    if (assessmentIds.length) {
      const myAssignments = await prisma.assessmentAssignment.findMany({
        where: {
          candidateId: user.id,
          assessmentId: { in: assessmentIds },
        },
        select: { assessmentId: true, workspace: { select: { id: true } } },
      });
      for (const a of myAssignments) {
        if (a.workspace) workspaceByAssessment.set(a.assessmentId, a.workspace.id);
      }
    }
  }

  const rows = challenges.map((c) => {
    const assessment = c.assessments[0];
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      description: "",
      type: c.type,
      track: c.track,
      difficulty: c.difficulty,
      tags: c.tags,
      languages: c.languages,
      estimatedDays: c.estimatedDays,
      companies: c.companies,
      frequency: c.frequency,
      avgMinutes: c.avgMinutes,
      isPremium: c.isPremium,
      owaspMappings: c.owaspMappings,
      mitreMappings: c.mitreMappings,
      assessmentId: assessment?.id ?? null,
      workspaceId: assessment ? workspaceByAssessment.get(assessment.id) ?? null : null,
      editorialSlug: resolveEditorialSlug(c.slug, editorialMap),
    };
  });

  const problems = rows.filter((r) => isCodingProblem(r));
  const projects = rows.filter((r) => !isCodingProblem(r));

  return (
    <Problemset
      problems={problems}
      projects={projects}
      initialMode={sp.view === "projects" ? "projects" : "problemset"}
      premium={isPremium(user)}
    />
  );
}
