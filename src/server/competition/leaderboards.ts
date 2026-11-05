import { prisma } from "@/lib/db";

/** Transparent human leaderboard from contest entries + assignment completions. */
export async function humanLeaderboard(opts?: { windowDays?: number; take?: number }) {
  const take = opts?.take ?? 50;
  const since =
    opts?.windowDays != null ? new Date(Date.now() - opts.windowDays * 86400000) : null;

  const entries = await prisma.contestEntry.findMany({
    where: since ? { updatedAt: { gte: since } } : undefined,
    orderBy: [{ score: "desc" }, { penaltyMin: "asc" }],
    take,
    include: {
      user: { select: { id: true, name: true, candidateProfile: { select: { publicSlug: true } } } },
      contest: { select: { slug: true, title: true, mode: true } },
    },
  });

  const completions = await prisma.assessmentAssignment.groupBy({
    by: ["candidateId"],
    where: {
      status: { in: ["COMPLETED", "UNDER_REVIEW"] },
      ...(since ? { updatedAt: { gte: since } } : {}),
    },
    _count: { _all: true },
  });
  const completionMap = Object.fromEntries(completions.map((c) => [c.candidateId, c._count._all]));

  return entries.map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    name: e.user.name,
    publicSlug: e.user.candidateProfile?.publicSlug ?? null,
    contestScore: e.score,
    solvedCount: e.solvedCount,
    penaltyMin: e.penaltyMin,
    completions: completionMap[e.userId] ?? 0,
    contest: e.contest.slug,
    verified: true,
    scoring: "contest_score_desc_then_penalty_asc",
  }));
}

export async function aiLeaderboard(opts?: { take?: number }) {
  const take = opts?.take ?? 50;
  const runs = await prisma.aiBenchmarkRun.groupBy({
    by: ["aiModelId"],
    _count: { _all: true },
  });

  const models = await prisma.aiModel.findMany({
    where: { id: { in: runs.map((r) => r.aiModelId) } },
  });
  const modelMap = Object.fromEntries(models.map((m) => [m.id, m]));

  const rows = [];
  for (const r of runs) {
    const all = await prisma.aiBenchmarkRun.findMany({
      where: { aiModelId: r.aiModelId, status: "COMPLETED" },
      select: { correct: true, latencyMs: true, resultClass: true, mocked: true },
    });
    const verified = all.filter((a) => a.resultClass === "verified" && !a.mocked);
    const pool = verified.length ? verified : all;
    const correct = pool.filter((a) => a.correct).length;
    const latencySamples = pool.filter((a) => a.latencyMs != null);
    const avgLatency = latencySamples.length
      ? latencySamples.reduce((s, a) => s + (a.latencyMs ?? 0), 0) / latencySamples.length
      : null;
    const m = modelMap[r.aiModelId];
    if (!m) continue;
    rows.push({
      modelId: m.id,
      slug: m.slug,
      displayName: m.displayName,
      provider: m.provider,
      attempts: pool.length,
      correct,
      accuracyPct: pool.length ? Math.round((correct / pool.length) * 1000) / 10 : 0,
      avgLatencyMs: avgLatency ? Math.round(avgLatency) : null,
      verifiedPool: verified.length > 0,
      note: verified.length
        ? "Verified runs only (API-backed)"
        : "Experimental / mocked runs — not claimed as model capability limits",
    });
  }

  rows.sort((a, b) => b.accuracyPct - a.accuracyPct || b.correct - a.correct);
  return rows.slice(0, take).map((r, i) => ({ rank: i + 1, ...r }));
}

export async function teamLeaderboard(opts?: { take?: number }) {
  const take = opts?.take ?? 50;
  const teams = await prisma.engineeringTeam.findMany({
    take: take * 2,
    orderBy: { createdAt: "desc" },
    include: {
      members: { select: { userId: true } },
      assessment: {
        select: {
          title: true,
          assignments: {
            take: 5,
            orderBy: { updatedAt: "desc" },
            select: {
              status: true,
              scoreReport: { select: { overall: true, qualified: true } },
            },
          },
        },
      },
    },
  });

  return teams
    .map((t) => {
      const reports = t.assessment.assignments
        .map((a) => a.scoreReport)
        .filter(Boolean) as { overall: number; qualified: boolean }[];
      const overall = reports.length
        ? reports.reduce((s, r) => s + r.overall, 0) / reports.length
        : 0;
      return {
        teamId: t.id,
        name: t.name,
        memberCount: t.members.length,
        assessmentTitle: t.assessment.title,
        overall: Math.round(overall * 10) / 10,
        qualified: reports.some((r) => r.qualified),
        verified: reports.length > 0,
        scoring: "avg_team_assessment_score_report",
      };
    })
    .sort((a, b) => b.overall - a.overall)
    .slice(0, take)
    .map((r, i) => ({ rank: i + 1, ...r }));
}
