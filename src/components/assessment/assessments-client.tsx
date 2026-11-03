"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatScore } from "@/lib/utils";

type Challenge = { id: string; title: string; track: string; slug: string };
type Assessment = {
  id: string;
  title: string;
  description: string;
  track: string;
  status: string;
  challenge: Challenge;
  _count: { assignments: number };
  createdBy: { name: string };
};
type Candidate = { id: string; name: string; email: string };
type Assignment = {
  id: string;
  status: string;
  currentLevel: number;
  assessment: { id: string; title: string; track: string; challenge: { summary: string } };
  candidate: { id: string; name: string; email: string };
  workspace: { id: string } | null;
  scoreReport: { overall: number; qualified: boolean; tier: string } | null;
};

export function AssessmentsClient(props: {
  role: string;
  assessments: Assessment[];
  challenges: Challenge[];
  candidates: Candidate[];
  assignments: Assignment[];
}) {
  const router = useRouter();
  const canManage = ["SUPER_ADMIN", "HIRING_MANAGER"].includes(props.role);
  const [title, setTitle] = useState("New elite assessment");
  const [description, setDescription] = useState("Demonstrate end-to-end engineering ownership.");
  const [challengeId, setChallengeId] = useState(props.challenges[0]?.id ?? "");
  const [assignAssessmentId, setAssignAssessmentId] = useState(props.assessments[0]?.id ?? "");
  const [candidateId, setCandidateId] = useState(props.candidates[0]?.id ?? "");

  async function createAssessment() {
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, challengeId }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Failed");
    toast.success("Assessment created");
    router.refresh();
  }

  async function assign() {
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assessmentId: assignAssessmentId, candidateId }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Failed");
    toast.success("Assessment assigned + workspace provisioned");
    router.refresh();
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">ASSESSMENT MANAGEMENT</p>
        <h1 className="mt-2 text-3xl font-semibold">Assign real engineering work</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Create assessments from the challenge library — including cybersecurity labs — and assign candidates to
          isolated workspaces.
        </p>
      </header>

      {canManage && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create assessment</CardTitle>
              <CardDescription>Track is inherited from the selected challenge.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Challenge</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                  value={challengeId}
                  onChange={(e) => setChallengeId(e.target.value)}
                >
                  {props.challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.track}] {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={createAssessment}>Publish assessment</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assign to candidate</CardTitle>
              <CardDescription>Provisions Monaco workspace + starter repo for the track.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Assessment</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                  value={assignAssessmentId}
                  onChange={(e) => setAssignAssessmentId(e.target.value)}
                >
                  {props.assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.track}] {a.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Candidate</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                >
                  {props.candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={assign}>Assign + provision workspace</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Published assessments</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {props.assessments.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={a.track === "CYBERSECURITY" ? "violet" : "cyan"}>{a.track}</Badge>
                  <Badge>{a.status}</Badge>
                </div>
                <CardTitle className="text-base">{a.title}</CardTitle>
                <CardDescription>{a.challenge.title}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-400">
                {a._count.assignments} assignments · created by {a.createdBy.name}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Assignments</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Workspace</th>
              </tr>
            </thead>
            <tbody>
              {props.assignments.map((a) => (
                <tr key={a.id} className="border-t border-slate-800/80">
                  <td className="px-4 py-3">{a.candidate.name}</td>
                  <td className="px-4 py-3">{a.assessment.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.assessment.track === "CYBERSECURITY" ? "violet" : "cyan"}>
                      {a.assessment.track}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{a.status}</td>
                  <td className="px-4 py-3 font-mono">
                    {a.scoreReport ? formatScore(a.scoreReport.overall) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {a.workspace ? (
                      <Link className="text-cyan-300 hover:underline" href={`/workspace/${a.workspace.id}`}>
                        Open
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
