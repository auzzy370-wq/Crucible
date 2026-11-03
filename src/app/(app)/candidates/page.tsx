import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser, canReview, canManageCandidates } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateProfilePanel } from "@/components/candidate/profile-panel";

export default async function CandidatesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.role === "CANDIDATE" || user.role === "TEAM_MEMBER") {
    return (
      <div className="animate-rise space-y-6">
        <header>
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">CANDIDATE PROFILE</p>
          <h1 className="mt-2 text-3xl font-semibold">Profile, résumé & skill evidence</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Skills are separated into claimed, portfolio, assessment-verified, and human-reviewed. Résumé claims never
            equal competence.
          </p>
        </header>
        <CandidateProfilePanel />
      </div>
    );
  }

  if (!canManageCandidates(user.role) && !canReview(user.role)) {
    redirect("/dashboard");
  }

  const candidates = await prisma.user.findMany({
    where: { role: { in: ["CANDIDATE", "TEAM_MEMBER"] } },
    include: {
      candidateProfile: { include: { skills: true, resumes: { take: 1, orderBy: { uploadedAt: "desc" } } } },
      assignments: { include: { scoreReport: true, assessment: true }, take: 3, orderBy: { createdAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">CANDIDATES</p>
        <h1 className="mt-2 text-3xl font-semibold">Profiles & evidence lanes</h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {candidates.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">{c.name}</CardTitle>
              <div className="text-sm text-slate-400">{c.email}</div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge>{c.candidateProfile?.preferredTrack ?? "n/a"}</Badge>
                {(c.candidateProfile?.cybersecurity ?? []).slice(0, 4).map((s) => (
                  <Badge key={s} variant="violet">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>Claimed: {c.candidateProfile?.skills.filter((s) => s.source === "CLAIMED").length ?? 0}</div>
                <div>Portfolio: {c.candidateProfile?.skills.filter((s) => s.source === "PORTFOLIO").length ?? 0}</div>
                <div>Assessment: {c.candidateProfile?.skills.filter((s) => s.source === "ASSESSMENT").length ?? 0}</div>
                <div>Human: {c.candidateProfile?.skills.filter((s) => s.source === "HUMAN_REVIEW").length ?? 0}</div>
              </div>
              <Link className="text-cyan-300 hover:underline" href={`/candidates/${c.id}`}>
                Open dossier →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
