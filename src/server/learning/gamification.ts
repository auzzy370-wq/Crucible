import { prisma } from "@/lib/db";
import { AI_CRAFT_PLAN_SLUG, AI_LESSONS, nextAiLesson } from "@/server/learning/ai-curriculum";
import {
  INTERVIEW_CRAFT_PLAN_SLUG,
  INTERVIEW_LESSONS,
  nextInterviewLesson,
} from "@/server/learning/interview-curriculum";
import { dateKey } from "@/server/saas/daily";
import { STUDY_PLANS } from "@/server/saas/study-plans";
import { itemXp, PLAN_CLEAR_BONUS_XP } from "@/server/learning/study-plan-game";

export const LESSON_XP = 50;
export const DAILY_XP = 75;
export const PROVE_BASE_XP = 100;
export const COMBO_XP = 15;
export const CHAPTER_CLEAR_XP = 100;
export const WEEKLY_QUEST_BONUS_XP = 40;

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

export type XpBreakdown = {
  lessons: number;
  daily: number;
  prove: number;
  campaigns: number;
  streak: number;
  total: number;
};

export type PathChapter = {
  id: string;
  title: string;
  done: number;
  total: number;
  percent: number;
  cleared: boolean;
};

export type LearnerGameState = {
  xp: number;
  rank: LearnerRank;
  nextRank: LearnerRank | null;
  rankProgressPct: number;
  xpToNext: number | null;
  breakdown: XpBreakdown;
  streak: { current: number; longest: number; activeToday: boolean };
  paths: {
    interview: {
      done: number;
      total: number;
      percent: number;
      nextHref: string;
      nextTitle: string | null;
      chapters: PathChapter[];
    };
    ai: {
      done: number;
      total: number;
      percent: number;
      nextHref: string;
      nextTitle: string | null;
      chapters: PathChapter[];
    };
  };
  quests: LearnerQuest[];
  questsDone: number;
  questsTotal: number;
  weeklyQuests: LearnerQuest[];
  weeklyDone: number;
  weeklyTotal: number;
  achievements: LearnerAchievement[];
  unlockedCount: number;
  focus: {
    title: string;
    detail: string;
    href: string;
    cta: string;
  };
};

