# CRUCIBLE

**Release 1.4** — elite full-stack **software engineering** and **cybersecurity** assessment & qualification platform.

Timed, evidence-based assessments. Candidates design, build, secure, test, deploy, and recover real systems — including AppSec labs, SOC/IR simulations, detection engineering, cloud hardening, and secure full-stack product builds. Résumés claim. **Crucible verifies.**

The seed loads the **full challenge library as published 60-minute assessments** with demo assignments, workspaces, and tests already placed. See [docs/RELEASE.md](docs/RELEASE.md).

## Tracks

Each track ships **≥100 published challenges** (700 total in the expanded library).

| Track | Focus |
|-------|--------|
| Software Engineering | SaaS, APIs, frontend, realtime, distributed systems, performance, architecture, ecommerce, AI SaaS |
| Cybersecurity | AppSec, cloud security, threat modeling, SOC/IR, secure code review, cryptography, zero trust, detection, IAM, vuln triage, purple team, supply chain |
| Secure Full-Stack | Product delivery with elevated security bar |
| Platform / SRE | SLOs, on-call, canaries, DR, capacity, synthetics, change-fail |
| Data / ML Engineering | ETL, CDC, feature stores, model registry, batch/online inference, DQ, lineage |
| Mobile Engineering | Offline sync, push, deep links, attestation, IAP, OTA, mobile perf/a11y |
| Privacy Engineering | Consent, DSAR, retention, DP, purpose limitation, transfers, DPIA |

**Other sectors you could add next:** FinTech / payments risk, Game backend / multiplayer, Embedded / IoT security, Developer tooling / IDE plugins, Healthcare HITRUST-style workflows, Growth / experimentation eng.

Skills on profiles are separated into **claimed**, **portfolio**, **assessment-verified**, and **human-reviewed**. Résumé claims never prove competence.

## Elite scoring (100)

Default engineering weights: Frontend 10 · Backend 15 · Database 10 · Architecture 15 · Infrastructure 10 · Security 10 · Testing 10 · Problem-solving 10 · Performance 5 · Collaboration 5.

Cybersecurity track elevates **security (25)** and **problem-solving (15)**.

Qualification requires ≥90 overall, ≥80% in critical categories, deployment + hidden tests + incident recovery + architecture (+ team when required), no critical vulns, and **human reviewer approval**. AI assists; humans decide.

## Deploy on Vercel (test)

See **[docs/VERCEL.md](docs/VERCEL.md)**. You need a Neon (or other) Postgres `DATABASE_URL`, then:

```bash
vercel login && vercel link
vercel env add DATABASE_URL   # also SESSION_SECRET, SETUP_SECRET, EXECUTION_MODE=process, AI_FALLBACK_MOCK=true, NEXT_PUBLIC_APP_URL
vercel --prod
curl -X POST https://YOUR_APP.vercel.app/api/setup -H 'content-type: application/json' -d '{"secret":"YOUR_SETUP_SECRET","seed":true}'
```

Docker-based candidate isolation is not available on Vercel; use `EXECUTION_MODE=process` for UI/API testing.

## Quick start (local)

```bash
cp .env.example .env
# Start Postgres + Redis (or: docker compose up -d postgres redis minio)
npm install
npx prisma db push
npm run db:seed
npm run release:check
npm run dev          # http://localhost:3847
npm run dev:worker   # optional execution worker
```

Presentation deck: http://localhost:3847/presentation.html  
Speaker script: http://localhost:3847/presentation-script.html


### Docker Compose

```bash
docker compose up --build
```

Compose runs Postgres, Redis, MinIO, web, and worker. **Do not** treat Docker-socket mounts as production isolation — use microVMs/gVisor for hostile workloads.

More detail: [docs/VERCEL.md](docs/VERCEL.md).

## Seed accounts

| Email | Password | Role |
|-------|----------|------|
| admin@gauntlet.local | Gauntlet!Admin1 | Super Admin |
| hiring@gauntlet.local | Gauntlet!Admin1 | Hiring Manager |
| reviewer@gauntlet.local | Gauntlet!Admin1 | Technical Reviewer |
| candidate@gauntlet.local | Gauntlet!Cand1 | Candidate (secure full-stack) |
| cyber@gauntlet.local | Gauntlet!Cand1 | Candidate (cybersecurity) |
| teammate@gauntlet.local | Gauntlet!Cand1 | Team member |
| premium@gauntlet.local | Gauntlet!Cand1 | Candidate (Premium SaaS plan) |

## SaaS prep features

- **Public landing** — `/` converts logged-out visitors; signed-in users go to Operations
- **Daily Challenge** — `/daily` with streak tracking
- **Weekly broken production** — `/weekly` shared incident/SaaS failure for the week
- **Contest Arena** — `/contest` optional heat + leaderboard
- **Editorials** — `/editorials` free + Premium solutions after judge signal
- **Study Plans** — `/study-plans` (Meta 75, Stripe 2 Weeks, Google, Security)
- **Lightning Judge / Debugger / AI autocomplete** — Premium priority queue, interactive debugger, Monaco AI completions
- **Hidden harnesses** — coding Submit runs real hidden fixtures (TS/Python); Python & Go starters included
- **Public qualification profiles** — `/u/casey-elite`, `/u/sam-appsec`, `/u/premium-prep`
- **Employer scorecards** — `/api/scorecards/[assignmentId]` HTML print + `?format=ats` text export
- **Pair / interviewer shadow** — host a code from the IDE; guest joins the same workspace
- **Premium Checkout** — `/pricing` uses Stripe when `STRIPE_SECRET_KEY` is set; otherwise instant mock upgrade
- Webhook: `POST /api/billing/webhook` (set `STRIPE_WEBHOOK_SECRET`)
- Frequency % is labeled **illustrative** (methodology in problemset UI)

## Core workflow

1. Admin/hiring manager creates an assessment from the challenge library (including cyber challenges). Default session length is **60 minutes**.
2. Candidate registers / uses seed account; uploads PDF résumé (claims only).
3. Manager assigns assessment → isolated workspace provisioned with a live countdown.
4. Candidate builds in Monaco IDE, commits, runs sandboxed tests / hidden tests / deploy checks.
5. Submit → evidence-based AI evaluation (no invented test results; mock LLM if no API key).
6. Candidate completes architecture package, incident/SOC simulation, follow-ups, optional team crucible.
7. Human reviewer approves/rejects with documented reasoning.
8. Qualification report + skill lanes updated.

## AI configuration

Set `OPENAI_API_KEY` (and optional `OPENAI_BASE_URL` / `OPENAI_MODEL`). With `AI_FALLBACK_MOCK=true`, grading uses deterministic mock scores when no key is present — fine for demos.

## License

Private / proprietary unless otherwise noted.
