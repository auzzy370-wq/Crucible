"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LEARNER_RANKS, PERFECT_DAY_XP, type LearnerGameState } from "@/server/learning/gamification";
import { AnimatedXp, ForgeSparks } from "@/components/learn/forge-fun";

export function ForgeHero({ game }: { game: LearnerGameState }) {
  const questPct = Math.round((game.questsDone / Math.max(1, game.questsTotal)) * 100);
  const sparkDensity = game.perfectDay ? 14 : game.streak.heat >= 70 ? 12 : game.streak.heat >= 30 ? 8 : 4;

  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border border-[var(--brand)]/30 bg-[var(--surface-elevated)] p-5 sm:p-6">
      <ForgeSparks density={sparkDensity} />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="forge-level-badge inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-[var(--brand)] px-2 font-mono text-sm font-semibold text-white">
              Lv {game.level}
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--brand)]">Forge rank</p>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">
            {game.rank.title}
          </p>
          <p className="mt-1 font-mono text-sm text-slate-600">
            <AnimatedXp value={game.xp} /> XP
            {game.nextRank ? ` · ${game.xpToNext} to ${game.nextRank.title}` : " · max rank"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="amber" className={cn(game.streak.activeToday && "forge-heat-pulse")}>
              {game.streak.current}d streak
              {game.streak.activeToday ? " · lit" : ""}
            </Badge>
            <Badge variant="cyan">
              {game.questsDone}/{game.questsTotal} today
            </Badge>
            <Badge variant="emerald">
              {game.weeklyDone}/{game.weeklyTotal} weekly
            </Badge>
            {game.perfectDay && <Badge variant="emerald">Perfect day</Badge>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              "relative flex h-20 w-20 items-center justify-center rounded-full border-4",
              game.streak.heat >= 70
                ? "forge-heat-pulse border-[var(--brand)] bg-orange-100/80"
                : game.streak.heat >= 30
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 bg-white",
            )}
            title={`Forge heat ${game.streak.heat}%`}
          >
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Heat</p>
              <p className="text-lg font-semibold text-slate-900">{game.streak.current}d</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {game.streak.milestones.map((m) => (
              <span
                key={m.days}
                className={cn(
                  "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition",
                  m.reached
                    ? "border-[var(--brand)]/40 bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-slate-200 text-slate-400",
                )}
              >
                {m.days}d
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span>Next rank</span>
              <span>{game.rankProgressPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="learn-xp-bar h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${game.rankProgressPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span>Today’s quests</span>
              <span>
                {game.questsDone}/{game.questsTotal} · {questPct}%
              </span>
            </div>
            <div className="flex gap-1.5">
              {game.quests.map((q) => (
                <div
                  key={q.id}
                  className={cn(
                    "h-2.5 flex-1 rounded-full transition-all duration-500",
                    q.done ? "learn-xp-bar scale-y-110" : "bg-slate-200",
                  )}
                  title={q.title}
                />
              ))}
            </div>
          </div>
          {game.perfectDay ? (
            <div className="forge-perfect-banner rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700">Perfect day</p>
              <p className="text-sm font-medium text-emerald-950">
                All daily quests cleared · +{game.breakdown.perfectDay} XP locked in
              </p>
            </div>
          ) : (
            <p className="font-mono text-[11px] text-slate-500">
              Perfect day · +{PERFECT_DAY_XP} XP when all three daily quests clear
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-orange-500/5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]/30">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Focus now</p>
          <h2 className="mt-1 text-lg font-medium text-slate-900">{game.focus.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{game.focus.detail}</p>
          <div className="mt-3">
            <Link href={game.focus.href}>
              <Button>{game.focus.cta}</Button>
            </Link>
          </div>
        </div>
      </div>

      <details className="relative mt-5 rounded-xl border border-orange-200/70 bg-white/70 px-4 py-3">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-slate-600">
          XP breakdown · rank ladder · {game.unlockedCount} medals
        </summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {(
            [
              ["Lessons", game.breakdown.lessons],
              ["Daily", game.breakdown.daily],
              ["Prove", game.breakdown.prove],
              ["Campaigns", game.breakdown.campaigns],
              ["Arcade", game.breakdown.arcade],
              ["Streak", game.breakdown.streak],
              ["Weekly", game.breakdown.weekly],
              ["Perfect", game.breakdown.perfectDay],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-orange-100 bg-white px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
              <p className="font-mono text-sm text-slate-900">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {LEARNER_RANKS.map((r) => {
            const reached = game.xp >= r.minXp;
            const current = r.id === game.rank.id;
            return (
              <span
                key={r.id}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
                  current
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : reached
                      ? "border-orange-200 bg-orange-50 text-orange-800"
                      : "border-slate-200 text-slate-400",
                )}
              >
                {r.title}
              </span>
            );
          })}
        </div>
      </details>
    </section>
  );
}
