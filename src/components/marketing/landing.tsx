"use client";

import Link from "next/link";

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
      {/* ——— First viewport: one composition ——— */}
      <section className="relative isolate min-h-[100svh]">
        {/* Full-bleed product visual — edge-to-edge code arena, not a card */}
        <div className="landing-hero-plane absolute inset-0" aria-hidden>
          <div className="landing-noise absolute inset-0" />
          <div className="landing-mesh absolute inset-0" />
          <div className="landing-anim-ambient absolute -left-[20%] top-[-15%] h-[75vh] w-[75vw] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_68%)] blur-2xl" />
          <div
            className="landing-anim-ambient absolute bottom-[-25%] right-[-15%] h-[60vh] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.1),transparent_70%)] blur-3xl"
            style={{ animationDelay: "-6s" }}
          />
          <pre className="landing-anim-plane pointer-events-none absolute inset-0 overflow-hidden px-4 pt-[18vh] font-mono text-[11px] leading-[1.7] text-cyan-200/[0.11] sm:px-10 sm:text-[12px] lg:px-16 lg:text-[13px]">
            {`// timed evidence session · shared judge
export async function listInvoices(orgId: string) {
  // enforce tenant boundary on every read
  return db.invoice.findMany({
    where: { organizationId: orgId },
  });
}

await deployCheck();
// public 3/3 · hidden harness next`}
          </pre>
          <div className="landing-hero-fade absolute inset-0" />
        </div>

        <header className="relative z-20 mx-auto flex w-full max-w-[1400px] items-center justify-end gap-4 px-4 py-4 safe-top sm:px-10 sm:py-6 lg:px-14">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center text-sm text-[var(--landing-mute)] transition hover:text-[var(--landing-ink)]"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--landing-teal)] transition hover:text-white"
          >
            Start learning
          </Link>
        </header>

        <div className="relative z-20 mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-[1400px] flex-col justify-end px-4 pb-14 pt-6 sm:px-10 sm:pb-20 lg:px-14 lg:pb-24">
          <p className="landing-anim-brand font-serif-display text-[clamp(3.4rem,14vw,8.5rem)] leading-[0.88] tracking-[-0.03em] text-[var(--landing-ink)]">
            Crucible
          </p>
          <h1 className="landing-anim-copy mt-5 max-w-2xl font-serif-display text-[clamp(1.55rem,3.8vw,2.65rem)] leading-[1.15] tracking-[-0.015em] text-[var(--landing-ink)] sm:mt-6">
            Learn the craft. Hire the proof.
          </h1>
          <p className="landing-anim-copy mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--landing-mute)] sm:text-base">
            Timed judges and real production work — one arena for engineers who practice and employers who hire.
          </p>
          <div className="landing-anim-cta mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/register"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cyan-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 sm:w-auto"
            >
              Start learning free
            </Link>
            <Link
              href="/login?intent=hire"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-600/80 px-5 text-sm text-slate-100 transition hover:border-slate-400 sm:w-auto"
            >
              Hire with Crucible
            </Link>
          </div>
        </div>
      </section>

      <section id="paths" className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-14 lg:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--landing-teal)]">For learners</p>
            <h2 className="mt-3 font-serif-display text-3xl text-[var(--landing-ink)]">A place to get better</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--landing-mute)]">
              Daily sessions, a deep problem bank, study plans, and company-style mocks. You learn by shipping under the
              same judges employers trust — then publish a verified profile.
            </p>
            <ul className="mt-6 space-y-2 font-mono text-xs text-white/45">
              <li>1 · Practice timed coding + project missions</li>
              <li>2 · Pass public and hidden judges</li>
              <li>3 · Share evidence employers can open</li>
            </ul>
            <Link
              href="/register"
              className="mt-8 inline-flex min-h-11 items-center font-mono text-sm text-[var(--landing-teal)] transition hover:text-white"
            >
              Create a learner account →
            </Link>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-200/80">For employers</p>
            <h2 className="mt-3 font-serif-display text-3xl text-[var(--landing-ink)]">A floor to test talent</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--landing-mute)]">
              Assign the work you actually care about. Watch candidates build in isolated workspaces, run hidden
              harnesses, and collect scorecards — humans still make the hire call.
            </p>
            <ul className="mt-6 space-y-2 font-mono text-xs text-white/45">
              <li>1 · Create a timed assessment from the bank</li>
              <li>2 · Assign candidates and review evidence</li>
              <li>3 · Qualify with documented human review</li>
            </ul>
            <Link
              href="/login?intent=hire"
              className="mt-8 inline-flex min-h-11 items-center font-mono text-sm text-amber-200/90 transition hover:text-white"
            >
              Enter as hiring team →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-14 sm:px-10 lg:flex-row lg:items-end lg:justify-between lg:px-14">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Shared proof</p>
            <p className="mt-3 max-w-xl font-serif-display text-2xl leading-snug text-[var(--landing-ink)] sm:text-3xl">
              {skills} verified skills · {timed}-minute sessions · human review
            </p>
          </div>
          <Link
            href={`/u/${sampleSlug}`}
            className="font-mono text-sm text-[var(--landing-teal)] transition hover:text-white"
          >
            Open a live qualification profile →
          </Link>
        </div>
        <p className="mx-auto max-w-[1400px] px-6 pb-6 font-mono text-[11px] text-white/25 sm:px-10 lg:px-14">
          {profiles} public {profiles === 1 ? "profile" : "profiles"} published · learners and hiring teams share one
          evidence standard
        </p>
      </section>

      <section className="relative z-10 border-t border-white/[0.06] bg-black/20">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 sm:grid-cols-3 sm:px-10 lg:px-14">
          {[
            {
              t: "Learn under pressure",
              d: "Sixty-minute sessions across SaaS, AppSec, SOC/IR, and secure full-stack — build, break, recover.",
            },
            {
              t: "One judge for both sides",
              d: "Public examples and hidden harnesses in TypeScript, JavaScript, Python, Go, Rust, and Java. Learners train on what employers score.",
            },
            {
              t: "Hire on evidence",
              d: "Shareable qualification pages and scorecards. Résumé claims stay claims until Crucible verifies them.",
            },
          ].map((item) => (
            <div key={item.t}>
              <h2 className="font-serif-display text-xl text-[var(--landing-ink)]">{item.t}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--landing-mute)]">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
