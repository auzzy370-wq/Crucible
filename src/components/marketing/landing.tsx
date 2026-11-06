"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CrucibleLockup } from "@/components/brand/crucible-lockup";

function WorkspacePreview({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "overflow-hidden rounded-xl border border-white/10 bg-[#0d141c]/90 shadow-2xl shadow-black/50"
      }
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="ml-2 font-mono text-[10px] text-white/40">timed session</span>
      </div>
      <div className="grid grid-cols-[48px_1fr]">
        <div className="space-y-2 border-r border-white/10 px-2 py-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-1.5 rounded-full bg-white/10"
              style={{ width: `${45 + (n % 3) * 16}%` }}
            />
          ))}
        </div>
        <div className="space-y-2 px-3 py-3">
          <div className="h-2 w-[70%] rounded-full bg-teal-400/40" />
          <div className="h-2 w-[88%] rounded-full bg-white/12" />
          <div className="h-2 w-[55%] rounded-full bg-white/12" />
          <div className="h-2 w-[78%] rounded-full bg-white/12" />
          <div className="h-2 w-[62%] rounded-full bg-amber-300/30" />
          <div className="h-2 w-[72%] rounded-full bg-white/12" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 font-mono text-[10px] text-white/40">
        <span>public 3/3</span>
        <span className="text-teal-300/80">harness ready</span>
      </div>
    </div>
  );
}

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
    <div className="landing-root relative min-h-screen overflow-x-clip">
      <section className="relative isolate flex min-h-[100svh] flex-col bg-[#07090d]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(13,148,136,0.2),transparent_45%),linear-gradient(180deg,#0b1118_0%,#07090d_60%,#05070a_100%)]" />
          <div className="landing-noise absolute inset-0 opacity-40 mix-blend-soft-light" />
          {/* Desktop-only side preview — never overlaps mobile copy */}
          <div className="absolute bottom-[22%] right-10 top-28 hidden w-[min(400px,42vw)] sm:block lg:right-14">
            <WorkspacePreview />
          </div>
        </div>

        <header className="relative z-20 mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 safe-top sm:px-8 sm:py-5 lg:px-10">
          <div className="[&_.font-serif-display]:text-white">
            <CrucibleLockup href="/" size="sm" wordmarkFrom="sm" />
          </div>
          <div className="relative z-20 flex shrink-0 items-center gap-2">
            <ThemeToggle className="border-white/15 text-white/70 hover:border-white/30 hover:text-white" />
            <Link
              href="/login"
              className="hidden min-h-10 items-center px-2 text-sm text-white/60 transition hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-10 items-center rounded-md bg-[var(--brand)] px-3 text-sm font-medium text-white transition hover:bg-[var(--brand-hover)] sm:px-3.5"
            >
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Start learning</span>
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 pb-10 pt-3 sm:px-8 sm:pb-20 sm:pt-6 lg:px-10">
          {/* Mobile visual sits in normal flow — no absolute overlap */}
          <div className="mb-8 sm:hidden">
            <WorkspacePreview />
          </div>

          <div className="mt-auto max-w-xl sm:max-w-md lg:max-w-xl">
            <p className="landing-anim-brand font-serif-display text-[clamp(3.25rem,14vw,8.5rem)] leading-[0.88] tracking-[-0.04em] text-white">
              Crucible
            </p>
            <h1 className="landing-anim-copy mt-4 text-[1.15rem] font-medium leading-snug text-white/90 sm:mt-5 sm:text-[1.35rem]">
              Learn the craft. Hire the proof.
            </h1>
            <p className="landing-anim-copy mt-3 text-[15px] leading-relaxed text-white/55">
              Timed judges and real production work — one arena for engineers who practice and employers who hire.
            </p>
            <div className="landing-anim-cta mt-7 flex w-full flex-col gap-2.5 sm:mt-9 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[var(--brand)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] sm:w-auto"
              >
                Start learning free
              </Link>
              <Link
                href="/login?intent=hire"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 text-sm text-white transition hover:border-white/35 hover:bg-white/10 sm:w-auto"
              >
                Hire with Crucible
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="paths" className="relative z-10 border-t border-slate-200 bg-[var(--background)]">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-14 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-600">For learners</p>
            <h2 className="mt-3 font-serif-display text-[1.75rem] leading-tight text-slate-900 sm:text-[2rem]">
              A place to get better
            </h2>
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
            <h2 className="mt-3 font-serif-display text-[1.75rem] leading-tight text-slate-900 sm:text-[2rem]">
              A floor to test talent
            </h2>
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

      <section className="relative z-10 border-t border-slate-200 bg-[var(--background)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-14">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">Shared proof</p>
            <p className="mt-3 max-w-xl font-serif-display text-xl leading-snug text-slate-900 sm:text-[1.75rem]">
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

      <section className="relative z-10 border-t border-slate-200 bg-slate-50/80">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:grid-cols-3 sm:px-8 lg:gap-12 lg:px-10 lg:py-20">
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
