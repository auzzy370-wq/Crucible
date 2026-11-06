export const ARCADE_PLAN_SLUG = "learn-arcade";
export const ARCADE_CLEAR_XP = 40;
export const ARCADE_PERFECT_BONUS_XP = 20;
/** First-clear XP for generated drills (keeps 1000 clears from breaking ranks). */
export const ARCADE_DRILL_XP = 2;
export const ARCADE_DRILL_PERFECT_BONUS_XP = 1;
export const ARCADE_TARGET_COUNT = 1000;

export type ArcadeAccent = "teal" | "amber" | "emerald" | "cyan" | "orange";

export type ArcadeEngine =
  | "framework-flow"
  | "big-o-blitz"
  | "pair-seeker"
  | "binary-range"
  | "two-sum"
  | "binary-guess"
  | "complexity-quiz"
  | "sequence-order"
  | "stack-machine"
  | "bit-puzzle"
  | "memory-match"
  | "tap-timing";

export type ArcadeGameDef = {
  slug: string;
  title: string;
  blurb: string;
  minutes: number;
  skill: string;
  accent: ArcadeAccent;
  engine: ArcadeEngine;
  seed: number;
  featured: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
  family: string;
};

type FamilySpec = {
  id: string;
  engine: ArcadeEngine;
  title: string;
  skill: string;
  accent: ArcadeAccent;
  minutes: number;
  blurbs: string[];
};

const DRILL_FAMILIES: FamilySpec[] = [
  {
    id: "two-sum",
    engine: "two-sum",
    title: "Two-Sum Arena",
    skill: "hashing",
    accent: "cyan",
    minutes: 2,
    blurbs: [
      "Pick the pair that hits the target — hash-map thinking under a clock.",
      "Find complements fast. Decoys punish linear scanning habits.",
      "Same two-sum craft, new board every seed.",
    ],
  },
  {
    id: "binary-guess",
    engine: "binary-guess",
    title: "Binary Hunt",
    skill: "binary search",
    accent: "emerald",
    minutes: 2,
    blurbs: [
      "Halve the search space until the secret yields.",
      "Guess high or low — optimal play is log₂ of the range.",
      "Train the binary-search reflex with a fresh secret each run.",
    ],
  },
  {
    id: "complexity-quiz",
    engine: "complexity-quiz",
    title: "Complexity Flash",
    skill: "complexity",
    accent: "amber",
    minutes: 2,
    blurbs: [
      "Name the Big-O before the timer burns the round.",
      "Match approaches to growth rates — speed counts.",
      "Interview-grade complexity drills with seeded prompts.",
    ],
  },
  {
    id: "sequence-order",
    engine: "sequence-order",
    title: "Order the Beats",
    skill: "process",
    accent: "teal",
    minutes: 2,
    blurbs: [
      "Put the interview or algorithm steps in the right order.",
      "Sequence the craft — wrong order fails the clear.",
      "Process fluency under a short clock.",
    ],
  },
  {
    id: "stack-machine",
    engine: "stack-machine",
    title: "Stack Machine",
    skill: "stacks",
    accent: "orange",
    minutes: 2,
    blurbs: [
      "Push and pop to reach the goal stack state.",
      "LIFO discipline — one wrong pop and the machine stalls.",
      "Simulate a stack until the target sequence appears.",
    ],
  },
  {
    id: "bit-puzzle",
    engine: "bit-puzzle",
    title: "Bit Forge",
    skill: "bit tricks",
    accent: "amber",
    minutes: 2,
    blurbs: [
      "Flip bits to match the target mask.",
      "Count, shift, and toggle — bitwise craft in the browser.",
      "Reach the target integer with minimal flips.",
    ],
  },
  {
    id: "memory-match",
    engine: "memory-match",
    title: "Term Match",
    skill: "fundamentals",
    accent: "cyan",
    minutes: 3,
    blurbs: [
      "Match CS terms to definitions before the board closes.",
      "Memory drill for interview vocabulary.",
      "Flip cards, lock pairs, clear the grid.",
    ],
  },
  {
    id: "tap-timing",
    engine: "tap-timing",
    title: "SLO Tap",
    skill: "systems",
    accent: "emerald",
    minutes: 2,
    blurbs: [
      "Tap when latency is under the SLO — miss the spike.",
      "Reliability reflexes: green means ship, red means wait.",
      "Keep the service healthy with timed taps.",
    ],
  },
];

