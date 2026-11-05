"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FREQUENCY_METHODOLOGY } from "@/lib/frequency";
import {
  ACCEPTANCE_METHODOLOGY,
  LIVE_ACCEPTANCE_METHODOLOGY,
  illustrativeAcceptance,
} from "@/lib/acceptance";
import { difficultyBand, type DifficultyBand } from "@/lib/difficulty";
import { CODING_LANGUAGES, CODING_LANGUAGE_LABELS, type CodingLanguage } from "@/lib/coding-languages";
import { trackBadgeVariant, trackLabel } from "@/lib/tracks";

export type ProblemRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description?: string;
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
  editorialSlug?: string | null;
};

const PAGE_SIZE = 40;

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
  const [lang, setLang] = useState<CodingLanguage>("typescript");
  const [starting, setStarting] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [liveAcc, setLiveAcc] = useState<
    Record<string, { acceptancePct: number; submissions: number }>
  >({});
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const router = useRouter();

  const coding = props.problems;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bmRes, accRes] = await Promise.all([
          fetch("/api/bookmarks"),
          fetch("/api/practice/acceptance"),
        ]);
        const bmJson = await bmRes.json().catch(() => null);
        const accJson = await accRes.json().catch(() => null);
        if (cancelled) return;
        if (bmJson?.ok && Array.isArray(bmJson.data?.bookmarks)) {
          setBookmarkedIds(
            new Set(
              (bmJson.data.bookmarks as { challenge: { id: string } }[]).map((b) => b.challenge.id),
            ),
          );
        }
        if (accJson?.ok && accJson.data?.byId) {
          setLiveAcc(accJson.data.byId as Record<string, { acceptancePct: number; submissions: number }>);
        }
      } catch {
        /* optional enrichment */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleBookmark(challengeId: string) {
    const on = bookmarkedIds.has(challengeId);
    try {
      if (on) {
        const res = await fetch(`/api/bookmarks?challengeId=${encodeURIComponent(challengeId)}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error?.message || "Failed");
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(challengeId);
          return next;
        });
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ challengeId }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error?.message || "Failed");
        setBookmarkedIds((prev) => new Set(prev).add(challengeId));
        toast.success("Bookmarked");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bookmark failed");
    }
  }

  function acceptanceFor(p: ProblemRow): { pct: number; live: boolean } {
    const live = liveAcc[p.id];
    if (live) return { pct: live.acceptancePct, live: true };
    return { pct: illustrativeAcceptance(p.difficulty, p.slug), live: false };
  }

  async function startProblem(p: ProblemRow) {
    if (Boolean(p.isPremium) && !props.premium) {
      router.push("/pricing");
      return;
    }
    setStarting(p.id);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId: p.id, language: lang }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not start");
      toast.success(`Opened in ${CODING_LANGUAGE_LABELS[lang]}`);
      router.push(`/workspace/${json.data.workspaceId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setStarting(null);
    }
  }
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
      if (bookmarksOnly && !bookmarkedIds.has(p.id)) return false;
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
  }, [coding, diff, tag, company, q, sort, bookmarksOnly, bookmarkedIds]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [mode, diff, tag, company, sort, q]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;
  const visibleProjects = useMemo(
    () => props.projects.slice(0, visibleCount),
    [props.projects, visibleCount],
  );
  const hasMoreProjects = visibleCount < props.projects.length;

  const counts = useMemo(() => {
    const c: Record<DifficultyBand, number> = { Easy: 0, Medium: 0, Hard: 0, Expert: 0, Impossible: 0 };
    for (const p of coding) c[label(p.difficulty)] += 1;
    return c;
  }, [coding]);

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">LEARNING LIBRARY</p>
          <h1 className="mt-2 font-serif-display text-2xl tracking-tight sm:text-3xl">Practice bank</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Train on the same timed coding and production missions employers assign — TypeScript, JavaScript, Python,
            Go, Rust, Java. Public checks first; hidden harnesses decide Accepted.
          </p>
          <p className="mt-2 max-w-2xl text-xs text-slate-500" title={FREQUENCY_METHODOLOGY.detail}>
            Freq: {FREQUENCY_METHODOLOGY.label}. Acc: live when ≥3 hidden submits, otherwise{" "}
            {ACCEPTANCE_METHODOLOGY.short}.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => setMode("problemset")}
            className={cn(
              "min-h-11 rounded-lg border px-3 py-2 text-sm",
              mode === "problemset"
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                : "border-slate-700 text-slate-400 hover:bg-slate-900",
            )}
          >
            Coding judges ({coding.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("projects")}
            className={cn(
              "min-h-11 rounded-lg border px-3 py-2 text-sm",
              mode === "projects"
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                : "border-slate-700 text-slate-400 hover:bg-slate-900",
            )}
          >
            Missions ({props.projects.length})
          </button>
          <Link
            href="/pricing"
            className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 sm:col-span-1"
          >
            Premium
          </Link>
        </div>
      </header>

      {mode === "problemset" ? (
        <>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Search title, company, tag…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full md:max-w-sm"
            />
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
              {(["All", "Easy", "Medium", "Hard", "Expert", "Impossible"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiff(d)}
                  className={cn(
                    "shrink-0 rounded-md border px-2.5 py-2 text-xs font-medium",
                    diff === d ? "border-slate-500 bg-slate-800 text-slate-100" : "border-slate-800 text-slate-500",
                  )}
                >
                  {d}
                  {d !== "All" ? ` (${counts[d]})` : ""}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select
                className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
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
                className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
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
                className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value="frequency">Sort: frequency</option>
                <option value="time">Sort: time</option>
                <option value="title">Sort: title</option>
              </select>
              <select
                className="h-11 w-full rounded-md border border-cyan-500/30 bg-slate-950 px-3 text-sm text-cyan-100"
                value={lang}
                onChange={(e) => setLang(e.target.value as CodingLanguage)}
                title="Language for Solve"
              >
                {CODING_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {CODING_LANGUAGE_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBookmarksOnly((v) => !v)}
                className={cn(
                  "min-h-10 rounded-md border px-3 text-xs",
                  bookmarksOnly
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                    : "border-slate-700 text-slate-400",
                )}
              >
                ★ Bookmarks{bookmarkedIds.size ? ` (${bookmarkedIds.size})` : ""}
              </button>
            </div>
          </div>

          <p className="font-mono text-[11px] text-slate-500">
            Showing {Math.min(visible.length, filtered.length)} of {filtered.length} matching · library stays intact
          </p>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {visible.map((p, i) => {
              const L = label(p.difficulty);
              const locked = Boolean(p.isPremium) && !props.premium;
              const acc = acceptanceFor(p);
              const starred = bookmarkedIds.has(p.id);
              return (
                <article key={p.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-600">
                        <span>#{i + 1}</span>
                        <button
                          type="button"
                          className={cn("text-sm", starred ? "text-amber-300" : "text-slate-600")}
                          onClick={() => void toggleBookmark(p.id)}
                          aria-label={starred ? "Remove bookmark" : "Bookmark"}
                        >
                          {starred ? "★" : "☆"}
                        </button>
                      </div>
                      <h2 className="mt-0.5 text-base font-medium leading-snug text-slate-100">{p.title}</h2>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.summary}</p>
                    </div>
                    <span className={cn("shrink-0 text-sm font-medium", diffClass(L))}>{L}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.isPremium && <Badge variant="amber">Premium</Badge>}
                    {[...new Set(p.companies ?? [])].slice(0, 3).map((c) => (
                      <span
                        key={`${p.id}-co-${c}`}
                        className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-slate-500">
                    <span>
                      Freq {p.frequency ?? 0}%
                      <span className="text-slate-600"> {FREQUENCY_METHODOLOGY.short}</span>
                    </span>
                    <span title={acc.live ? LIVE_ACCEPTANCE_METHODOLOGY.detail : ACCEPTANCE_METHODOLOGY.detail}>
                      Acc {acc.pct}%
                      <span className="text-slate-600">
                        {" "}
                        {acc.live ? LIVE_ACCEPTANCE_METHODOLOGY.short : ACCEPTANCE_METHODOLOGY.short}
                      </span>
                    </span>
                    <span>{p.avgMinutes ?? 60}m</span>
                    {p.editorialSlug && (
                      <Link
                        href={`/editorials?slug=${encodeURIComponent(p.editorialSlug)}`}
                        className="text-cyan-400/80 hover:underline"
                      >
                        Editorial
                      </Link>
                    )}
                  </div>
                  <div className="mt-3">
                    {locked ? (
                      <Link
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-sm text-amber-100"
                        href="/pricing"
                      >
                        Unlock Premium →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={starting === p.id}
                        onClick={() => void startProblem(p)}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/10 text-sm text-cyan-100 disabled:opacity-50"
                      >
                        {starting === p.id ? "Opening…" : `Solve · ${CODING_LANGUAGE_LABELS[lang]}`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {!filtered.length && (
              <p className="rounded-xl border border-slate-800 px-4 py-10 text-center text-slate-500">
                No problems match your filters.
              </p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-10">★</th>
                  <th className="px-4 py-3 w-14">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Companies</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3" title={FREQUENCY_METHODOLOGY.detail}>
                    Freq*
                  </th>
                  <th className="px-4 py-3" title={ACCEPTANCE_METHODOLOGY.detail}>
                    Acc*
                  </th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p, i) => {
                  const L = label(p.difficulty);
                  const locked = Boolean(p.isPremium) && !props.premium;
                  const acc = acceptanceFor(p);
                  const starred = bookmarkedIds.has(p.id);
                  return (
                    <tr key={p.id} className="border-b border-slate-800/80 hover:bg-slate-900/50">
                      <td className="px-2 py-3 text-center">
                        <button
                          type="button"
                          className={cn("text-sm", starred ? "text-amber-300" : "text-slate-600 hover:text-slate-400")}
                          onClick={() => void toggleBookmark(p.id)}
                          aria-label={starred ? "Remove bookmark" : "Bookmark"}
                        >
                          {starred ? "★" : "☆"}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-100">{p.title}</span>
                          {p.isPremium && <Badge variant="amber">Premium</Badge>}
                          {p.editorialSlug && (
                            <Link
                              href={`/editorials?slug=${encodeURIComponent(p.editorialSlug)}`}
                              className="font-mono text-[10px] text-cyan-400/80 hover:underline"
                            >
                              Editorial
                            </Link>
                          )}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.summary}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(p.companies ?? [])].slice(0, 3).map((c) => (
                            <span
                              key={`${p.id}-co-${c}`}
                              className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 font-medium", diffClass(L))}>{L}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400" title={FREQUENCY_METHODOLOGY.detail}>
                        {p.frequency ?? 0}%
                        <span className="ml-1 text-[10px] text-slate-600">{FREQUENCY_METHODOLOGY.short}</span>
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-xs text-slate-400"
                        title={acc.live ? LIVE_ACCEPTANCE_METHODOLOGY.detail : ACCEPTANCE_METHODOLOGY.detail}
                      >
                        {acc.pct}%
                        <span className="ml-1 text-[10px] text-slate-600">
                          {acc.live ? LIVE_ACCEPTANCE_METHODOLOGY.short : ACCEPTANCE_METHODOLOGY.short}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.avgMinutes ?? 60}m</td>
                      <td className="px-4 py-3">
                        {locked ? (
                          <Link className="text-amber-300 hover:underline" href="/pricing">
                            Unlock →
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={starting === p.id}
                            onClick={() => void startProblem(p)}
                            className="text-cyan-300 hover:underline disabled:opacity-50"
                          >
                            {starting === p.id ? "Opening…" : `Solve (${CODING_LANGUAGE_LABELS[lang]}) →`}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      No problems match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-sm text-slate-200 hover:border-cyan-500/40 hover:text-cyan-100"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Load more ({filtered.length - visible.length} remaining)
            </button>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <p className="font-mono text-[11px] text-slate-500">
            Showing {visibleProjects.length} of {props.projects.length} missions
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleProjects.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "rounded-xl border border-slate-800 bg-slate-950/60 p-5",
                  (c.track === "CYBERSECURITY" || c.track === "CLOUD_INFRA_SECURITY") &&
                    "border-violet-500/20",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      trackBadgeVariant(c.track)
                    }
                  >
                    {trackLabel(c.track)}
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
          {hasMoreProjects && (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-sm text-slate-200 hover:border-cyan-500/40 hover:text-cyan-100"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Load more missions ({props.projects.length - visibleProjects.length} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
