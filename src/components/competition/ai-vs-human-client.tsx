"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Challenge = {
  id: string;
  slug: string;
  title: string;
  difficulty: number;
  summary?: string;
};

type AiRun = {
  id: string;
  status?: string;
  correct: boolean;
  mocked: boolean;
  passedPublic: number;
  totalPublic: number;
  passedHidden: number;
  totalHidden: number;
  diagnostics?: { publicSummary?: string; safeDetail?: string; category?: string } | null;
  aiModel?: { displayName: string };
  challenge?: { title: string; difficulty: number; slug?: string };
};

export function AiVsHumanClient() {
  const [models, setModels] = useState<any[]>([]);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [challengeId, setChallengeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [busy, setBusy] = useState(false);
  const [humanCompare, setHumanCompare] = useState<any[]>([]);
  const [lastResult, setLastResult] = useState<AiRun | null>(null);

  async function loadModels() {
    const res = await fetch("/api/competition/ai-models");
    const json = await res.json();
    if (json.ok) {
      const list = json.data.models ?? [];
      setModels(list);
      setProviderStatus(json.data.status ?? null);
      const preferred =
        list.find((m: any) => m.ready && m.provider === "Groq") ??
        list.find((m: any) => m.ready) ??
        list.find((m: any) => m.freeTier) ??
        list[0];
      if (!modelId && preferred) setModelId(preferred.id);
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

  const [staleHost, setStaleHost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    void (async () => {
      void loadModels();
      void loadRuns();
      try {
        const me = await fetch("/api/settings");
        const meJson = await me.json().catch(() => null);
        setIsAdmin(meJson?.data?.account?.role === "SUPER_ADMIN");
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch("/api/competition/bench-challenges");
        if (res.status === 404) {
          setStaleHost(true);
          return;
        }
        const json = await res.json();
        if (!json.ok) {
          setStaleHost(true);
          return;
        }
        const arr = (json.data.challenges ?? []) as Challenge[];
        setChallenges(arr);
        if (!challengeId && arr[0]) setChallengeId(arr[0].id);
      } catch {
        setStaleHost(true);
      }
    })();
  }, []);

  async function runSweep() {
    setSweeping(true);
    try {
      const res = await fetch("/api/admin/assessments/auto-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          aiModelId: modelId || undefined,
          assignmentLimit: 200,
          aiLimit: 200,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Auto-run failed");
      toast.success(json.data.summary);
      await loadRuns();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auto-run failed");
    } finally {
      setSweeping(false);
    }
  }

  async function runBench() {
    if (!challengeId || !modelId) return toast.error("Pick a challenge and model");
    setBusy(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/competition/benchmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId, aiModelId: modelId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Benchmark failed");
      const data = json.data as AiRun;
      setLastResult(data);
      if (data.correct) {
        toast.success("Verified pass — public + hidden harnesses green");
      } else if (data.status === "FAILED" || data.diagnostics?.category === "infrastructure_error") {
        toast.message(data.diagnostics?.publicSummary || "Provider issue — try Groq on Two Sum");
      } else {
        toast.message(
          data.diagnostics?.publicSummary ||
            `Not cleared — public ${data.passedPublic}/${data.totalPublic}, hidden ${data.passedHidden}/${data.totalHidden}`,
        );
      }
      await loadRuns(challengeId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const selected = challenges.find((c) => c.id === challengeId);

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-violet-300">AI × HUMAN</p>
        <h1 className="mt-2 font-serif-display text-2xl sm:text-3xl">AI vs Human benchmarks</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Pick a curated coding problem, submit to a free model, and the same public + hidden harnesses that grade
          humans run on the model&apos;s code.
        </p>
      </header>

      {staleHost && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-50">
          <div className="font-medium">This deploy is missing the AI judge update</div>
          <p className="mt-1 text-xs text-rose-100/90">
            Refresh after the latest publish, or open Crucible from the Cursor Publish pill so every signed-in learner
            gets the same fixed AI vs Human bench.
          </p>
        </div>
      )}

      {providerStatus && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            providerStatus.anyFreeKey
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-100"
              : "border-amber-500/30 bg-amber-500/5 text-amber-100"
          }`}
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant={providerStatus.groqReady ? "emerald" : "default"}>
              Groq {providerStatus.groqReady ? "ready" : "needs GROQ_API_KEY"}
            </Badge>
            <Badge variant={providerStatus.openRouterReady ? "emerald" : "default"}>
              OpenRouter {providerStatus.openRouterReady ? "ready" : "needs key"}
            </Badge>
          </div>
          <p className="mt-2 text-xs opacity-90">{providerStatus.hint}</p>
        </div>
      )}

      <section className="grid gap-4 rounded-xl border border-slate-800 p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Challenge (judgable only)</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={challengeId}
            onChange={(e) => {
              setChallengeId(e.target.value);
              setLastResult(null);
              void loadRuns(e.target.value);
            }}
          >
            {!challenges.length && <option value="">Loading…</option>}
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                D{c.difficulty} · {c.title}
              </option>
            ))}
          </select>
          {selected?.summary && <p className="mt-1 text-xs text-slate-500">{selected.summary}</p>}
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
                {m.ready ? "●" : "○"} {m.provider} · {m.displayName}
                {m.freeTier ? " (free)" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <Button disabled={busy || !challengeId || !modelId} onClick={() => void runBench()}>
            {busy ? "Running judge…" : "Submit challenge to model"}
          </Button>
          {isAdmin && (
            <Button variant="secondary" disabled={sweeping} onClick={() => void runSweep()}>
              {sweeping ? "Running all & posting scores…" : "Auto-run all & post scores"}
            </Button>
          )}
          <span className="text-xs text-slate-500">
            {isAdmin
              ? "Admin-only: scores every assignment workspace, then AI-benches judgable assessments."
              : "Starts with Two Sum — easiest verified smoke test."}
          </span>
        </div>
      </section>

      {lastResult && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            lastResult.correct
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-50"
              : "border-rose-500/30 bg-rose-500/5 text-rose-50"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {lastResult.correct ? "Verified pass" : lastResult.mocked ? "Experimental" : "Did not clear"}
            </span>
            <Badge variant="cyan">
              public {lastResult.passedPublic}/{lastResult.totalPublic}
            </Badge>
            <Badge>
              hidden {lastResult.passedHidden}/{lastResult.totalHidden}
            </Badge>
          </div>
          {lastResult.diagnostics?.publicSummary && (
            <p className="mt-2 text-xs opacity-90">{lastResult.diagnostics.publicSummary}</p>
          )}
          {lastResult.diagnostics?.safeDetail && (
            <p className="mt-1 font-mono text-[11px] opacity-80">{lastResult.diagnostics.safeDetail}</p>
          )}
        </div>
      )}

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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Challenge</th>
                <th className="px-3 py-2">Public</th>
                <th className="px-3 py-2">Hidden</th>
                <th className="px-3 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/80 align-top">
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
                      <Badge variant="rose">fail</Badge>
                    )}
                    {r.diagnostics?.publicSummary && (
                      <div className="mt-1 max-w-xs text-[11px] text-slate-500">{r.diagnostics.publicSummary}</div>
                    )}
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No benchmark runs yet — submit Two Sum above.
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
