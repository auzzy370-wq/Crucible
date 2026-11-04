"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function EditorialsClient() {
  const [rows, setRows] = useState<any[]>([]);
  const [premium, setPremium] = useState(false);
  const [active, setActive] = useState<any>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/editorials");
      const json = await res.json();
      if (json.ok) {
        setRows(json.data.editorials);
        setPremium(json.data.premium);
      }
      const want = new URLSearchParams(window.location.search).get("slug");
      if (want) {
        const one = await fetch(`/api/editorials?slug=${encodeURIComponent(want)}`);
        const oneJson = await one.json();
        if (oneJson.ok) setActive(oneJson.data);
      }
    })();
  }, []);

  async function open(slug: string) {
    const res = await fetch(`/api/editorials?slug=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (json.ok) setActive(json.data);
    const url = new URL(window.location.href);
    url.searchParams.set("slug", slug);
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-amber-300">PREMIUM SOLUTIONS</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Editorials</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Deep-dive solutions after the judge signal is solid. Free editorials cover foundations; Premium unlocks company-grade writeups.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => open(r.slug)}
                className="w-full rounded-xl border border-slate-800 px-4 py-3 text-left hover:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.title}</span>
                  {r.isPremium && <Badge variant="amber">Premium</Badge>}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {r.challenge?.title} · {r.complexity}
                </div>
              </button>
            </li>
          ))}
        </ul>

        <article className="min-h-[280px] rounded-xl border border-slate-800 bg-slate-950/50 p-5">
          {!active && <p className="text-slate-500">Select an editorial.</p>}
          {active?.locked && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              <p className="text-sm text-slate-400">
                {active.approach} · {active.complexity}
              </p>
              <p className="text-amber-200">Premium required to read the full solution.</p>
              <Link href="/pricing" className="text-sm text-cyan-300 hover:underline">
                Upgrade →
              </Link>
            </div>
          )}
          {active && !active.locked && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span>{active.approach}</span>
                <span>·</span>
                <span>{active.complexity}</span>
                {premium && active.isPremium && <Badge variant="amber">Premium</Badge>}
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">{active.bodyMd}</pre>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
