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
import {
  ARCADE_DRILL_XP,
  ARCADE_PLAN_SLUG,
  ARCADE_TARGET_COUNT,
  getArcadeGame,
} from "@/server/learning/arcade-games";

export const LESSON_XP = 50;
export const DAILY_XP = 75;
export const PROVE_BASE_XP = 100;
export const COMBO_XP = 15;
export const CHAPTER_CLEAR_XP = 100;
export const WEEKLY_QUEST_BONUS_XP = 40;
/** Bonus when the full weekly board is cleared. */
export const WEEKLY_BOARD_CLEAR_XP = 80;
/** Bonus when all three daily quests are cleared the same day. */
export const PERFECT_DAY_XP = 60;
/** Extra XP per active streak day (capped). */
export const STREAK_DAY_XP = 8;
export const STREAK_MILESTONES = [3, 7, 14, 30, 60] as const;

export type LearnerRank = {
  id: string;
  title: string;
  minXp: number;
};

export const LEARNER_RANKS: LearnerRank[] = [
  { id: "initiate", title: "Initiate", minXp: 0 },
  { id: "spark", title: "Spark", minXp: 75 },
  { id: "apprentice", title: "Apprentice", minXp: 150 },
  { id: "operator", title: "Operator", minXp: 300 },
  { id: "craftsman", title: "Craftsman", minXp: 500 },
  { id: "specialist", title: "Specialist", minXp: 750 },
  { id: "veteran", title: "Veteran", minXp: 1100 },
  { id: "elite", title: "Elite", minXp: 1500 },
  { id: "architect", title: "Architect", minXp: 2100 },
  { id: "distinguished", title: "Distinguished", minXp: 2800 },
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
  arcade: number;
  streak: number;
  weekly: number;
  perfectDay: number;
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
  level: number;
  rank: LearnerRank;
  nextRank: LearnerRank | null;
  rankProgressPct: number;
  xpToNext: number | null;
  breakdown: XpBreakdown;
  streak: {
    current: number;
    longest: number;
    activeToday: boolean;
    heat: number;
    nextMilestone: number | null;
    milestones: { days: number; reached: boolean }[];
  };
  perfectDay: boolean;
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

  const arcadeEnrollment = allEnrollments.find((e) => e.planSlug === ARCADE_PLAN_SLUG);
  const arcadeClearedSlugs = arcadeEnrollment?.completedSlugs ?? [];
  const arcadeClears = arcadeClearedSlugs.filter((slug) => getArcadeGame(slug)).length;
  const arcadeXp = arcadeClearedSlugs.reduce((sum, slug) => {
    const g = getArcadeGame(slug);
    if (!g) return sum;
    return sum + (g.featured ? 40 : ARCADE_DRILL_XP);
  }, 0);

  const nextIv = nextInterviewLesson(ivSet);
  const nextAi = nextAiLesson(aiSet);
  const activeToday = streak?.lastDateKey === today;

  const lessonTouchedToday =
    (ivEnrollment && dateKey(ivEnrollment.updatedAt) === today && ivDone.length > 0) ||
    (aiEnrollment && dateKey(aiEnrollment.updatedAt) === today && aiDone.length > 0);

  const perfectDay = Boolean(activeToday && lessonTouchedToday && dailyDone);

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
  const chaptersCleared = [...ivChapters, ...aiChapters].filter((c) => c.cleared).length;

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

  const weeklyDoneCount = weeklyQuests.filter((q) => q.done).length;
  const weeklyXp =
    weeklyDoneCount * WEEKLY_QUEST_BONUS_XP +
    (weeklyDoneCount >= weeklyQuests.length ? WEEKLY_BOARD_CLEAR_XP : 0);

  const lessonBase = (aiDone.length + ivDone.length) * LESSON_XP;
  const chapterXp = chaptersCleared * CHAPTER_CLEAR_XP;
  /** Same-day combo when the forge is already lit and a lesson lands today. */
  const comboXp = lessonTouchedToday && activeToday ? COMBO_XP : 0;
  const lessonXp = lessonBase + chapterXp + comboXp;
  const dailyXp = dailyCompletions * DAILY_XP;
  const proveXp = scoredAssignments * PROVE_BASE_XP;
  const streakBonus =
    Math.min(240, (streak?.longestStreak ?? 0) * 10) +
    Math.min(160, (streak?.currentStreak ?? 0) * STREAK_DAY_XP);
  const perfectDayXp = perfectDay ? PERFECT_DAY_XP : 0;
  const breakdown: XpBreakdown = {
    lessons: lessonXp,
    daily: dailyXp,
    prove: proveXp,
    campaigns: campaignXp,
    arcade: arcadeXp,
    streak: streakBonus,
    weekly: weeklyXp,
    perfectDay: perfectDayXp,
    total:
      lessonXp + dailyXp + proveXp + campaignXp + arcadeXp + streakBonus + weeklyXp + perfectDayXp,
  };
  const xp = breakdown.total;
  const { rank, nextRank, rankProgressPct, xpToNext } = rankForXp(xp);
  const level = Math.max(1, LEARNER_RANKS.findIndex((r) => r.id === rank.id) + 1);

  const achievements: LearnerAchievement[] = [
    {
      id: "first-lesson",
      title: "First clearance",
      detail: "Complete any craft lesson",
      unlocked: aiDone.length + ivDone.length >= 1,
    },
    {
      id: "spark",
      title: "First spark",
      detail: "Reach Spark rank",
      unlocked: xp >= 75,
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
      unlocked: chaptersCleared >= 1,
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
      id: "arcade-first",
      title: "Arcade warm-up",
      detail: "Clear any Learn Arcade game",
      unlocked: arcadeClears >= 1,
    },
    {
      id: "arcade-25",
      title: "Arcade warm circuit",
      detail: "Clear 25 Learn Arcade games",
      unlocked: arcadeClears >= 25,
    },
    {
      id: "arcade-100",
      title: "Arcade centurion",
      detail: "Clear 100 Learn Arcade games",
      unlocked: arcadeClears >= 100,
    },
    {
      id: "arcade-500",
      title: "Arcade campaign",
      detail: "Clear 500 Learn Arcade games",
      unlocked: arcadeClears >= 500,
    },
    {
      id: "arcade-all",
      title: "Arcade complete",
      detail: `Clear all ${ARCADE_TARGET_COUNT} Learn Arcade games`,
      unlocked: arcadeClears >= ARCADE_TARGET_COUNT,
    },
    {
      id: "operator",
      title: "Reach Operator",
      detail: "Earn Operator rank (300 XP)",
      unlocked: xp >= 300,
    },
    {
      id: "elite",
      title: "Reach Elite",
      detail: "Earn Elite rank (1500 XP)",
      unlocked: xp >= 1500,
    },
    {
      id: "streak-14",
      title: "Fortnight forge",
      detail: "Hold a 14-day learning streak",
      unlocked: (streak?.longestStreak ?? 0) >= 14,
    },
    {
      id: "perfect-day",
      title: "Perfect day",
      detail: "Clear all three daily quests in one day",
      unlocked:
        perfectDay ||
        (dailyCompletions >= 5 && aiDone.length + ivDone.length >= 5 && (streak?.longestStreak ?? 0) >= 3),
    },
    {
      id: "weekly-board",
      title: "Week cleared",
      detail: "Finish every weekly quest on the board",
      unlocked: weeklyDoneCount >= weeklyQuests.length,
    },
    {
      id: "prove-10",
      title: "Evidence vault",
      detail: "Post scores on 10 timed sessions",
      unlocked: scoredAssignments + dailyCompletions >= 10,
    },
  ];

  const currentStreak = streak?.currentStreak ?? 0;
  const streakMilestones = STREAK_MILESTONES.map((days) => ({
    days,
    reached: (streak?.longestStreak ?? 0) >= days || currentStreak >= days,
  }));
  const nextMilestone = STREAK_MILESTONES.find((d) => currentStreak < d) ?? null;
  const heat = Math.max(
    0,
    Math.min(100, Math.round((currentStreak / (nextMilestone ?? 30)) * 100) || (currentStreak > 0 ? 12 : 0)),
  );

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
            detail: "Clear the last daily quest for a perfect-day bonus",
            href: "/daily",
            cta: "Open daily",
          }
        : weeklyDoneCount < weeklyQuests.length
          ? {
              title: "Clear the weekly board",
              detail: `${weeklyDoneCount}/${weeklyQuests.length} weekly quests done · +${WEEKLY_BOARD_CLEAR_XP} XP when complete`,
              href: weeklyQuests.find((q) => !q.done)?.href ?? "/study-plans",
              cta: "Next weekly quest",
            }
          : {
              title: "Push a campaign",
              detail: "Chapter maps and pack clear bonuses wait on Study plans",
              href: "/study-plans",
              cta: "Open campaigns",
            };

  return {
    xp,
    level,
    rank,
    nextRank,
    rankProgressPct,
    xpToNext,
    breakdown,
    streak: {
      current: currentStreak,
      longest: streak?.longestStreak ?? 0,
      activeToday,
      heat,
      nextMilestone,
      milestones: streakMilestones,
    },
    perfectDay,
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
    weeklyDone: weeklyDoneCount,
    weeklyTotal: weeklyQuests.length,
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    focus,
  };
}

