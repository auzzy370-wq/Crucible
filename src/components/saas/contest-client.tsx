"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ContestClient() {
  const [contest, setContest] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/contests");
    const json = await res.json();
    if (json.ok) setContest(json.data.contest);
  }

  useEffect(() => {
    void load();
  }, []);

  async function checkIn(points: number) {
    if (!contest) return;
    const res = await fetch("/api/contests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contestId: contest.id, deltaScore: points, penaltyMin: 0 }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Failed");
    toast.success(`+${points} on the board`);
    await load();
  }

  if (!contest) {
    return <p className="text-slate-500">No active contest heat right now.</p>;
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">PROVE THE CRAFT</p>
        <h1 className="mt-2 font-serif-display text-2xl sm:text-3xl">{contest.title}</h1>
        <p className="mt-2 max-w-3xl text-slate-400">{contest.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="cyan">Ends {new Date(contest.endsAt).toLocaleString()}</Badge>
          <Badge>{contest.problems?.length ?? 0} problems</Badge>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-200">Heat set</h2>
        {contest.problems?.map((p: any) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 px-4 py-3"
          >
            <div>
              <div className="font-medium">
                {p.ordinal}. {p.challenge.title}
              </div>
              <div className="text-xs text-slate-500">{p.points} pts</div>
            </div>
            <div className="flex gap-2">
              <Link href="/challenges" className="text-sm text-cyan-300 hover:underline">
                Open evidence bank →
              </Link>
              <Button size="sm" variant="secondary" onClick={() => checkIn(p.points)}>
                Mark solved
              </Button>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-200">Leaderboard</h2>
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Engineer</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Solved</th>
              </tr>
            </thead>
            <tbody>
              {(contest.entries ?? []).map((e: any, i: number) => (
                <tr key={e.id} className="border-b border-slate-800/80">
                  <td className="px-4 py-3 font-mono text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3">{e.user?.name}</td>
                  <td className="px-4 py-3 font-mono text-cyan-200">{e.score}</td>
                  <td className="px-4 py-3 font-mono">{e.solvedCount}</td>
                </tr>
              ))}
              {!(contest.entries ?? []).length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Be the first on the board.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          Contests are an optional habit loop — evidence-based assessments still outrank puzzle velocity.
        </p>
      </section>
    </div>
  );
}
