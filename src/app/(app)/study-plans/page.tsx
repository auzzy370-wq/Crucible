import { redirect } from "next/navigation";
import { getSessionUser, isPremium } from "@/server/auth/session";
import { StudyPlansClient } from "@/components/saas/study-plans-client";
import { prisma } from "@/lib/db";
import { STUDY_PLANS } from "@/server/saas/study-plans";

export default async function StudyPlansPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const enrollments = await prisma.studyPlanEnrollment.findMany({ where: { userId: user.id } });
  const bySlug = new Map(enrollments.map((e) => [e.planSlug, e]));
  const challenges = await prisma.challenge.findMany({
    where: { slug: { in: STUDY_PLANS.flatMap((p) => p.challengeSlugs) } },
    select: { id: true, slug: true, title: true, difficulty: true, isPremium: true, avgMinutes: true },
  });
  const challengeBySlug = new Map(challenges.map((c) => [c.slug, c]));

  const plans = STUDY_PLANS.map((plan) => {
    const enr = bySlug.get(plan.slug);
    const completed = new Set(enr?.completedSlugs ?? []);
    const items = plan.challengeSlugs
      .map((slug) => challengeBySlug.get(slug))
      .filter(Boolean)
      .map((c) => ({
        id: c!.id,
        slug: c!.slug,
        title: c!.title,
        difficulty: c!.difficulty,
        avgMinutes: c!.avgMinutes,
        done: completed.has(c!.slug),
      }));
    return {
      ...plan,
      enrolled: Boolean(enr),
      completedCount: completed.size,
      totalCount: plan.challengeSlugs.length,
      percent: plan.challengeSlugs.length
        ? Math.round((completed.size / plan.challengeSlugs.length) * 100)
        : 0,
      items,
    };
  });

  return <StudyPlansClient plans={plans} premium={isPremium(user)} />;
}