/** Zeroed forge state for guests browsing the free Learn experience. */
export function guestLearnerGameState(): LearnerGameState {
  const emptyChapters = (ids: string[], titles: Record<string, string>): PathChapter[] =>
    ids.map((id) => ({
      id,
      title: titles[id] ?? id,
      done: 0,
      total: 1,
      percent: 0,
      cleared: false,
    }));
  const ivChapters = emptyChapters(["foundations", "patterns", "rounds"], {
    foundations: "Foundations",
    patterns: "Patterns",
    rounds: "Rounds",
  });
  const aiChapters = emptyChapters(["foundations", "builder", "production"], {
    foundations: "Foundations",
    builder: "Builder",
    production: "Production",
  });
  const firstIv = INTERVIEW_LESSONS[0];
  const firstAi = AI_LESSONS[0];
  const quests: LearnerQuest[] = [
    {
      id: "forge",
      title: "Keep the forge lit",
      detail: "Sign in to save streak progress — you can still explore free",
      href: firstIv ? `/learn/interview/${firstIv.slug}` : "/learn/games",
      xp: 25,
      done: false,
    },
    {
      id: "lesson",
      title: "Clear a lesson",
      detail: firstIv ? `Try: ${firstIv.title}` : "Open Interview Craft",
      href: firstIv ? `/learn/interview/${firstIv.slug}` : "/learn/interview",
      xp: LESSON_XP,
      done: false,
    },
    {
      id: "prove",
      title: "Prove it under the judge",
      detail: "Sign in to run the daily forge for XP",
      href: "/learn/games",
      xp: DAILY_XP,
      done: false,
    },
  ];
  const weeklyQuests: LearnerQuest[] = [
    {
      id: "week-lessons",
      title: "Study three days",
      detail: "Create a free account to track weekly quests",
      href: "/learn",
      xp: WEEKLY_QUEST_BONUS_XP,
      done: false,
    },
    {
      id: "week-daily",
      title: "Two daily forges",
      detail: "Available after you sign in",
      href: "/learn/games",
      xp: WEEKLY_QUEST_BONUS_XP,
      done: false,
    },
    {
      id: "week-campaign",
      title: "Advance a campaign",
      detail: "Browse packs freely — progress saves when signed in",
      href: "/learn/games",
      xp: WEEKLY_QUEST_BONUS_XP,
      done: false,
    },
  ];
  const achievements: LearnerAchievement[] = [
    {
      id: "first-lesson",
      title: "First clearance",
      detail: "Complete any craft lesson",
      unlocked: false,
    },
    {
      id: "arcade-first",
      title: "Arcade warm-up",
      detail: "Clear any Learn Arcade game",
      unlocked: false,
    },
  ];
  const rank = LEARNER_RANKS[0]!;
  const nextRank = LEARNER_RANKS[1] ?? null;
  return {
    xp: 0,
    level: 1,
    rank,
    nextRank,
    rankProgressPct: 0,
    xpToNext: nextRank ? nextRank.minXp : null,
    breakdown: {
      lessons: 0,
      daily: 0,
      prove: 0,
      campaigns: 0,
      arcade: 0,
      streak: 0,
      weekly: 0,
      perfectDay: 0,
      total: 0,
    },
    streak: {
      current: 0,
      longest: 0,
      activeToday: false,
      heat: 0,
      nextMilestone: STREAK_MILESTONES[0] ?? null,
      milestones: STREAK_MILESTONES.map((days) => ({ days, reached: false })),
    },
    perfectDay: false,
    paths: {
      interview: {
        done: 0,
        total: INTERVIEW_LESSONS.length,
        percent: 0,
        nextHref: firstIv ? `/learn/interview/${firstIv.slug}` : "/learn/interview",
        nextTitle: firstIv?.title ?? null,
        chapters: ivChapters,
      },
      ai: {
        done: 0,
        total: AI_LESSONS.length,
        percent: 0,
        nextHref: firstAi ? `/learn/ai/${firstAi.slug}` : "/learn/ai",
        nextTitle: firstAi?.title ?? null,
        chapters: aiChapters,
      },
    },
    quests,
    questsDone: 0,
    questsTotal: quests.length,
    weeklyQuests,
    weeklyDone: 0,
    weeklyTotal: weeklyQuests.length,
    achievements,
    unlockedCount: 0,
    focus: {
      title: "Free forge — explore without an account",
      detail: "Play arcade drills and skim craft paths. Sign in when you want XP saved.",
      href: "/learn/games",
      cta: "Open arcade",
    },
  };
}
