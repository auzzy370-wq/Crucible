import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import { writeAudit } from "@/server/security/audit";

export async function GET(req: Request) {
  return withHandler(async () => {
    await requireUser(["SUPER_ADMIN"]);
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const published = url.searchParams.get("published");
    const take = Math.min(Number(url.searchParams.get("take") || 60), 200);

    const [challenges, assessments, teams, incidents] = await Promise.all([
      prisma.challenge.findMany({
        where: {
          ...(published === "true" ? { isPublished: true } : {}),
          ...(published === "false" ? { isPublished: false } : {}),
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
        orderBy: [{ isPublished: "desc" }, { frequency: "desc" }, { title: "asc" }],
        take,
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
          track: true,
          difficulty: true,
          isPublished: true,
          isPremium: true,
          frequency: true,
          avgMinutes: true,
          tags: true,
          _count: { select: { assessments: true } },
        },
      }),
      prisma.assessment.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        select: {
          id: true,
          title: true,
          status: true,
          track: true,
          timedMinutes: true,
          createdAt: true,
          challenge: { select: { slug: true, title: true, type: true } },
          _count: { select: { assignments: true } },
        },
      }),
      prisma.engineeringTeam.count(),
      prisma.incidentScenario.count(),
    ]);

    return jsonOk({
      challenges,
      assessments,
      counts: {
        challenges: await prisma.challenge.count(),
        published: await prisma.challenge.count({ where: { isPublished: true } }),
        premium: await prisma.challenge.count({ where: { isPremium: true } }),
        assessments: await prisma.assessment.count(),
        teams,
        incidents,
      },
    });
  });
}

const patchSchema = z.object({
  challengeId: z.string(),
  isPublished: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
});

export async function PATCH(req: Request) {
  return withHandler(async () => {
    const admin = await requireUser(["SUPER_ADMIN"]);
    const body = patchSchema.parse(await req.json());
    const updated = await prisma.challenge.update({
      where: { id: body.challengeId },
      data: {
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        ...(body.isPremium !== undefined ? { isPremium: body.isPremium } : {}),
        ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
        isPremium: true,
        difficulty: true,
      },
    });
    await writeAudit({
      action: "admin.challenge_update",
      entityType: "Challenge",
      entityId: updated.id,
      actorId: admin.id,
      metadata: {
        isPublished: body.isPublished,
        isPremium: body.isPremium,
        difficulty: body.difficulty,
      },
    });
    return jsonOk(updated);
  });
}
