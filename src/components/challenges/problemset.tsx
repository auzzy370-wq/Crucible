"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ProblemRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  type: string;
  track: string;
  difficulty: number;
  tags: string[];
  languages: string[];
  estimatedDays: number;
  owaspMappings: string[];
  mitreMappings: string[];
  assessmentId?: string | null;
  workspaceId?: string | null;
};

function label(difficulty: number) {
  if (difficulty <= 3) return "Easy" as const;
  if (difficulty <= 6) return "Medium" as const;
  return "Hard" as const;
}

function diffClass(d: "Easy" | "Medium" | "Hard") {
  if (d === "Easy") return "text-emerald-400";
  if (d === "Medium") return "text-amber-300";
  return "text-rose-400";
}

export function Problemset(props: {
  problems: ProblemRow[];
  projects: ProblemRow[];
  initialMode?: "problemset" | "projects";
}) {
  const [mode, setMode] = useState<"problemset" | "projects">(props.initialMode ?? "problemset");
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [tag, setTag] = useState<string>("All");

  const coding = props.problems;
  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const p of coding) for (const t of p.tags) if (t !== "coding") s.add(t);
    return ["All", ...[...s].sort()];
  }, [coding]);

  const filtered = useMemo(() => {
    return coding.filter((p) => {
      const L = label(p.difficulty);
      if (diff !== "All" && L !== diff) return false;
      if (tag !== "All" && !p.tags.includes(tag)) return false;
      if (!q.trim()) return true;
      const hay = `${p.title} ${p.summary} ${p.tags.join(" ")} ${p.slug}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [coding, diff, tag, q]);

  const counts = useMemo(() => {
    const c = { Easy: 0, Medium: 0, Hard: 0 };
    for (const p of coding) c[label(p.difficulty)] += 1;
    return c;
  }, [coding]);

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">CRUCIBLE</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Problemset</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Timed coding problems with public examples and hidden tests — plus full project assessments when you need
            systems depth.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("problemset")}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              mode === "problemset"
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                : "border-slate-700 text-slate-400 hover:bg-slate-900",
            )}
          >
            Coding ({coding.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("projects")}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              mode === "projects"
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                : "border-slate-700 text-slate-400 hover:bg-slate-900",
            )}
          >
            Projects ({props.projects.length})
          </button>
        </div>
      </header>

      {mode === "problemset" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search title, tag, or slug…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiff(d)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium",
                    diff === d ? "border-slate-500 bg-slate-800 text-slate-100" : "border-slate-800 text-slate-500",
                  )}
                >
                  {d}
                  {d !== "All" ? ` ${counts[d]}` : ""}
                </button>
              ))}
            </div>
            <select
              className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All tags" : t}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-14">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 hidden md:table-cell">Tags</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Session</th>
                  <th className="px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const L = label(p.difficulty);
                  return (
                    <tr key={p.id} className="border-b border-slate-800/80 hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-mono text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-100">{p.title}</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.summary}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {p.tags
                            .filter((t) => t !== "coding" && t !== "easy" && t !== "medium" && t !== "hard")
                            .slice(0, 3)
                            .map((t) => (
                              <span
                                key={t}
                                className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                              >
                                {t}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 font-medium", diffClass(L))}>{L}</td>
                      <td className="px-4 py-3 hidden font-mono text-xs text-slate-400 sm:table-cell">60m</td>
                      <td className="px-4 py-3">
                        {p.workspaceId ? (
                          <Link className="text-cyan-300 hover:underline" href={`/workspace/${p.workspaceId}`}>
                            Solve →
                          </Link>
                        ) : (
                          <Link className="text-slate-400 hover:underline" href="/assessments">
                            Assign →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No problems match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {props.projects.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border border-slate-800 bg-slate-950/60 p-5",
                c.track === "CYBERSECURITY" && "border-violet-500/20",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    c.track === "CYBERSECURITY" ? "violet" : c.track === "SECURE_FULL_STACK" ? "emerald" : "cyan"
                  }
                >
                  {c.track.replaceAll("_", " ")}
                </Badge>
                <Badge>{c.type}</Badge>
                <Badge variant="amber">L{c.difficulty}</Badge>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-100">{c.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{c.summary}</p>
              <p className="mt-3 line-clamp-3 text-sm text-slate-500">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {c.tags.slice(0, 6).map((t) => (
                  <span key={t} className="rounded border border-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-slate-500">60m session · {c.languages.join(", ")}</span>
                {c.workspaceId ? (
                  <Link className="text-cyan-300 hover:underline" href={`/workspace/${c.workspaceId}`}>
                    Open workspace →
                  </Link>
                ) : (
                  <Link className="text-slate-400 hover:underline" href="/assessments">
                    Assign →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
