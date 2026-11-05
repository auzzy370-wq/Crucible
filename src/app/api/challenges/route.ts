import { z } from "zod";
import { AssessmentTrack, ChallengeType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser, canAdmin } from "@/server/auth/session";
import { AppError } from "@/lib/errors";

export async function GET(req: Request) {
  return withHandler(async () => {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get("track");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();
    const take = Math.min(Math.max(Number(searchParams.get("take") || 80), 1), 200);
    const user = await requireUser();

    const challenges = await prisma.challenge.findMany({
      where: {
        isPublished: true,
        ...(track ? { track: track as AssessmentTrack } : {}),
        ...(type ? { type: type as ChallengeType } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
                { summary: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ frequency: "desc" }, { difficulty: "asc" }, { title: "asc" }],
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: canAdmin(user.role),
        type: true,
        track: true,
        difficulty: true,
        estimatedDays: true,
        tags: true,
        companies: true,
        frequency: true,
        avgMinutes: true,
        isPremium: true,
        languages: true,
        publicRequirements: true,
        hints: true,
        contentVersion: true,
        integrityStatus: true,
        calibratedDifficulty: true,
        expectedComplexity: true,
        timeLimitMs: true,
        memoryLimitMb: true,
        functionSignature: true,
        researchFrontier: true,
        adversarialMeta: true,
        createdAt: true,
        ...(canAdmin(user.role)
          ? {
              hiddenRequirements: true,
              referenceSolution: true,
              gradingRubric: true,
            }
          : {}),
      },
    });
    return jsonOk(challenges);
  });
}

const createSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  summary: z.string().min(3),
  description: z.string().min(10),
  type: z.nativeEnum(ChallengeType),
  track: z.nativeEnum(AssessmentTrack),
  difficulty: z.number().int().min(1).max(10),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    const user = await requireUser(["SUPER_ADMIN"]);
    if (!canAdmin(user.role)) throw new AppError("Forbidden", 403, "FORBIDDEN");
    const body = createSchema.parse(await req.json());
    const challenge = await prisma.challenge.create({
      data: {
        ...body,
        publicRequirements: [],
        hiddenRequirements: [],
        gradingRubric: {},
        adaptiveTrack: [],
      },
    });
    return jsonOk(challenge, { status: 201 });
  });
}
