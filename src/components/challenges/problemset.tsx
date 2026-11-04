"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FREQUENCY_METHODOLOGY } from "@/lib/frequency";
import { difficultyBand, type DifficultyBand } from "@/lib/difficulty";

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
  companies?: string[];
  frequency?: number;
  avgMinutes?: number;
  isPremium?: boolean;
  owaspMappings: string[];
  mitreMappings: string[];
  assessmentId?: string | null;
  workspaceId?: string | null;
};

function label(difficulty: number): DifficultyBand {
  return difficultyBand(difficulty);
}

function diffClass(d: DifficultyBand) {
  if (d === "Easy") return "text-emerald-400";
  if (d === "Medium") return "text-amber-300";
  if (d === "Hard") return "text-rose-400";
  if (d === "Expert") return "text-violet-300";
  return "text-fuchsia-300";
}

export function Problemset(props: {
  problems: ProblemRow[];
  projects: ProblemRow[];
  initialMode?: "problemset" | "projects";
  premium?: boolean;
}) {
  const [mode, setMode] = useState<"problemset" | "projects">(props.initialMode ?? "problemset");
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<"All" | DifficultyBand>("All");
  const [tag, setTag] = useState<string>("All");
  const [company, setCompany] = useState<string>("All");
  const [sort, setSort] = useState<"frequency" | "time" | "title">("frequency");

  const coding = props.problems;
  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const p of coding) for (const t of p.tags) if (t !== "coding") s.add(t);
    return ["All", ...[...s].sort()];
  }, [coding]);

  const companies = useMemo(() => {
    const s = new Set<string>();
    for (const p of coding) for (const c of p.companies ?? []) s.add(c);
    return ["All", ...[...s].sort()];
  }, [coding]);

  const filtered = useMemo(() => {
    const rows = coding.filter((p) => {
      const L = label(p.difficulty);
      if (diff !== "All" && L !== diff) return false;
      if (tag !== "All" && !p.tags.includes(tag)) return false;
      if (company !== "All" && !(p.companies ?? []).includes(company)) return false;
      if (!q.trim()) return true;
      const hay = `${p.title} ${p.summary} ${p.tags.join(" ")} ${(p.companies ?? []).join(" ")} ${p.slug}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
    rows.sort((a, b) => {
      if (sort === "frequency") return (b.frequency ?? 0) - (a.frequency ?? 0);
      if (sort === "time") return (a.avgMinutes ?? 60) - (b.avgMinutes ?? 60);
      return a.title.localeCompare(b.title);
    });
    return rows;
  }, [coding, diff, tag, company, q, sort]);

  const counts = useMemo(() => {
    const c: Record<DifficultyBand, number> = { Easy: 0, Medium: 0, Hard: 0, Expert: 0, Impossible: 0 };
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
            Company-tagged interview questions with frequency and time filters. Premium unlocks exclusive problems,
            solutions, and Lightning Judge.
          </p>
          <p className="mt-2 max-w-2xl text-xs text-slate-500" title={FREQUENCY_METHODOLOGY.detail}>
            Freq column: {FREQUENCY_METHODOLOGY.label}. {FREQUENCY_METHODOLOGY.detail}
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
          <Link href="/pricing" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Premium
          </Link>
        </div>
      </header>

      {mode === "problemset" ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <Input
              placeholder="Search title, company, tag…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {(["All", "Easy", "Medium", "Hard", "Expert", "Impossible"] as const).map((d) => (
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
                  {d !== "All" ? ` (${counts[d]})` : ""}
                </button>
              ))}
            </div>
            <select
              className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All companies" : c}
                </option>
              ))}
            </select>
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
            <select
              className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="frequency">Sort: frequency</option>
              <option value="time">Sort: time</option>
              <option value="title">Sort: title</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-14">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Companies</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3 hidden md:table-cell" title={FREQUENCY_METHODOLOGY.detail}>
                    Freq*
                  </th>
                  <th className="px-4 py-3 hidden sm:table-cell">Time</th>
                  <th className="px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const L = label(p.difficulty);
                  const locked = Boolean(p.isPremium) && !props.premium;
                  return (
                    <tr key={p.id} className="border-b border-slate-800/80 hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-mono text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-100">{p.title}</span>
                          {p.isPremium && <Badge variant="amber">Premium</Badge>}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.summary}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(p.companies ?? []).slice(0, 3).map((c) => (
                            <span
                              key={c}
                              className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 font-medium", diffClass(L))}>{L}</td>
                      <td
                        className="px-4 py-3 hidden font-mono text-xs text-slate-400 md:table-cell"
                        title={FREQUENCY_METHODOLOGY.detail}
                      >
                        {p.frequency ?? 0}%
                        <span className="ml-1 text-[10px] text-slate-600">{FREQUENCY_METHODOLOGY.short}</span>
                      </td>
                      <td className="px-4 py-3 hidden font-mono text-xs text-slate-400 sm:table-cell">
                        {p.avgMinutes ?? 60}m
                      </td>
                      <td className="px-4 py-3">
                        {locked ? (
                          <Link className="text-amber-300 hover:underline" href="/pricing">
                            Unlock →
                          </Link>
                        ) : p.workspaceId ? (
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
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
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
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-slate-500">60m session</span>
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
