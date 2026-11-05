"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminCompetitionPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [scorePreview, setScorePreview] = useState<
    { title: string; email: string; overall: number | null; error?: string }[]
  >([]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/competition/analytics");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      setData(json.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function runAllAndPostScores() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/assessments/auto-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assignmentLimit: 200, aiLimit: 200 }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Auto-run failed");
      setLastRun(json.data.summary);
      const rows = (json.data.assignmentScores?.results ?? []).map((r: any) => ({
        title: r.assessmentTitle as string,
        email: r.candidateEmail as string,
        overall: r.overall as number | null,
        error: r.error as string | undefined,
      }));
      setScorePreview(rows.slice(0, 40));
      toast.success(json.data.summary);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auto-run failed");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading && !data) return <p className="text-slate-500">Loading competition analytics…</p>;
  if (!data) return null;

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium text-slate-100">Competition analytics</h2>
          <p className="text-xs text-slate-500">Last {data.windowDays} days · live counts only</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={running} onClick={() => void runAllAndPostScores()}>
            {running ? "Running all assessments…" : "Auto-run all & post scores"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>
      {lastRun && <p className="text-xs text-emerald-300/90">{lastRun}</p>}
      {scorePreview.length > 0 && (
        <div className="max-h-48 overflow-auto rounded-lg border border-slate-800 text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-950 text-slate-500">
              <tr>
                <th className="px-2 py-1 text-left font-normal">Assessment</th>
                <th className="px-2 py-1 text-left font-normal">Candidate</th>
                <th className="px-2 py-1 text-right font-normal">Score</th>
              </tr>
            </thead>
            <tbody>
              {scorePreview.map((r) => (
                <tr key={`${r.email}-${r.title}`} className="border-t border-slate-900 text-slate-300">
                  <td className="px-2 py-1">{r.title}</td>
                  <td className="px-2 py-1 font-mono text-[10px]">{r.email}</td>
                  <td className="px-2 py-1 text-right font-mono">
                    {r.error ? <span className="text-rose-300">err</span> : r.overall ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Challenges", data.totals.challenges],
          ["Research Frontier", data.totals.researchFrontier],
          ["Submissions", data.totals.submissions],
          ["Tournaments", data.totals.tournaments],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-800 px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-xl text-cyan-100">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 px-3 py-3 text-sm">
          <div className="font-medium text-slate-200">Human success</div>
          <div className="mt-1 font-mono text-2xl text-emerald-300">
            {data.human.successRatePct ?? "—"}%
          </div>
          <p className="mt-1 text-xs text-slate-500">{data.human.note}</p>
        </div>
        <div className="rounded-lg border border-slate-800 px-3 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-200">
            AI success
            {data.ai.verifiedPool ? (
              <Badge variant="emerald">verified</Badge>
            ) : (
              <Badge variant="amber">experimental</Badge>
            )}
          </div>
          <div className="mt-1 font-mono text-2xl text-violet-300">
            {data.ai.successRatePct ?? "—"}%
          </div>
          <p className="mt-1 text-xs text-slate-500">{data.ai.note}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">By difficulty</p>
        <div className="flex flex-wrap gap-1">
          {(data.byDifficulty ?? []).map((d: any) => (
            <Badge key={d.difficulty}>
              D{d.difficulty}: {d.count}
            </Badge>
          ))}
        </div>
      </div>

      {(data.hardest ?? []).length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Hardest published</p>
          <ul className="space-y-1 text-sm text-slate-300">
            {data.hardest.map((c: any) => (
              <li key={c.slug}>
                D{c.difficulty} · {c.title}{" "}
                <span className="font-mono text-[10px] text-slate-500">{c.integrityStatus}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.totals.integrityFailures > 0 && (
        <p className="text-sm text-amber-300">
          {data.totals.integrityFailures} challenges with integrityStatus=fail — publish gate should block these.
        </p>
      )}
    </section>
  );
}
