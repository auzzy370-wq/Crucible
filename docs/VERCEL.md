# Deploy Engineering Gauntlet on Vercel

Vercel runs the Next.js control plane. You still need a **hosted Postgres** database (Neon is the simplest free option). Redis is optional (rate limiting fails open). Sandboxed Docker execution is **not** available on Vercel — the app uses `EXECUTION_MODE=process` for demo/testing.

## 1. Create a Neon Postgres database (free)

1. Go to [https://console.neon.tech](https://console.neon.tech) and create a project.
2. Copy the connection string (`DATABASE_URL`). Prefer the **pooled** URL for serverless (`-pooler` host) and append `?sslmode=require` if missing.

## 2. Deploy from your machine

```bash
npm i -g vercel
vercel login
vercel link   # create/link project

vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add SETUP_SECRET
vercel env add AI_FALLBACK_MOCK
vercel env add EXECUTION_MODE
vercel env add NEXT_PUBLIC_APP_URL
# optional: OPENAI_API_KEY, APP_URL
# Do NOT set REDIS_URL to redis://localhost — that hangs login on serverless.
# Only set REDIS_URL to a real hosted Redis (e.g. Upstash) if you need rate limits.

vercel --prod
```

Suggested values:

| Env | Example |
|-----|---------|
| `DATABASE_URL` | Neon pooled connection string |
| `SESSION_SECRET` | long random string |
| `SETUP_SECRET` | long random string (for `/api/setup`) |
| `AI_FALLBACK_MOCK` | `true` |
| `EXECUTION_MODE` | `process` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `APP_URL` | same as above |
| `REDIS_URL` | omit on Vercel, or use Upstash — never localhost |

Add env vars for **Production**, **Preview**, and **Development** as needed. `DATABASE_URL` must also be available at **build** time so `prisma migrate deploy` can run.

## 3. Seed the database once

After the first successful deploy:

```bash
curl -X POST https://YOUR_APP.vercel.app/api/setup \
  -H 'content-type: application/json' \
  -d '{"secret":"YOUR_SETUP_SECRET","seed":true}'
```

Then open `/login` and use:

- `admin@gauntlet.local` / `Gauntlet!Admin1`
- `cyber@gauntlet.local` / `Gauntlet!Cand1`

## 4. Health check

```bash
curl https://YOUR_APP.vercel.app/api/setup
```

## Limits on Vercel (intentional)

- No long-running execution worker / Docker-in-Docker for candidate sandboxes.
- Local `/tmp` storage is ephemeral (workspace file content still lives in Postgres).
- For full isolated grading, run `docker compose` or a dedicated worker host; use Vercel for the UI + API control plane.
