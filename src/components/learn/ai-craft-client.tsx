"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type LessonRow = {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: string;
  skills: string[];
  practiceSlug: string | null;
  done: boolean;
};

export function AiCraftClient() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [next, setNext] = useState<{ slug: string; title: string; summary: string; minutes: number } | null>(null);
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/learn/ai/progress");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      setLessons(json.data.lessons ?? []);
      setNext(json.data.nextLesson);
      setPercent(json.data.percent ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function enrollAndGo() {
    setBusy(true);
    try {
      await fetch("/api/learn/ai/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug: lessons[0]?.slug ?? "ai-what-llms-are", done: false, enroll: true }),
      });
      const target = next?.slug ?? lessons[0]?.slug;
      if (target) window.location.href = `/learn/ai/${target}`;
      else await load();
    } finally {
      setBusy(false);
    }
  }

  const levels = ["foundations", "builder", "production"] as const;

  return (
    <div className="animate-rise space-y-8">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-violet-300">AI CRAFT</p>
        <h1 className="mt-2 font-serif-display text-2xl sm:text-3xl">Learn AI end-to-end</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Prompting, API integration, tools, RAG, agents, evals, and safety — then prove it on the same benches
          humans and models share.
        </p>
      </header>

      <section className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-violet-200/80">Your path</div>
            <div className="mt-1 font-mono text-2xl text-violet-100">{percent}% complete</div>
            {next ? (
              <p className="mt-1 text-sm text-slate-600">
                Next: <span className="text-slate-800">{next.title}</span> · {next.minutes} min
              </p>
            ) : (
              <p className="mt-1 text-sm text-emerald-300">Curriculum cleared — keep practicing in the problem bank.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {next ? (
              <Link href={`/learn/ai/${next.slug}`}>
                <Button disabled={busy}>{busy ? "…" : "Continue lesson"}</Button>
              </Link>
            ) : (
              <Button disabled={busy} onClick={() => void enrollAndGo()}>
                Start AI Craft
              </Button>
            )}
            <Link href="/challenges">
              <Button variant="secondary">Open problem bank</Button>
            </Link>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-violet-400/80 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </section>

      {loading ? (
        <p className="text-slate-500">Loading curriculum…</p>
      ) : (
        levels.map((level) => {
          const rows = lessons.filter((l) => l.level === level);
          if (!rows.length) return null;
          return (
            <section key={level} className="space-y-3">
              <h2 className="text-sm font-semibold capitalize text-slate-800">{level}</h2>
              <div className="space-y-2">
                {rows.map((l, idx) => (
                  <Link
                    key={l.slug}
                    href={`/learn/ai/${l.slug}`}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-violet-500/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-600">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="font-medium text-slate-900">{l.title}</span>
                        {l.done && <Badge variant="emerald">done</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{l.summary}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <Badge>{l.minutes} min</Badge>
                      {l.skills.slice(0, 2).map((s) => (
                        <Badge key={s} variant="cyan">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
