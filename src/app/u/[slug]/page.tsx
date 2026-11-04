import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicQualificationProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await prisma.candidateProfile.findUnique({
    where: { publicSlug: slug },
    include: {
      skills: true,
      user: {
        select: {
          name: true,
          assignments: {
            where: {
              OR: [
                { status: { in: ["COMPLETED", "UNDER_REVIEW"] } },
                { scoreReport: { isNot: null } },
              ],
            },
            include: {
              assessment: { select: { title: true, track: true } },
              scoreReport: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 12,
          },
        },
      },
    },
  });
  if (!profile || !profile.publicEnabled) notFound();

  const verified = profile.skills.filter((s) => s.source === "ASSESSMENT" || s.source === "HUMAN_REVIEW");
  const portfolio = profile.skills.filter((s) => s.source === "PORTFOLIO");
  const scored = profile.user.assignments.filter((a) => a.scoreReport);
  const best = scored.reduce((m, a) => Math.max(m, a.scoreReport?.overall ?? 0), 0);

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
        <span className="font-mono text-[10px] tracking-widest text-slate-500">PUBLIC QUALIFICATION</span>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl space-y-8 px-6 pb-20">
        <div className="animate-rise">
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">VERIFIED PROFILE</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{profile.user.name}</h1>
          <p className="mt-2 text-lg text-slate-300">{profile.headline || "Crucible candidate"}</p>
          {profile.bio && <p className="mt-4 max-w-2xl text-slate-400">{profile.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="cyan">{profile.preferredTrack}</Badge>
            {profile.yearsExperience != null && <Badge>{profile.yearsExperience}+ years</Badge>}
            {verified.length > 0 && <Badge variant="emerald">{verified.length} verified skills</Badge>}
            {best > 0 && <Badge variant="amber">Best {formatScore(best)}</Badge>}
          </div>
        </div>

        <section className="animate-rise space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-100">Assessment-verified skills</h2>
          <p className="text-xs text-slate-500">
            Claimed résumé skills are never shown here. Only assessment and human-review evidence appears as verified.
          </p>
          <div className="flex flex-wrap gap-2">
            {verified.length ? (
              verified.map((s) => (
                <Badge key={s.id} variant={s.source === "HUMAN_REVIEW" ? "violet" : "emerald"}>
                  {s.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-slate-500">No verified skills published yet.</span>
            )}
          </div>
          {portfolio.length > 0 && (
            <div className="pt-2">
              <div className="mb-2 text-xs text-slate-500">Portfolio-backed</div>
              <div className="flex flex-wrap gap-2">
                {portfolio.map((s) => (
                  <Badge key={s.id}>{s.name}</Badge>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="animate-rise space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-100">Assessments</h2>
          <div className="space-y-2">
            {profile.user.assignments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{a.assessment.title}</span>
                  <Badge variant={a.assessment.track === "CYBERSECURITY" ? "violet" : "cyan"}>
                    {a.assessment.track}
                  </Badge>
                  {a.scoreReport && (
                    <>
                      <Badge variant="emerald">{formatScore(a.scoreReport.overall)}</Badge>
                      <Badge>{a.scoreReport.tier}</Badge>
                    </>
                  )}
                </div>
                {a.scoreReport && (
                  <Link href={`/scorecard/${a.id}`} className="text-sm text-cyan-300 hover:underline">
                    Scorecard →
                  </Link>
                )}
              </div>
            ))}
            {!profile.user.assignments.length && (
              <p className="text-sm text-slate-500">No completed assessments on this public profile yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
