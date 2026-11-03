import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const sp = await searchParams;
  const challenges = await prisma.challenge.findMany({
    where: {
      isPublished: true,
      ...(sp.track ? { track: sp.track as never } : {}),
    },
    orderBy: [{ track: "asc" }, { difficulty: "desc" }],
  });

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">CHALLENGE LIBRARY</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Realistic project gauntlets</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Full-stack product builds, distributed systems, and a dedicated cybersecurity track covering AppSec, cloud
          hardening, threat modeling, SOC/IR, detection engineering, cryptography, and zero trust.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/challenges"><Badge>All</Badge></Link>
          <Link href="/challenges?track=SOFTWARE_ENGINEERING"><Badge variant="cyan">Software Engineering</Badge></Link>
          <Link href="/challenges?track=CYBERSECURITY"><Badge variant="violet">Cybersecurity</Badge></Link>
          <Link href="/challenges?track=SECURE_FULL_STACK"><Badge variant="emerald">Secure Full-Stack</Badge></Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {challenges.map((c) => (
          <Card key={c.id} className={c.track === "CYBERSECURITY" ? "border-violet-500/20" : undefined}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={c.track === "CYBERSECURITY" ? "violet" : c.track === "SECURE_FULL_STACK" ? "emerald" : "cyan"}>
                  {c.track.replaceAll("_", " ")}
                </Badge>
                <Badge>{c.type}</Badge>
                <Badge variant="amber">L{c.difficulty}</Badge>
              </div>
              <CardTitle className="pt-2 text-lg">{c.title}</CardTitle>
              <CardDescription>{c.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p className="line-clamp-3">{c.description}</p>
              <div className="flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span key={t} className="rounded border border-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
              {(c.owaspMappings.length > 0 || c.mitreMappings.length > 0) && (
                <div className="text-xs text-violet-300/90">
                  {c.owaspMappings.length > 0 && <div>OWASP: {c.owaspMappings.join(", ")}</div>}
                  {c.mitreMappings.length > 0 && <div>MITRE: {c.mitreMappings.join(", ")}</div>}
                </div>
              )}
              <div className="font-mono text-xs text-slate-500">
                ~{c.estimatedDays} days · {c.languages.join(", ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
