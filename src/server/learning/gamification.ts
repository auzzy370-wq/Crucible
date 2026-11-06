import { prisma } from "@/lib/db";
import { AI_CRAFT_PLAN_SLUG, AI_LESSONS, nextAiLesson } from "@/server/learning/ai-curriculum";
import {
  INTERVIEW_CRAFT_PLAN_SLUG,
  INTERVIEW_LESSONS,
  nextInterviewLesson,
} from "@/server/learning/interview-curriculum";
import { dateKey } from "@/server/saas/daily";

export const LESSON_XP = 50;
export const DAILY_XP = 75;
export const PROVE_BASE_XP = 100;

export type LearnerRank = {
  id: string;
  title: string;
  minXp: number;
};

export const LEARNER_RANKS: LearnerRank[] = [
  { id: "initiate", title: "Initiate", minXp: 0 },
  { id: "operator", title: "Operator", minXp: 150 },
  { id: "specialist", title: "Specialist", minXp: 450 },
  { id: "elite", title: "Elite", minXp: 1000 },
  { id: "distinguished", title: "Distinguished", minXp: 1800 },
];

export type LearnerQuest = {
  id: string;
  title: string;
  detail: string;
  href: string;
  xp: number;
  done: boolean;
};

export type LearnerAchievement = {
  id: string;
  title: string;
  detail: string;
  unlocked: boolean;
};

export type LearnerGameState = {
  xp: number;
  rank: LearnerRank;
  nextRank: LearnerRank | null;
  rankProgressPct: number;
  xpToNext: number | null;
  streak: { current: number; longest: number; activeToday: boolean };
  paths: {
    interview: { done: number; total: number; percent: number; nextHref: string; nextTitle: string | null };
    ai: { done: number; total: number; percent: number; nextHref: string; nextTitle: string | null };
  };
  quests: LearnerQuest[];
  questsDone: number;
  questsTotal: number;
  achievements: LearnerAchievement[];
  unlockedCount: number;
};

function rankForXp(xp: number): { rank: LearnerRank; nextRank: LearnerRank | null; rankProgressPct: number; xpToNext: number | null } {
  let rank = LEARNER_RANKS[0]!;
  for (const r of LEARNER_RANKS) {
    if (xp >= r.minXp) rank = r;
  }
  const idx = LEARNER_RANKS.findIndex((r) => r.id === rank.id);
  const nextRank = LEARNER_RANKS[idx + 1] ?? null;
  if (!nextRank) {
    return { rank, nextRank: null, rankProgressPct: 100, xpToNext: null };
  }
  const span = nextRank.minXp - rank.minXp;
  const into = xp - rank.minXp;
  return {
    rank,
    nextRank,
    rankProgressPct: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
    xpToNext: Math.max(0, nextRank.minXp - xp),
  };
}

