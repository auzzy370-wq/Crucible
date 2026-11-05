"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AiVsHumanClient() {
  const [models, setModels] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [challengeId, setChallengeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [busy, setBusy] = useState(false);
  const [humanCompare, setHumanCompare] = useState<any[]>([]);

  async function loadModels() {
    const res = await fetch("/api/competition/ai-models");
    const json = await res.json();
    if (json.ok) {
      setModels(json.data.models ?? []);
      if (!modelId && json.data.models?.[0]) setModelId(json.data.models[0].id);
    }
  }

  async function loadChallenges() {
    const res = await fetch("/api/challenges?take=40");
    const json = await res.json();
    if (json.ok) {
      const list = Array.isArray(json.data) ? json.data : json.data.challenges ?? json.data.items ?? [];
      const arr = (list as any[]).filter((c) => !c.type || c.type === "CODING_PROBLEM").slice(0, 40);
      setChallenges(arr);
      if (!challengeId && arr[0]) setChallengeId(arr[0].id);
    }
  }

  async function loadRuns(cid?: string) {
    const q = cid ? `?challengeId=${cid}` : "";
    const res = await fetch(`/api/competition/benchmark${q}`);
    const json = await res.json();
    if (json.ok) {
      setRuns(json.data.runs ?? []);
      setHumanCompare(json.data.humanCompare ?? []);
    }
  }

  useEffect(() => {
    void loadModels();
    void loadChallenges();
    void loadRuns();
  }, []);

  async function runBench() {
    if (!challengeId || !modelId) return toast.error("Pick a challenge and model");
    setBusy(true);
    try {
      const res = await fetch("/api/competition/benchmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId, aiModelId: modelId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Benchmark failed");
      toast.success(
        json.data.mocked
          ? "Experimental run recorded (mock / no API key)"
          : json.data.correct
            ? "Verified pass"
            : "Run recorded — not a claim of incapability",
      );
      await loadRuns(challengeId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-violet-300">AI × HUMAN</p>
        <h1 className="mt-2 font-serif-display text-2xl sm:text-3xl">AI vs Human benchmarks</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Identical public statements for humans and models. Hidden tests never leave the judge. Mocked runs are
          labeled experimental — a single miss never proves a model cannot solve a problem.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-800 p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Challenge</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={challengeId}
            onChange={(e) => {
              setChallengeId(e.target.value);
              void loadRuns(e.target.value);
            }}
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                D{c.difficulty} · {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">AI model</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.provider} · {m.displayName}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <Button disabled={busy} onClick={() => void runBench()}>
            {busy ? "Running…" : "Submit challenge to model"}
          </Button>
        </div>
      </section>

      {humanCompare[0] && (
        <div className="rounded-xl border border-slate-800 px-4 py-3 text-sm text-slate-300">
          Human hidden-suite acceptance on this challenge:{" "}
          <span className="font-mono text-cyan-200">
            {humanCompare[0].humanAcceptancePct ?? "—"}%
          </span>{" "}
          ({humanCompare[0].submissions} jobs)
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Recent AI runs</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Challenge</th>
                <th className="px-3 py-2">Public</th>
                <th className="px-3 py-2">Hidden</th>
                <th className="px-3 py-2">Class</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/80">
                  <td className="px-3 py-2">{r.aiModel?.displayName ?? "—"}</td>
                  <td className="px-3 py-2">
                    {r.challenge?.title ?? "—"}
                    <div className="font-mono text-[10px] text-slate-500">D{r.challenge?.difficulty}</div>
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {r.passedPublic}/{r.totalPublic}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {r.passedHidden}/{r.totalHidden}
                  </td>
                  <td className="px-3 py-2">
                    {r.mocked ? (
                      <Badge variant="amber">experimental</Badge>
                    ) : r.correct ? (
                      <Badge variant="emerald">verified pass</Badge>
                    ) : (
                      <Badge variant="rose">recorded fail</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No benchmark runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
