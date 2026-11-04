"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-60" />
      <div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl transition-opacity duration-1000"
        style={{ opacity: ready ? 1 : 0 }}
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-1000 delay-150"
        style={{ opacity: ready ? 1 : 0 }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="pulse-live flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300">
            CR
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.22em] text-slate-100">CRUCIBLE</div>
            <div className="text-[10px] tracking-[0.18em] text-cyan-300/90">PROVE THE CRAFT</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
          >
            Start free
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-16">
        <section className="animate-rise">
          <p className="font-mono text-xs tracking-[0.35em] text-cyan-300">CRUCIBLE</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Evidence over puzzles.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
            Timed software engineering and cybersecurity assessments that verify what résumés claim — plus a company-tagged
            problemset with Lightning Judge for Premium prep.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Enter the crucible
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm text-slate-200 hover:border-slate-500"
            >
              View demo accounts
            </Link>
          </div>
        </section>

        <section
          className={`relative min-h-[320px] overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-[0_0_80px_-20px_rgba(34,211,238,0.35)] transition-transform duration-700 sm:min-h-[420px] ${ready ? "translate-y-0" : "translate-y-2"}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.15),transparent_55%)]" />
          <div className="relative space-y-4 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
              <span>Live session</span>
              <span className="text-amber-300">60:00</span>
            </div>
            <pre className="overflow-hidden rounded-lg border border-slate-800 bg-black/50 p-4 text-[11px] leading-relaxed text-cyan-100/90">{`function twoSum(nums, target) {
  const seen = new Map();
  // Lightning Judge · priority queue
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
}`}</pre>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-200">
                public · 3/3
              </div>
              <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-cyan-100">
                hidden harness
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Qualification profiles publish assessment-verified skills — not self-reported claims.
            </p>
          </div>
        </section>
      </main>

      <section className="relative z-10 border-t border-slate-800/80 bg-slate-950/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          {[
            {
              t: "Timed assessments",
              d: "60-minute sessions across SaaS, AppSec, SOC/IR, and secure full-stack delivery.",
            },
            {
              t: "Problemset + Premium",
              d: "Company-tagged coding drills, Lightning Judge, debugger, and AI autocomplete.",
            },
            {
              t: "Verified profiles",
              d: "Share public qualification pages employers can trust — skills gated by evidence.",
            },
          ].map((item) => (
            <div key={item.t}>
              <h2 className="text-sm font-semibold tracking-wide text-slate-100">{item.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
