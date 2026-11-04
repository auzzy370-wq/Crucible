"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SessionTimer } from "@/components/assessment/session-timer";
import { cn } from "@/lib/utils";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type FileRow = { id: string; path: string; content: string; language: string | null };

type CaseResult = { name: string; pass: boolean; hidden?: boolean };

function difficultyLabel(difficulty: number) {
  if (difficulty <= 3) return "Easy";
  if (difficulty <= 6) return "Medium";
  return "Hard";
}

function diffClass(difficulty: number) {
  const L = difficultyLabel(difficulty);
  if (L === "Easy") return "text-emerald-400 border-emerald-500/30";
  if (L === "Medium") return "text-amber-300 border-amber-500/30";
  return "text-rose-400 border-rose-500/30";
}

function renderProblemBody(md: string) {
  // Lightweight markdown-ish rendering for problem statements
  const blocks = md.split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split("\n");
    if (lines[0]?.startsWith("## ")) {
      return (
        <div key={i} className="space-y-2">
          <h3 className="text-sm font-semibold tracking-wide text-slate-100">{lines[0].replace(/^##\s+/, "")}</h3>
          {lines.slice(1).map((l, j) => (
            <p key={j} className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
              {formatInline(l)}
            </p>
          ))}
        </div>
      );
    }
    if (lines[0]?.startsWith("```")) {
      const code = lines.slice(1).filter((l) => !l.startsWith("```")).join("\n");
      return (
        <pre key={i} className="overflow-x-auto rounded-lg border border-slate-800 bg-black/40 p-3 font-mono text-xs text-cyan-100">
          {code}
        </pre>
      );
    }
    return (
      <p key={i} className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
        {lines.map((l, j) => (
          <span key={j}>
            {formatInline(l)}
            {j < lines.length - 1 ? "\n" : null}
          </span>
        ))}
      </p>
    );
  });
}

function formatInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[12px] text-cyan-200">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export function WorkspaceIde(props: {
  workspaceId: string;
  assignmentId: string;
  title: string;
  track: string;
  language: string;
  files: FileRow[];
  commits: { sha: string; message: string; createdAt: string }[];
  jobs: { id: string; type: string; status: string; stdout: string | null; stderr: string | null }[];
  role: string;
  timedMinutes?: number | null;
  dueAt?: string | null;
  startedAt?: string | null;
  codingMode?: boolean;
  difficulty?: number;
  tags?: string[];
  problemDescription?: string;
  problemSummary?: string;
  premium?: boolean;
  companies?: string[];
  isPremiumContent?: boolean;
}) {
  const router = useRouter();
  const coding = Boolean(props.codingMode);
  const premium = Boolean(props.premium);
  const [debuggerOpen, setDebuggerOpen] = useState(false);
  const preferred = coding
    ? props.files.find((f) => f.path === "src/solution.ts")?.path ??
      props.files.find((f) => f.path.endsWith("solution.ts"))?.path
    : undefined;
  const [files, setFiles] = useState(props.files);
  const [activePath, setActivePath] = useState(preferred ?? props.files[0]?.path ?? "README.md");
  const active = useMemo(() => files.find((f) => f.path === activePath), [files, activePath]);
  const [commitMsg, setCommitMsg] = useState(coding ? "feat: solve coding problem" : "feat: progress on assessment");
  const [terminal, setTerminal] = useState(
    coding ? "Ready. Run public tests, then Submit for hidden evaluation.\n" : "Ready. Tests execute in an isolated worker/sandbox.\n",
  );
  const [busy, setBusy] = useState(false);
  const [caseResults, setCaseResults] = useState<CaseResult[]>([]);
  const [panel, setPanel] = useState<"problem" | "code">("problem");

  async function save(content: string) {
    setFiles((prev) => prev.map((f) => (f.path === activePath ? { ...f, content } : f)));
    const res = await fetch(`/api/workspace/${props.workspaceId}/files`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: activePath, content, language: active?.language }),
    });
    const json = await res.json();
    if (!json.ok) toast.error(json.error?.message || "Save failed");
  }

  async function commit() {
    const res = await fetch(`/api/workspace/${props.workspaceId}/commit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: commitMsg }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Commit failed");
    toast.success(`Committed ${json.data.sha}`);
    router.refresh();
  }

  function parseCases(stdout: string | null | undefined): CaseResult[] {
    if (!stdout) return [];
    try {
      const line = stdout
        .trim()
        .split("\n")
        .reverse()
        .find((l) => l.trim().startsWith("{"));
      if (!line) return [];
      const parsed = JSON.parse(line) as { results?: CaseResult[] };
      return parsed.results ?? [];
    } catch {
      return [];
    }
  }

  async function run(type: "test" | "hidden_test" | "deploy_check") {
    setBusy(true);
    setTerminal((t) => t + `\n$ ${type === "test" ? "run" : type}\n`);
    const res = await fetch(`/api/workspace/${props.workspaceId}/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const json = await res.json();
    if (!json.ok) {
      setBusy(false);
      return toast.error(json.error?.message || "Execution failed");
    }
    setTerminal((t) => t + `queued job ${json.data.id} (${json.data.status})\n`);

    // Poll briefly for process-mode completion
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 700));
      router.refresh();
    }
    try {
      const jobsRes = await fetch(`/api/workspace/${props.workspaceId}/execute`, { method: "GET" }).catch(() => null);
      void jobsRes;
    } catch {
      /* ignore */
    }
    setBusy(false);
    toast.message(type === "test" ? "Public tests queued — check Cases / Jobs" : "Job queued");
  }

  const latestTestJob = useMemo(() => {
    return props.jobs.find((j) => j.type === "test" || j.type === "hidden_test");
  }, [props.jobs]);

  useEffect(() => {
    if (latestTestJob?.stdout) {
      const parsed = parseCases(latestTestJob.stdout);
      if (parsed.length) setCaseResults(parsed);
    }
  }, [latestTestJob?.id, latestTestJob?.stdout]);

  async function submit() {
    setBusy(true);
    setTerminal((t) => t + `\n$ submit\n`);
    try {
      await fetch(`/api/workspace/${props.workspaceId}/execute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: coding ? "hidden_test" : "test" }),
      });
      const res = await fetch(`/api/assignments/${props.assignmentId}/submit`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error?.message || "Submit failed");
        return;
      }
      toast.success(`Submitted. Overall ${json.data.report?.overall ?? "—"}`);
      setTerminal((t) => t + `Submission graded. Report overall=${json.data.report?.overall}\n`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const problemText =
    props.problemDescription ||
    files.find((f) => f.path === "PROBLEM.md")?.content ||
    props.problemSummary ||
    "";

  if (coding) {
    return (
      <div className="animate-rise space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={props.track === "CYBERSECURITY" ? "violet" : "cyan"}>{props.track}</Badge>
              {props.difficulty != null && (
                <span className={cn("rounded-md border px-2 py-0.5 text-xs font-semibold", diffClass(props.difficulty))}>
                  {difficultyLabel(props.difficulty)}
                </span>
              )}
              {premium && <Badge variant="amber">Lightning Judge</Badge>}
              {props.isPremiumContent && <Badge variant="amber">Premium</Badge>}
              <SessionTimer endsAt={props.dueAt} timedMinutes={props.timedMinutes} />
            </div>
            <h1 className="mt-2 break-words text-xl font-semibold sm:text-2xl">{props.title}</h1>
            <p className="text-sm text-slate-400">
              {props.problemSummary || "Implement the solution and pass public + hidden tests."}
              {(props.companies?.length ?? 0) > 0 ? ` · Asked at ${props.companies!.slice(0, 3).join(", ")}` : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" variant="secondary" disabled={busy} onClick={() => run("test")}>
              {premium ? "Run · priority" : "Run"}
            </Button>
            <Button className="w-full sm:w-auto" disabled={busy} onClick={submit}>
              Submit
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              disabled={!premium}
              onClick={() => (premium ? setDebuggerOpen((v) => !v) : undefined)}
              title={premium ? "Toggle debugger" : "Premium feature"}
            >
              Debugger
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary" onClick={commit}>
              Commit
            </Button>
          </div>
        </div>
        {debuggerOpen && premium && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-50">
            <div className="font-medium">Interactive debugger</div>
            <p className="mt-1 text-amber-100/80">
              Breakpoints-ready panel (Premium). Step through failing cases without print-spam — wire a DAP adapter in
              production; this demo surfaces the control surface in-editor.
            </p>
          </div>
        )}

        {/* Mobile tabs */}
        <div className="flex gap-2 xl:hidden">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm",
              panel === "problem" ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-400",
            )}
            onClick={() => setPanel("problem")}
          >
            Problem
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm",
              panel === "code" ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100" : "border-slate-700 text-slate-400",
            )}
            onClick={() => setPanel("code")}
          >
            Code
          </button>
        </div>

        <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.15fr)]">
          <aside
            className={cn(
              "max-h-[70vh] space-y-4 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 p-4",
              panel === "code" ? "hidden xl:block" : "block",
            )}
          >
            <div className="flex flex-wrap gap-1">
              {(props.tags ?? [])
                .filter((t) => !["coding", "easy", "medium", "hard"].includes(t))
                .map((t) => (
                  <span key={t} className="rounded border border-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                    {t}
                  </span>
                ))}
            </div>
            <div className="space-y-4">{renderProblemBody(problemText)}</div>
          </aside>

          <div className={cn("space-y-3", panel === "problem" ? "hidden xl:block" : "block")}>
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
                <select
                  className="max-w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-300"
                  value={activePath}
                  onChange={(e) => setActivePath(e.target.value)}
                >
                  {files.map((f) => (
                    <option key={f.id} value={f.path}>
                      {f.path}
                    </option>
                  ))}
                </select>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{props.language}</span>
              </div>
              <div className="h-[42vh] min-h-[260px] sm:h-[48vh]">
                <Monaco
                  height="100%"
                  theme="vs-dark"
                  language={guessLang(activePath, props.language)}
                  value={active?.content ?? ""}
                  onChange={(v) => v !== undefined && save(v)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                    automaticLayout: true,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    quickSuggestions: premium,
                    suggestOnTriggerCharacters: premium,
                    wordBasedSuggestions: premium ? "currentDocument" : "off",
                  }}
                />
              </div>
              {!premium && (
                <div className="border-t border-slate-800 px-3 py-2 text-xs text-slate-500">
                  Autocomplete is a Premium feature.{" "}
                  <a className="text-amber-300 hover:underline" href="/pricing">
                    Upgrade
                  </a>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-slate-500">
                  Testcases {premium ? "· Lightning queue" : ""}
                </div>
                <div className="font-mono text-xs text-slate-400">
                  {caseResults.length
                    ? `${caseResults.filter((c) => c.pass).length}/${caseResults.length} passed`
                    : latestTestJob
                      ? latestTestJob.status
                      : "not run"}
                </div>
              </div>
              {caseResults.length ? (
                <ul className="space-y-1.5">
                  {caseResults.map((c) => (
                    <li
                      key={c.name}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 font-mono text-xs",
                        c.pass
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
                          : "border-rose-500/20 bg-rose-500/5 text-rose-200",
                      )}
                    >
                      <span>{c.name}</span>
                      <span>{c.pass ? "Accepted" : "Wrong Answer"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Click Run to execute public examples against your solution.</p>
              )}
              <Textarea className="mt-3 min-h-[80px] font-mono text-xs" value={terminal} readOnly />
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={props.track === "CYBERSECURITY" ? "violet" : "cyan"}>{props.track}</Badge>
            <Badge>{props.language}</Badge>
            <SessionTimer endsAt={props.dueAt} timedMinutes={props.timedMinutes} />
          </div>
          <h1 className="mt-2 break-words text-xl font-semibold sm:text-2xl">{props.title}</h1>
          <p className="text-sm text-slate-400">
            Isolated Crucible workspace · sandboxed execution · evidence-based grading
            {props.timedMinutes ? ` · ${props.timedMinutes}-minute session` : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button className="w-full sm:w-auto" variant="secondary" disabled={busy} onClick={() => run("test")}>
            Run tests
          </Button>
          <Button className="w-full sm:w-auto" variant="secondary" disabled={busy} onClick={() => run("hidden_test")}>
            Hidden tests
          </Button>
          <Button className="w-full sm:w-auto" variant="secondary" disabled={busy} onClick={() => run("deploy_check")}>
            Verify deploy
          </Button>
          <Button className="col-span-2 w-full sm:col-span-1 sm:w-auto" disabled={busy} onClick={submit}>
            Submit for evaluation
          </Button>
        </div>
      </div>

      <div className="xl:hidden">
        <label className="mb-1 block text-xs uppercase tracking-wider text-slate-500" htmlFor="ide-file">
          File
        </label>
        <select
          id="ide-file"
          className="flex min-h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-base text-slate-100"
          value={activePath}
          onChange={(e) => setActivePath(e.target.value)}
        >
          {files.map((f) => (
            <option key={f.id} value={f.path}>
              {f.path}
            </option>
          ))}
        </select>
      </div>

      <div className="grid min-h-0 gap-3 xl:grid-cols-[220px_1fr_300px]">
        <aside className="hidden rounded-xl border border-slate-800 bg-slate-950/70 p-3 xl:block">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Files</div>
          <ul className="space-y-1">
            {files.map((f) => (
              <li key={f.id}>
                <button
                  className={`w-full rounded px-2 py-1.5 text-left font-mono text-xs ${
                    f.path === activePath ? "bg-cyan-500/10 text-cyan-200" : "text-slate-400 hover:bg-slate-900"
                  }`}
                  onClick={() => setActivePath(f.path)}
                >
                  {f.path}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117]">
          <div className="truncate border-b border-slate-800 px-3 py-2 font-mono text-xs text-slate-400">
            {activePath}
          </div>
          <div className="h-[42vh] min-h-[240px] sm:h-[52vh] lg:h-[58vh]">
            <Monaco
              height="100%"
              theme="vs-dark"
              language={guessLang(activePath, props.language)}
              value={active?.content ?? ""}
              onChange={(v) => v !== undefined && save(v)}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                automaticLayout: true,
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </section>

        <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:space-y-0">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Git</div>
            <Input value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} className="mb-2" />
            <Button size="sm" className="w-full min-h-10" onClick={commit}>
              Commit
            </Button>
            <ul className="mt-3 max-h-40 space-y-2 overflow-auto text-xs text-slate-400">
              {props.commits.map((c) => (
                <li key={c.sha} className="break-words font-mono">
                  <span className="text-cyan-300">{c.sha.slice(0, 8)}</span> {c.message}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Jobs</div>
            <ul className="max-h-40 space-y-2 overflow-auto text-xs">
              {props.jobs.map((j) => (
                <li key={j.id} className="rounded border border-slate-800 p-2">
                  <div className="font-mono text-slate-300">
                    {j.type} · {j.status}
                  </div>
                  {(j.stdout || j.stderr) && (
                    <pre className="mt-1 max-h-16 overflow-auto whitespace-pre-wrap break-all text-[10px] text-slate-500">
                      {(j.stdout || j.stderr || "").slice(0, 400)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-black/40 p-3 sm:col-span-2 xl:col-span-1">
            <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Terminal</div>
            <Textarea className="min-h-[120px] font-mono text-xs sm:min-h-[160px]" value={terminal} readOnly />
          </div>
        </aside>
      </div>
    </div>
  );
}

function guessLang(path: string, fallback: string) {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".go")) return "go";
  if (path.endsWith(".rs")) return "rust";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  return fallback === "python" ? "python" : "typescript";
}
