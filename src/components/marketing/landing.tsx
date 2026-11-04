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
        className="landing-anim-ambient pointer-events-none absolute -left-1/4 top-[-10%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(122,243,215,0.14),transparent_68%)] blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[55vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.08),transparent_70%)] blur-3xl"
        aria-hidden
      />

      {/* Full-bleed first viewport — one composition */}
      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <header className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
          <div className="landing-anim-brand flex items-baseline gap-3">
            <span className="font-serif-display text-2xl tracking-tight text-[var(--landing-ink)] sm:text-3xl">
              Crucible
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--landing-teal)] sm:inline">
              Prove the craft
            </span>
          </div>
          <div className="landing-anim-brand flex items-center gap-5" style={{ animationDelay: "0.05s" }}>
            <Link
              href="/login"
              className="text-sm text-[var(--landing-mute)] transition hover:text-[var(--landing-ink)]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-[var(--landing-teal)] transition hover:text-white"
            >
              Start free
            </Link>
          </div>
        </header>

        <main className="relative mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-10 px-6 pb-16 pt-4 sm:px-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8 lg:px-14 lg:pb-20 lg:pt-0">
          <section className="relative z-10 max-w-xl">
            <p className="landing-anim-brand font-mono text-[11px] uppercase tracking-[0.42em] text-[var(--landing-teal)]">
              Crucible
            </p>
            <h1 className="landing-anim-copy mt-5 font-serif-display text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.95] tracking-[-0.02em] text-[var(--landing-ink)]">
              Evidence
              <br />
              <em className="text-[var(--landing-teal)]">over puzzles.</em>
            </h1>
            <p className="landing-anim-copy mt-6 max-w-md text-base leading-relaxed text-[var(--landing-mute)] sm:text-lg">
              Timed engineering and cybersecurity assessments that verify what résumés claim — then let employers trust
              the scorecard.
            </p>
            <div className="landing-anim-cta mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center rounded-md bg-[var(--landing-teal)] px-6 text-sm font-semibold text-[#041016] transition hover:bg-[#a8f7e4]"
              >
                Enter the crucible
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center rounded-md border border-[var(--landing-line)] px-5 text-sm text-[var(--landing-ink)] transition hover:border-white/25"
              >
                View demo accounts
              </Link>
            </div>
          </section>

          {/* Dominant IDE visual plane — not a card collage */}
          <section className="landing-anim-ide relative lg:justify-self-stretch">
            <div className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(122,243,215,0.12),transparent_65%)]" />
            <div className="landing-ide-sheen relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#070b10]/90 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  workspace · evidence session
                </span>
                <span className="ml-auto font-mono text-[11px] text-amber-200/80">41:12</span>
              </div>
              <div className="grid sm:grid-cols-[0.9fr_1.15fr]">
                <aside className="hidden border-r border-white/[0.06] p-4 sm:block">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">Problem</div>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    Isolate tenants on invoice reads. Pass public checks — then survive the hidden cross-tenant harness.
                  </p>
                  <div className="mt-6 space-y-2 font-mono text-[11px] text-white/40">
                    <div>src/invoices/query.ts</div>
                    <div className="text-[var(--landing-teal)]/80">tests/hidden.manifest.json</div>
                    <div>Dockerfile</div>
                  </div>
                </aside>
                <div className="min-h-[280px] p-4 sm:min-h-[360px]">
                  <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/30">
                    <span>src/invoices/query.ts</span>
                    <span>typescript</span>
                  </div>
                  <pre className="overflow-x-auto font-mono text-[12px] leading-[1.65] text-[#c8d6e5] sm:text-[13px]">
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
                    <span className="text-white/35">{"// Lightning Judge · priority queue"}</span>
                    {"\n"}
                    <span className="text-white/30">08</span>
                    {"  "}
                    <span className="landing-cursor-blink text-[var(--landing-teal)]">await deployCheck();</span>
                  </pre>
                  <div className="mt-6 grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5 text-emerald-200/90">
                      public · 3/3 Accepted
                    </div>
                    <div className="border border-rose-400/25 bg-rose-400/[0.06] px-3 py-2.5 text-rose-200/90">
                      hidden · harness failed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Below fold — proof + one purpose sections */}
      <section className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-14 sm:px-10 lg:flex-row lg:items-end lg:justify-between lg:px-14">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Live proof</p>
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
          {profiles} public {profiles === 1 ? "profile" : "profiles"} published · claimed résumé skills never appear
        </p>
      </section>

      <section className="relative z-10 border-t border-white/[0.06] bg-black/20">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 sm:grid-cols-3 sm:px-10 lg:px-14">
          {[
            {
              t: "Timed assessments",
              d: "Sixty minutes. SaaS, AppSec, SOC/IR, secure full-stack — build, break, recover.",
            },
            {
              t: "Judge you can trust",
              d: "Public examples and hidden harnesses. Accepted only when both lanes pass.",
            },
            {
              t: "Verified profiles",
              d: "Shareable qualification pages for employers. Evidence only — never claims.",
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
