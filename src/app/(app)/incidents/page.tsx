"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function IncidentsPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [diagnosis, setDiagnosis] = useState("");

  async function load() {
    const res = await fetch("/api/incidents");
    const json = await res.json();
    if (json.ok) {
      setScenarios(json.data.scenarios);
      setRuns(json.data.runs);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function start(slug: string) {
    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "start", scenarioSlug: slug }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Failed");
    toast.success("Incident run started");
    await load();
  }

  async function recover(runId: string) {
    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        runId,
        diagnosis,
        rootCauseFound: true,
        fixApplied: true,
        regressionTests: true,
        recovered: true,
        preventionDoc: "Added idempotency keys / rotated secrets / detection rule.",
        timelineEvent: "recovery_completed",
      }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Failed");
    toast.success("Recovery recorded");
    await load();
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-rose-300">PRODUCTION / SOC SIMULATOR</p>
        <h1 className="mt-2 text-3xl font-semibold">Incident response gauntlets</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Software reliability incidents and cybersecurity SOC simulations. Investigate, contain, fix, regress, recover,
          document prevention.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {scenarios.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p>{s.synopsis}</p>
              <Button size="sm" onClick={() => start(s.slug)}>
                Start run
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active / recent runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Diagnosis / RCA notes"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
          {runs.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-800 p-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant={r.recovered ? "emerald" : "rose"}>{r.recovered ? "RECOVERED" : "OPEN"}</Badge>
                <span>{r.scenario.title}</span>
              </div>
              {!r.recovered && (
                <Button className="mt-2" size="sm" onClick={() => recover(r.id)}>
                  Mark investigated + recovered
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
