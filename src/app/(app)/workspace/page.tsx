import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/server/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WorkspaceIndexPage() {
  const user = await getSessionUser();
  const workspaces = await prisma.workspace.findMany({
    where:
      user?.role === "CANDIDATE" || user?.role === "TEAM_MEMBER"
        ? { assignment: { candidateId: user.id } }
        : undefined,
    include: {
      assignment: {
        include: {
          assessment: { include: { challenge: true } },
          candidate: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">STEP 2 · PROVE</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Your open workspaces</h1>
        <p className="mt-2 text-slate-400">
          Continue a session, hit Run for public tests, then Submit for the hidden judge. Need a new problem?{" "}
          <Link href="/challenges" className="text-cyan-300 hover:underline">
            Open the bank →
          </Link>
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="text-base">{w.assignment.assessment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-400">
              <div>{w.assignment.candidate.name}</div>
              <div className="font-mono text-xs">
                {w.language} · {w.assignment.assessment.track}
              </div>
              <Link className="text-cyan-300 hover:underline" href={`/workspace/${w.id}`}>
                Launch IDE →
              </Link>
            </CardContent>
          </Card>
        ))}
        {!workspaces.length && (
          <Card className="md:col-span-2">
            <CardContent className="space-y-3 py-10 text-center text-slate-400">
              <p>No open workspaces yet.</p>
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <Link href="/daily" className="text-cyan-300 hover:underline">
                  Start daily →
                </Link>
                <Link href="/challenges" className="text-cyan-300 hover:underline">
                  Pick from the bank →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
