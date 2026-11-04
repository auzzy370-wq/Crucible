import type { AssessmentTrack } from "@prisma/client";
import type { ChallengeSeed } from "./catalog";
import { DIFFICULTY_BLURBS, difficultyBand, difficultyFromIndex } from "./difficulty";

type Family = {
  key: string;
  title: string;
  tags: string[];
  tracks: AssessmentTrack[];
  prompt: (n: number, d: number) => { summary: string; description: string; publicReqs: string[]; hiddenReqs: string[] };
};

const COMPANIES = ["Google", "Meta", "Amazon", "Apple", "Stripe", "Netflix", "Microsoft", "Cloudflare", "Datadog", "OpenAI"];

const FAMILIES: Family[] = [
  {
    key: "two-sum-family",
    title: "Pair Sum Variants",
    tags: ["coding", "array", "hash-table"],
    tracks: ["SOFTWARE_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `Find index pairs that satisfy a sum/constraint variant #${n}.`,
      description: `Implement a pair-sum style problem (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}\n\nReturn correct indices under the stated constraints. Prefer O(n) with a hash map when difficulty ≥ 4.`,
      publicReqs: ["Pass public examples", "Handle duplicates correctly"],
      hiddenReqs: d >= 7 ? ["n≈1e5 under time", "Negatives + overflow-safe"] : ["Hidden edge pairs"],
    }),
  },
  {
    key: "window-family",
    title: "Sliding Window Variants",
    tags: ["coding", "sliding-window", "string", "array"],
    tracks: ["SOFTWARE_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `Sliding-window optimum for variant #${n}.`,
      description: `Maintain a window that optimizes a count/sum/unique constraint (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct window bounds", "Public examples"],
      hiddenReqs: d >= 8 ? ["Unicode-safe", "Pathological repeats"] : ["Empty / single-element"],
    }),
  },
  {
    key: "graph-family",
    title: "Graph Traversal Variants",
    tags: ["coding", "graphs", "bfs", "dfs"],
    tracks: ["SOFTWARE_ENGINEERING", "PLATFORM_SRE"],
    prompt: (n, d) => ({
      summary: `Graph reachability / topo / shortest path variant #${n}.`,
      description: `Operate on an adjacency list (variant ${n}). Detect cycles or compute distances as specified.\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct BFS/DFS or topo", "Public fixtures"],
      hiddenReqs: d >= 9 ? ["1e5 nodes memory-tight", "Disconnected + cycles"] : ["Cycle detection"],
    }),
  },
  {
    key: "dp-family",
    title: "Dynamic Programming Variants",
    tags: ["coding", "dp", "recursion"],
    tracks: ["SOFTWARE_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `DP formulation variant #${n}.`,
      description: `Derive a DP recurrence and implement it (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct recurrence", "Base cases"],
      hiddenReqs: d >= 8 ? ["Memory-optimized", "Large n"] : ["Off-by-one bases"],
    }),
  },
  {
    key: "heap-family",
    title: "Heap / Top-K Variants",
    tags: ["coding", "heap", "sorting"],
    tracks: ["SOFTWARE_ENGINEERING", "DATA_ML"],
    prompt: (n, d) => ({
      summary: `Top-K / streaming heap variant #${n}.`,
      description: `Maintain a heap (or equivalent) for top-K queries (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct top-K", "Stable on ties where required"],
      hiddenReqs: d >= 7 ? ["Streaming updates", "n≈1e6"] : ["K=1 and K=n"],
    }),
  },
  {
    key: "interval-family",
    title: "Interval Scheduling Variants",
    tags: ["coding", "sorting", "greedy", "array"],
    tracks: ["SOFTWARE_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `Merge / schedule intervals variant #${n}.`,
      description: `Sort and sweep intervals (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Merge or schedule correctly", "Public examples"],
      hiddenReqs: d >= 8 ? ["Touching edges", "1e5 intervals"] : ["Empty list"],
    }),
  },
  {
    key: "tree-family",
    title: "Binary Tree Variants",
    tags: ["coding", "trees", "recursion"],
    tracks: ["SOFTWARE_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `Tree serialize / path / LCA-style variant #${n}.`,
      description: `Manipulate binary trees (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct traversal logic", "Public trees"],
      hiddenReqs: d >= 9 ? ["Skewed 1e4 depth iterative", "Null-heavy"] : ["Single node"],
    }),
  },
  {
    key: "string-family",
    title: "String Algorithm Variants",
    tags: ["coding", "strings", "hash-table"],
    tracks: ["SOFTWARE_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `String matching / parsing variant #${n}.`,
      description: `Process strings under the variant ${n} rules.\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct parsing", "Examples"],
      hiddenReqs: d >= 8 ? ["Unicode", "Adversarial repeats"] : ["Empty string"],
    }),
  },
  {
    key: "concurrency-family",
    title: "Concurrency Puzzle Variants",
    tags: ["coding", "concurrency", "idempotency"],
    tracks: ["SOFTWARE_ENGINEERING", "SECURE_FULL_STACK", "PLATFORM_SRE"],
    prompt: (n, d) => ({
      summary: `Concurrency / idempotency puzzle #${n}.`,
      description: `Implement a thread-safe or idempotent API stub (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Functional single-thread path", "Idempotent key behavior"],
      hiddenReqs: d >= 7 ? ["Race harness", "Double-submit"] : ["Duplicate key"],
    }),
  },
  {
    key: "security-coding",
    title: "Secure Coding Variants",
    tags: ["coding", "appsec", "authn", "crypto"],
    tracks: ["CYBERSECURITY", "SECURE_FULL_STACK", "PRIVACY_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `Secure-coding micro-challenge #${n}.`,
      description: `Fix or implement a security-sensitive function (variant ${n}): constant-time compare, parse hardening, or token checks.\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Secure happy path", "Reject malformed input"],
      hiddenReqs: d >= 8 ? ["Timing side-channel lab", "Alg confusion"] : ["Empty / null input"],
    }),
  },
  {
    key: "sql-logic",
    title: "Query Logic Variants",
    tags: ["coding", "transactions", "data-modeling"],
    tracks: ["SOFTWARE_ENGINEERING", "DATA_ML"],
    prompt: (n, d) => ({
      summary: `Data/query logic variant #${n}.`,
      description: `Implement aggregation or transactional logic in-process (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct aggregates", "Examples"],
      hiddenReqs: d >= 7 ? ["Concurrent updates", "Late events"] : ["Empty tables"],
    }),
  },
  {
    key: "rate-limit-family",
    title: "Rate Limit Variants",
    tags: ["coding", "caching", "queues"],
    tracks: ["SOFTWARE_ENGINEERING", "PLATFORM_SRE", "SECURE_FULL_STACK"],
    prompt: (n, d) => ({
      summary: `Rate limiter / token bucket variant #${n}.`,
      description: `Implement rate limiting semantics (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Allow within quota", "Deny over quota"],
      hiddenReqs: d >= 8 ? ["Distributed approximation", "Clock skew"] : ["Burst boundary"],
    }),
  },
  {
    key: "privacy-coding",
    title: "Privacy Logic Variants",
    tags: ["coding", "privacy", "pii"],
    tracks: ["PRIVACY_ENGINEERING", "DATA_ML"],
    prompt: (n, d) => ({
      summary: `Privacy/redaction logic variant #${n}.`,
      description: `Redact, tokenize, or k-threshold aggregate (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Redact configured fields", "Public fixtures"],
      hiddenReqs: d >= 9 ? ["Nested PII", "Re-ID risk"] : ["Missing fields"],
    }),
  },
  {
    key: "mobile-logic",
    title: "Mobile Sync Logic Variants",
    tags: ["coding", "mobile", "concurrency"],
    tracks: ["MOBILE"],
    prompt: (n, d) => ({
      summary: `Offline sync / merge variant #${n}.`,
      description: `Merge offline mutations with conflict rules (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Apply mutations", "Detect conflicts"],
      hiddenReqs: d >= 8 ? ["Clock skew", "Duplicate sync"] : ["Empty queue"],
    }),
  },
  {
    key: "sre-logic",
    title: "SRE Scoring Variants",
    tags: ["coding", "slo", "observability"],
    tracks: ["PLATFORM_SRE"],
    prompt: (n, d) => ({
      summary: `SLO / burn-rate calculation variant #${n}.`,
      description: `Compute SLI/SLO burn from event windows (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct burn math", "Examples"],
      hiddenReqs: d >= 8 ? ["Multi-window", "Late points"] : ["Zero traffic"],
    }),
  },
  {
    key: "bit-family",
    title: "Bit Manipulation Variants",
    tags: ["coding", "bit-manipulation", "math"],
    tracks: ["SOFTWARE_ENGINEERING"],
    prompt: (n, d) => ({
      summary: `Bit-twiddling variant #${n}.`,
      description: `Solve using bit operations where appropriate (variant ${n}).\n\n${DIFFICULTY_BLURBS[difficultyBand(d)]}`,
      publicReqs: ["Correct bits", "Examples"],
      hiddenReqs: d >= 7 ? ["Full 32/64-bit range"] : ["Zero"],
    }),
  },
];

