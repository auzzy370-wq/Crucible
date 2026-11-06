import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { platformAnalytics } from "@/server/analytics/service";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatScore } from "@/lib/utils";
import { SessionTimer } from "@/components/assessment/session-timer";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const isStaff = ["SUPER_ADMIN", "HIRING_MANAGER", "TECHNICAL_REVIEWER"].includes(user.role);

  if (!isStaff) {
    const { AI_CRAFT_PLAN_SLUG, AI_LESSONS, nextAiLesson } = await import("@/server/learning/ai-curriculum");
    const {
      INTERVIEW_CRAFT_PLAN_SLUG,
      INTERVIEW_LESSONS,
      nextInterviewLesson,
    } = await import("@/server/learning/interview-curriculum");
    const { buildLearnerRoadmap } = await import("@/server/learning/roadmap");
    const [assignments, streak, enrollments, profile, daily, aiEnrollment, ivEnrollment, roadmap] =
      await Promise.all([
        prisma.assessmentAssignment.findMany({
          where: { candidateId: user.id },
          include: {
            assessment: {
              include: {
                challenge: {
                  select: {
                    id: true,
                    title: true,
                    summary: true,
                    type: true,
                    track: true,
                    difficulty: true,
                    tags: true,
                  },
                },
              },
            },
            scoreReport: true,
            workspace: { select: { id: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
        prisma.userStreak.findUnique({ where: { userId: user.id } }),
        prisma.studyPlanEnrollment.count({ where: { userId: user.id } }),
        prisma.candidateProfile.findUnique({ where: { userId: user.id } }),
        prisma.dailyChallenge.findFirst({
          orderBy: { dateKey: "desc" },
          include: { challenge: true },
        }),
        prisma.studyPlanEnrollment.findUnique({
          where: { userId_planSlug: { userId: user.id, planSlug: AI_CRAFT_PLAN_SLUG } },
        }),
        prisma.studyPlanEnrollment.findUnique({
          where: { userId_planSlug: { userId: user.id, planSlug: INTERVIEW_CRAFT_PLAN_SLUG } },
        }),
        buildLearnerRoadmap(user.id).catch(() => null),
      ]);
    const aiNext = nextAiLesson(aiEnrollment?.completedSlugs ?? []);
    const aiPercent = Math.round(((aiEnrollment?.completedSlugs.length ?? 0) / AI_LESSONS.length) * 100);
    const ivNext = nextInterviewLesson(ivEnrollment?.completedSlugs ?? []);
    const ivPercent = Math.round(((ivEnrollment?.completedSlugs.length ?? 0) / INTERVIEW_LESSONS.length) * 100);
    const nextProblem = roadmap?.nextProblems?.[0] ?? null;

    const codingOpen =
      assignments.find(
        (a) =>
          a.workspace &&
          a.assessment.challenge.type === "CODING_PROBLEM" &&
          !["COMPLETED", "FAILED", "EXPIRED"].includes(a.status),
      ) ?? assignments.find((a) => a.workspace);

    const completedWithScore = assignments.filter((a) => a.scoreReport);
    const firstRunDone = Boolean(streak?.currentStreak) && completedWithScore.length > 0;

    return (
      <div className="animate-rise space-y-6">
        <header>
          <p className="font-mono text-xs tracking-[0.3em] text-teal-700">LEARNING PATH</p>
          <h1 className="mt-2 font-serif-display text-2xl tracking-tight sm:text-3xl">
            {firstRunDone ? "Keep sharpening" : "Learn by proving"}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Practice the same timed work employers use to test candidates — then publish verified proof.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-teal-300/50 bg-cyan-500/5 p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-teal-700/80">Interview Craft</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              {ivNext ? ivNext.title : ivPercent ? "Interview path complete" : "Prepare for the loop"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {ivNext
                ? `${ivNext.summary} · ${ivNext.minutes} min · ${ivPercent}% done`
                : "Coding, design, behavioral, company packs."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href={ivNext ? `/learn/interview/${ivNext.slug}` : "/learn/interview"}
                className="text-teal-800 hover:underline"
              >
                {ivNext ? "Continue lesson →" : "Start Interview Craft →"}
              </Link>
              <Link href="/study-plans" className="text-slate-600 hover:underline">
                Study plans →
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-violet-200/80">AI Craft</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              {aiNext ? aiNext.title : aiPercent ? "AI path complete" : "Learn AI — prompt to production"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {aiNext
                ? `${aiNext.summary} · ${aiNext.minutes} min · ${aiPercent}% done`
                : "Prompting, APIs, RAG, agents, evals, safety."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href={aiNext ? `/learn/ai/${aiNext.slug}` : "/learn/ai"}
                className="text-violet-200 hover:underline"
              >
                {aiNext ? "Continue lesson →" : "Start AI Craft →"}
              </Link>
              <Link href="/learn" className="text-slate-600 hover:underline">
                Learning hub →
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/75 p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-600">Next problem</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              {nextProblem?.title ?? daily?.challenge?.title ?? "Pick up a practice set"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {nextProblem
                ? `Adaptive · D${nextProblem.difficulty} · streak ${streak?.currentStreak ?? 0}`
                : `Daily or bank · streak ${streak?.currentStreak ?? 0}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {nextProblem ? (
                <Link
                  href={`/challenges?q=${encodeURIComponent(nextProblem.slug)}`}
                  className="text-teal-700 hover:underline"
                >
                  Open in bank →
                </Link>
              ) : (
                <Link href="/daily" className="text-teal-700 hover:underline">
                  Open daily →
                </Link>
              )}
              <Link href="/roadmap" className="text-slate-600 hover:underline">
                Roadmap →
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-teal-700/80">Learning loop</div>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            <li className="rounded-xl border border-slate-200 bg-white/75 p-4">
              <div className="font-mono text-xs text-slate-500">1 · Practice</div>
              <div className="mt-1 font-medium text-slate-900">Daily or problem bank</div>
              <p className="mt-1 text-sm text-slate-600">
                {daily?.challenge?.title ?? "Today’s lesson"} · streak {streak?.currentStreak ?? 0}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link href="/daily" className="text-teal-700 hover:underline">
                  Open daily →
                </Link>
                <Link href="/challenges" className="text-slate-600 hover:underline">
                  Browse bank →
                </Link>
              </div>
            </li>
            <li className="rounded-xl border border-slate-200 bg-white/75 p-4">
              <div className="font-mono text-xs text-slate-500">2 · Prove</div>
              <div className="mt-1 font-medium text-slate-900">Pass public + hidden judges</div>
              <p className="mt-1 text-sm text-slate-600">
                Pick a problem, run the tests, and clear both public and hidden checks.
              </p>
              <Link
                href={codingOpen?.workspace ? `/workspace/${codingOpen.workspace.id}` : "/challenges"}
                className="mt-3 inline-block text-sm text-teal-700 hover:underline"
              >
                {codingOpen?.workspace ? "Continue your problem →" : "Open problem bank →"}
              </Link>
            </li>
            <li className="rounded-xl border border-slate-200 bg-white/75 p-4">
              <div className="font-mono text-xs text-slate-500">3 · Show employers</div>
              <div className="mt-1 font-medium text-slate-900">Verified profile</div>
              <p className="mt-1 text-sm text-slate-600">
                Hiring managers see evidence — never résumé claims.
              </p>
              {profile?.publicEnabled && profile.publicSlug ? (
                <Link href={`/u/${profile.publicSlug}`} className="mt-3 inline-block text-sm text-teal-700 hover:underline">
                  View /u/{profile.publicSlug} →
                </Link>
              ) : (
                <Link href="/candidates" className="mt-3 inline-block text-sm text-teal-700 hover:underline">
                  Publish profile →
                </Link>
              )}
            </li>
          </ol>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/daily" className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 hover:bg-teal-500/10">
            <div className="text-xs uppercase tracking-wider text-slate-500">Daily challenge</div>
            <div className="mt-1 font-mono text-2xl text-teal-800">{streak?.currentStreak ?? 0} day streak</div>
          </Link>
          <Link href="/study-plans" className="rounded-xl border border-slate-200 bg-white/75 p-4 hover:bg-slate-100">
            <div className="text-xs uppercase tracking-wider text-slate-500">Study plans</div>
            <div className="mt-1 font-mono text-2xl text-slate-900">{enrollments} enrolled</div>
          </Link>
          <Link href="/pricing" className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:bg-amber-500/10">
            <div className="text-xs uppercase tracking-wider text-slate-500">Plan</div>
            <div className="mt-1 font-mono text-2xl text-amber-100">{user?.plan === "PREMIUM" ? "Premium" : "Free"}</div>
          </Link>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="text-base leading-snug">{a.assessment.title}</CardTitle>
                  <Badge
                    className="w-fit shrink-0"
                    variant={a.assessment.track === "CYBERSECURITY" ? "violet" : "cyan"}
                  >
                    {a.assessment.track.replaceAll("_", " ")}
                  </Badge>
                </div>
                <CardDescription>{a.assessment.challenge.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Status</span>
                  <span className="font-mono text-slate-800">{a.status}</span>
                </div>
                {(a.assessment.timedMinutes || a.dueAt) && (
                  <div className="flex items-center justify-between gap-2 text-slate-600">
                    <span>Session</span>
                    <SessionTimer
                      endsAt={a.dueAt?.toISOString()}
                      timedMinutes={a.assessment.timedMinutes}
                      compact
                    />
                  </div>
                )}
                {a.scoreReport && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
                    <span>Score</span>
                    <span className="font-mono text-teal-700">{formatScore(a.scoreReport.overall)}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="text-teal-700 hover:underline"
                    href={a.workspace ? `/workspace/${a.workspace.id}` : "/challenges"}
                  >
                    {a.workspace ? "Continue problem →" : "Pick a problem →"}
                  </Link>
                  {a.scoreReport && (
                    <Link className="text-emerald-300 hover:underline" href={`/scorecard/${a.id}`} target="_blank">
                      Share scorecard →
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!assignments.length && (
            <Card className="md:col-span-2">
              <CardContent className="py-10 text-center text-slate-600">
                No assignments yet. Start a daily evidence session — or wait for a manager to assign a timed assessment.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const analytics = await platformAnalytics();

  const tiles = [
    { label: "Candidates", value: analytics.totalCandidates },
    { label: "Active assessments", value: analytics.activeAssessments },
    { label: "Completed", value: analytics.completedAssessments },
    { label: "Elite qualified", value: analytics.eliteQualified },
    { label: "Deploy success %", value: analytics.deploymentSuccessRate },
    { label: "Avg overall", value: formatScore(analytics.averageScores.overall) },
    { label: "Cyber reports", value: analytics.cybersecurity.reports },
    { label: "Cyber elite", value: analytics.cybersecurity.elite },
  ];

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-teal-700">HIRING PATH</p>
          <h1 className="mt-2 font-serif-display text-2xl tracking-tight sm:text-3xl">Test who can ship</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Use the same arena learners train in — assign timed work, review evidence, hire on proof.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="cyan">27 tracks</Badge>
          <Badge variant="violet">Industry + systems</Badge>
          <Badge variant="emerald">Shared judges</Badge>
        </div>
      </header>

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="text-xs font-medium uppercase tracking-wider text-teal-700/80">Candidate testing loop</div>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          <li className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <div className="font-mono text-xs text-slate-500">1 · Assign</div>
            <div className="mt-1 font-medium text-slate-900">Create a timed test</div>
            <p className="mt-1 text-sm text-slate-600">Pick from the bank, set the clock, provision a workspace.</p>
            <Link href="/assessments" className="mt-3 inline-block text-sm text-teal-700 hover:underline">
              Open assessments →
            </Link>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <div className="font-mono text-xs text-slate-500">2 · Observe</div>
            <div className="mt-1 font-medium text-slate-900">Watch real evidence</div>
            <p className="mt-1 text-sm text-slate-600">Candidates build in isolated IDEs against public + hidden judges.</p>
            <Link href="/candidates" className="mt-3 inline-block text-sm text-teal-700 hover:underline">
              Browse candidates →
            </Link>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white/75 p-4">
            <div className="font-mono text-xs text-slate-500">3 · Decide</div>
            <div className="mt-1 font-medium text-slate-900">Human hire review</div>
            <p className="mt-1 text-sm text-slate-600">AI assists — you qualify, hold, or reject with reasoning.</p>
            <Link href="/reviews" className="mt-3 inline-block text-sm text-teal-700 hover:underline">
              Open review queue →
            </Link>
          </li>
        </ol>
        <div className="mt-4">
          <Link href="/analytics" className="text-sm text-teal-700 hover:underline">
            Open hiring analytics →
          </Link>
          {user.role === "SUPER_ADMIN" && (
            <>
              <span className="mx-2 text-slate-600">·</span>
              <Link href="/admin" className="text-sm text-teal-700 hover:underline">
                Control plane →
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-wider text-slate-500">{t.label}</div>
              <div className="mt-2 font-mono text-3xl text-slate-900">{t.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category averages</CardTitle>
            <CardDescription>Evidence-weighted category means across scored submissions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(analytics.averageScores)
              .filter(([k]) => k !== "overall")
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span className="capitalize text-slate-600">{k}</span>
                  <span className="font-mono text-slate-900">{formatScore(v as number)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Track health</CardTitle>
            <CardDescription>Cybersecurity vs software engineering throughput</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="font-medium text-violet-200">Cybersecurity</div>
              <p className="mt-1 text-slate-600">
                {analytics.cybersecurity.reports} reports · {analytics.cybersecurity.elite} elite · avg security{" "}
                {formatScore(analytics.cybersecurity.avgSecurity)}
              </p>
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="font-medium text-teal-800">Software Engineering</div>
              <p className="mt-1 text-slate-600">
                {analytics.softwareEngineering.reports} reports · {analytics.softwareEngineering.elite} elite
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/challenges?track=CYBERSECURITY" className="text-violet-300 hover:underline">
                Cyber challenge library →
              </Link>
              <Link href="/assessments" className="text-teal-700 hover:underline">
                Manage assessments →
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
