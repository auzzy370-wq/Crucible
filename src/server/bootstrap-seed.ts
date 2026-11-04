import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { CHALLENGE_CATALOG } from "@/server/challenges/catalog";
import {
  DEFAULT_WEIGHTS,
  CYBERSECURITY_WEIGHTS,
  SECURE_FULL_STACK_WEIGHTS,
} from "@/server/scoring/policy";
import { createWorkspaceForAssignment } from "@/server/execution/workspace";
import { createTeam } from "@/server/teams/service";

export async function seedDatabase() {
  console.log("Seeding CRUCIBLE…");

  // Cost 8 — bcryptjs at 12 often exceeds Vercel serverless login budgets.
  const passwordHash = await bcrypt.hash("Gauntlet!Admin1", 8);
  const candidateHash = await bcrypt.hash("Gauntlet!Cand1", 8);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gauntlet.local" },
    update: { passwordHash },
    create: {
      email: "admin@gauntlet.local",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  const hiring = await prisma.user.upsert({
    where: { email: "hiring@gauntlet.local" },
    update: { passwordHash },
    create: {
      email: "hiring@gauntlet.local",
      name: "Harper Manager",
      role: "HIRING_MANAGER",
      passwordHash,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@gauntlet.local" },
    update: { passwordHash },
    create: {
      email: "reviewer@gauntlet.local",
      name: "Riley Reviewer",
      role: "TECHNICAL_REVIEWER",
      passwordHash,
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: "candidate@gauntlet.local" },
    update: { passwordHash: candidateHash, plan: "FREE" },
    create: {
      email: "candidate@gauntlet.local",
      name: "Casey Candidate",
      role: "CANDIDATE",
      plan: "FREE",
      passwordHash: candidateHash,
      githubLogin: "casey-candidate",
      candidateProfile: {
        create: {
          headline: "Full-stack engineer exploring elite qualification",
          bio: "Built multi-tenant SaaS and hardened APIs. Claims require assessment verification.",
          portfolioUrl: "https://example.com/casey",
          githubUrl: "https://github.com/example/casey",
          yearsExperience: 6,
          languages: ["typescript", "python", "go"],
          frameworks: ["nextjs", "fastapi"],
          databases: ["postgresql", "redis"],
          cloud: ["aws"],
          infrastructure: ["docker", "kubernetes"],
          aiExperience: ["openai-api"],
          cybersecurity: ["appsec", "owasp"],
          preferredTrack: "SECURE_FULL_STACK",
          previousEmployers: [{ company: "Example Corp", title: "Senior Engineer", years: 3 }],
        },
      },
    },
    include: { candidateProfile: true },
  });

  const premiumCandidate = await prisma.user.upsert({
    where: { email: "premium@gauntlet.local" },
    update: {
      passwordHash: candidateHash,
      plan: "PREMIUM",
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    create: {
      email: "premium@gauntlet.local",
      name: "Parker Premium",
      role: "CANDIDATE",
      plan: "PREMIUM",
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      passwordHash: candidateHash,
      candidateProfile: {
        create: {
          headline: "Premium Crucible member",
          preferredTrack: "SOFTWARE_ENGINEERING",
          yearsExperience: 4,
          languages: ["typescript", "python"],
        },
      },
    },
  });

  const cyberCandidate = await prisma.user.upsert({
    where: { email: "cyber@gauntlet.local" },
    update: { passwordHash: candidateHash },
    create: {
      email: "cyber@gauntlet.local",
      name: "Sam Security",
      role: "CANDIDATE",
      passwordHash: candidateHash,
      candidateProfile: {
        create: {
          headline: "Application security & detection engineering",
          preferredTrack: "CYBERSECURITY",
          cybersecurity: ["appsec", "detection-engineering", "incident-response", "iam"],
          languages: ["python", "go", "typescript"],
          cloud: ["aws", "gcp"],
          infrastructure: ["terraform", "kubernetes"],
          yearsExperience: 5,
        },
      },
    },
  });

  const teammate = await prisma.user.upsert({
    where: { email: "teammate@gauntlet.local" },
    update: { passwordHash: candidateHash },
    create: {
      email: "teammate@gauntlet.local",
      name: "Taylor Teammate",
      role: "TEAM_MEMBER",
      passwordHash: candidateHash,
      candidateProfile: { create: { headline: "Collaborative engineer", preferredTrack: "SOFTWARE_ENGINEERING" } },
    },
  });

  if (candidate.candidateProfile) {
    await prisma.skillRecord.upsert({
      where: {
        profileId_name_source: {
          profileId: candidate.candidateProfile.id,
          name: "typescript",
          source: "CLAIMED",
        },
      },
      create: {
        profileId: candidate.candidateProfile.id,
        name: "typescript",
        domain: "languages",
        source: "CLAIMED",
        confidence: 0.3,
        evidence: "Self-reported / résumé claim — not verified",
      },
      update: {},
    });
  }

  const engPolicy = await prisma.scoringPolicy.upsert({
    where: { id: "policy-eng-elite" },
    update: { weights: DEFAULT_WEIGHTS },
    create: {
      id: "policy-eng-elite",
      name: "Software Engineering Elite Policy",
      weights: DEFAULT_WEIGHTS,
      minOverall: 90,
      minCategoryPct: 80,
    },
  });

  const cyberPolicy = await prisma.scoringPolicy.upsert({
    where: { id: "policy-cyber-elite" },
    update: { weights: CYBERSECURITY_WEIGHTS },
    create: {
      id: "policy-cyber-elite",
      name: "Cybersecurity Elite Policy",
      weights: CYBERSECURITY_WEIGHTS,
      requireTeam: false,
      minOverall: 90,
      minCategoryPct: 80,
    },
  });

  const securePolicy = await prisma.scoringPolicy.upsert({
    where: { id: "policy-secure-elite" },
    update: { weights: SECURE_FULL_STACK_WEIGHTS },
    create: {
      id: "policy-secure-elite",
      name: "Secure Full-Stack Elite Policy",
      weights: SECURE_FULL_STACK_WEIGHTS,
      minOverall: 90,
      minCategoryPct: 80,
    },
  });

  for (const c of CHALLENGE_CATALOG) {
    await prisma.challenge.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        summary: c.summary,
        description: c.description,
        type: c.type,
        track: c.track,
        difficulty: c.difficulty,
        estimatedDays: c.estimatedDays,
        tags: c.tags,
        languages: c.languages,
        companies: c.companies ?? [],
        frequency: c.frequency ?? 0,
        avgMinutes: c.avgMinutes ?? (c.type === "CODING_PROBLEM" ? 30 : 60),
        isPremium: c.isPremium ?? false,
        publicRequirements: c.publicRequirements,
        hiddenRequirements: c.hiddenRequirements,
        adaptiveTrack: c.adaptiveTrack,
        gradingRubric: c.gradingRubric,
        mitreMappings: c.mitreMappings ?? [],
        owaspMappings: c.owaspMappings ?? [],
        controlledVulns: c.controlledVulns ?? undefined,
        isPublished: true,
      },
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: c.description,
        type: c.type,
        track: c.track,
        difficulty: c.difficulty,
        estimatedDays: c.estimatedDays,
        tags: c.tags,
        languages: c.languages,
        companies: c.companies ?? [],
        frequency: c.frequency ?? 0,
        avgMinutes: c.avgMinutes ?? (c.type === "CODING_PROBLEM" ? 30 : 60),
        isPremium: c.isPremium ?? false,
        publicRequirements: c.publicRequirements,
        hiddenRequirements: c.hiddenRequirements,
        adaptiveTrack: c.adaptiveTrack,
        gradingRubric: c.gradingRubric,
        mitreMappings: c.mitreMappings ?? [],
        owaspMappings: c.owaspMappings ?? [],
        controlledVulns: c.controlledVulns ?? undefined,
        isPublished: true,
      },
    });
  }

  const saas = await prisma.challenge.findUniqueOrThrow({ where: { slug: "saas-nexus" } });
  const appsec = await prisma.challenge.findUniqueOrThrow({ where: { slug: "appsec-fortress" } });
  const soc = await prisma.challenge.findUniqueOrThrow({ where: { slug: "soc-nightwatch" } });
  const teamChallenge = await prisma.challenge.findUniqueOrThrow({ where: { slug: "team-forge" } });

  const DEFAULT_TIMED_MINUTES = 60;

  const assessmentSaas = await prisma.assessment.upsert({
    where: { id: "assess-saas-1" },
    update: { timedMinutes: DEFAULT_TIMED_MINUTES, status: "PUBLISHED" },
    create: {
      id: "assess-saas-1",
      title: "Elite SaaS Build — Nexus",
      description: "Individual full-stack SaaS assessment with adaptive difficulty. Timed 60-minute session.",
      challengeId: saas.id,
      track: "SOFTWARE_ENGINEERING",
      status: "PUBLISHED",
      timedMinutes: DEFAULT_TIMED_MINUTES,
      multiDay: false,
      progressiveDiff: true,
      createdById: hiring.id,
      scoringPolicyId: engPolicy.id,
    },
  });

  const assessmentCyber = await prisma.assessment.upsert({
    where: { id: "assess-cyber-1" },
    update: { timedMinutes: DEFAULT_TIMED_MINUTES, status: "PUBLISHED" },
    create: {
      id: "assess-cyber-1",
      title: "AppSec Fortress Qualification",
      description: "Cybersecurity track — controlled vulnerability lab with fix + regression requirements. Timed 60 minutes.",
      challengeId: appsec.id,
      track: "CYBERSECURITY",
      status: "PUBLISHED",
      timedMinutes: DEFAULT_TIMED_MINUTES,
      multiDay: false,
      progressiveDiff: true,
      allowTeam: false,
      createdById: hiring.id,
      scoringPolicyId: cyberPolicy.id,
    },
  });

  await prisma.assessment.upsert({
    where: { id: "assess-soc-1" },
    update: { timedMinutes: DEFAULT_TIMED_MINUTES, status: "PUBLISHED" },
    create: {
      id: "assess-soc-1",
      title: "SOC Nightwatch IR Simulation",
      description: "Incident response and detection engineering simulation. Timed 60-minute IR window.",
      challengeId: soc.id,
      track: "CYBERSECURITY",
      status: "PUBLISHED",
      timedMinutes: DEFAULT_TIMED_MINUTES,
      multiDay: false,
      createdById: hiring.id,
      scoringPolicyId: cyberPolicy.id,
    },
  });

  const assessmentTeam = await prisma.assessment.upsert({
    where: { id: "assess-team-1" },
    update: { timedMinutes: DEFAULT_TIMED_MINUTES, status: "PUBLISHED" },
    create: {
      id: "assess-team-1",
      title: "Team Forge Collaborative Delivery",
      description: "2–4 engineers, shared ownership, integration quality. Timed collaborative session.",
      challengeId: teamChallenge.id,
      track: "SECURE_FULL_STACK",
      status: "PUBLISHED",
      timedMinutes: DEFAULT_TIMED_MINUTES,
      multiDay: false,
      allowTeam: true,
      teamSizeMin: 2,
      teamSizeMax: 4,
      createdById: hiring.id,
      scoringPolicyId: securePolicy.id,
    },
  });

  await prisma.incidentScenario.upsert({
    where: { slug: "checkout-dup-payments" },
    update: {},
    create: {
      slug: "checkout-dup-payments",
      title: "Duplicate checkout charges under queue retry",
      synopsis: "Customers report double charges after payment provider timeouts.",
      symptoms: ["elevated 500s", "queue retries", "webhook storms"],
      rootCause: "Non-idempotent payment intent creation combined with at-least-once queue delivery.",
      buggyFiles: [{ path: "src/payments/charge.ts", issue: "missing idempotency key" }],
    },
  });

  await prisma.incidentScenario.upsert({
    where: { slug: "token-exfil-beacon" },
    update: {},
    create: {
      slug: "token-exfil-beacon",
      title: "Service token exfiltration + DNS beacon",
      synopsis: "SOC alerts show billing service token used from unfamiliar ASN with DNS spikes.",
      symptoms: ["impossible travel", "dns volume", "new ASN token use"],
      rootCause: "Compromised CI secret written to debug logs and harvested by attacker.",
      buggyFiles: [{ path: "ci/deploy.sh", issue: "echo of secret env" }],
      challengeId: soc.id,
    },
  });

  await prisma.aiProviderConfig.upsert({
    where: { id: "ai-default" },
    update: {},
    create: {
      id: "ai-default",
      name: "OpenAI-compatible default",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      apiKeyEnv: "OPENAI_API_KEY",
      isDefault: true,
      enabled: true,
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: "retention_days" },
    update: { value: { candidateDataDays: 365, auditDays: 2555 } },
    create: { key: "retention_days", value: { candidateDataDays: 365, auditDays: 2555 } },
  });

  // —— Ready-to-use assignments + workspaces (tests already placed in starters) ——
  async function ensureAssignment(params: {
    id: string;
    assessmentId: string;
    candidateId: string;
    challengeSlug: string;
    track: string;
    language?: string;
  }) {
    const existing = await prisma.assessmentAssignment.findUnique({ where: { id: params.id } });
    if (existing) {
      const startedAt = existing.startedAt ?? new Date();
      const refreshed = await prisma.assessmentAssignment.update({
        where: { id: existing.id },
        data: {
          startedAt,
          dueAt: new Date(startedAt.getTime() + DEFAULT_TIMED_MINUTES * 60 * 1000),
        },
      });
      const ws = await prisma.workspace.findUnique({ where: { assignmentId: existing.id } });
      if (!ws) {
        await createWorkspaceForAssignment({
          assignmentId: existing.id,
          challengeSlug: params.challengeSlug,
          language: params.language ?? "typescript",
          track: params.track,
        });
      }
      return refreshed;
    }
    const startedAt = new Date();
    const assignment = await prisma.assessmentAssignment.create({
      data: {
        id: params.id,
        assessmentId: params.assessmentId,
        candidateId: params.candidateId,
        assignedById: hiring.id,
        status: "IN_PROGRESS",
        startedAt,
        dueAt: new Date(startedAt.getTime() + DEFAULT_TIMED_MINUTES * 60 * 1000),
        currentLevel: 1,
        maxLevelReached: 1,
      },
    });
    await createWorkspaceForAssignment({
      assignmentId: assignment.id,
      challengeSlug: params.challengeSlug,
      language: params.language ?? "typescript",
      track: params.track,
    });
    return assignment;
  }

  const assignSaas = await ensureAssignment({
    id: "assign-saas-casey",
    assessmentId: assessmentSaas.id,
    candidateId: candidate.id,
    challengeSlug: "saas-nexus",
    track: "SOFTWARE_ENGINEERING",
  });

  const assignCyber = await ensureAssignment({
    id: "assign-appsec-sam",
    assessmentId: assessmentCyber.id,
    candidateId: cyberCandidate.id,
    challengeSlug: "appsec-fortress",
    track: "CYBERSECURITY",
  });

  const assignSoc = await ensureAssignment({
    id: "assign-soc-sam",
    assessmentId: "assess-soc-1",
    candidateId: cyberCandidate.id,
    challengeSlug: "soc-nightwatch",
    track: "CYBERSECURITY",
  });

  const assignTeamCasey = await ensureAssignment({
    id: "assign-team-casey",
    assessmentId: assessmentTeam.id,
    candidateId: candidate.id,
    challengeSlug: "team-forge",
    track: "SECURE_FULL_STACK",
  });

  await ensureAssignment({
    id: "assign-team-taylor",
    assessmentId: assessmentTeam.id,
    candidateId: teammate.id,
    challengeSlug: "team-forge",
    track: "SECURE_FULL_STACK",
  });

  // Featured assessment IDs for challenges that already have named gauntlets
  const featuredBySlug: Record<string, string> = {
    "saas-nexus": assessmentSaas.id,
    "appsec-fortress": assessmentCyber.id,
    "soc-nightwatch": "assess-soc-1",
    "team-forge": assessmentTeam.id,
  };

  // Publish every catalog challenge as a ready assessment
  for (const c of CHALLENGE_CATALOG) {
    const challenge = await prisma.challenge.findUnique({ where: { slug: c.slug } });
    if (!challenge) continue;
    const assessId = featuredBySlug[c.slug] ?? `assess-lib-${c.slug}`;
    const policyId =
      c.track === "CYBERSECURITY"
        ? cyberPolicy.id
        : c.track === "SECURE_FULL_STACK"
          ? securePolicy.id
          : engPolicy.id;
    const isLib = assessId.startsWith("assess-lib-");
    await prisma.assessment.upsert({
      where: { id: assessId },
      update: {
        status: "PUBLISHED",
        scoringPolicyId: policyId,
        timedMinutes: DEFAULT_TIMED_MINUTES,
        multiDay: false,
        ...(isLib
          ? {
              title: c.title,
              description: `${c.summary} Timed ${DEFAULT_TIMED_MINUTES}-minute Crucible session.`,
              allowTeam: c.type === "TEAM_PROJECT",
              teamSizeMin: c.type === "TEAM_PROJECT" ? 2 : null,
              teamSizeMax: c.type === "TEAM_PROJECT" ? 4 : null,
            }
          : {}),
      },
      create: {
        id: assessId,
        title: isLib
          ? c.title
          : c.slug === "saas-nexus"
            ? "Elite SaaS Build — Nexus"
            : c.slug === "appsec-fortress"
              ? "AppSec Fortress Qualification"
              : c.slug === "soc-nightwatch"
                ? "SOC Nightwatch IR Simulation"
                : "Team Forge Collaborative Delivery",
        description: isLib
          ? `${c.summary} Timed ${DEFAULT_TIMED_MINUTES}-minute Crucible session.`
          : c.summary,
        challengeId: challenge.id,
        track: c.track,
        status: "PUBLISHED",
        timedMinutes: DEFAULT_TIMED_MINUTES,
        multiDay: false,
        progressiveDiff: true,
        allowTeam: c.type === "TEAM_PROJECT",
        teamSizeMin: c.type === "TEAM_PROJECT" ? 2 : undefined,
        teamSizeMax: c.type === "TEAM_PROJECT" ? 4 : undefined,
        createdById: hiring.id,
        scoringPolicyId: policyId,
      },
    });
  }

  // Assign every catalog challenge to the right demo candidate with a workspace
  for (const c of CHALLENGE_CATALOG) {
    const assessId = featuredBySlug[c.slug] ?? `assess-lib-${c.slug}`;
    const primary =
      c.track === "CYBERSECURITY"
        ? { user: cyberCandidate, key: "sam" }
        : { user: candidate, key: "casey" };

    // Featured assignments already created above with stable IDs
    const featuredAssignId =
      c.slug === "saas-nexus"
        ? "assign-saas-casey"
        : c.slug === "appsec-fortress"
          ? "assign-appsec-sam"
          : c.slug === "soc-nightwatch"
            ? "assign-soc-sam"
            : c.slug === "team-forge"
              ? "assign-team-casey"
              : null;

    if (!featuredAssignId) {
      await ensureAssignment({
        id: `assign-lib-${c.slug}-${primary.key}`,
        assessmentId: assessId,
        candidateId: primary.user.id,
        challengeSlug: c.slug,
        track: c.track,
        language: c.languages[0] === "python" ? "python" : "typescript",
      });
    }
  }

  // Mark SOC assignment under review with a seed score report for the reviewer queue
  await prisma.assessmentAssignment.update({
    where: { id: assignSoc.id },
    data: { status: "UNDER_REVIEW", submittedAt: new Date() },
  });
  const socReport = await prisma.scoreReport.findUnique({ where: { assignmentId: assignSoc.id } });
  if (!socReport) {
    await prisma.scoreReport.create({
      data: {
        assignmentId: assignSoc.id,
        overall: 88,
        frontend: 70,
        backend: 80,
        database: 75,
        architecture: 85,
        infrastructure: 82,
        security: 92,
        testing: 84,
        problemSolving: 90,
        performance: 78,
        collaboration: 80,
        qualified: false,
        tier: "NOT_QUALIFIED",
        mandatoryFailures: ["Human review pending — containment timeline completeness"],
        calibrated: true,
      },
    });
  }

  // Architecture packages ready for staff + candidates to inspect
  for (const row of [
    {
      id: "arch-casey-saas",
      assignmentId: assignSaas.id,
      title: "Nexus multi-tenant SaaS architecture",
    },
    {
      id: "arch-sam-appsec",
      assignmentId: assignCyber.id,
      title: "AppSec fortress trust boundaries",
    },
  ] as const) {
    const existingArch = await prisma.architectureSubmission.findUnique({ where: { id: row.id } });
    if (!existingArch) {
      await prisma.architectureSubmission.create({
        data: {
          id: row.id,
          assignmentId: row.assignmentId,
          proposal: `# ${row.title}

## Components
- Edge API
- Auth service
- Primary datastore
- Async workers

## Trust boundaries
- Public internet → edge
- Edge → private services
- Secrets only via vault / env injection

## Failure modes
- Dependency outage
- Poisoned queue messages
- Credential leak

## Mitigations
- Idempotency keys
- Least privilege IAM
- Structured audit logs
`,
          diagrams: {
            overview: "edge -> api -> db; api -> queue -> workers",
            trust: ["public", "edge", "private-services", "data"],
          },
          answers: {
            scaling: "Stateless API + managed Postgres + queue consumers",
            security: "mTLS between services, short-lived tokens, audit trail",
          },
          score: 82,
          feedback: "Solid trust-boundary articulation. Expand blast-radius analysis for queue poison messages.",
        },
      });
    }
  }

  // Team already formed for collaborative gauntlet
  const existingTeam = await prisma.engineeringTeam.findFirst({
    where: { name: "Forge Squad Alpha", assessmentId: assessmentTeam.id },
  });
  if (!existingTeam) {
    try {
      await createTeam({
        name: "Forge Squad Alpha",
        assessmentId: assessmentTeam.id,
        managerId: hiring.id,
        members: [
          {
            userId: candidate.id,
            roleLabel: "API / backend owner",
            duties: "Contracts, auth, persistence, integration tests",
          },
          {
            userId: teammate.id,
            roleLabel: "Client / security owner",
            duties: "UI flows, threat checks, PR review",
          },
        ],
      });
    } catch {
      // ignore if already exists from partial seed
    }
  }

  // Incident runs ready for cyber + SE candidates
  for (const row of [
    { slug: "token-exfil-beacon", candidateId: cyberCandidate.id, assignmentId: assignSoc.id },
    { slug: "checkout-dup-payments", candidateId: candidate.id, assignmentId: assignSaas.id },
  ]) {
    const scenario = await prisma.incidentScenario.findUnique({ where: { slug: row.slug } });
    if (!scenario) continue;
    const existingRun = await prisma.incidentRun.findFirst({
      where: { scenarioId: scenario.id, candidateId: row.candidateId },
    });
    if (!existingRun) {
      await prisma.incidentRun.create({
        data: {
          scenarioId: scenario.id,
          candidateId: row.candidateId,
          assignmentId: row.assignmentId,
          timeline: [{ at: new Date().toISOString(), event: "seeded_ready" }],
        },
      });
    }
  }

  // Follow-up question queued on SOC for the candidate
  const existingFollowup = await prisma.followUpQuestion.findFirst({
    where: { assignmentId: assignSoc.id },
  });
  if (!existingFollowup) {
    await prisma.followUpQuestion.create({
      data: {
        assignmentId: assignSoc.id,
        prompt:
          "Walk through how you would revoke the compromised service token without dropping legitimate checkout traffic.",
        basedOnPath: "playbooks/IR_TEMPLATE.md",
        difficulty: 2,
      },
    });
  }

  // SaaS: study plan enrollments + daily challenge
  await prisma.studyPlanEnrollment.upsert({
    where: { userId_planSlug: { userId: candidate.id, planSlug: "meta-75" } },
    create: {
      userId: candidate.id,
      planSlug: "meta-75",
      completedSlugs: ["lc-two-sum", "lc-valid-parens"],
    },
    update: {},
  });
  await prisma.studyPlanEnrollment.upsert({
    where: { userId_planSlug: { userId: premiumCandidate.id, planSlug: "stripe-2-weeks" } },
    create: {
      userId: premiumCandidate.id,
      planSlug: "stripe-2-weeks",
      completedSlugs: ["lc-idempotent-charge"],
    },
    update: {},
  });

  const { ensureDailyChallenge } = await import("@/server/saas/daily");
  const daily = await ensureDailyChallenge();
  await prisma.userStreak.upsert({
    where: { userId: candidate.id },
    create: { userId: candidate.id, currentStreak: 2, longestStreak: 5, lastDateKey: daily.dateKey },
    update: { currentStreak: 2, longestStreak: 5, lastDateKey: daily.dateKey },
  });

  // SaaS: sample playgrounds for free + premium accounts
  const playgroundCount = await prisma.playground.count({ where: { userId: candidate.id } });
  if (playgroundCount === 0) {
    await prisma.playground.create({
      data: {
        userId: candidate.id,
        name: "Scratchpad",
        folder: "Inbox",
        language: "typescript",
        content: `// Free plan: 3 playgrounds max. Upgrade for unlimited.\nexport function hello() {\n  return "crucible";\n}\n`,
      },
    });
  }
  const premiumPlaygrounds = await prisma.playground.count({ where: { userId: premiumCandidate.id } });
  if (premiumPlaygrounds === 0) {
    await prisma.playground.createMany({
      data: [
        {
          userId: premiumCandidate.id,
          name: "Graph drills",
          folder: "Interview Prep",
          language: "typescript",
          content: `// Premium playground — unlimited folders\nexport function bfs() { return []; }\n`,
        },
        {
          userId: premiumCandidate.id,
          name: "Stripe idempotency notes",
          folder: "Company Prep",
          language: "typescript",
          content: `// Company-specific scratch\nexport function charge() { return { ok: true }; }\n`,
        },
      ],
    });
  }

  const [
    workspaceCount,
    fileCount,
    assignmentCount,
    assessmentCount,
    challengeCount,
    architectureCount,
    incidentRunCount,
  ] = await Promise.all([
    prisma.workspace.count(),
    prisma.workspaceFile.count(),
    prisma.assessmentAssignment.count(),
    prisma.assessment.count({ where: { status: "PUBLISHED" } }),
    prisma.challenge.count({ where: { isPublished: true } }),
    prisma.architectureSubmission.count(),
    prisma.incidentRun.count(),
  ]);

  const summary = {
    releaseReady: true,
    admin: admin.email,
    hiring: hiring.email,
    reviewer: reviewer.email,
    candidate: candidate.email,
    premiumCandidate: premiumCandidate.email,
    cyberCandidate: cyberCandidate.email,
    teammate: teammate.email,
    passwordAdmin: "Gauntlet!Admin1",
    passwordCandidate: "Gauntlet!Cand1",
    policies: [engPolicy.name, cyberPolicy.name, securePolicy.name],
    ready: {
      publishedChallenges: challengeCount,
      publishedAssessments: assessmentCount,
      assignments: assignmentCount,
      workspaces: workspaceCount,
      workspaceFiles: fileCount,
      architecturePackages: architectureCount,
      incidentRuns: incidentRunCount,
      featuredAssignments: [assignSaas.id, assignCyber.id, assignSoc.id, assignTeamCasey.id],
    },
  };
  console.log("Seed complete — full platform ready.");
  console.log(summary);
  return summary;
}
