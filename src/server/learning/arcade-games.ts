export const ARCADE_PLAN_SLUG = "learn-arcade";
export const ARCADE_CLEAR_XP = 40;
export const ARCADE_PERFECT_BONUS_XP = 20;

export type ArcadeGameDef = {
  slug: string;
  title: string;
  blurb: string;
  minutes: number;
  skill: string;
  accent: "teal" | "amber" | "emerald" | "cyan";
};

export const ARCADE_GAMES: ArcadeGameDef[] = [
  {
    slug: "framework-flow",
    title: "Framework Flow",
    blurb: "Put the live-coding beats in the right order before the clock runs out.",
    minutes: 2,
    skill: "interview process",
    accent: "teal",
  },
  {
    slug: "big-o-blitz",
    title: "Big-O Blitz",
    blurb: "Match each approach to its time complexity — speed and accuracy both count.",
    minutes: 3,
    skill: "complexity",
    accent: "amber",
  },
  {
    slug: "pair-seeker",
    title: "Pair Seeker",
    blurb: "Find two values that sum to the target. Learn why a hash map wins.",
    minutes: 3,
    skill: "hashing",
    accent: "cyan",
  },
  {
    slug: "binary-range",
    title: "Binary Range",
    blurb: "Guess the secret with binary search — halve the space each move.",
    minutes: 2,
    skill: "binary search",
    accent: "emerald",
  },
];

export function getArcadeGame(slug: string) {
  return ARCADE_GAMES.find((g) => g.slug === slug) ?? null;
}
