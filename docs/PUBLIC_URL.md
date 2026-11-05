# Public site URL (canonical)

**Use this URL only — do not mint new Vercel or Cloudflare links for the user.**

## Site

**https://brisk-viola-qnkxoqx.tmp.now**

- App: Crucible  
- AI vs Human: https://brisk-viola-qnkxoqx.tmp.now/ai-vs-human  

## Keep it permanent

Anonymous `*.tmp.now` deploys expire. To lock a stable `*.vercel.app` hostname, claim **this** deployment (same project as `.vercel/anonymous.json`):

https://vercel.com/claim-deployment?code=fa1febd6-897b-4aa7-b9a6-72df44c1db2a

After claiming, if the browser hits 403, disable **Deployment Protection** on the Vercel project (see `docs/VERCEL.md`). Then update this file to the claimed `*.vercel.app` URL and keep using that forever.

## Agent rules

1. Do **not** run fresh anonymous `vercel deploy` that creates another `*.tmp.now` name unless the canonical URL is dead and unclaimable.
2. Do **not** give Cloudflare `trycloudflare.com` tunnels as the primary user link.
3. Prefer redeploying / updating the claimed Vercel project so the hostname stays the same.
