import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import { getStudyPlan } from "@/server/saas/study-plans";

const schema = z.object({
  challengeSlug: z.string().min(2),
  done: z.boolean().default(true),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  return withHandler(async () => {
    const user = await requireUser();
    const { slug } = await ctx.params;
    const plan = getStudyPlan(slug);
    if (!plan) throw new AppError("Study plan not found", 404, "NOT_FOUND");
    const body = schema.parse(await req.json());
    if (!plan.challengeSlugs.includes(body.challengeSlug)) {
      throw new AppError("Challenge not in this plan", 400, "INVALID");
    }

    const existing = await prisma.studyPlanEnrollment.findUnique({
      where: { userId_planSlug: { userId: user.id, planSlug: slug } },
    });
    if (!existing) throw new AppError("Enroll in the plan first", 400, "NOT_ENROLLED");

    const set = new Set(existing.completedSlugs);
    if (body.done) set.add(body.challengeSlug);
    else set.delete(body.challengeSlug);

    const updated = await prisma.studyPlanEnrollment.update({
      where: { id: existing.id },
      data: { completedSlugs: [...set] },
    });
    return jsonOk(updated);
  });
}
