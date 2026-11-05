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
      <div className="landing-noise pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="landing-anim-ambient pointer-events-none absolute -left-1/4 top-[-10%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_68%)] blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[55vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.08),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <header className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-4 safe-top sm:px-10 sm:py-6 lg:px-14">
          <div className="landing-anim-brand flex min-w-0 items-baseline gap-2 sm:gap-3">
            <span className="font-serif-display text-xl tracking-tight text-[var(--landing-ink)] sm:text-3xl">
              Crucible
            </span>
            <span className="truncate font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--landing-teal)] sm:text-[10px] sm:tracking-[0.28em]">
              Learn · Hire
            </span>
          </div>
          <div
            className="landing-anim-brand flex shrink-0 items-center gap-3 sm:gap-5"
            style={{ animationDelay: "0.05s" }}
          >
            <Link
              href="/login?intent=hire"
              className="hidden min-h-10 items-center px-1 text-sm text-[var(--landing-mute)] transition hover:text-[var(--landing-ink)] sm:inline-flex"
            >
              For employers
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center px-1 text-sm text-[var(--landing-mute)] transition hover:text-[var(--landing-ink)]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-10 items-center rounded-md border border-cyan-400/30 px-3 text-sm font-medium text-[var(--landing-teal)] transition hover:border-cyan-300/50 hover:text-white sm:border-0 sm:px-0"
            >
              Start learning
            </Link>
          </div>
        </header>

        <main className="relative mx-auto grid w-full max-w-[1400px] min-w-0 flex-1 items-center gap-8 px-4 pb-12 pt-2 sm:gap-10 sm:px-10 sm:pb-16 sm:pt-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8 lg:px-14 lg:pb-20 lg:pt-0">
          <section className="relative z-10 w-full min-w-0 max-w-xl">
            <p className="landing-anim-brand font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--landing-teal)] sm:tracking-[0.42em]">
              Crucible
            </p>
            <h1 className="landing-anim-copy mt-4 break-words font-serif-display text-[clamp(2.2rem,8.5vw,4.85rem)] leading-[0.95] tracking-[-0.02em] text-[var(--landing-ink)] sm:mt-5">
              Learn the craft.
              <br />
              <em className="text-[var(--landing-teal)]">Hire the proof.</em>
            </h1>
            <p className="landing-anim-copy mt-5 max-w-md text-[15px] leading-relaxed text-[var(--landing-mute)] sm:mt-6 sm:text-lg">
              Engineers practice with timed judges and real production work. Employers use the same arena to test who
              can actually ship.
            </p>
            <div className="landing-anim-cta mt-7 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cyan-400 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 sm:w-auto"
              >
                Start learning free
              </Link>
              <Link
                href="/login?intent=hire"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-700 px-5 text-sm text-slate-100 transition hover:border-slate-500 sm:w-auto"
              >
                Hire with Crucible
              </Link>
            </div>
          </section>

          <section className="landing-anim-ide relative min-w-0 w-full lg:justify-self-stretch">
            <div className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.12),transparent_65%)]" />
            <div className="landing-ide-sheen relative overflow-hidden rounded-xl border border-cyan-400/20 bg-[#070b12]/95 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm">
              <div className="flex min-w-0 items-center gap-2 border-b border-slate-800/80 px-4 py-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-600" />
                <span className="ml-2 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:ml-3 sm:tracking-[0.22em]">
                  learn · timed evidence session
                </span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-amber-300/90">41:12</span>
              </div>
              <div className="grid min-w-0 sm:grid-cols-[0.9fr_1.15fr]">
                <aside className="hidden border-r border-white/[0.06] p-4 sm:block">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">Lesson in production</div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    Isolate tenants on invoice reads. Pass the public checks — then survive the hidden cross-tenant
                    harness employers also run.
                  </p>
                  <div className="mt-6 space-y-2 font-mono text-[11px] text-white/40">
                    <div>src/invoices/query.ts</div>
                    <div className="text-[var(--landing-teal)]/80">tests/hidden.manifest.json</div>
                    <div>Dockerfile</div>
                  </div>
                </aside>
                <div className="min-h-[280px] min-w-0 p-4 sm:min-h-[360px]">
                  <div className="mb-3 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-white/30">
                    <span className="truncate">src/invoices/query.ts</span>
                    <span className="shrink-0">typescript</span>
                  </div>
                  <pre className="max-w-full overflow-x-auto font-mono text-[12px] leading-[1.65] text-[#c8d6e5] sm:text-[13px]">
                    <span className="text-white/30">01</span>
                    {"  "}
                    <span className="text-sky-300/90">export async function</span>
                    {" listInvoices(orgId: "}
                    <span className="text-amber-200/80">string</span>
                    {") {\n"}
                    <span className="text-white/30">02</span>
                    {"    "}
                    <span className="text-white/35">{"// enforce tenant boundary on every read"}</span>
                    {"\n"}
                    <span className="text-white/30">03</span>
                    {"    "}
                    <span className="text-[var(--landing-teal)]/80">return</span>
                    {" db.invoice.findMany({\n"}
                    <span className="text-white/30">04</span>
                    {"      where: { organizationId: orgId },\n"}
                    <span className="text-white/30">05</span>
                    {"    });\n"}
                    <span className="text-white/30">06</span>
                    {"  }\n\n"}
                    <span className="text-white/30">07</span>
                    {"  "}
                    <span className="text-white/35">{"// same judge learners and hiring teams share"}</span>
                    {"\n"}
                    <span className="text-white/30">08</span>
                    {"  "}
                    <span className="landing-cursor-blink text-[var(--landing-teal)]">await deployCheck();</span>
                  </pre>
                  <div className="mt-6 grid grid-cols-1 gap-2 font-mono text-[11px] sm:grid-cols-2">
                    <div className="border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-emerald-200">
                      public · 3/3 Accepted
                    </div>
                    <div className="border border-rose-500/25 bg-rose-500/5 px-3 py-2.5 text-rose-200">
                      hidden · harness failed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

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
