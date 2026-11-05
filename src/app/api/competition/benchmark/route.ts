import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser, canReview } from "@/server/auth/session";
import { publicAiRunView, runAiBenchmark } from "@/server/competition/ai-benchmark";
import { writeAudit } from "@/server/security/audit";

export async function GET(req: Request) {
  return withHandler(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const challengeId = url.searchParams.get("challengeId") ?? undefined;
    const take = Math.min(Number(url.searchParams.get("take") || 40), 100);

    const runs = await prisma.aiBenchmarkRun.findMany({
      where: challengeId ? { challengeId } : undefined,
      orderBy: { createdAt: "desc" },
      take,
      include: {
        aiModel: { select: { slug: true, displayName: true, provider: true } },
        challenge: { select: { slug: true, title: true, difficulty: true } },
      },
    });

    // Compare human hidden_test success on same challenges when requested
    let humanCompare: { challengeId: string; humanAcceptancePct: number | null; submissions: number }[] = [];
    if (challengeId) {
      const jobs = await prisma.executionJob.findMany({
        where: {
          type: "hidden_test",
          workspace: { assignment: { assessment: { challengeId } } },
        },
        select: { status: true, testRun: { select: { hiddenPassed: true, hiddenFailed: true } } },
        take: 500,
      });
      let ok = 0;
      for (const j of jobs) {
        if (j.testRun && j.testRun.hiddenPassed > 0 && j.testRun.hiddenFailed === 0) ok += 1;
        else if (j.status === "SUCCEEDED") ok += 1;
      }
      humanCompare = [
        {
          challengeId,
          submissions: jobs.length,
          humanAcceptancePct: jobs.length ? Math.round((ok / jobs.length) * 1000) / 10 : null,
        },
      ];
    }

    return jsonOk({
      runs: runs.map((r) => publicAiRunView(r)),
      humanCompare,
      canSeeCode: canReview(user.role),
    });
  });
}

const postSchema = z.object({
  challengeId: z.string().min(1),
  aiModelId: z.string().min(1),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    const user = await requireUser();
    const body = postSchema.parse(await req.json());
    try {
      const result = await runAiBenchmark({
        challengeId: body.challengeId,
        aiModelId: body.aiModelId,
        actorId: user.id,
      });
      await writeAudit({
        actorId: user.id,
        action: "competition.ai_benchmark",
        entityType: "AiBenchmarkRun",
        entityId: result.id,
        metadata: { challengeId: body.challengeId, aiModelId: body.aiModelId, mocked: result.mocked },
      });
      return jsonOk(result, { status: 201 });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(e instanceof Error ? e.message : "Benchmark failed", 500, "BENCH_FAILED");
    }
  });
}
