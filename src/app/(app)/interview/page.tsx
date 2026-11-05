import { prisma } from "@/lib/db";
import { isPremium } from "@/server/auth/session";
import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import { InterviewClient } from "@/components/saas/interview-client";

export default async function InterviewPage() {
  const user = await requirePageRoles(CANDIDATE_ROLES);
  const sims = await prisma.interviewSimulation.findMany({
    where: { userId: user.id },
    include: { challenge: { select: { title: true, slug: true, difficulty: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <InterviewClient
      premium={isPremium(user)}
      sims={sims.map((s) => ({
        id: s.id,
        company: s.company,
        role: s.role,
        status: s.status,
        timedMinutes: s.timedMinutes,
        createdAt: s.createdAt.toISOString(),
        challenge: s.challenge,
      }))}
    />
  );
}
