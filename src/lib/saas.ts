export const PREMIUM_FEATURES = [
  {
    id: "company-questions",
    title: "Company-Specific Interview Questions",
    blurb:
      "Practice smarter with real questions from top companies. Sort by role, time, or frequency to focus on what matters most for your prep.",
  },
  {
    id: "lightning-judge",
    title: "Lightning Judge",
    blurb:
      "Premium gives you priority judging — up to 10× faster during peak hours — so you can stay ahead in your interview prep.",
  },
  {
    id: "premium-content",
    title: "Access to Premium Content",
    blurb:
      "Gain exclusive access to our ever-growing collection of premium content, such as questions, Explore cards, and premium solutions.",
  },
  {
    id: "autocomplete",
    title: "Autocomplete",
    blurb:
      "Get smart code autocompletion based on your language and code — no memorization needed.",
  },
  {
    id: "debugger",
    title: "Debugger",
    blurb: "Done with print debugging? Set breakpoints and debug interactively in our editor.",
  },
  {
    id: "interview-sims",
    title: "Interview Simulations",
    blurb:
      "Practice under pressure with mock assessments. Choose a company, get a timed question, and test your skills.",
  },
  {
    id: "cloud-storage",
    title: "Cloud Storage",
    blurb:
      "Code and layouts are instantly saved to the cloud, ensuring you can learn across devices at ease.",
  },
  {
    id: "unlimited-playgrounds",
    title: "Unlimited Playgrounds",
    blurb: "No more limits — create unlimited Playgrounds and keep them organized with folders.",
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
