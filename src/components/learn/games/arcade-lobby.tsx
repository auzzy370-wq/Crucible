"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ARCADE_CLEAR_XP, ARCADE_PERFECT_BONUS_XP, type ArcadeGameDef } from "@/server/learning/arcade-games";

type GameRow = ArcadeGameDef & { done: boolean };

const accentBorder = {
  teal: "border-teal-300 bg-teal-50/70",
  amber: "border-amber-300 bg-amber-50/70",
  emerald: "border-emerald-300 bg-emerald-50/70",
  cyan: "border-cyan-300 bg-cyan-50/70",
} as const;

export function ArcadeLobby(props: {
  games: GameRow[];
  completedCount: number;
  percent: number;
}) {
  return (
    <div className="animate-rise space-y-8">
      <header className="overflow-hidden rounded-2xl border border-teal-300/60 bg-gradient-to-br from-teal-500/[0.1] via-white to-amber-50/80 p-5 sm:p-7">
        <p className="font-mono text-xs tracking-[0.3em] text-teal-700">LEARN · ARCADE</p>
        <h1 className="mt-2 font-serif-display text-2xl text-slate-900 sm:text-3xl">HTML5 drills that teach craft</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Short browser games for interview process, Big-O fluency, hashing, and binary search. First clear banks XP;
          perfect runs add a bonus.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="cyan">
            {props.completedCount}/{props.games.length} cleared
          </Badge>
          <Badge variant="amber">+{ARCADE_CLEAR_XP} XP first clear</Badge>
          <Badge variant="emerald">+{ARCADE_PERFECT_BONUS_XP} perfect bonus</Badge>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
          <div className="h-full rounded-full bg-teal-500 transition-[width]" style={{ width: `${props.percent}%` }} />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {props.games.map((g) => (
          <article key={g.slug} className={cn("rounded-2xl border p-5", accentBorder[g.accent])}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">{g.skill}</Badge>
              <Badge>{g.minutes} min</Badge>
              {g.done && <Badge variant="emerald">cleared</Badge>}
            </div>
            <h2 className="mt-3 font-serif-display text-xl text-slate-900">{g.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{g.blurb}</p>
            <div className="mt-4">
              <Link href={`/learn/games/${g.slug}`}>
                <Button>{g.done ? "Play again" : "Play"}</Button>
              </Link>
            </div>
          </article>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        Prefer lessons?{" "}
        <Link href="/learn" className="text-teal-700 hover:underline">
          Back to Learn hub
        </Link>
      </p>
    </div>
  );
}
