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
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">BROWSER IDE</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Isolated engineering workspaces</h1>
        <p className="mt-2 text-slate-400">
          Monaco editor, file tree, commits, sandboxed test execution. Untrusted code never runs on the primary app
          process with platform privileges.
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
            <CardContent className="py-10 text-center text-slate-400">
              No workspaces yet. Assign an assessment to provision one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