/** Keep the forge alive when a lesson is completed (shares UserStreak with daily). */
export async function touchLearnStreak(userId: string) {
  const today = dateKey();
  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (streak?.lastDateKey === today) return streak;

  const yesterday = new Date(`${today}T12:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yKey = dateKey(yesterday);

  let current = 1;
  if (streak?.lastDateKey === yKey) current = streak.currentStreak + 1;
  const longest = Math.max(current, streak?.longestStreak ?? 0);

  return prisma.userStreak.upsert({
    where: { userId },
    create: { userId, currentStreak: current, longestStreak: longest, lastDateKey: today },
    update: { currentStreak: current, longestStreak: longest, lastDateKey: today },
  });
}

export async function buildLearnerGameState(userId: string): Promise<LearnerGameState> {
  const today = dateKey();
  const [aiEnrollment, ivEnrollment, streak, dailyDone, scoredAssignments] = await Promise.all([
    prisma.studyPlanEnrollment.findUnique({
      where: { userId_planSlug: { userId, planSlug: AI_CRAFT_PLAN_SLUG } },
    }),
    prisma.studyPlanEnrollment.findUnique({
      where: { userId_planSlug: { userId, planSlug: INTERVIEW_CRAFT_PLAN_SLUG } },
    }),
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.dailyChallengeCompletion.findFirst({
      where: { userId, dailyChallenge: { dateKey: today } },
      select: { id: true },
    }),
    prisma.assessmentAssignment.count({
      where: {
        candidateId: userId,
        status: { in: ["COMPLETED", "UNDER_REVIEW"] },
        scoreReport: { isNot: null },
      },
    }),
  ]);

  const aiDone = aiEnrollment?.completedSlugs ?? [];
  const ivDone = ivEnrollment?.completedSlugs ?? [];
  const aiSet = new Set(aiDone);
  const ivSet = new Set(ivDone);

  const lessonXp = (aiDone.length + ivDone.length) * LESSON_XP;
  const dailyCompletions = await prisma.dailyChallengeCompletion.count({ where: { userId } });
  const proveXp = scoredAssignments * PROVE_BASE_XP + dailyCompletions * DAILY_XP;
  const streakBonus = Math.min(200, (streak?.longestStreak ?? 0) * 10);
  const xp = lessonXp + proveXp + streakBonus;

  const { rank, nextRank, rankProgressPct, xpToNext } = rankForXp(xp);

  const nextIv = nextInterviewLesson(ivSet);
  const nextAi = nextAiLesson(aiSet);
  const activeToday = streak?.lastDateKey === today;

  const quests: LearnerQuest[] = [
    {
      id: "forge",
      title: "Keep the forge lit",
      detail: activeToday
        ? "Streak already counted for today"
        : "Finish a lesson or today’s challenge to extend your streak",
      href: nextIv ? `/learn/interview/${nextIv.slug}` : nextAi ? `/learn/ai/${nextAi.slug}` : "/daily",
      xp: 25,
      done: activeToday,
    },
    {
      id: "lesson",
      title: "Clear a lesson",
      detail: nextIv
        ? `Interview: ${nextIv.title}`
        : nextAi
          ? `AI Craft: ${nextAi.title}`
          : "Both craft paths complete — revisit a favorite",
      href: nextIv
        ? `/learn/interview/${nextIv.slug}`
        : nextAi
          ? `/learn/ai/${nextAi.slug}`
          : "/learn/interview",
      xp: LESSON_XP,
      done: Boolean(
        (ivEnrollment && dateKey(ivEnrollment.updatedAt) === today && ivDone.length > 0) ||
          (aiEnrollment && dateKey(aiEnrollment.updatedAt) === today && aiDone.length > 0),
      ),
    },
    {
      id: "prove",
      title: "Prove it under the judge",
      detail: dailyDone
        ? "Daily evidence already posted"
        : "Run today’s timed challenge or any bank problem",
      href: "/daily",
      xp: DAILY_XP,
      done: Boolean(dailyDone) || false,
    },
  ];

  // If lesson quest "done" is too aggressive (any update today), refine: only if they completed something today
  // Enrollment updatedAt bumps on any mark — acceptable for quest UX.

  const achievements: LearnerAchievement[] = [
    {
      id: "first-lesson",
      title: "First clearance",
      detail: "Complete any craft lesson",
      unlocked: aiDone.length + ivDone.length >= 1,
    },
    {
      id: "streak-3",
      title: "Three-day forge",
      detail: "Hold a 3-day learning streak",
      unlocked: (streak?.longestStreak ?? 0) >= 3,
    },
    {
      id: "streak-7",
      title: "Week under fire",
      detail: "Hold a 7-day learning streak",
      unlocked: (streak?.longestStreak ?? 0) >= 7,
    },
    {
      id: "interview-half",
      title: "Interview midpoint",
      detail: "Clear half of Interview Craft",
      unlocked: ivDone.length >= Math.ceil(INTERVIEW_LESSONS.length / 2),
    },
    {
      id: "ai-half",
      title: "AI midpoint",
      detail: "Clear half of AI Craft",
      unlocked: aiDone.length >= Math.ceil(AI_LESSONS.length / 2),
    },
    {
      id: "interview-complete",
      title: "Interview Craft complete",
      detail: "Finish every interview lesson",
      unlocked: ivDone.length >= INTERVIEW_LESSONS.length,
    },
    {
      id: "ai-complete",
      title: "AI Craft complete",
      detail: "Finish every AI lesson",
      unlocked: aiDone.length >= AI_LESSONS.length,
    },
    {
      id: "prove-3",
      title: "Triple evidence",
      detail: "Post scores on 3 timed sessions",
      unlocked: scoredAssignments + dailyCompletions >= 3,
    },
    {
      id: "operator",
      title: "Reach Operator",
      detail: "Earn 150 XP across learn + prove",
      unlocked: xp >= 150,
    },
    {
      id: "elite",
      title: "Reach Elite",
      detail: "Earn 1000 XP",
      unlocked: xp >= 1000,
    },
  ];

  return {
    xp,
    rank,
    nextRank,
    rankProgressPct,
    xpToNext,
    streak: {
      current: streak?.currentStreak ?? 0,
      longest: streak?.longestStreak ?? 0,
      activeToday,
    },
    paths: {
      interview: {
        done: ivDone.length,
        total: INTERVIEW_LESSONS.length,
        percent: Math.round((ivDone.length / INTERVIEW_LESSONS.length) * 100),
        nextHref: nextIv ? `/learn/interview/${nextIv.slug}` : "/learn/interview",
        nextTitle: nextIv?.title ?? null,
      },
      ai: {
        done: aiDone.length,
        total: AI_LESSONS.length,
        percent: Math.round((aiDone.length / AI_LESSONS.length) * 100),
        nextHref: nextAi ? `/learn/ai/${nextAi.slug}` : "/learn/ai",
        nextTitle: nextAi?.title ?? null,
      },
    },
    quests,
    questsDone: quests.filter((q) => q.done).length,
    questsTotal: quests.length,
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
  };
}