const FEATURED: ArcadeGameDef[] = [
  {
    slug: "framework-flow",
    title: "Framework Flow",
    blurb: "Put the live-coding beats in the right order before the clock runs out.",
    minutes: 2,
    skill: "interview process",
    accent: "teal",
    engine: "framework-flow",
    seed: 1,
    featured: true,
    difficulty: 2,
    family: "featured",
  },
  {
    slug: "big-o-blitz",
    title: "Big-O Blitz",
    blurb: "Match each approach to its time complexity — speed and accuracy both count.",
    minutes: 3,
    skill: "complexity",
    accent: "amber",
    engine: "big-o-blitz",
    seed: 2,
    featured: true,
    difficulty: 3,
    family: "featured",
  },
  {
    slug: "pair-seeker",
    title: "Pair Seeker",
    blurb: "Find two values that sum to the target. Learn why a hash map wins.",
    minutes: 3,
    skill: "hashing",
    accent: "cyan",
    engine: "pair-seeker",
    seed: 3,
    featured: true,
    difficulty: 2,
    family: "featured",
  },
  {
    slug: "binary-range",
    title: "Binary Range",
    blurb: "Guess the secret with binary search — halve the space each move.",
    minutes: 2,
    skill: "binary search",
    accent: "emerald",
    engine: "binary-range",
    seed: 4,
    featured: true,
    difficulty: 2,
    family: "featured",
  },
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildDrillCatalog(count: number): ArcadeGameDef[] {
  const out: ArcadeGameDef[] = [];
  for (let i = 1; i <= count; i++) {
    const family = DRILL_FAMILIES[(i - 1) % DRILL_FAMILIES.length]!;
    const variant = Math.floor((i - 1) / DRILL_FAMILIES.length) + 1;
    const slug = `${family.id}-${String(variant).padStart(3, "0")}`;
    const seed = hashSeed(slug);
    const difficulty = ((variant + family.id.length) % 5) + 1;
    out.push({
      slug,
      title: `${family.title} #${variant}`,
      blurb: family.blurbs[variant % family.blurbs.length]!,
      minutes: family.minutes,
      skill: family.skill,
      accent: family.accent,
      engine: family.engine,
      seed,
      featured: false,
      difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
      family: family.id,
    });
  }
  return out;
}

const DRILL_COUNT = ARCADE_TARGET_COUNT - FEATURED.length;

/** Full arcade catalog — exactly 1000 HTML5 games. */
export const ARCADE_GAMES: ArcadeGameDef[] = [...FEATURED, ...buildDrillCatalog(DRILL_COUNT)];

export const ARCADE_FAMILIES = [
  { id: "featured", label: "Featured craft" },
  ...DRILL_FAMILIES.map((f) => ({ id: f.id, label: f.title })),
];

export const ARCADE_SKILLS = [...new Set(ARCADE_GAMES.map((g) => g.skill))].sort();

if (ARCADE_GAMES.length !== ARCADE_TARGET_COUNT) {
  throw new Error(`Arcade catalog must be ${ARCADE_TARGET_COUNT}, got ${ARCADE_GAMES.length}`);
}

const bySlug = new Map(ARCADE_GAMES.map((g) => [g.slug, g]));

export function getArcadeGame(slug: string) {
  return bySlug.get(slug) ?? null;
}

export function arcadeClearXp(game: ArcadeGameDef, perfect: boolean) {
  if (game.featured) {
    return ARCADE_CLEAR_XP + (perfect ? ARCADE_PERFECT_BONUS_XP : 0);
  }
  return ARCADE_DRILL_XP + (perfect ? ARCADE_DRILL_PERFECT_BONUS_XP : 0);
}

export function arcadeReplayPerfectXp(game: ArcadeGameDef) {
  if (game.featured) return Math.floor(ARCADE_PERFECT_BONUS_XP / 2);
  return ARCADE_DRILL_PERFECT_BONUS_XP;
}

export function listArcadeGames(opts?: {
  q?: string;
  family?: string;
  skill?: string;
  cleared?: "all" | "done" | "open";
  done?: Set<string>;
  page?: number;
  pageSize?: number;
}) {
  const q = opts?.q?.trim().toLowerCase() ?? "";
  const pageSize = Math.min(48, Math.max(12, opts?.pageSize ?? 24));
  const page = Math.max(1, opts?.page ?? 1);
  let rows = ARCADE_GAMES;
  if (opts?.family && opts.family !== "all") {
    rows = rows.filter((g) => g.family === opts.family);
  }
  if (opts?.skill && opts.skill !== "all") {
    rows = rows.filter((g) => g.skill === opts.skill);
  }
  if (q) {
    rows = rows.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.blurb.toLowerCase().includes(q) ||
        g.skill.toLowerCase().includes(q) ||
        g.slug.includes(q),
    );
  }
  if (opts?.cleared && opts.cleared !== "all" && opts.done) {
    rows =
      opts.cleared === "done"
        ? rows.filter((g) => opts.done!.has(g.slug))
        : rows.filter((g) => !opts.done!.has(g.slug));
  }
  const total = rows.length;
  const start = (page - 1) * pageSize;
  return {
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    games: rows.slice(start, start + pageSize),
  };
}
