import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import { prisma } from "@/lib/db";
import { ARCADE_GAMES, ARCADE_PLAN_SLUG } from "@/server/learning/arcade-games";
import { ArcadeLobby } from "@/components/learn/games/arcade-lobby";

export default async function LearnGamesPage() {
  const user = await requirePageRoles(CANDIDATE_ROLES);
  const enrollment = await prisma.studyPlanEnrollment.findUnique({
    where: { userId_planSlug: { userId: user.id, planSlug: ARCADE_PLAN_SLUG } },
  });
  const done = new Set(enrollment?.completedSlugs ?? []);
  const completedCount = ARCADE_GAMES.reduce((n, g) => n + (done.has(g.slug) ? 1 : 0), 0);

  return <ArcadeLobby completedCount={completedCount} completedSlugs={enrollment?.completedSlugs ?? []} />;
}
