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
  console.log("Seeding Engineering Gauntlet…");

  const passwordHash = await bcrypt.hash("Gauntlet!Admin1", 12);
  const candidateHash = await bcrypt.hash("Gauntlet!Cand1", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gauntlet.local" },
    update: {},
    create: {
      email: "admin@gauntlet.local",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  const hiring = await prisma.user.upsert({
    where: { email: "hiring@gauntlet.local" },
    update: {},
    create: {
      email: "hiring@gauntlet.local",
      name: "Harper Manager",
      role: "HIRING_MANAGER",
      passwordHash,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@gauntlet.local" },
    update: {},
    create: {
      email: "reviewer@gauntlet.local",
      name: "Riley Reviewer",
      role: "TECHNICAL_REVIEWER",
      passwordHash,
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: "candidate@gauntlet.local" },
    update: {},
    create: {
      email: "candidate@gauntlet.local",
      name: "Casey Candidate",
      role: "CANDIDATE",
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

  const cyberCandidate = await prisma.user.upsert({
    where: { email: "cyber@gauntlet.local" },
    update: {},
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
    update: {},
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

  const assessmentSaas = await prisma.assessment.upsert({
    where: { id: "assess-saas-1" },
    update: {},
    create: {
      id: "assess-saas-1",
      title: "Elite SaaS Build — Nexus",
      description: "Individual full-stack SaaS assessment with adaptive difficulty.",
      challengeId: saas.id,
      track: "SOFTWARE_ENGINEERING",
      status: "PUBLISHED",
      multiDay: true,
      progressiveDiff: true,
      createdById: hiring.id,
      scoringPolicyId: engPolicy.id,
    },
  });

  const assessmentCyber = await prisma.assessment.upsert({
    where: { id: "assess-cyber-1" },
    update: {},
    create: {
      id: "assess-cyber-1",
      title: "AppSec Fortress Qualification",
      description: "Cybersecurity track — controlled vulnerability lab with fix + regression requirements.",
      challengeId: appsec.id,
      track: "CYBERSECURITY",
      status: "PUBLISHED",
      multiDay: true,
      progressiveDiff: true,
      allowTeam: false,
      createdById: hiring.id,
      scoringPolicyId: cyberPolicy.id,
    },
  });

  await prisma.assessment.upsert({
    where: { id: "assess-soc-1" },
    update: {},
    create: {
      id: "assess-soc-1",
      title: "SOC Nightwatch IR Simulation",
      description: "Incident response and detection engineering simulation.",
      challengeId: soc.id,
      track: "CYBERSECURITY",
      status: "PUBLISHED",
      timedMinutes: 240,
      createdById: hiring.id,
      scoringPolicyId: cyberPolicy.id,
    },
  });

  const assessmentTeam = await prisma.assessment.upsert({
    where: { id: "assess-team-1" },
    update: {},
    create: {
      id: "assess-team-1",
      title: "Team Forge Collaborative Delivery",
      description: "2–4 engineers, shared ownership, integration quality.",
      challengeId: teamChallenge.id,
      track: "SECURE_FULL_STACK",
      status: "PUBLISHED",
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
      const ws = await prisma.workspace.findUnique({ where: { assignmentId: existing.id } });
      if (!ws) {
        await createWorkspaceForAssignment({
          assignmentId: existing.id,
          challengeSlug: params.challengeSlug,
          language: params.language ?? "typescript",
          track: params.track,
        });
      }
      return existing;
    }
    const assignment = await prisma.assessmentAssignment.create({
      data: {
        id: params.id,
        assessmentId: params.assessmentId,
        candidateId: params.candidateId,
        assignedById: hiring.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

  // Publish remaining catalog challenges as ready assessments (library already loaded)
  for (const c of CHALLENGE_CATALOG) {
    const challenge = await prisma.challenge.findUnique({ where: { slug: c.slug } });
    if (!challenge) continue;
    const assessId = `assess-lib-${c.slug}`;
    await prisma.assessment.upsert({
      where: { id: assessId },
      update: { status: "PUBLISHED" },
      create: {
        id: assessId,
        title: c.title,
        description: c.summary,
        challengeId: challenge.id,
        track: c.track,
        status: "PUBLISHED",
        multiDay: true,
        progressiveDiff: true,
        allowTeam: c.type === "TEAM_PROJECT",
        createdById: hiring.id,
        scoringPolicyId:
          c.track === "CYBERSECURITY"
            ? cyberPolicy.id
            : c.track === "SECURE_FULL_STACK"
              ? securePolicy.id
              : engPolicy.id,
      },
    });
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

  // Incident runs ready for cyber candidate
  const socScenario = await prisma.incidentScenario.findUnique({ where: { slug: "token-exfil-beacon" } });
  if (socScenario) {
    const existingRun = await prisma.incidentRun.findFirst({
      where: { scenarioId: socScenario.id, candidateId: cyberCandidate.id },
    });
    if (!existingRun) {
      await prisma.incidentRun.create({
        data: {
          scenarioId: socScenario.id,
          candidateId: cyberCandidate.id,
          assignmentId: assignSoc.id,
          timeline: [{ at: new Date().toISOString(), event: "seeded_ready" }],
        },
      });
    }
  }

  const workspaceCount = await prisma.workspace.count();
  const fileCount = await prisma.workspaceFile.count();
  const assignmentCount = await prisma.assessmentAssignment.count();

  const summary = {
    admin: admin.email,
    hiring: hiring.email,
    reviewer: reviewer.email,
    candidate: candidate.email,
    cyberCandidate: cyberCandidate.email,
    teammate: teammate.email,
    passwordAdmin: "Gauntlet!Admin1",
    passwordCandidate: "Gauntlet!Cand1",
    assessments: [assessmentSaas.title, assessmentCyber.title, assessmentTeam.title],
    policies: [engPolicy.name, cyberPolicy.name, securePolicy.name],
    ready: {
      assignments: assignmentCount,
      workspaces: workspaceCount,
      workspaceFiles: fileCount,
      demoAssignments: [assignSaas.id, assignCyber.id, assignSoc.id, assignTeamCasey.id],
    },
  };
  console.log("Seed complete.");
  console.log(summary);
  return summary;
}
