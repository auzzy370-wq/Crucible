import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, isPremium } from "@/server/auth/session";
import { InterviewClient } from "@/components/saas/interview-client";

export default async function InterviewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
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
