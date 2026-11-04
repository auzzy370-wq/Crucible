import Link from "next/link";
import { getSessionUser } from "@/server/auth/session";
import { platformAnalytics } from "@/server/analytics/service";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatScore } from "@/lib/utils";
import { SessionTimer } from "@/components/assessment/session-timer";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const isStaff = user && ["SUPER_ADMIN", "HIRING_MANAGER", "TECHNICAL_REVIEWER"].includes(user.role);

  if (!isStaff) {
    const [assignments, streak, enrollments] = await Promise.all([
      prisma.assessmentAssignment.findMany({
        where: { candidateId: user!.id },
        include: { assessment: { include: { challenge: true } }, scoreReport: true, workspace: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userStreak.findUnique({ where: { userId: user!.id } }),
      prisma.studyPlanEnrollment.count({ where: { userId: user!.id } }),
    ]);
    return (
      <div className="animate-rise space-y-6">
        <header>
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">CANDIDATE PORTAL</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl tracking-tight">Your Crucible assignments</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Complete timed, realistic engineering and cybersecurity assessments. Résumé claims are never treated as proof.
          </p>
        </header>
        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/daily" className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 hover:bg-cyan-500/10">
            <div className="text-xs uppercase tracking-wider text-slate-500">Daily challenge</div>
            <div className="mt-1 font-mono text-2xl text-cyan-200">{streak?.currentStreak ?? 0} day streak</div>
          </Link>
          <Link href="/study-plans" className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:bg-slate-900">
            <div className="text-xs uppercase tracking-wider text-slate-500">Study plans</div>
            <div className="mt-1 font-mono text-2xl text-slate-100">{enrollments} enrolled</div>
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
                <div className="flex justify-between text-slate-400">
                  <span>Status</span>
                  <span className="font-mono text-slate-200">{a.status}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Adaptive level</span>
                  <span className="font-mono text-slate-200">{a.currentLevel}</span>
                </div>
                {(a.assessment.timedMinutes || a.dueAt) && (
                  <div className="flex items-center justify-between gap-2 text-slate-400">
                    <span>Session</span>
                    <SessionTimer
                      endsAt={a.dueAt?.toISOString()}
                      timedMinutes={a.assessment.timedMinutes}
                      compact
                    />
                  </div>
                )}
                {a.scoreReport && (
                  <div className="flex justify-between text-slate-400">
                    <span>Score</span>
                    <span className="font-mono text-cyan-300">{formatScore(a.scoreReport.overall)}</span>
                  </div>
                )}
                <Link
                  className="text-cyan-300 hover:underline"
                  href={a.workspace ? `/workspace/${a.workspace.id}` : "/workspace"}
                >
                  {a.workspace ? "Open workspace →" : "View workspaces →"}
                </Link>
              </CardContent>
            </Card>
          ))}
          {!assignments.length && (
            <Card className="md:col-span-2">
              <CardContent className="py-10 text-center text-slate-400">
                No assignments yet. A hiring manager will assign software engineering or cybersecurity assessments.
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
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">OPERATIONS DASHBOARD</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl tracking-tight">Crucible operations</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Premium hiring operations for exceptional software engineers and cybersecurity practitioners.
            Timed assessments. Scores calibrated to challenge difficulty — not population percentiles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="cyan">Software Engineering</Badge>
          <Badge variant="violet">Cybersecurity</Badge>
          <Badge variant="emerald">Secure Full-Stack</Badge>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="pt-6">
              <div className="text-xs uppercase tracking-wider text-slate-500">{t.label}</div>
              <div className="mt-2 font-mono text-3xl text-slate-50">{t.value}</div>
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
                <div key={k} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2">
                  <span className="capitalize text-slate-400">{k}</span>
                  <span className="font-mono text-slate-100">{formatScore(v as number)}</span>
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
              <p className="mt-1 text-slate-400">
                {analytics.cybersecurity.reports} reports · {analytics.cybersecurity.elite} elite · avg security{" "}
                {formatScore(analytics.cybersecurity.avgSecurity)}
              </p>
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="font-medium text-cyan-200">Software Engineering</div>
              <p className="mt-1 text-slate-400">
                {analytics.softwareEngineering.reports} reports · {analytics.softwareEngineering.elite} elite
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/challenges?track=CYBERSECURITY" className="text-violet-300 hover:underline">
                Cyber challenge library →
              </Link>
              <Link href="/assessments" className="text-cyan-300 hover:underline">
                Manage assessments →
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
