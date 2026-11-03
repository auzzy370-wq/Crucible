import { z } from "zod";
import { AssessmentTrack } from "@prisma/client";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import { ensureCandidateProfile, getCandidateDetail, updateCandidateProfile } from "@/server/candidates/service";

export async function GET() {
  return withHandler(async () => {
    const user = await requireUser();
    await ensureCandidateProfile(user.id);
    return jsonOk(await getCandidateDetail(user.id));
  });
}

const schema = z.object({
  headline: z.string().optional(),
  bio: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedInUrl: z.string().url().optional().or(z.literal("")),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  languages: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  databases: z.array(z.string()).optional(),
  cloud: z.array(z.string()).optional(),
  infrastructure: z.array(z.string()).optional(),
  aiExperience: z.array(z.string()).optional(),
  cybersecurity: z.array(z.string()).optional(),
  preferredTrack: z.nativeEnum(AssessmentTrack).optional(),
  accommodations: z.string().optional(),
  claimedSkills: z.array(z.object({ name: z.string(), domain: z.string() })).optional(),
});

export async function PUT(req: Request) {
  return withHandler(async () => {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const updated = await updateCandidateProfile(user.id, {
      ...body,
      portfolioUrl: body.portfolioUrl || undefined,
      githubUrl: body.githubUrl || undefined,
      linkedInUrl: body.linkedInUrl || undefined,
    });
    // cybersecurity field on profile
    if (body.cybersecurity || body.preferredTrack) {
      const { prisma } = await import("@/lib/db");
      await prisma.candidateProfile.update({
        where: { id: updated.id },
        data: {
          cybersecurity: body.cybersecurity,
          preferredTrack: body.preferredTrack,
        },
      });
    }
    return jsonOk(await getCandidateDetail(user.id));
  });
}
