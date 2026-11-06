"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ARCADE_CLEAR_XP,
  ARCADE_DRILL_XP,
  ARCADE_FAMILIES,
  ARCADE_GAMES,
  ARCADE_PERFECT_BONUS_XP,
  ARCADE_SKILLS,
  ARCADE_TARGET_COUNT,
  type ArcadeGameDef,
} from "@/server/learning/arcade-games";

type GameRow = ArcadeGameDef & { done: boolean };

const accentBorder = {
  teal: "border-teal-300 bg-teal-50/70",
  amber: "border-amber-300 bg-amber-50/70",
  emerald: "border-emerald-300 bg-emerald-50/70",
  cyan: "border-cyan-300 bg-cyan-50/70",
  orange: "border-orange-300 bg-orange-50/70",
} as const;

const PAGE_SIZE = 24;

export function ArcadeLobby(props: {
  completedSlugs: string[];
  completedCount: number;
}) {
  const done = useMemo(() => new Set(props.completedSlugs), [props.completedSlugs]);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("all");
  const [skill, setSkill] = useState("all");
  const [cleared, setCleared] = useState<"all" | "done" | "open">("all");
  const [page, setPage] = useState(1);

  const featured = useMemo(
    () => ARCADE_GAMES.filter((g) => g.featured).map((g) => ({ ...g, done: done.has(g.slug) })),
    [done],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return ARCADE_GAMES.filter((g) => {
      if (g.featured && family === "all" && !query && skill === "all" && cleared === "all") return false;
      if (family !== "all" && g.family !== family) return false;
      if (skill !== "all" && g.skill !== skill) return false;
      if (cleared === "done" && !done.has(g.slug)) return false;
      if (cleared === "open" && done.has(g.slug)) return false;
      if (!query) return true;
      return (
        g.title.toLowerCase().includes(query) ||
        g.blurb.toLowerCase().includes(query) ||
        g.skill.toLowerCase().includes(query) ||
        g.slug.includes(query)
      );
    }).map((g) => ({ ...g, done: done.has(g.slug) }));
  }, [q, family, skill, cleared, done]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageGames = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const percent = Math.round((props.completedCount / ARCADE_TARGET_COUNT) * 100);

  return (
    <div className="animate-rise space-y-8">
      <header className="overflow-hidden rounded-2xl border border-[var(--brand)]/30 bg-gradient-to-br from-[var(--brand-soft)] via-white to-orange-50/80 p-5 sm:p-7">
        <p className="font-mono text-xs tracking-[0.3em] text-[var(--brand)]">LEARN · ARCADE</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">
          {ARCADE_TARGET_COUNT.toLocaleString()} HTML5 drills
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Four featured craft games plus {(ARCADE_TARGET_COUNT - 4).toLocaleString()} seeded browser drills across
          hashing, Big-O, stacks, bits, systems timing, and more. First clear banks XP; perfect runs add a bonus.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="cyan">
            {props.completedCount}/{ARCADE_TARGET_COUNT} cleared
          </Badge>
          <Badge variant="amber">Featured +{ARCADE_CLEAR_XP} XP</Badge>
          <Badge variant="emerald">Drills +{ARCADE_DRILL_XP} XP</Badge>
          <Badge>Perfect bonus +{ARCADE_PERFECT_BONUS_XP}</Badge>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
          <div className="h-full rounded-full bg-[var(--brand)] transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Featured craft</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Full catalog</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length.toLocaleString()} matches · page {safePage}/{pageCount}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, skill, slug…"
            aria-label="Search arcade games"
          />
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={family}
            onChange={(e) => {
              setFamily(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All families</option>
            {ARCADE_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All skills</option>
            {ARCADE_SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={cleared}
            onChange={(e) => {
              setCleared(e.target.value as "all" | "done" | "open");
              setPage(1);
            }}
          >
            <option value="all">Cleared + open</option>
            <option value="open">Open only</option>
            <option value="done">Cleared only</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageGames.map((g) => (
            <GameCard key={g.slug} game={g} compact />
          ))}
        </div>

        {pageGames.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No drills match those filters.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <p className="font-mono text-xs text-slate-500">
            {safePage} / {pageCount}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </Button>
        </div>
      </section>

      <p className="text-sm text-slate-500">
        Prefer lessons?{" "}
        <Link href="/learn" className="text-[var(--brand)] hover:underline">
          Back to Learn hub
        </Link>
      </p>
    </div>
  );
}

function GameCard({ game, compact }: { game: GameRow; compact?: boolean }) {
  return (
    <article className={cn("rounded-2xl border p-4 sm:p-5", accentBorder[game.accent])}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="cyan">{game.skill}</Badge>
        <Badge>{game.minutes} min</Badge>
        <Badge variant="amber">D{game.difficulty}</Badge>
        {game.featured && <Badge>Featured</Badge>}
        {game.done && <Badge variant="emerald">cleared</Badge>}
      </div>
      <h3 className={cn("mt-3 font-semibold text-slate-900", compact ? "text-base" : "text-xl")}>{game.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{game.blurb}</p>
      <div className="mt-4">
        <Link href={`/learn/games/${game.slug}`}>
          <Button size={compact ? "sm" : "default"}>{game.done ? "Play again" : "Play"}</Button>
        </Link>
      </div>
    </article>
  );
}
