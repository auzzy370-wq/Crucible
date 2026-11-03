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

  return (
    <AssessmentsClient
      role={user!.role}
      assessments={assessments}
      challenges={challenges}
      candidates={candidates}
      assignments={assignments}
    />
  );
}
