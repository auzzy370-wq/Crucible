import type { StudyPlanDef } from "@/server/saas/study-plans";
import { LESSON_XP } from "@/server/learning/gamification";

export const PLAN_CLEAR_BONUS_XP = 200;

export function itemXp(opts: { itemKind?: "lesson" | "challenge"; difficulty?: number }) {
  if (opts.itemKind === "lesson") return LESSON_XP;
  const d = Math.max(1, Math.min(10, opts.difficulty ?? 4));
  return 35 + d * 8;
}

export type PlanChapter = {
  id: string;
  title: string;
  index: number;
  itemSlugs: string[];
  done: number;
  total: number;
  percent: number;
  cleared: boolean;
};

export type PlanGameView = {
  slug: string;
  title: string;
  subtitle: string;
  company?: string;
  role: string;
  days: number;
  premium: boolean;
  track?: string;
  itemKind?: "lesson" | "challenge";
  enrolled: boolean;
  completedCount: number;
  totalCount: number;
  percent: number;
  earnedXp: number;
  totalXp: number;
  remainingXp: number;
  clearBonusXp: number;
  chapters: PlanChapter[];
  nextItemSlug: string | null;
  campaignComplete: boolean;
};

export function buildPlanChapters(
  plan: StudyPlanDef,
  completed: Set<string>,
): PlanChapter[] {
  const slugs = plan.challengeSlugs;
  if (!slugs.length) return [];
  const weekCount = Math.max(1, Math.ceil(plan.days / 7));
  const perWeek = Math.max(1, Math.ceil(slugs.length / weekCount));
  const chapters: PlanChapter[] = [];
  for (let w = 0; w < weekCount; w++) {
    const slice = slugs.slice(w * perWeek, (w + 1) * perWeek);
    if (!slice.length) break;
    const done = slice.filter((s) => completed.has(s)).length;
    chapters.push({
      id: `${plan.slug}-w${w + 1}`,
      title: weekCount === 1 ? "Full campaign" : `Chapter ${w + 1}`,
      index: w + 1,
      itemSlugs: slice,
      done,
      total: slice.length,
      percent: Math.round((done / slice.length) * 100),
      cleared: done === slice.length,
    });
  }
  return chapters;
}

export function scorePlanProgress(
  plan: StudyPlanDef,
  completed: Set<string>,
  difficultyBySlug: Map<string, number>,
): Pick<PlanGameView, "earnedXp" | "totalXp" | "remainingXp" | "clearBonusXp" | "campaignComplete" | "nextItemSlug"> {
  let earned = 0;
  let total = 0;
  for (const slug of plan.challengeSlugs) {
    const xp = itemXp({
      itemKind: plan.itemKind,
      difficulty: difficultyBySlug.get(slug),
    });
    total += xp;
    if (completed.has(slug)) earned += xp;
  }
  const campaignComplete =
    plan.challengeSlugs.length > 0 && plan.challengeSlugs.every((s) => completed.has(s));
  if (campaignComplete) {
    earned += PLAN_CLEAR_BONUS_XP;
  }
  total += PLAN_CLEAR_BONUS_XP;
  const nextItemSlug = plan.challengeSlugs.find((s) => !completed.has(s)) ?? null;
  return {
    earnedXp: earned,
    totalXp: total,
    remainingXp: Math.max(0, total - earned),
    clearBonusXp: PLAN_CLEAR_BONUS_XP,
    campaignComplete,
    nextItemSlug,
  };
}

export type StudyCampaignHud = {
  enrolledCount: number;
  completedPlans: number;
  activeSlug: string | null;
  totalEarnedXp: number;
  quest: {
    title: string;
    detail: string;
    href: string;
    xp: number;
    planSlug: string | null;
  };
  medals: { id: string; title: string; detail: string; unlocked: boolean }[];
};

export function buildStudyCampaignHud(plans: PlanGameView[]): StudyCampaignHud {
  const enrolled = plans.filter((p) => p.enrolled);
  const completedPlans = enrolled.filter((p) => p.campaignComplete);
  const active =
    enrolled.find((p) => !p.campaignComplete && p.nextItemSlug) ??
    enrolled.find((p) => !p.campaignComplete) ??
    null;
  const totalEarnedXp = plans.reduce((s, p) => s + (p.enrolled ? p.earnedXp : 0), 0);

  return {
    enrolledCount: enrolled.length,
    completedPlans: completedPlans.length,
    activeSlug: active?.slug ?? null,
    totalEarnedXp,
    quest: active
      ? {
          title: active.campaignComplete ? "Campaign cleared" : "Advance your campaign",
          detail: active.nextItemSlug
            ? `Next node on ${active.title}`
            : `${active.title} is complete — enroll another pack`,
          href: `#plan-${active.slug}`,
          xp: active.nextItemSlug ? 40 : PLAN_CLEAR_BONUS_XP,
          planSlug: active.slug,
        }
      : {
          title: "Enlist in a campaign",
          detail: "Pick a company or role pack and clear the first node",
          href: "#catalog",
          xp: 50,
          planSlug: null,
        },
    medals: [
      {
        id: "first-enlist",
        title: "First enlistment",
        detail: "Start any study campaign",
        unlocked: enrolled.length >= 1,
      },
      {
        id: "chapter-clear",
        title: "Chapter cleared",
        detail: "Finish every node in a chapter",
        unlocked: enrolled.some((p) => p.chapters.some((c) => c.cleared)),
      },
      {
        id: "half-pack",
        title: "Halfway through a pack",
        detail: "Reach 50% on any campaign",
        unlocked: enrolled.some((p) => p.percent >= 50),
      },
      {
        id: "pack-clear",
        title: "Campaign complete",
        detail: "Clear every node in a pack (+200 XP bonus)",
        unlocked: completedPlans.length >= 1,
      },
      {
        id: "two-packs",
        title: "Two campaigns",
        detail: "Complete two full study packs",
        unlocked: completedPlans.length >= 2,
      },
      {
        id: "company-raid",
        title: "Company raid",
        detail: "Enroll in a named company pack",
        unlocked: enrolled.some((p) => Boolean(p.company)),
      },
      {
        id: "xp-500",
        title: "500 campaign XP",
        detail: "Earn 500 XP across study plans",
        unlocked: totalEarnedXp >= 500,
      },
      {
        id: "xp-1500",
        title: "1500 campaign XP",
        detail: "Earn 1500 XP across study plans",
        unlocked: totalEarnedXp >= 1500,
      },
    ],
  };
}
