import Link from "next/link";
import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import {
  buildLearnerGameState,
  LESSON_XP,
  DAILY_XP,
  COMBO_XP,
  CHAPTER_CLEAR_XP,
  PERFECT_DAY_XP,
} from "@/server/learning/gamification";
import { buildLearnerRoadmap } from "@/server/learning/roadmap";
import { ForgeHero } from "@/components/learn/forge-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function LearnHubPage() {
  const user = await requirePageRoles(CANDIDATE_ROLES);
  const [game, roadmap] = await Promise.all([
    buildLearnerGameState(user.id),
    buildLearnerRoadmap(user.id).catch(() => null),
  ]);
  const nextProblem = roadmap?.nextProblems?.[0] ?? null;
  const primaryQuest = game.quests.find((q) => !q.done) ?? game.quests[0]!;

  return (
    <div className="animate-rise space-y-8">
      <header className="space-y-4">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-teal-700">LEARN · FORGE</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Level up by proving craft</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Quests, streaks, heat, and perfect-day bonuses — XP only from work you finish.
          </p>
        </div>
        <ForgeHero game={game} />
      </header>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">Today’s quests</h2>
            <p className="mt-1 text-sm text-slate-500">
              Three daily objectives · {game.questsDone}/{game.questsTotal} cleared
              {game.perfectDay ? " · perfect day bonus banked" : ` · +${PERFECT_DAY_XP} XP if you clear all three`}
            </p>
          </div>
          <Link href={primaryQuest.href}>
            <Button size="sm">{game.perfectDay ? "Review forge" : `Start: ${primaryQuest.title}`}</Button>
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {game.quests.map((q, i) => (
            <Link
              key={q.id}
              href={q.href}
              className={cn(
                "learn-quest-card group rounded-xl border px-4 py-4 transition",
                q.done
                  ? "border-emerald-300 bg-emerald-50/70"
                  : "border-slate-200 bg-white/80 hover:border-[var(--brand)]/50",
              )}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Quest {i + 1}</span>
                <Badge variant={q.done ? "emerald" : "cyan"}>+{q.xp} XP</Badge>
              </div>
              <h3 className="mt-2 font-medium text-slate-900 group-hover:text-[var(--brand)]">{q.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{q.detail}</p>
              <p className="mt-3 font-mono text-[11px] text-[var(--brand)]">{q.done ? "Cleared" : "Open →"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">This week</h2>
            <p className="mt-1 text-sm text-slate-500">
              Weekly board · {game.weeklyDone}/{game.weeklyTotal} done
              {game.weeklyDone >= game.weeklyTotal
                ? " · weekly board clear bonus banked"
                : " · clear all three for a board bonus"}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {game.weeklyQuests.map((q) => (
            <Link
              key={q.id}
              href={q.href}
              className={cn(
                "rounded-xl border px-4 py-4 transition",
                q.done
                  ? "border-amber-300 bg-amber-50/70"
                  : "border-slate-200 bg-white/80 hover:border-[var(--brand)]/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-slate-900">{q.title}</h3>
                <Badge variant={q.done ? "emerald" : "amber"}>+{q.xp}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{q.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PathCard
          label="Interview Craft"
          percent={game.paths.interview.percent}
          done={game.paths.interview.done}
          total={game.paths.interview.total}
          nextTitle={game.paths.interview.nextTitle}
          href={game.paths.interview.nextHref}
          browseHref="/learn/interview"
          chapters={game.paths.interview.chapters}
          accent="cyan"
        />
        <PathCard
          label="AI Craft"
          percent={game.paths.ai.percent}
          done={game.paths.ai.done}
          total={game.paths.ai.total}
          nextTitle={game.paths.ai.nextTitle}
          href={game.paths.ai.nextHref}
          browseHref="/learn/ai"
          chapters={game.paths.ai.chapters}
          accent="teal"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyan">Prove quest</Badge>
          <Badge variant="amber">+{DAILY_XP} XP</Badge>
        </div>
        <h2 className="mt-3 font-serif-display text-xl text-slate-900">
          {nextProblem ? nextProblem.title : "Today’s timed challenge"}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          {nextProblem
            ? `Adaptive pick · D${nextProblem.difficulty} · ${(nextProblem.tags ?? []).slice(0, 3).join(", ") || "coding"}`
            : "Open the daily session — same public + hidden judges employers use."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {nextProblem ? (
            <Link href={`/challenges?q=${encodeURIComponent(nextProblem.slug)}`}>
              <Button>Open recommended problem</Button>
            </Link>
          ) : (
            <Link href="/daily">
              <Button>Open today’s challenge</Button>
            </Link>
          )}
          <Link href="/daily">
            <Button variant="secondary">Daily forge</Button>
          </Link>
          <Link href="/study-plans">
            <Button variant="ghost">Study campaigns</Button>
          </Link>
          <Link href="/learn/games">
            <Button variant="secondary">Learn Arcade</Button>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800">HTML5 drills</p>
            <h2 className="mt-1 font-serif-display text-xl text-slate-900">Learn Arcade</h2>
            <p className="mt-1 text-sm text-slate-600">
              Framework Flow, Big-O Blitz, Pair Seeker, Binary Range — short games that teach interview craft.
            </p>
          </div>
          <Link href="/learn/games">
            <Button>Open arcade</Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-900">Medals</h2>
            <p className="mt-1 text-sm text-slate-500">
              Unlock by finishing real work — {game.unlockedCount}/{game.achievements.length} earned
            </p>
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-700"
              style={{
                width: `${Math.round((game.unlockedCount / Math.max(1, game.achievements.length)) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {game.achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-xl border px-4 py-3",
                a.unlocked ? "border-amber-300 bg-amber-50/70" : "border-slate-200 bg-white/60 opacity-55",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-slate-900">{a.title}</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {a.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{a.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="font-mono text-[11px] text-slate-500">
        Lesson +{LESSON_XP} · same-day combo +{COMBO_XP} · chapter clear +{CHAPTER_CLEAR_XP} · perfect day +
        {PERFECT_DAY_XP} · ranks: Initiate → Spark → Apprentice → … → Distinguished
      </p>
    </div>
  );
}

function PathCard(props: {
  label: string;
  percent: number;
  done: number;
  total: number;
  nextTitle: string | null;
  href: string;
  browseHref: string;
  chapters: { id: string; title: string; done: number; total: number; cleared: boolean }[];
  accent: "cyan" | "teal";
}) {
  const border =
    props.accent === "cyan" ? "border-teal-300/50 bg-teal-500/[0.06]" : "border-emerald-300/50 bg-emerald-500/[0.06]";
  const bar = props.accent === "cyan" ? "bg-teal-500" : "bg-emerald-500";

  return (
    <div className={cn("rounded-2xl border p-5", border)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={props.accent === "cyan" ? "cyan" : "emerald"}>{props.label}</Badge>
        <Badge>
          {props.done}/{props.total}
        </Badge>
        <Badge variant="amber">+{LESSON_XP} XP / lesson</Badge>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
        <div className={cn("h-full rounded-full transition-[width] duration-700", bar)} style={{ width: `${props.percent}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {props.chapters.map((c) => (
          <span
            key={c.id}
            className={cn(
              "rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
              c.cleared ? "border-emerald-400 text-emerald-800" : "border-slate-300 text-slate-500",
            )}
          >
            {c.title} {c.done}/{c.total}
          </span>
        ))}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        {props.nextTitle ? `Next: ${props.nextTitle}` : "Path complete"}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {props.percent}% cleared
        {props.nextTitle ? " — finish the next lesson to bank XP and keep your streak." : " — run campaigns or the bank to keep ranking up."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={props.href}>
          <Button>{props.nextTitle ? "Continue lesson" : "Review path"}</Button>
        </Link>
        <Link href={props.browseHref}>
          <Button variant="secondary">Path map</Button>
        </Link>
      </div>
    </div>
  );
}
