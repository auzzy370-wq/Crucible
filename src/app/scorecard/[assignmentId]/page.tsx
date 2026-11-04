import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatScore } from "@/lib/utils";
import { ShareScorecardButton } from "@/components/saas/share-scorecard";

export const dynamic = "force-dynamic";

/** Employer-facing shareable scorecard — visible when candidate profile is public or assignment completed. */
export default async function PublicScorecardPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const assignment = await prisma.assessmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      candidate: { include: { candidateProfile: { include: { skills: true } } } },
      assessment: { include: { challenge: true } },
      scoreReport: true,
      reviews: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!assignment?.scoreReport) notFound();

  const profile = assignment.candidate.candidateProfile;
  const shareable =
    profile?.publicEnabled ||
    ["COMPLETED", "UNDER_REVIEW"].includes(assignment.status);
  if (!shareable) notFound();

  const report = assignment.scoreReport;
  const verified =
    profile?.skills.filter((s) => s.source === "ASSESSMENT" || s.source === "HUMAN_REVIEW") ?? [];

  const categories: [string, number][] = [
    ["Frontend", report.frontend],
    ["Backend", report.backend],
    ["Database", report.database],
    ["Architecture", report.architecture],
    ["Infrastructure", report.infrastructure],
    ["Security", report.security],
    ["Testing", report.testing],
    ["Problem-solving", report.problemSolving],
    ["Performance", report.performance],
    ["Collaboration", report.collaboration],
  ];

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />
      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 font-mono text-xs font-bold text-cyan-300">
            CR
          </div>
          <span className="text-sm font-semibold tracking-[0.2em]">CRUCIBLE</span>
        </Link>
        <ShareScorecardButton assignmentId={assignmentId} />
      </header>

      <main className="relative z-10 mx-auto max-w-4xl space-y-8 px-6 pb-20">
        <div className="animate-rise">
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">EMPLOYER SCORECARD</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {assignment.candidate.name}
          </h1>
          <p className="mt-2 text-lg text-slate-300">{assignment.assessment.title}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={assignment.assessment.track === "CYBERSECURITY" ? "violet" : "cyan"}>
              {assignment.assessment.track}
            </Badge>
            <Badge variant="emerald">{formatScore(report.overall)}</Badge>
            <Badge>{report.tier}</Badge>
            <Badge variant={report.qualified ? "emerald" : "amber"}>
              {report.qualified ? "Qualified" : "Not yet qualified"}
            </Badge>
          </div>
          {profile?.publicSlug && profile.publicEnabled && (
            <Link href={`/u/${profile.publicSlug}`} className="mt-4 inline-block text-sm text-cyan-300 hover:underline">
              Public qualification profile →
            </Link>
          )}
        </div>

        <section className="animate-rise grid gap-2 sm:grid-cols-2">
          {categories.map(([label, score]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
            >
              <span className="text-sm text-slate-400">{label}</span>
              <span className="font-mono text-slate-100">{formatScore(score)}</span>
            </div>
          ))}
        </section>

        <section className="animate-rise space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">Verified skills on this scorecard</h2>
          <div className="flex flex-wrap gap-2">
            {verified.length ? (
              verified.map((s) => (
                <Badge key={s.id} variant={s.source === "HUMAN_REVIEW" ? "violet" : "emerald"}>
                  {s.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-slate-500">No verified skills attached yet.</span>
            )}
          </div>
        </section>

        {assignment.reviews.length > 0 && (
          <section className="animate-rise space-y-3">
            <h2 className="text-sm font-semibold text-slate-100">Human review</h2>
            <ul className="space-y-2">
              {assignment.reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-800 px-4 py-3 text-sm text-slate-300">
                  <Badge className="mb-2">{r.decision}</Badge>
                  <p>{r.reasoning}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-slate-500">
          Claimed résumé skills are excluded. Print this page or copy the link for ATS / hiring threads. Also available as{" "}
          <a className="text-cyan-300 hover:underline" href={`/api/scorecards/${assignmentId}?format=ats`}>
            ATS text
          </a>
          .
        </p>
      </main>
    </div>
  );
}
