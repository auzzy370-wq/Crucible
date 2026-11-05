export const PREMIUM_FEATURES = [
  {
    id: "company-questions",
    title: "Company-tagged evidence sessions",
    blurb:
      "Prioritize timed sessions by company tags, frequency, and time — craft practice that maps to what teams actually ask.",
  },
  {
    id: "lightning-judge",
    title: "Lightning Judge",
    blurb:
      "Priority public + hidden judging so your evidence loop stays fast when the queue is busy.",
  },
  {
    id: "premium-content",
    title: "Premium craft content",
    blurb:
      "Exclusive missions, deeper editorials, and premium harness packs — after the judge signal is solid.",
  },
  {
    id: "autocomplete",
    title: "Autocomplete",
    blurb: "Language-aware completion in the evidence IDE — speed without hiding ownership of the craft.",
  },
  {
    id: "debugger",
    title: "Debugger",
    blurb: "Breakpoints and interactive debug in the workspace — not just print statements.",
  },
  {
    id: "interview-sims",
    title: "Timed company sessions",
    blurb:
      "Company-tagged timed workspaces with the same public + hidden judge bar as assessments.",
  },
  {
    id: "cloud-storage",
    title: "Cloud Storage",
    blurb: "Code and layouts save to the cloud so evidence sessions continue across devices.",
  },
  {
    id: "unlimited-playgrounds",
    title: "Unlimited Playgrounds",
    blurb: "Create unlimited playgrounds and keep them organized with folders.",
  },
] as const;

export const FREE_PLAYGROUND_LIMIT = 3;

export const PLAN_PRICING = {
  monthly: 35,
  yearly: 159,
} as const;

export const COMPANIES = [
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Microsoft",
  "Stripe",
  "Netflix",
  "Uber",
  "Cloudflare",
  "Bloomberg",
  "LinkedIn",
  "Shopify",
] as const;
