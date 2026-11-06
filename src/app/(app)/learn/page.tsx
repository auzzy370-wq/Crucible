import Link from "next/link";
import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import { buildLearnerGameState, LESSON_XP, DAILY_XP } from "@/server/learning/gamification";
import { buildLearnerRoadmap } from "@/server/learning/roadmap";
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
          <h1 className="mt-2 font-serif-display text-2xl sm:text-3xl">Level up by proving craft</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Clear lessons, keep a streak, and post timed evidence. XP and ranks come only from work you finish —
            nothing is invented.
          </p>
        </div>

        {/* HUD */}
        <section className="overflow-hidden rounded-2xl border border-teal-300/60 bg-gradient-to-br from-teal-500/[0.09] via-white/80 to-white p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-teal-700/80">Rank</p>
              <p className="mt-1 font-serif-display text-3xl text-slate-900 sm:text-4xl">{game.rank.title}</p>
              <p className="mt-1 font-mono text-sm text-slate-600">
                {game.xp.toLocaleString()} XP
                {game.nextRank ? ` · ${game.xpToNext} to ${game.nextRank.title}` : " · max rank"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="amber">
                {game.streak.current} day streak
                {game.streak.activeToday ? " · lit" : ""}
              </Badge>
              <Badge variant="cyan">
                {game.questsDone}/{game.questsTotal} quests today
              </Badge>
              <Badge>
                {game.unlockedCount}/{game.achievements.length} medals
              </Badge>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span>Progress to next rank</span>
              <span>{game.rankProgressPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="learn-xp-bar h-full rounded-full bg-teal-500 transition-[width] duration-700 ease-out"
                style={{ width: `${game.rankProgressPct}%` }}
              />
            </div>
          </div>
        </section>
      </header>

      {/* Daily quests */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-serif-display text-xl text-slate-900">Today’s quests</h2>
            <p className="mt-1 text-sm text-slate-500">Three objectives. Finish them to keep the forge hot.</p>
          </div>
          <Link href={primaryQuest.href}>
            <Button size="sm">Start: {primaryQuest.title}</Button>
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
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-slate-200 bg-white/75 hover:border-teal-400/50",
              )}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Quest {i + 1}
                </span>
                <Badge variant={q.done ? "emerald" : "cyan"}>+{q.xp} XP</Badge>
              </div>
              <h3 className="mt-2 font-medium text-slate-900 group-hover:text-teal-900">{q.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{q.detail}</p>
              <p className="mt-3 font-mono text-[11px] text-teal-700/80">
                {q.done ? "Cleared" : "Open →"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Craft paths */}
      <section className="grid gap-4 lg:grid-cols-2">
        <PathCard
          label="Interview Craft"
          percent={game.paths.interview.percent}
          done={game.paths.interview.done}
          total={game.paths.interview.total}
          nextTitle={game.paths.interview.nextTitle}
          href={game.paths.interview.nextHref}
          browseHref="/learn/interview"
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
          accent="teal"
        />
      </section>

      {/* Recommended prove */}
      <section className="rounded-2xl border border-slate-200 bg-white/75 p-5">
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
          <Link href="/roadmap">
            <Button variant="ghost">Full roadmap</Button>
          </Link>
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="font-serif-display text-xl text-slate-900">Medals</h2>
        <p className="mt-1 text-sm text-slate-500">Unlock by finishing real work — lessons, streaks, and evidence.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {game.achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-xl border px-4 py-3",
                a.unlocked
                  ? "border-amber-500/25 bg-amber-500/[0.06]"
                  : "border-slate-200/80 bg-white/60 opacity-55",
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/daily", title: "Daily forge", body: `+${DAILY_XP} XP · streak fuel` },
          { href: "/challenges", title: "Problem bank", body: "Browse & clear judges" },
          { href: "/study-plans", title: "Study campaigns", body: "XP, chapters, pack clear bonuses" },
          { href: "/interview", title: "Mock interviews", body: "Timed company rounds" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-slate-200 px-4 py-4 transition hover:border-teal-300/60"
          >
            <div className="font-medium text-slate-900">{c.title}</div>
            <p className="mt-1 text-sm text-slate-500">{c.body}</p>
          </Link>
        ))}
      </section>

      <p className="font-mono text-[11px] text-slate-600">
        Lesson clears award +{LESSON_XP} XP each · ranks: Initiate → Operator → Specialist → Elite → Distinguished
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
  accent: "cyan" | "teal";
}) {
  const border =
    props.accent === "cyan" ? "border-teal-300/50 bg-cyan-500/5" : "border-emerald-500/20 bg-emerald-500/[0.04]";
  const bar = props.accent === "cyan" ? "bg-teal-500" : "bg-emerald-400/90";

  return (
    <div className={cn("rounded-2xl border p-5", border)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={props.accent === "cyan" ? "cyan" : "emerald"}>{props.label}</Badge>
        <Badge>
          {props.done}/{props.total}
        </Badge>
        <Badge variant="amber">+{LESSON_XP} XP / lesson</Badge>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-[width] duration-700", bar)} style={{ width: `${props.percent}%` }} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        {props.nextTitle ? `Next: ${props.nextTitle}` : "Path complete"}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {props.percent}% cleared
        {props.nextTitle ? " — finish the next lesson to bank XP and keep your streak." : " — run mocks or the bank to keep ranking up."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={props.href}>
          <Button>{props.nextTitle ? "Continue lesson" : "Review path"}</Button>
        </Link>
        <Link href={props.browseHref}>
          <Button variant="secondary">All lessons</Button>
        </Link>
      </div>
    </div>
  );
}