/** Generate thousands of coding questions spanning Easy → Impossible. */
export function buildCodingBulk(count = 4000, existingSlugs: Set<string>): ChallengeSeed[] {
  const out: ChallengeSeed[] = [];
  let i = 0;
  while (out.length < count) {
    const family = FAMILIES[i % FAMILIES.length]!;
    const n = Math.floor(i / FAMILIES.length) + 1;
    const difficulty = difficultyFromIndex(i);
    const track = family.tracks[i % family.tracks.length]!;
    const slug = `q-${family.key}-${n}`;
    i += 1;
    if (existingSlugs.has(slug)) continue;
    existingSlugs.add(slug);
    const body = family.prompt(n, difficulty);
    const band = difficultyBand(difficulty);
    out.push({
      slug,
      title: `${family.title} #${n}`,
      summary: body.summary,
      description: `${body.description}\n\n## Difficulty\n**${band} (D${difficulty}/10)**\n\n## Function\nImplement \`solve(...)\` in \`src/solution.ts\` (or language equivalent). Public tests call your export; hidden tests probe adversarial cases.`,
      type: "CODING_PROBLEM",
      track,
      difficulty,
      estimatedDays: 1,
      tags: [...family.tags, band.toLowerCase(), "question-bank"],
      languages: ["typescript", "javascript", "python", "go", "rust", "java"],
      companies: [COMPANIES[n % COMPANIES.length]!, COMPANIES[(n * 3) % COMPANIES.length]!],
      frequency: Math.max(5, 100 - difficulty * 8 - (n % 17)),
      avgMinutes: difficulty <= 3 ? 15 : difficulty <= 6 ? 25 : difficulty <= 8 ? 40 : difficulty === 9 ? 55 : 75,
      isPremium: difficulty >= 9,
      publicRequirements: body.publicReqs,
      hiddenRequirements: body.hiddenReqs,
      adaptiveTrack: [
        { level: 1, title: "Public examples", criteria: "Public tests green" },
        { level: 2, title: "Hidden edge", criteria: "Hidden harness green" },
        ...(difficulty >= 8
          ? [{ level: 3, title: "Adversarial", criteria: "Perf / abuse cases green" }]
          : []),
      ],
      gradingRubric: {
        backend: "Correctness",
        performance: "Complexity under hidden load",
        testing: "Edge coverage",
        problemSolving: band,
      },
    });
  }
  return out;
}