function rankForXp(xp: number): {
  rank: LearnerRank;
  nextRank: LearnerRank | null;
  rankProgressPct: number;
  xpToNext: number | null;
} {
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

function weekStartUtc(d = new Date()) {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday start
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function chaptersForPath(
  lessons: { slug: string; level: string }[],
  done: Set<string>,
  levelOrder: string[],
  labels: Record<string, string>,
): PathChapter[] {
  return levelOrder.map((level) => {
    const slugs = lessons.filter((l) => l.level === level).map((l) => l.slug);
    const clearedCount = slugs.filter((s) => done.has(s)).length;
    return {
      id: level,
      title: labels[level] ?? level,
      done: clearedCount,
      total: slugs.length,
      percent: slugs.length ? Math.round((clearedCount / slugs.length) * 100) : 0,
      cleared: slugs.length > 0 && clearedCount >= slugs.length,
    };
  });
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

export function chapterBonusForLesson(opts: {
  track: "interview" | "ai";
  lessonSlug: string;
  completedBefore: string[];
  completedAfter: string[];
}): number {
  const lessons = opts.track === "interview" ? INTERVIEW_LESSONS : AI_LESSONS;
  const lesson = lessons.find((l) => l.slug === opts.lessonSlug);
  if (!lesson) return 0;
  const before = new Set(opts.completedBefore);
  const after = new Set(opts.completedAfter);
  const peers = lessons.filter((l) => l.level === lesson.level).map((l) => l.slug);
  const wasClear = peers.every((s) => before.has(s));
  const nowClear = peers.every((s) => after.has(s));
  return !wasClear && nowClear ? CHAPTER_CLEAR_XP : 0;
}

export async function buildLearnerGameState(userId: string): Promise<LearnerGameState> {
  const today = dateKey();
  const weekStart = weekStartUtc();

  const [
    aiEnrollment,
    ivEnrollment,
    streak,
    dailyDone,
    scoredAssignments,
    dailyCompletions,
    dailyThisWeek,
    scoredThisWeek,
    allEnrollments,
  ] = await Promise.all([
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
    prisma.dailyChallengeCompletion.count({ where: { userId } }),
    prisma.dailyChallengeCompletion.count({
      where: { userId, completedAt: { gte: weekStart } },
    }),
    prisma.assessmentAssignment.count({
      where: {
        candidateId: userId,
        status: { in: ["COMPLETED", "UNDER_REVIEW"] },
        scoreReport: { isNot: null },
        updatedAt: { gte: weekStart },
      },
    }),
    prisma.studyPlanEnrollment.findMany({ where: { userId } }),
  ]);

  const aiDone = aiEnrollment?.completedSlugs ?? [];
  const ivDone = ivEnrollment?.completedSlugs ?? [];
  const aiSet = new Set(aiDone);
  const ivSet = new Set(ivDone);

  let campaignXp = 0;
  let campaignsCleared = 0;
  let campaignsEnrolled = 0;
  for (const plan of STUDY_PLANS) {
    const enr = allEnrollments.find((e) => e.planSlug === plan.slug);
    if (!enr) continue;
    campaignsEnrolled += 1;
    const completed = new Set(enr.completedSlugs);
    let clearedNodes = 0;
    for (const slug of plan.challengeSlugs) {
      if (!completed.has(slug)) continue;
      clearedNodes += 1;
      campaignXp += itemXp({ itemKind: plan.itemKind, difficulty: 4 });
    }
    if (plan.challengeSlugs.length > 0 && clearedNodes >= plan.challengeSlugs.length) {
      campaignXp += PLAN_CLEAR_BONUS_XP;
      campaignsCleared += 1;
    }
  }

  const lessonXp = (aiDone.length + ivDone.length) * LESSON_XP;
  const dailyXp = dailyCompletions * DAILY_XP;
  const proveXp = scoredAssignments * PROVE_BASE_XP;
  const streakBonus = Math.min(200, (streak?.longestStreak ?? 0) * 10);
  const breakdown: XpBreakdown = {
    lessons: lessonXp,
    daily: dailyXp,
    prove: proveXp,
    campaigns: campaignXp,
    streak: streakBonus,
    total: lessonXp + dailyXp + proveXp + campaignXp + streakBonus,
  };
  const xp = breakdown.total;

  const { rank, nextRank, rankProgressPct, xpToNext } = rankForXp(xp);

  const nextIv = nextInterviewLesson(ivSet);
  const nextAi = nextAiLesson(aiSet);
  const activeToday = streak?.lastDateKey === today;

  const lessonTouchedToday =
    (ivEnrollment && dateKey(ivEnrollment.updatedAt) === today && ivDone.length > 0) ||
    (aiEnrollment && dateKey(aiEnrollment.updatedAt) === today && aiDone.length > 0);

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
      done: Boolean(lessonTouchedToday),
    },
    {
      id: "prove",
      title: "Prove it under the judge",
      detail: dailyDone
        ? "Daily evidence already posted"
        : "Run today’s timed challenge or any bank problem",
      href: "/daily",
      xp: DAILY_XP,
      done: Boolean(dailyDone),
    },
  ];

  const lessonTouchedThisWeek =
    (ivEnrollment && ivEnrollment.updatedAt >= weekStart && ivDone.length > 0) ||
    (aiEnrollment && aiEnrollment.updatedAt >= weekStart && aiDone.length > 0);

  const weeklyQuests: LearnerQuest[] = [
    {
      id: "week-lessons",
      title: "Study three days",
      detail: lessonTouchedThisWeek
        ? "Lesson path touched this week — keep clearing nodes"
        : "Clear at least one craft lesson before Sunday",
      href: nextIv ? `/learn/interview/${nextIv.slug}` : nextAi ? `/learn/ai/${nextAi.slug}` : "/learn",
      xp: WEEKLY_QUEST_BONUS_XP,
      done: Boolean(lessonTouchedThisWeek),
    },
    {
      id: "week-daily",
      title: "Two daily forges",
      detail:
        dailyThisWeek >= 2
          ? `${dailyThisWeek} dailies logged this week`
          : `${dailyThisWeek}/2 timed dailies this week`,
      href: "/daily",
      xp: WEEKLY_QUEST_BONUS_XP,
      done: dailyThisWeek >= 2,
    },
    {
      id: "week-campaign",
      title: "Advance a campaign",
      detail:
        campaignsEnrolled > 0
          ? `${campaignsCleared} packs cleared · open study campaigns`
          : "Enlist in a company or role pack",
      href: "/study-plans",
      xp: WEEKLY_QUEST_BONUS_XP,
      done: campaignsEnrolled > 0 && (campaignsCleared > 0 || allEnrollments.some((e) => e.updatedAt >= weekStart)),
    },
  ];

  const ivChapters = chaptersForPath(
    INTERVIEW_LESSONS,
    ivSet,
    ["foundations", "patterns", "rounds"],
    { foundations: "Foundations", patterns: "Patterns", rounds: "Rounds" },
  );
  const aiChapters = chaptersForPath(
    AI_LESSONS,
    aiSet,
    ["foundations", "builder", "production"],
    { foundations: "Foundations", builder: "Builder", production: "Production" },
  );

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
      id: "chapter-clear",
      title: "Chapter cleared",
      detail: "Finish every lesson in a craft chapter",
      unlocked: [...ivChapters, ...aiChapters].some((c) => c.cleared),
    },
    {
      id: "prove-3",
      title: "Triple evidence",
      detail: "Post scores on 3 timed sessions",
      unlocked: scoredAssignments + dailyCompletions >= 3,
    },
    {
      id: "campaign-enlist",
      title: "Campaign enlisted",
      detail: "Start any study campaign",
      unlocked: campaignsEnrolled >= 1,
    },
    {
      id: "campaign-clear",
      title: "Pack cleared",
      detail: "Complete a full study campaign",
      unlocked: campaignsCleared >= 1,
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

  const focus = !activeToday
    ? {
        title: "Light the forge",
        detail: nextIv?.title ?? nextAi?.title ?? "Open today’s daily challenge",
        href: nextIv
          ? `/learn/interview/${nextIv.slug}`
          : nextAi
            ? `/learn/ai/${nextAi.slug}`
            : "/daily",
        cta: "Continue learning",
      }
    : !lessonTouchedToday
      ? {
          title: "Bank lesson XP",
          detail: nextIv?.title ?? nextAi?.title ?? "Pick any craft lesson",
          href: nextIv
            ? `/learn/interview/${nextIv.slug}`
            : nextAi
              ? `/learn/ai/${nextAi.slug}`
              : "/learn/interview",
          cta: "Clear a lesson",
        }
      : !dailyDone
        ? {
            title: "Post timed evidence",
            detail: "Daily forge keeps ranks climbing",
            href: "/daily",
            cta: "Open daily",
          }
        : {
            title: "Push a campaign",
            detail: "Chapter maps and pack clear bonuses wait on Study plans",
            href: "/study-plans",
            cta: "Open campaigns",
          };

  return {
    xp,
    rank,
    nextRank,
    rankProgressPct,
    xpToNext,
    breakdown,
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
        chapters: ivChapters,
      },
      ai: {
        done: aiDone.length,
        total: AI_LESSONS.length,
        percent: Math.round((aiDone.length / AI_LESSONS.length) * 100),
        nextHref: nextAi ? `/learn/ai/${nextAi.slug}` : "/learn/ai",
        nextTitle: nextAi?.title ?? null,
        chapters: aiChapters,
      },
    },
    quests,
    questsDone: quests.filter((q) => q.done).length,
    questsTotal: quests.length,
    weeklyQuests,
    weeklyDone: weeklyQuests.filter((q) => q.done).length,
    weeklyTotal: weeklyQuests.length,
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    focus,
  };
}
