# ENGINEERING GAUNTLET

Elite full-stack **software engineering** and **cybersecurity** assessment & qualification platform.

This is not a LeetCode clone. Candidates design, build, secure, test, deploy, and recover real systems — including AppSec labs, SOC/IR simulations, detection engineering, cloud hardening, and secure full-stack product builds.

## Tracks

| Track | Focus |
|-------|--------|
| Software Engineering | SaaS, realtime, distributed systems, ecommerce, AI SaaS |
| Cybersecurity | AppSec, cloud security, threat modeling, SOC/IR, secure code review, cryptography, zero trust, detection, IAM, vuln triage |
| Secure Full-Stack | Product delivery with elevated security bar |

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
npm run dev          # http://localhost:3847
npm run dev:worker   # optional execution worker
```

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

## Core workflow

1. Admin/hiring manager creates an assessment from the challenge library (including cyber challenges).
2. Candidate registers / uses seed account; uploads PDF résumé (claims only).
3. Manager assigns assessment → isolated workspace provisioned.
4. Candidate builds in Monaco IDE, commits, runs sandboxed tests / hidden tests / deploy checks.
5. Submit → evidence-based AI evaluation (no invented test results; mock LLM if no API key).
6. Candidate completes architecture package, incident/SOC simulation, follow-ups, optional team gauntlet.
7. Human reviewer approves/rejects with documented reasoning.
8. Qualification report + skill lanes updated.

## AI configuration

Set `OPENAI_API_KEY` and optional `OPENAI_BASE_URL` / `OPENAI_MODEL`. Without a key, `AI_FALLBACK_MOCK=true` uses deterministic evidence-based heuristics. Providers are managed in Admin; keys stay in env vars.

## Execution security

- `EXECUTION_MODE=process` — constrained local fallback for development.
- `EXECUTION_MODE=docker` — disposable containers with CPU/memory/timeouts, dropped caps, no new privileges.
- Candidate code, uploads, and AI instructions are untrusted.
- Production should prefer Firecracker/gVisor; no host credentials or Docker socket inside workloads.

## Tests

```bash
npm run test:unit
npm run dev   # separate terminal
npm run test:e2e
```

## Docs

- `docs/SECURITY.md` — threat model & isolation
- `docs/ARCHITECTURE.md` — system design
- `docs/adr/` — architecture decision records
