# Public site URL (canonical)

**Use this URL — do not mint new Vercel links until the anonymous deploy is claimed.**

## Site (live tunnel → local fixed build)

**https://single-photography-permissions-rouge.trycloudflare.com**

- AI vs Human: https://single-photography-permissions-rouge.trycloudflare.com/ai-vs-human
- Demo login: `candidate@gauntlet.local` / `Gauntlet!Cand1`

The previous anonymous Vercel hostname (`speedy-spinel-q0v72i0.tmp.now`) **cannot be redeployed** until someone claims it (session expired). That deploy is missing the AI judge fix.

## Claim Vercel (permanent)

https://vercel.com/claim-deployment?code=0e18a47b-edec-4a2c-8e01-4a46439e9c19

After claiming, redeploy from this repo, disable Deployment Protection if needed, then replace this file with the stable `*.vercel.app` URL.

## Agent rules

1. Prefer keeping this tunnel URL until Vercel is claimed.
2. Do not mint extra Cloudflare tunnels unless this one dies.
3. AI vs Human must only offer judgable `lc-*` challenges; Two Sum is the default smoke test.
