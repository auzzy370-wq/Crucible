import { ensureDailyChallenge } from "@/server/saas/daily";
import { getSessionUser } from "@/server/auth/session";
import { prisma } from "@/lib/db";
import { DailyClient } from "@/components/saas/daily-client";

export default async function DailyPage() {
  const user = await getSessionUser();
  const daily = await ensureDailyChallenge();
  const completion = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_dailyChallengeId: { userId: user!.id, dailyChallengeId: daily.id } },
  });
  const streak = await prisma.userStreak.findUnique({ where: { userId: user!.id } });

  return (
    <DailyClient
      daily={{
        dateKey: daily.dateKey,
        completed: Boolean(completion),
        streak: streak ?? { currentStreak: 0, longestStreak: 0, lastDateKey: null },
        challenge: {
          id: daily.challenge.id,
          slug: daily.challenge.slug,
          title: daily.challenge.title,
          summary: daily.challenge.summary,
          difficulty: daily.challenge.difficulty,
          tags: daily.challenge.tags,
          avgMinutes: daily.challenge.avgMinutes,
          companies: daily.challenge.companies,
        },
      }}
    />
  );
}
