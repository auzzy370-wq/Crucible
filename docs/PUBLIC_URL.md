# Public site URL (canonical)

**Use this URL only — do not mint new Vercel or Cloudflare links for the user.**

## Site

**https://speedy-spinel-q0v72i0.tmp.now**

- AI vs Human: https://speedy-spinel-q0v72i0.tmp.now/ai-vs-human

## Keep it permanent

Anonymous `*.tmp.now` deploys expire. Claim **this** deployment to lock a stable hostname:

https://vercel.com/claim-deployment?code=0e18a47b-edec-4a2c-8e01-4a46439e9c19

After claiming, if you get 403, disable **Deployment Protection** (see `docs/VERCEL.md`). Then update this file to the claimed `*.vercel.app` URL and keep using that forever.

## Agent rules

1. Redeploy with `vercel deploy --temporary` from the same anonymous session so the hostname stays put when Vercel allows it.
2. Do **not** give Cloudflare tunnels as the primary user link.
3. If Vercel mints a new `*.tmp.now` because the prior anonymous session expired, update this file once and tell the user — then claim immediately.
