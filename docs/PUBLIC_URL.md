# Public site URL

**Live demo tunnel (HTTPS):**

**https://friendship-won-platform-cats.trycloudflare.com**

- Learn hub: `/learn`
- Learn Arcade: `/learn/games`
- Study plans: `/study-plans`
- Mock interviews: `/interview`
- Register any email (not `@crucible.local`) or use a seeded demo account when `DEMO_*` passwords are set locally

Quick tunnels are temporary. Prefer **Cursor Publish** for a stable multi-user URL once confirmed.

Do **not** use expired `*.tmp.now` Vercel links — they lack the real judge stack.

## Agent rules

1. Prefer Cursor Publish for durable access; use `*.trycloudflare.com` for demos.
2. Keep `allowedDevOrigins` including `*.trycloudflare.com` so Next assets load through the tunnel.
3. Set `APP_URL` / `NEXT_PUBLIC_APP_URL` to the active public HTTPS origin so cookies and redirects work.
