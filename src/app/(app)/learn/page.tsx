import Link from "next/link";
import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import { prisma } from "@/lib/db";
import { AI_CRAFT_PLAN_SLUG, AI_LESSONS, nextAiLesson } from "@/server/learning/ai-curriculum";
import {
  INTERVIEW_CRAFT_PLAN_SLUG,
  INTERVIEW_LESSONS,
  nextInterviewLesson,
} from "@/server/learning/interview-curriculum";
import { buildLearnerRoadmap } from "@/server/learning/roadmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function LearnHubPage() {
  const user = await requirePageRoles(CANDIDATE_ROLES);
  const [aiEnrollment, ivEnrollment, streak, roadmap] = await Promise.all([
    prisma.studyPlanEnrollment.findUnique({
      where: { userId_planSlug: { userId: user.id, planSlug: AI_CRAFT_PLAN_SLUG } },
    }),
    prisma.studyPlanEnrollment.findUnique({
      where: { userId_planSlug: { userId: user.id, planSlug: INTERVIEW_CRAFT_PLAN_SLUG } },
    }),
    prisma.userStreak.findUnique({ where: { userId: user.id } }),
    buildLearnerRoadmap(user.id).catch(() => null),
  ]);

  const aiDone = new Set(aiEnrollment?.completedSlugs ?? []);
  const ivDone = new Set(ivEnrollment?.completedSlugs ?? []);
  const nextAi = nextAiLesson(aiDone);
  const nextIv = nextInterviewLesson(ivDone);
  const aiPercent = Math.round((aiDone.size / AI_LESSONS.length) * 100);
  const ivPercent = Math.round((ivDone.size / INTERVIEW_LESSONS.length) * 100);
  const nextProblem = roadmap?.nextProblems?.[0] ?? null;

  return (
    <div className="animate-rise space-y-8">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">LEARN</p>
        <h1 className="mt-2 font-serif-display text-2xl sm:text-3xl">Your learning hub</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Study Interview Craft and AI Craft, clear daily problems, and follow an adaptive roadmap — then prove skills
          with the same judges employers use.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan">Interview Craft</Badge>
            <Badge>{ivPercent}%</Badge>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-100">Prepare for the real loop</h2>
          <p className="mt-2 text-sm text-slate-400">
            {nextIv
              ? `Next lesson: ${nextIv.title} (${nextIv.minutes} min)`
              : ivDone.size
                ? "Path complete — run a company pack or timed mock."
                : "Coding framework, DSA patterns, system design, behavioral STAR."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={nextIv ? `/learn/interview/${nextIv.slug}` : "/learn/interview"}>
              <Button>{nextIv ? "Continue interview lesson" : "Open Interview Craft"}</Button>
            </Link>
            <Link href="/study-plans">
              <Button variant="secondary">Company packs</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="violet">AI Craft</Badge>
            <Badge>{aiPercent}%</Badge>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-100">Learn AI — prompting to production</h2>
          <p className="mt-2 text-sm text-slate-400">
            {nextAi
              ? `Next lesson: ${nextAi.title} (${nextAi.minutes} min)`
              : aiDone.size
                ? "Path complete — keep sharpening on AI vs Human."
                : "Start with what LLMs are, then ship integrations safely."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={nextAi ? `/learn/ai/${nextAi.slug}` : "/learn/ai"}>
              <Button>{nextAi ? "Continue AI lesson" : "Open AI Craft"}</Button>
            </Link>
            <Link href="/ai-vs-human">
              <Button variant="secondary">Benchmark a model</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyan">Next up</Badge>
          {streak && streak.currentStreak > 0 && (
            <Badge variant="amber">{streak.currentStreak} day streak</Badge>
          )}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-slate-100">
          {nextProblem ? nextProblem.title : "Recommended practice"}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {nextProblem
            ? `Adaptive pick · D${nextProblem.difficulty} · ${(nextProblem.tags ?? []).slice(0, 3).join(", ") || "coding"}`
            : "Complete a daily or bank problem so the roadmap can personalize."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {nextProblem ? (
            <Link href={`/challenges?q=${encodeURIComponent(nextProblem.slug)}`}>
              <Button>Open in problem bank</Button>
            </Link>
          ) : (
            <Link href="/daily">
              <Button>Do today&apos;s problem</Button>
            </Link>
          )}
          <Link href="/roadmap">
            <Button variant="secondary">Full roadmap</Button>
          </Link>
          <Link href="/interview">
            <Button variant="ghost">Timed company mock</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/daily", title: "Daily", body: "One timed session today" },
          { href: "/challenges", title: "Problem bank", body: "Browse & practice" },
          { href: "/study-plans", title: "Study plans", body: "Company & role packs" },
          { href: "/interview", title: "Company mocks", body: "Timed interview sims" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-slate-800 px-4 py-4 transition hover:border-cyan-500/30"
          >
            <div className="font-medium text-slate-100">{c.title}</div>
            <p className="mt-1 text-sm text-slate-500">{c.body}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-300">Also useful</h2>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {[
            { href: "/roadmap", label: "Adaptive roadmap" },
            { href: "/playgrounds", label: "Playgrounds" },
            { href: "/weekly", label: "Broken prod" },
            { href: "/contest", label: "Contest" },
            { href: "/editorials", label: "Editorials" },
            { href: "/research-frontier", label: "Research Frontier" },
            { href: "/benchmarks", label: "Benchmarks" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-500 hover:text-cyan-300 hover:underline">
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
