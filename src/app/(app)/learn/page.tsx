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
import { MedalShine, QuestClearedMark } from "@/components/learn/forge-fun";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const JUMP = [
  { href: "#quests", label: "Quests" },
  { href: "#paths", label: "Paths" },
  { href: "#practice", label: "Practice" },
  { href: "#medals", label: "Medals" },
] as const;

export default async function LearnHubPage() {
  const user = await requirePageRoles(CANDIDATE_ROLES);
  const [game, roadmap] = await Promise.all([
    buildLearnerGameState(user.id),
    buildLearnerRoadmap(user.id).catch(() => null),
  ]);
  const nextProblem = roadmap?.nextProblems?.[0] ?? null;
  const primaryQuest = game.quests.find((q) => !q.done) ?? game.quests[0]!;
  const unlockedMedals = game.achievements.filter((a) => a.unlocked);
  const lockedMedals = game.achievements.filter((a) => !a.unlocked);

  return (
    <div className="animate-rise space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-[var(--brand)]">LEARN · FORGE</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Level up by proving craft</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Quests first, then paths and practice — XP only from work you finish.
            </p>
          </div>
          <nav className="flex flex-wrap gap-1.5" aria-label="Learn sections">
            {JUMP.map((j) => (
              <a
                key={j.href}
                href={j.href}
                className="rounded-md border border-slate-200 bg-white/80 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-600 transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
              >
                {j.label}
              </a>
            ))}
          </nav>
        </div>
        <ForgeHero game={game} />
      </header>

      <section id="quests" className="scroll-mt-20 space-y-6">
        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">1 · Board</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">Today’s quests</h2>
              <p className="mt-1 text-sm text-slate-500">
                {game.questsDone}/{game.questsTotal} cleared
                {game.perfectDay ? " · perfect day banked" : ` · +${PERFECT_DAY_XP} XP if you clear all three`}
              </p>
            </div>
            <Link href={primaryQuest.href}>
              <Button size="sm">{game.perfectDay ? "Browse forge" : `Start: ${primaryQuest.title}`}</Button>
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
                    ? "is-cleared border-emerald-300 bg-emerald-50/70"
                    : "border-slate-200 bg-white/80 hover:border-[var(--brand)]/50",
                )}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Quest {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <QuestClearedMark show={q.done} />
                    <Badge variant={q.done ? "emerald" : "cyan"}>+{q.xp} XP</Badge>
                  </div>
                </div>
                <h3 className="mt-2 font-medium text-slate-900 group-hover:text-[var(--brand)]">{q.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{q.detail}</p>
                <p className="mt-3 font-mono text-[11px] text-[var(--brand)]">{q.done ? "Cleared" : "Open →"}</p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">This week</h3>
            <p className="mt-1 text-sm text-slate-500">
              {game.weeklyDone}/{game.weeklyTotal} done
              {game.weeklyDone >= game.weeklyTotal
                ? " · board clear bonus banked"
                : " · clear all three for a board bonus"}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {game.weeklyQuests.map((q) => (
              <Link
                key={q.id}
                href={q.href}
                className={cn(
                  "learn-quest-card rounded-xl border px-4 py-4 transition",
                  q.done
                    ? "is-cleared border-amber-300 bg-amber-50/70"
                    : "border-slate-200 bg-white/80 hover:border-[var(--brand)]/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-slate-900">{q.title}</h3>
                  <div className="flex items-center gap-2">
                    <QuestClearedMark show={q.done} />
                    <Badge variant={q.done ? "emerald" : "amber"}>+{q.xp}</Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-500">{q.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="paths" className="scroll-mt-20 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">2 · Craft paths</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">Continue a curriculum</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
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
        </div>
      </section>

      <section id="practice" className="scroll-mt-20 space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">3 · Practice lanes</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">Prove it or play a drill</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">Timed evidence</Badge>
              <Badge variant="amber">+{DAILY_XP} XP</Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
              {nextProblem ? nextProblem.title : "Today’s timed challenge"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {nextProblem
                ? `Adaptive pick · D${nextProblem.difficulty} · ${(nextProblem.tags ?? []).slice(0, 3).join(", ") || "coding"}`
                : "Same public + hidden judges employers use."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {nextProblem ? (
                <Link href={`/challenges?q=${encodeURIComponent(nextProblem.slug)}`}>
                  <Button>Open problem</Button>
                </Link>
              ) : (
                <Link href="/daily">
                  <Button>Open daily</Button>
                </Link>
              )}
              <Link href="/daily">
                <Button variant="secondary">Daily forge</Button>
              </Link>
              <Link href="/study-plans">
                <Button variant="ghost">Campaigns</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="amber">HTML5</Badge>
              <Badge>1,000 drills</Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">Learn Arcade</h3>
            <p className="mt-2 text-sm text-slate-600">
              Featured craft games plus seeded arenas for hashing, Big-O, stacks, bits, and systems timing.
            </p>
            <div className="mt-4">
              <Link href="/learn/games">
                <Button>Open arcade</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="medals" className="scroll-mt-20 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">4 · Collection</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-900">Medals</h2>
            <p className="mt-1 text-sm text-slate-500">
              {game.unlockedCount}/{game.achievements.length} earned
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

        {unlockedMedals.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unlockedMedals.map((a) => (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-3"
              >
                <MedalShine active />
                <div className="relative flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-slate-900">{a.title}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-800">Unlocked</span>
                </div>
                <p className="relative mt-1 text-xs text-slate-500">{a.detail}</p>
              </div>
            ))}
          </div>
        )}

        {lockedMedals.length > 0 && (
          <details className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3">
            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-slate-600">
              {lockedMedals.length} locked medals
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lockedMedals.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 opacity-70">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-slate-900">{a.title}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Locked</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{a.detail}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>

      <p className="font-mono text-[11px] text-slate-500">
        Lesson +{LESSON_XP} · same-day combo +{COMBO_XP} · chapter clear +{CHAPTER_CLEAR_XP} · perfect day +
        {PERFECT_DAY_XP}
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
      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        {props.nextTitle ? `Next: ${props.nextTitle}` : "Path complete"}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        {props.percent}% cleared
        {props.nextTitle ? " — finish the next lesson to bank XP." : " — run campaigns or the bank next."}
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
