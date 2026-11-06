"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "human" | "ai" | "team";

export function LeaderboardsClient() {
  const [tab, setTab] = useState<Tab>("human");
  const [rows, setRows] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(t: Tab) {
    setLoading(true);
    try {
      const res = await fetch(`/api/competition/leaderboards?tab=${t}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      setRows(json.data.rows ?? []);
      setNotes(json.data.scoringNotes ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(tab);
  }, [tab]);

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-teal-700">RANKINGS</p>
        <h1 className="mt-2 font-serif-display text-2xl sm:text-3xl">Global leaderboards</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Separate boards for humans, AI models, and teams. Verified results are distinguished from experimental
          runs — a single AI miss never claims incapability.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["human", "Human"],
            ["ai", "AI models"],
            ["team", "Teams"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              tab === id ? "border-teal-400/50 bg-teal-500/10 text-teal-900" : "border-slate-300 text-slate-600",
            )}
          >
            {label}
          </button>
        ))}
        <Button variant="secondary" size="sm" onClick={() => void load(tab)}>
          Refresh
        </Button>
      </div>

      <p className="font-mono text-[11px] text-slate-500">{notes}</p>

      {loading ? (
        <p className="text-slate-500">Loading standings…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-white/85 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">{tab === "ai" ? "Model" : tab === "team" ? "Team" : "Competitor"}</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rank + (r.userId || r.modelId || r.teamId)} className="border-b border-slate-200/80">
                  <td className="px-4 py-3 font-mono text-slate-500">#{r.rank}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {r.name || r.displayName || "—"}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {r.provider || r.contest || r.assessmentTitle || r.publicSlug || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-teal-900">
                    {tab === "ai"
                      ? `${r.accuracyPct}%`
                      : tab === "team"
                        ? r.overall
                        : r.contestScore}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tab === "human" && (
                        <>
                          <Badge>{r.solvedCount} solved</Badge>
                          <Badge variant="cyan">{r.completions} clears</Badge>
                        </>
                      )}
                      {tab === "ai" && (
                        <>
                          <Badge>
                            {r.correct}/{r.attempts} clears
                          </Badge>
                          {typeof r.clearRatePct === "number" && (
                            <Badge variant="cyan">{r.clearRatePct}% full clears</Badge>
                          )}
                          {r.verifiedPool ? (
                            <Badge variant="emerald">verified</Badge>
                          ) : (
                            <Badge variant="amber">experimental</Badge>
                          )}
                        </>
                      )}
                      {tab === "team" && (
                        <>
                          <Badge>{r.memberCount} members</Badge>
                          {r.verified ? <Badge variant="emerald">scored</Badge> : <Badge variant="amber">pending</Badge>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No standings yet — compete in tournaments or run AI benchmarks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
