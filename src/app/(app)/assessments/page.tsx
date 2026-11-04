import { prisma } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";
import { AssessmentsClient } from "@/components/assessment/assessments-client";

export default async function AssessmentsPage() {
  const user = await getSessionUser();
  const [assessments, challenges, candidates, assignments] = await Promise.all([
    prisma.assessment.findMany({
      include: {
        challenge: true,
        _count: { select: { assignments: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.challenge.findMany({ where: { isPublished: true }, orderBy: { title: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["CANDIDATE", "TEAM_MEMBER"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.assessmentAssignment.findMany({
      where: user?.role === "CANDIDATE" || user?.role === "TEAM_MEMBER" ? { candidateId: user.id } : undefined,
      include: {
        assessment: { include: { challenge: true } },
        candidate: { select: { id: true, name: true, email: true } },
        workspace: true,
        scoreReport: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const serializeChallenge = (c: (typeof challenges)[number] | (typeof assessments)[number]["challenge"]) => ({
    id: c.id,
    title: c.title,
    track: c.track,
    slug: c.slug,
    summary: "summary" in c ? c.summary : undefined,
    difficulty: "difficulty" in c ? c.difficulty : undefined,
    tags: "tags" in c ? c.tags : undefined,
    publicRequirements: ("publicRequirements" in c ? (c.publicRequirements as string[] | null) : null) ?? [],
  });

  return (
    <AssessmentsClient
      role={user!.role}
      assessments={assessments.map((a) => ({
        ...a,
        challenge: serializeChallenge(a.challenge),
      }))}
      challenges={challenges.map(serializeChallenge)}
      candidates={candidates}
      assignments={assignments.map((a) => ({
        ...a,
        assessment: {
          ...a.assessment,
          challenge: {
            summary: a.assessment.challenge.summary,
            title: a.assessment.challenge.title,
            difficulty: a.assessment.challenge.difficulty,
            tags: a.assessment.challenge.tags,
            publicRequirements: (a.assessment.challenge.publicRequirements as string[] | null) ?? [],
            adaptiveTrack: a.assessment.challenge.adaptiveTrack as { level: number; title: string }[] | null,
          },
        },
      }))}
    />
  );
}
