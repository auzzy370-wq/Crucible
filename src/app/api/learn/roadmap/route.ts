import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";

/**
 * Adaptive practice roadmap from assignment outcomes + knowledge pinpoint gaps.
 * Recommendations get harder as the learner clears Easy/Medium bands.
 */
export async function GET() {
  return withHandler(async () => {
    const user = await requireUser();

    const [assignments, profile] = await Promise.all([
      prisma.assessmentAssignment.findMany({
        where: { candidateId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 80,
        select: {
          status: true,
          currentLevel: true,
          maxLevelReached: true,
          assessment: {
            select: {
              challenge: {
                select: { id: true, slug: true, title: true, difficulty: true, tags: true, type: true },
              },
            },
          },
        },
      }),
      prisma.candidateProfile.findUnique({
        where: { userId: user.id },
        select: { knowledgeMap: true },
      }),
    ]);

    const tagFails = new Map<string, number>();
    const tagWins = new Map<string, number>();
    let solvedEasy = 0;
    let solvedMedium = 0;
    let solvedHard = 0;
    const gaps: string[] = [];

    for (const a of assignments) {
      const c = a.assessment.challenge;
      const done = ["COMPLETED", "UNDER_REVIEW", "SUBMITTED", "GRADING"].includes(a.status);
      const failed = a.status === "FAILED" || a.status === "EXPIRED";
      for (const t of c.tags.filter((x: string) => x !== "coding")) {
        if (done) tagWins.set(t, (tagWins.get(t) ?? 0) + 1);
        if (failed) tagFails.set(t, (tagFails.get(t) ?? 0) + 1);
      }
      if (done) {
        if (c.difficulty <= 3) solvedEasy += 1;
        else if (c.difficulty <= 6) solvedMedium += 1;
        else solvedHard += 1;
      }
    }

    const km = profile?.knowledgeMap as { gaps?: { name?: string }[] } | null;
    if (km?.gaps) {
      for (const g of km.gaps) if (g.name) gaps.push(g.name);
    }

    const weakTags = [...tagFails.entries()]
      .map(([tag, fails]) => ({ tag, fails, wins: tagWins.get(tag) ?? 0 }))
      .filter((t) => t.fails > t.wins)
      .sort((a, b) => b.fails - a.fails)
      .slice(0, 5);

    let targetDifficulty = 2;
    if (solvedEasy >= 5) targetDifficulty = 4;
    if (solvedMedium >= 5) targetDifficulty = 6;
    if (solvedHard >= 3) targetDifficulty = 8;
    if (weakTags.length) targetDifficulty = Math.max(2, targetDifficulty - 1);

    const focusTags = weakTags.map((t) => t.tag);
    const takenIds = assignments.map((a) => a.assessment.challenge.id);
    const nextProblems = await prisma.challenge.findMany({
      where: {
        type: "CODING_PROBLEM",
        isPublished: true,
        difficulty: { gte: targetDifficulty - 1, lte: targetDifficulty + 1 },
        ...(focusTags.length ? { tags: { hasSome: focusTags } } : {}),
        id: { notIn: takenIds.length ? takenIds : ["_none_"] },
      },
      select: { id: true, slug: true, title: true, difficulty: true, tags: true },
      orderBy: [{ frequency: "desc" }, { difficulty: "asc" }],
      take: 8,
    });

    const mastery = {
      easy: solvedEasy,
      medium: solvedMedium,
      hard: solvedHard,
      level:
        solvedHard >= 5 ? "advanced" : solvedMedium >= 8 ? "intermediate" : solvedEasy >= 3 ? "building" : "starter",
    };

    return jsonOk({
      mastery,
      weakTags,
      recurringGaps: [...new Set(gaps)].slice(0, 8),
      targetDifficulty,
      nextProblems,
      skillTree: [
        { id: "arrays", label: "Arrays & hashing", prereq: [], mastery: tagWins.get("arrays") ?? 0 },
        { id: "two-pointers", label: "Two pointers", prereq: ["arrays"], mastery: tagWins.get("two-pointers") ?? 0 },
        { id: "graphs", label: "Graphs", prereq: ["arrays"], mastery: tagWins.get("graphs") ?? 0 },
        { id: "dp", label: "Dynamic programming", prereq: ["arrays", "two-pointers"], mastery: tagWins.get("dp") ?? 0 },
        {
          id: "system-design",
          label: "System design missions",
          prereq: ["graphs"],
          mastery: assignments.filter(
            (a) => a.assessment.challenge.type !== "CODING_PROBLEM" && a.status === "COMPLETED",
          ).length,
        },
      ],
    });
  });
}
