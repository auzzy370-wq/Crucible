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
      select: {
        correct: true,
        latencyMs: true,
        resultClass: true,
        mocked: true,
        passedPublic: true,
        totalPublic: true,
        passedHidden: true,
        totalHidden: true,
        challenge: { select: { difficulty: true, slug: true } },
      },
    });
    const verified = all.filter((a) => a.resultClass === "verified" && !a.mocked);
    const pool = verified.length ? verified : all;
    // Keep the latest attempt per challenge so repeats of Two Sum don't flatten the board.
    const latestByChallenge = new Map<string, (typeof pool)[number]>();
    for (const a of pool) {
      const key = a.challenge.slug;
      // findMany is unordered here — prefer correct, then higher partial credit
      const prev = latestByChallenge.get(key);
      if (!prev || runPartial(a) > runPartial(prev) || (a.correct && !prev.correct)) {
        latestByChallenge.set(key, a);
      }
    }
    const distinct = [...latestByChallenge.values()];
    const correct = distinct.filter((a) => a.correct).length;
    const latencySamples = distinct.filter((a) => a.latencyMs != null);
    const avgLatency = latencySamples.length
      ? latencySamples.reduce((s, a) => s + (a.latencyMs ?? 0), 0) / latencySamples.length
      : null;

    let weightSum = 0;
    let pointSum = 0;
    for (const a of distinct) {
      const difficulty = Math.max(1, Math.min(10, a.challenge.difficulty || 1));
      const partial = runPartial(a);
      weightSum += difficulty;
      pointSum += difficulty * partial;
    }
    const scorePct = weightSum ? Math.round((pointSum / weightSum) * 1000) / 10 : 0;

    const m = modelMap[r.aiModelId];
    if (!m || !distinct.length) continue;
    rows.push({
      modelId: m.id,
      slug: m.slug,
      displayName: m.displayName,
      provider: m.provider,
      attempts: distinct.length,
      correct,
      /** Difficulty-weighted partial credit across distinct challenges (not flat pass%). */
      accuracyPct: scorePct,
      clearRatePct: distinct.length ? Math.round((correct / distinct.length) * 1000) / 10 : 0,
      avgLatencyMs: avgLatency ? Math.round(avgLatency) : null,
      verifiedPool: verified.length > 0,
      note: verified.length
        ? "Difficulty-weighted partial credit on verified API-backed runs (one row per challenge)"
        : "Experimental / mocked runs — not claimed as model capability limits",
    });
  }

  rows.sort(
    (a, b) =>
      b.accuracyPct - a.accuracyPct ||
      b.correct - a.correct ||
      (a.avgLatencyMs ?? 9e9) - (b.avgLatencyMs ?? 9e9),
  );
  return rows.slice(0, take).map((r, i) => ({ rank: i + 1, ...r }));
}

/** 0–1 credit from public/hidden harness counts (full clear still wins). */
function runPartial(a: {
  correct: boolean;
  passedPublic: number;
  totalPublic: number;
  passedHidden: number;
  totalHidden: number;
}): number {
  if (a.correct) return 1;
  const pub = a.totalPublic > 0 ? a.passedPublic / a.totalPublic : 0;
  const hid = a.totalHidden > 0 ? a.passedHidden / a.totalHidden : 0;
  if (a.totalPublic === 0 && a.totalHidden === 0) return 0;
  if (a.totalHidden === 0) return pub * 0.85;
  if (a.totalPublic === 0) return hid * 0.9;
  return pub * 0.4 + hid * 0.6;
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
