# Engineering Gauntlet — Release 1.0

## What “ready for release” means

- All **19 catalog challenges** published
- Matching **published assessments** for every challenge
- Demo candidates have **assignments + workspaces + starter tests** for the full library
- Scoring policies for SE / Cyber / Secure Full-Stack
- Incident scenarios, architecture packages, and at least one item in the reviewer queue
- Auth, dashboards, IDE, assessments, reviews, teams, incidents, admin surfaces wired

## One-command local release prep

```bash
cp .env.example .env   # set DATABASE_URL (Neon or local Postgres)
npm install
npx prisma migrate deploy
npm run db:seed
npm run release:check
npm run build
npm start              # http://localhost:3847
```

## Seed accounts

| Email | Password | Role |
|-------|----------|------|
| admin@gauntlet.local | Gauntlet!Admin1 | Super Admin |
| hiring@gauntlet.local | Gauntlet!Admin1 | Hiring Manager |
| reviewer@gauntlet.local | Gauntlet!Admin1 | Technical Reviewer |
| candidate@gauntlet.local | Gauntlet!Cand1 | Candidate (SE + Secure Full-Stack library) |
| cyber@gauntlet.local | Gauntlet!Cand1 | Candidate (full Cyber library) |
| teammate@gauntlet.local | Gauntlet!Cand1 | Team member |

## Vercel

1. Set `DATABASE_URL`, `SESSION_SECRET`, `SETUP_SECRET`, `EXECUTION_MODE=process`, `AI_FALLBACK_MOCK=true`
2. **Do not** set `REDIS_URL=localhost`
3. Deploy, then `POST /api/setup` with `{ "secret": "<SETUP_SECRET>", "seed": true }`
4. Disable Deployment Protection if you see `403 FORBIDDEN`
5. See [VERCEL.md](./VERCEL.md)

## Verify

```bash
npm run release:check
curl -s http://localhost:3847/api/setup
```

Expect published challenges ≥ 19, assignments covering the library, and `databaseReachable: true`.
