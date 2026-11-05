import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import { aiLeaderboard, humanLeaderboard, teamLeaderboard } from "@/server/competition/leaderboards";

export async function GET(req: Request) {
  return withHandler(async () => {
    await requireUser();
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") || "human";
    const windowDays = url.searchParams.get("window")
      ? Number(url.searchParams.get("window"))
      : undefined;

    if (tab === "ai") {
      return jsonOk({ tab, rows: await aiLeaderboard(), scoringNotes: "AI accuracy from completed benchmark runs; mocked runs marked experimental." });
    }
    if (tab === "team") {
      return jsonOk({ tab, rows: await teamLeaderboard(), scoringNotes: "Team average from scored assessment reports." });
    }
    return jsonOk({
      tab: "human",
      rows: await humanLeaderboard({ windowDays }),
      scoringNotes: "Contest score desc, then penalty asc. Completions counted separately.",
    });
  });
}
