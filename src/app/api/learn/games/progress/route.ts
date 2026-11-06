import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import {
  ARCADE_CLEAR_XP,
  ARCADE_GAMES,
  ARCADE_PERFECT_BONUS_XP,
  ARCADE_PLAN_SLUG,
  getArcadeGame,
} from "@/server/learning/arcade-games";
import { touchLearnStreak } from "@/server/learning/gamification";

export async function GET() {
  return withHandler(async () => {
    const user = await requireUser();
    const enrollment = await prisma.studyPlanEnrollment.findUnique({
      where: { userId_planSlug: { userId: user.id, planSlug: ARCADE_PLAN_SLUG } },
    });
    const done = new Set(enrollment?.completedSlugs ?? []);
    return jsonOk({
      enrolled: Boolean(enrollment),
      completedSlugs: enrollment?.completedSlugs ?? [],
      completedCount: done.size,
      totalCount: ARCADE_GAMES.length,
      percent: Math.round((done.size / ARCADE_GAMES.length) * 100),
      games: ARCADE_GAMES.map((g) => ({ ...g, done: done.has(g.slug) })),
    });
  });
}

const postSchema = z.object({
  gameSlug: z.string().min(2),
  perfect: z.boolean().optional().default(false),
  score: z.number().int().min(0).max(10_000).optional(),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    const user = await requireUser();
    const body = postSchema.parse(await req.json());
    const game = getArcadeGame(body.gameSlug);
    if (!game) throw new AppError("Game not found", 404, "NOT_FOUND");

    let enrollment = await prisma.studyPlanEnrollment.findUnique({
      where: { userId_planSlug: { userId: user.id, planSlug: ARCADE_PLAN_SLUG } },
    });
    if (!enrollment) {
      enrollment = await prisma.studyPlanEnrollment.create({
        data: { userId: user.id, planSlug: ARCADE_PLAN_SLUG },
      });
    }

    const set = new Set(enrollment.completedSlugs);
    const firstClear = !set.has(body.gameSlug);
    set.add(body.gameSlug);

    await prisma.studyPlanEnrollment.update({
      where: { id: enrollment.id },
      data: { completedSlugs: [...set] },
    });

    let xpEarned = 0;
    if (firstClear) {
      xpEarned = ARCADE_CLEAR_XP + (body.perfect ? ARCADE_PERFECT_BONUS_XP : 0);
      await touchLearnStreak(user.id);
    } else if (body.perfect) {
      xpEarned = Math.floor(ARCADE_PERFECT_BONUS_XP / 2);
      await touchLearnStreak(user.id);
    } else {
      await touchLearnStreak(user.id);
    }

    return jsonOk({
      gameSlug: body.gameSlug,
      firstClear,
      xpEarned,
      completedCount: set.size,
      totalCount: ARCADE_GAMES.length,
      score: body.score ?? null,
    });
  });
}
