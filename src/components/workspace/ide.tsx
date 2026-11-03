"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type FileRow = { id: string; path: string; content: string; language: string | null };

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
}) {
  const router = useRouter();
  const [files, setFiles] = useState(props.files);
  const [activePath, setActivePath] = useState(props.files[0]?.path ?? "README.md");
  const active = useMemo(() => files.find((f) => f.path === activePath), [files, activePath]);
  const [commitMsg, setCommitMsg] = useState("feat: progress on assessment");
  const [terminal, setTerminal] = useState("Ready. Tests execute in an isolated worker/sandbox.\n");
  const [busy, setBusy] = useState(false);

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

  async function run(type: "test" | "hidden_test" | "deploy_check") {
    setBusy(true);
    setTerminal((t) => t + `\n$ enqueue ${type}\n`);
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
    setTimeout(() => {
      router.refresh();
      setBusy(false);
    }, 2000);
  }

  async function submit() {
    setBusy(true);
    const res = await fetch(`/api/assignments/${props.assignmentId}/submit`, { method: "POST" });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) return toast.error(json.error?.message || "Submit failed");
    toast.success(`Submitted. Overall ${json.data.report?.overall ?? "—"}`);
    setTerminal((t) => t + `\nSubmission graded. Report overall=${json.data.report?.overall}\n`);
    router.refresh();
  }

  return (
    <div className="animate-rise space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={props.track === "CYBERSECURITY" ? "violet" : "cyan"}>{props.track}</Badge>
            <Badge>{props.language}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{props.title}</h1>
          <p className="text-sm text-slate-400">
            Isolated workspace · sandboxed execution · evidence-based grading
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => run("test")}>
            Run tests
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => run("hidden_test")}>
            Hidden tests
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => run("deploy_check")}>
            Verify deploy
          </Button>
          <Button disabled={busy} onClick={submit}>
            Submit for evaluation
          </Button>
        </div>
      </div>

      <div className="grid min-h-[70vh] gap-3 xl:grid-cols-[220px_1fr_300px]">
        <aside className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Files</div>
          <ul className="space-y-1">
            {files.map((f) => (
              <li key={f.id}>
                <button
                  className={`w-full rounded px-2 py-1 text-left font-mono text-xs ${
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

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117]">
          <div className="border-b border-slate-800 px-3 py-2 font-mono text-xs text-slate-400">{activePath}</div>
          <Monaco
            height="58vh"
            theme="vs-dark"
            language={guessLang(activePath, props.language)}
            value={active?.content ?? ""}
            onChange={(v) => v !== undefined && save(v)}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "IBM Plex Mono, ui-monospace, monospace",
              automaticLayout: true,
            }}
          />
        </section>

        <aside className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Git</div>
            <Input value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} className="mb-2" />
            <Button size="sm" className="w-full" onClick={commit}>
              Commit
            </Button>
            <ul className="mt-3 max-h-40 space-y-2 overflow-auto text-xs text-slate-400">
              {props.commits.map((c) => (
                <li key={c.sha} className="font-mono">
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
                    <pre className="mt-1 max-h-16 overflow-auto text-[10px] text-slate-500">
                      {(j.stdout || j.stderr || "").slice(0, 400)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-black/40 p-3">
            <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Terminal</div>
            <Textarea className="min-h-[160px] font-mono text-xs" value={terminal} readOnly />
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
