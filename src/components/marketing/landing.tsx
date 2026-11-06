"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CrucibleLockup } from "@/components/brand/crucible-lockup";

export function LandingPage(props: {
  verifiedSkills?: number;
  timedSessions?: number;
  publicProfiles?: number;
  sampleProfileSlug?: string;
}) {
  const skills = props.verifiedSkills ?? 0;
  const timed = props.timedSessions ?? 60;
  const profiles = props.publicProfiles ?? 0;
  const sampleSlug = props.sampleProfileSlug ?? "casey-elite";

  return (
    <div className="landing-root relative min-h-screen overflow-hidden">
      <section className="relative isolate min-h-[100svh]">
        <div className="landing-hero-plane absolute inset-0" aria-hidden>
          <div className="landing-noise absolute inset-0 opacity-40" />
          <div className="landing-mesh absolute inset-0 opacity-60" />
          <div className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_at_70%_20%,rgba(13,148,136,0.16),transparent_55%)]" />
          <div className="landing-hero-fade absolute inset-0" />
        </div>

        <header className="relative z-20 mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-5 py-5 safe-top sm:px-8 lg:px-10">
          <CrucibleLockup href="/" size="md" />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden min-h-10 items-center px-2 text-sm text-slate-500 transition hover:text-slate-900 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-10 items-center rounded-md bg-teal-600 px-3.5 text-sm font-medium text-white transition hover:bg-teal-500"
            >
              Start learning
            </Link>
          </div>
        </header>

        <div className="relative z-20 mx-auto flex min-h-[calc(100svh-4.75rem)] w-full max-w-[1200px] flex-col justify-end px-5 pb-16 pt-10 sm:px-8 sm:pb-24 lg:px-10">
          <p className="landing-anim-brand font-serif-display text-[clamp(4rem,16vw,9.5rem)] leading-[0.84] tracking-[-0.04em] text-slate-900">
            Crucible
          </p>
          <h1 className="landing-anim-copy mt-6 max-w-md text-[1.15rem] font-medium leading-snug text-slate-700 sm:mt-8 sm:text-[1.35rem]">
            Learn the craft. Hire the proof.
          </h1>
          <p className="landing-anim-copy mt-3 max-w-md text-[15px] leading-relaxed text-slate-500">
            Timed judges and real production work — one arena for engineers who practice and employers who hire.
          </p>
          <div className="landing-anim-cta mt-9 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-teal-600 px-6 text-sm font-semibold text-white transition hover:bg-teal-500 sm:w-auto"
            >
              Start learning free
            </Link>
            <Link
              href="/login?intent=hire"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-300 px-5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 sm:w-auto"
            >
              Hire with Crucible
            </Link>
          </div>
        </div>
      </section>

      <section id="paths" className="relative z-10 border-t border-slate-200">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-600">For learners</p>
            <h2 className="mt-3 font-serif-display text-[2rem] leading-tight text-slate-900">A place to get better</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-500">
              Daily sessions, a deep problem bank, study plans, and company-style mocks. Train under the same judges
              employers trust — then publish a verified profile.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-teal-600 transition hover:text-teal-500"
            >
              Create a learner account →
            </Link>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-600">For employers</p>
            <h2 className="mt-3 font-serif-display text-[2rem] leading-tight text-slate-900">A floor to test talent</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-500">
              Assign the work you care about. Watch candidates build in isolated workspaces, run hidden harnesses, and
              collect scorecards — humans still make the hire call.
            </p>
            <Link
              href="/login?intent=hire"
              className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-amber-600 transition hover:text-amber-500"
            >
              Enter as hiring team →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-slate-200">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-14 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">Shared proof</p>
            <p className="mt-3 max-w-xl font-serif-display text-2xl leading-snug text-slate-900 sm:text-[1.75rem]">
              {skills} verified skills · {timed}-minute sessions · human review
            </p>
            <p className="mt-2 font-mono text-[11px] text-slate-500">
              {profiles} public {profiles === 1 ? "profile" : "profiles"} published
            </p>
          </div>
          <Link
            href={`/u/${sampleSlug}`}
            className="text-sm font-medium text-teal-600 transition hover:text-teal-500"
          >
            Open a live qualification profile →
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-t border-slate-200 bg-slate-50/50">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:grid-cols-3 sm:px-8 lg:gap-12 lg:px-10 lg:py-20">
          {[
            {
              t: "Learn under pressure",
              d: "Sixty-minute sessions across SaaS, AppSec, SOC/IR, and secure full-stack — build, break, recover.",
            },
            {
              t: "One judge for both sides",
              d: "Public examples and hidden harnesses in TypeScript, JavaScript, Python, Go, Rust, and Java.",
            },
            {
              t: "Hire on evidence",
              d: "Shareable qualification pages and scorecards. Résumé claims stay claims until Crucible verifies them.",
            },
          ].map((item) => (
            <div key={item.t}>
              <h2 className="font-serif-display text-xl text-slate-900">{item.t}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
