import { prisma } from "@/lib/db";

const SEED_EDITORIALS: {
  challengeSlug: string;
  slug: string;
  title: string;
  approach: string;
  complexity: string;
  bodyMd: string;
  isPremium: boolean;
}[] = [
  {
    challengeSlug: "lc-two-sum",
    slug: "editorial-lc-two-sum",
    title: "Two Sum — hash map editorial",
    approach: "Single-pass complement map",
    complexity: "O(n) time · O(n) space",
    isPremium: false,
    bodyMd: `## Intuition
For each value \`x\`, ask whether \`target - x\` was already seen. Store \`value → index\` as you scan.

## Pitfalls
- Do not reuse the same index.
- Negatives and zeros are valid.
- Prefer the hash map over nested loops when n grows.

## Reference sketch
\`\`\`ts
const seen = new Map<number, number>();
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i]!;
  if (seen.has(need)) return [seen.get(need)!, i];
  seen.set(nums[i]!, i);
}
\`\`\`
`,
  },
  {
    challengeSlug: "lc-lru-cache",
    slug: "editorial-lc-lru-cache",
    title: "LRU Cache — map + doubly linked list",
    approach: "O(1) get/put via hash map + DLL",
    complexity: "O(1) amortized per op",
    isPremium: true,
    bodyMd: `## Intuition
A hash map gives O(1) lookup; a doubly linked list orders recency. Move nodes to the head on access; evict from the tail when over capacity.

## Premium deep-dive
Wire sentinel head/tail nodes to avoid null edge cases. Overwrite must refresh recency. Capacity 1 is a common trap.

Judge signal first: pass public + hidden harness before studying this editorial as a shortcut.
`,
  },
  {
    challengeSlug: "lc-idempotent-charge",
    slug: "editorial-lc-idempotent-charge",
    title: "Idempotent charge — intent ledger",
    approach: "Persist intentId → charged amount",
    complexity: "O(1) per call with map/store",
    isPremium: true,
    bodyMd: `## Production lesson
Retries are not bugs — they are the network. Key every charge by \`intentId\` and return \`duplicate\` when the ledger already holds it.

## Evidence bar
Hidden cases interleave intents and retry storms. A correct solution keeps \`totalCharged\` monotonic and never double-books.
`,
  },
];

export async function seedEditorials() {
  for (const ed of SEED_EDITORIALS) {
    const challenge = await prisma.challenge.findUnique({ where: { slug: ed.challengeSlug } });
    if (!challenge) continue;
    await prisma.editorial.upsert({
      where: { slug: ed.slug },
      update: {
        title: ed.title,
        bodyMd: ed.bodyMd,
        approach: ed.approach,
        complexity: ed.complexity,
        isPremium: ed.isPremium,
        published: true,
        challengeId: challenge.id,
      },
      create: {
        slug: ed.slug,
        challengeId: challenge.id,
        title: ed.title,
        bodyMd: ed.bodyMd,
        approach: ed.approach,
        complexity: ed.complexity,
        isPremium: ed.isPremium,
        published: true,
      },
    });
  }
}

export async function listEditorials(_opts?: { premium?: boolean }) {
  return prisma.editorial.findMany({
    where: { published: true },
    include: { challenge: { select: { slug: true, title: true, isPremium: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
