import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { isPremium, requireUser } from "@/server/auth/session";
import { createWorkspaceForAssignment } from "@/server/execution/workspace";

export async function GET() {
  return withHandler(async () => {
    const user = await requireUser();
    const sims = await prisma.interviewSimulation.findMany({
      where: { userId: user.id },
      include: { challenge: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return jsonOk({ sims, premium: isPremium(user) });
  });
}

const startSchema = z.object({
  company: z.string().min(2),
  role: z.string().min(2).default("Software Engineer"),
  challengeId: z.string().optional(),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    const user = await requireUser();
    if (!isPremium(user)) {
      throw new AppError("Interview Simulations are a Premium feature. Upgrade to unlock.", 402, "PREMIUM_REQUIRED");
    }
    const body = startSchema.parse(await req.json());

    let challenge = body.challengeId
      ? await prisma.challenge.findUnique({ where: { id: body.challengeId } })
      : null;

    if (!challenge) {
      const pool = await prisma.challenge.findMany({
        where: {
          isPublished: true,
          type: "CODING_PROBLEM",
          companies: { has: body.company },
        },
        orderBy: { frequency: "desc" },
        take: 20,
      });
      challenge = pool[Math.floor(Math.random() * Math.max(pool.length, 1))] ?? null;
    }

    if (!challenge) {
      challenge = await prisma.challenge.findFirst({
        where: { isPublished: true, type: "CODING_PROBLEM" },
        orderBy: { frequency: "desc" },
      });
    }
    if (!challenge) throw new AppError("No coding challenges available", 404, "NOT_FOUND");

    const timedMinutes = challenge.avgMinutes || 45;
    const sim = await prisma.interviewSimulation.create({
      data: {
        userId: user.id,
        company: body.company,
        role: body.role,
        challengeId: challenge.id,
        timedMinutes,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      include: { challenge: true },
    });

    // Ensure a published assessment + assignment + workspace for the candidate
    let assessment = await prisma.assessment.findFirst({
      where: { challengeId: challenge.id, status: "PUBLISHED" },
    });
    if (!assessment) {
      assessment = await prisma.assessment.create({
        data: {
          title: `${body.company} Interview — ${challenge.title}`,
          description: `Timed interview simulation for ${body.role}`,
          challengeId: challenge.id,
          track: challenge.track,
          status: "PUBLISHED",
          timedMinutes,
          multiDay: false,
          createdById: user.id,
        },
      });
    }

    let assignment = await prisma.assessmentAssignment.findFirst({
      where: { assessmentId: assessment.id, candidateId: user.id },
      include: { workspace: true },
    });
    if (!assignment) {
      const startedAt = new Date();
      assignment = await prisma.assessmentAssignment.create({
        data: {
          assessmentId: assessment.id,
          candidateId: user.id,
          assignedById: user.id,
          status: "IN_PROGRESS",
          startedAt,
          dueAt: new Date(startedAt.getTime() + timedMinutes * 60 * 1000),
        },
        include: { workspace: true },
      });
      await createWorkspaceForAssignment({
        assignmentId: assignment.id,
        challengeSlug: challenge.slug,
        language: challenge.languages[0] ?? "typescript",
        track: challenge.track,
      });
      assignment = await prisma.assessmentAssignment.findUniqueOrThrow({
        where: { id: assignment.id },
        include: { workspace: true },
      });
    } else if (!assignment.workspace) {
      await createWorkspaceForAssignment({
        assignmentId: assignment.id,
        challengeSlug: challenge.slug,
        language: challenge.languages[0] ?? "typescript",
        track: challenge.track,
      });
      assignment = await prisma.assessmentAssignment.findUniqueOrThrow({
        where: { id: assignment.id },
        include: { workspace: true },
      });
    }

    return jsonOk(
      {
        simulation: sim,
        workspaceId: assignment.workspace?.id,
        timedMinutes,
      },
      { status: 201 },
    );
  });
}
