# CRUCIBLE

**Release 1.4** — **Learn the craft. Hire the proof.**

Crucible is both a **learning arena** and an **employer testing floor**. Engineers practice with timed judges and production missions; hiring managers assign that same work to screen candidates. Coding judges in **TypeScript, JavaScript, Python, Go, Rust, and Java** (public + hidden). Résumés claim. **Crucible verifies.**

The seed loads the **full challenge library as published 60-minute assessments** with demo assignments, workspaces, and tests already placed. See [docs/RELEASE.md](docs/RELEASE.md).

## Tracks

Each track ships **≥250 project missions** plus a shared **4,000-question coding bank** scaling **Easy → Impossible**, with post-test **knowledge pinpoint** (exactly which skills were proven vs gaps).

### Core
| Track | Focus |
|-------|--------|
| Software Engineering | SaaS, APIs, frontend, realtime, distributed systems, performance, architecture |
| Cybersecurity | AppSec, threat modeling, SOC/IR, crypto, zero trust, detection, IAM, vuln triage |
| Secure Full-Stack | Product delivery with elevated security bar |
| Platform / SRE | SLOs, on-call, canaries, DR, capacity, synthetics |
| Data / ML Engineering | ETL, CDC, feature stores, model registry, DQ, lineage |
| Mobile Engineering | Offline sync, push, deep links, attestation, IAP, OTA |
| Privacy Engineering | Consent, DSAR, retention, DP, purpose limitation, transfers, DPIA |

### Industry
| Track | Focus |
|-------|--------|
| FinTech / Payments | Ledgers, idempotent charges, fraud, wallets, settlement, KYC |
| Healthcare / HITRUST | PHI vaults, FHIR-lite, e-prescribe, BAAs, telehealth tokens |
| Game Backend | Matchmaking, authoritative sim, anti-cheat, economy, replays |
| Embedded / IoT | Signed OTA, attestation, fleet config, MQTT ACL, power budgets |
| EdTech | LMS roster, autograde sandboxes, FERPA export, quiz banks |
| Logistics / Supply Chain | Routing, ASN, POD, cold chain, dock scheduling |
| Climate / Energy Tech | Grid telemetry, carbon ledger, demand response, MRV packs |
| RegTech / LegalTech | Policy-as-code, SAR workflow, legal hold, trade surveillance |

### Platform & systems
| Track | Focus |
|-------|--------|
| Developer Tooling | LSP, CI plugins, sandboxes, codegen, test-impact |
| Design Systems / Frontend Platform | Tokens, a11y kits, visual regression, living docs |
| Growth / Experimentation | Bucketing, exposures, guardrails, funnels, paywalls |
| Search / Recommendations | Indexes, ranking features, typeahead, safe search |
| Support Platform Engineering | Ticket routing, macros, CSAT, KB search, SLA breach |
| AI / MLOps Product | Model registry, feature store, RAG eval, prompt firewall |
| Database Engineering | Buffer pool, WAL, MVCC, planners, sharding |
| Networking / Edge | CDN keys, DNS failover, LB algos, WAF, anycast |
| Cloud / Infra Security | IAM least-privilege, image gates, K8s hardening, OIDC |
| QA / Reliability Engineering | Flake quarantine, contracts, chaos gamedays, synthetics |
| Compilers / Language Tooling | Lexer/parser, typecheck, IR, bytecode VM, formatters |
| Blockchain / Web3 | Wallet policy, vesting, bridges, indexers, multisig |

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
- **Settings** — `/settings` account, practice preferences (headline, bio, skills, links), privacy/public slug, password, and session revoke (staff see account/security/sessions only)
- **Hiring analytics** — `/analytics` for Super Admin, Hiring Manager, and Technical Reviewer
- **Admin control plane** — `/admin` (Super Admin) overview, analytics, users/roles/plans, assignments, challenge library publish/premium, execution drain/retry, AI providers, audit log, system posture
- **Role visibility** — nav and page guards limit each role to surfaces they can use (candidates ↔ practice; hiring ↔ ops/reviews/analytics; Super Admin ↔ control plane)

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
