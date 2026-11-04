/**
 * Release readiness gate for CRUCIBLE.
 * Run after seed: npx tsx scripts/release-check.ts
 */
import { PrismaClient } from "@prisma/client";
import { CHALLENGE_CATALOG } from "../src/server/challenges/catalog";

const prisma = new PrismaClient();

async function main() {
  const catalog = CHALLENGE_CATALOG.length;
  const [
    challenges,
    assessments,
    assignments,
    workspaces,
    files,
    users,
    policies,
    incidents,
    architecture,
    underReview,
  ] = await Promise.all([
    prisma.challenge.count({ where: { isPublished: true } }),
    prisma.assessment.count({ where: { status: "PUBLISHED" } }),
    prisma.assessmentAssignment.count(),
    prisma.workspace.count(),
    prisma.workspaceFile.count(),
    prisma.user.count(),
    prisma.scoringPolicy.count(),
    prisma.incidentScenario.count(),
    prisma.architectureSubmission.count(),
    prisma.assessmentAssignment.count({ where: { status: "UNDER_REVIEW" } }),
  ]);

  const wsWithoutFiles = await prisma.workspace.count({
    where: { files: { none: {} } },
  });
  const assignsWithoutWs = await prisma.assessmentAssignment.count({
    where: { workspace: null },
  });

  const timedAssessments = await prisma.assessment.count({
    where: { status: "PUBLISHED", timedMinutes: { equals: 60 } },
  });

  const checks: { name: string; ok: boolean; detail: string }[] = [
    {
      name: "catalog_challenges_published",
      ok: challenges >= catalog,
      detail: `${challenges}/${catalog}`,
    },
    {
      name: "published_assessments_cover_catalog",
      ok: assessments >= catalog,
      detail: `${assessments} published (need ≥ ${catalog})`,
    },
    {
      name: "sixty_minute_timed_assessments",
      ok: timedAssessments >= catalog,
      detail: `${timedAssessments}/${catalog} with timedMinutes=60`,
    },
    {
      name: "assignments_for_full_library",
      ok: assignments >= catalog,
      detail: `${assignments} assignments (need ≥ ${catalog})`,
    },
    {
      name: "workspaces_match_assignments",
      ok: workspaces >= assignments && assignsWithoutWs === 0,
      detail: `${workspaces} workspaces, ${assignsWithoutWs} assignments missing workspace`,
    },
    {
      name: "workspace_files_present",
      ok: files > 0 && wsWithoutFiles === 0,
      detail: `${files} files, ${wsWithoutFiles} empty workspaces`,
    },
    { name: "demo_users", ok: users >= 6, detail: `${users} users` },
    { name: "scoring_policies", ok: policies >= 3, detail: `${policies} policies` },
    { name: "incident_scenarios", ok: incidents >= 2, detail: `${incidents} scenarios` },
    { name: "architecture_seed", ok: architecture >= 1, detail: `${architecture} packages` },
    { name: "reviewer_queue", ok: underReview >= 1, detail: `${underReview} under review` },
  ];

  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`);
  }

  if (failed.length) {
    console.error(`\nRelease check FAILED (${failed.length} gates). Re-run seed: npm run db:seed`);
    process.exit(1);
  }

  console.log("\nRelease check PASSED — platform is fully seeded and ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
