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
    const user = await requireUser();
    const challenges = await prisma.challenge.findMany({
      where: {
        isPublished: true,
        ...(track ? { track: track as AssessmentTrack } : {}),
        ...(type ? { type: type as ChallengeType } : {}),
      },
      orderBy: [{ track: "asc" }, { difficulty: "desc" }],
    });
    if (canAdmin(user.role)) return jsonOk(challenges);
    // Never leak private evaluation data on the public challenge list
    return jsonOk(
      challenges.map(
        ({
          hiddenRequirements: _h,
          referenceSolution: _r,
          controlledVulns: _c,
          gradingRubric: _g,
          adaptiveTrack: _a,
          ...safe
        }) => safe,
      ),
    );
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
