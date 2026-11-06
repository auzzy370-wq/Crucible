"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ForgeSparks } from "@/components/learn/forge-fun";
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
  teal: "border-teal-300 bg-teal-50",
  amber: "border-amber-300 bg-amber-50",
  emerald: "border-emerald-300 bg-emerald-50",
  cyan: "border-cyan-300 bg-cyan-50",
  orange: "border-orange-300 bg-orange-50",
} as const;

const PAGE_SIZE = 20;

export function ArcadeLobby(props: {
  completedSlugs: string[];
  completedCount: number;
}) {
  const done = useMemo(() => new Set(props.completedSlugs), [props.completedSlugs]);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("all");
  const [skill, setSkill] = useState("all");
  const [cleared, setCleared] = useState<"all" | "done" | "open">("open");
  const [page, setPage] = useState(1);

  const featured = useMemo(
    () => ARCADE_GAMES.filter((g) => g.featured).map((g) => ({ ...g, done: done.has(g.slug) })),
    [done],
  );

  const continueGame = useMemo(() => {
    const openFeatured = featured.find((g) => !g.done);
    if (openFeatured) return openFeatured;
    return ARCADE_GAMES.find((g) => !done.has(g.slug)) ?? null;
  }, [done, featured]);

  const familyCounts = useMemo(() => {
    const map = new Map<string, { total: number; open: number }>();
    for (const g of ARCADE_GAMES) {
      if (g.featured) continue;
      const cur = map.get(g.family) ?? { total: 0, open: 0 };
      cur.total += 1;
      if (!done.has(g.slug)) cur.open += 1;
      map.set(g.family, cur);
    }
    return map;
  }, [done]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return ARCADE_GAMES.filter((g) => {
      if (g.featured && family === "all" && !query && skill === "all") return false;
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
      <header className="relative overflow-hidden rounded-2xl border border-[var(--brand)]/30 bg-gradient-to-br from-[var(--brand-soft)] via-white to-orange-50/80 p-5 sm:p-7">
        <ForgeSparks density={9} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-[0.3em] text-[var(--brand)]">LEARN · ARCADE</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">
              {ARCADE_TARGET_COUNT.toLocaleString()} HTML5 drills
            </h1>
            <p className="mt-2 max-w-xl text-slate-600">
              Featured craft first, then browse by family. Drills +{ARCADE_DRILL_XP} XP · featured +{ARCADE_CLEAR_XP} XP.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="cyan">
                {props.completedCount}/{ARCADE_TARGET_COUNT} cleared
              </Badge>
              <Badge variant="amber">Perfect +{ARCADE_PERFECT_BONUS_XP}</Badge>
            </div>
          </div>
          {continueGame && (
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white/90 p-4 sm:w-auto">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Continue</p>
              <p className="mt-1 font-medium text-slate-900">{continueGame.title}</p>
              <p className="mt-1 text-sm text-slate-500">{continueGame.skill} · D{continueGame.difficulty}</p>
              <div className="mt-3">
                <Link href={`/learn/games/${continueGame.slug}`}>
                  <Button size="sm">Play next</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
          <div className="h-full rounded-full bg-[var(--brand)] transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">1 · Featured</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Craft originals</h2>
          </div>
          <Link href="/learn" className="text-sm text-[var(--brand)] hover:underline">
            ← Learn hub
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {featured.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">2 · Catalog</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Browse by family</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length.toLocaleString()} matches · page {safePage}/{pageCount}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FamilyChip
            active={family === "all"}
            label="All drills"
            detail={`${ARCADE_TARGET_COUNT - 4}`}
            onClick={() => {
              setFamily("all");
              setPage(1);
            }}
          />
          {ARCADE_FAMILIES.filter((f) => f.id !== "featured").map((f) => {
            const counts = familyCounts.get(f.id);
            return (
              <FamilyChip
                key={f.id}
                active={family === f.id}
                label={f.label}
                detail={counts ? `${counts.open} open` : undefined}
                onClick={() => {
                  setFamily(f.id);
                  setPage(1);
                }}
              />
            );
          })}
        </div>

        <div className="sticky top-0 z-10 -mx-1 rounded-xl border border-slate-200/80 bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="grid gap-2 sm:grid-cols-3">
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
              <option value="open">Open only</option>
              <option value="done">Cleared only</option>
              <option value="all">Cleared + open</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
          {pageGames.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No drills match those filters.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pageGames.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/learn/games/${g.slug}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-[var(--brand-soft)]/40"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{g.title}</p>
                        {g.done && <Badge variant="emerald">cleared</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{g.blurb}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Badge variant="cyan">{g.skill}</Badge>
                      <Badge variant="amber">D{g.difficulty}</Badge>
                      <span className="font-mono text-[11px] text-[var(--brand)]">{g.done ? "Replay →" : "Play →"}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

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
    </div>
  );
}

function FamilyChip(props: {
  label: string;
  detail?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-left text-sm transition",
        props.active
          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-[var(--brand)]/40",
      )}
    >
      <span className="font-medium">{props.label}</span>
      {props.detail && (
        <span className={cn("ml-1.5 font-mono text-[10px]", props.active ? "text-white/80" : "text-slate-500")}>
          {props.detail}
        </span>
      )}
    </button>
  );
}

function GameCard({ game }: { game: GameRow }) {
  return (
    <article className={cn("rounded-2xl border p-4 sm:p-5", accentBorder[game.accent])}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="cyan">{game.skill}</Badge>
        <Badge>{game.minutes} min</Badge>
        {game.done && <Badge variant="emerald">cleared</Badge>}
      </div>
      <h3 className="mt-3 font-serif-display text-lg font-semibold text-slate-900">{game.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{game.blurb}</p>
      <div className="mt-4">
        <Link href={`/learn/games/${game.slug}`}>
          <Button size="sm">{game.done ? "Play again" : "Play"}</Button>
        </Link>
      </div>
    </article>
  );
}
