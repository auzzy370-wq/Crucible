export type StudyPlanDef = {
  slug: string;
  title: string;
  subtitle: string;
  company?: string;
  role: string;
  days: number;
  premium: boolean;
  challengeSlugs: string[];
};

/** Curated interview prep paths — progress tracked per user enrollment. */
export const STUDY_PLANS: StudyPlanDef[] = [
  {
    slug: "meta-75",
    title: "Meta 75",
    subtitle: "High-frequency Meta/Facebook patterns — arrays, graphs, and design.",
    company: "Meta",
    role: "Software Engineer",
    days: 21,
    premium: false,
    challengeSlugs: [
      "lc-two-sum",
      "lc-valid-parens",
      "lc-merge-intervals",
      "lc-top-k-frequent",
      "lc-course-schedule",
      "lc-serialize-tree",
      "lc-word-break",
      "lc-min-window",
    ],
  },
  {
    slug: "stripe-2-weeks",
    title: "Stripe · 2 Weeks",
    subtitle: "Payments-minded drills: idempotency, rate limits, caches, and hashing.",
    company: "Stripe",
    role: "Backend Engineer",
    days: 14,
    premium: true,
    challengeSlugs: [
      "lc-idempotent-charge",
      "lc-rate-limiter",
      "lc-lru-cache",
      "lc-two-sum",
      "lc-valid-parens",
      "lc-top-k-frequent",
    ],
  },
  {
    slug: "google-algorithms",
    title: "Google Algorithms",
    subtitle: "Classic Google-flavored interview set with sliding window and graphs.",
    company: "Google",
    role: "Software Engineer",
    days: 28,
    premium: false,
    challengeSlugs: [
      "lc-two-sum",
      "lc-min-window",
      "lc-word-break",
      "lc-merge-intervals",
      "lc-course-schedule",
      "lc-top-k-frequent",
      "lc-serialize-tree",
    ],
  },
  {
    slug: "security-track-sprint",
    title: "Security Track Sprint",
    subtitle: "AppSec-leaning coding + validation problems for security-minded roles.",
    role: "Security Engineer",
    days: 10,
    premium: true,
    challengeSlugs: ["lc-secure-password", "lc-idempotent-charge", "lc-valid-parens", "lc-rate-limiter"],
  },
];

export function getStudyPlan(slug: string) {
  return STUDY_PLANS.find((p) => p.slug === slug) ?? null;
}
