import { z } from "zod";
import { AssessmentTrack, ChallengeType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser, canAdmin } from "@/server/auth/session";
import { AppError } from "@/lib/errors";

export async function GET(req: Request) {
  return withHandler(async () => {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const track = searchParams.get("track");
    const type = searchParams.get("type");
    const challenges = await prisma.challenge.findMany({
      where: {
        isPublished: true,
        ...(track ? { track: track as AssessmentTrack } : {}),
        ...(type ? { type: type as ChallengeType } : {}),
      },
      orderBy: [{ track: "asc" }, { difficulty: "desc" }],
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
