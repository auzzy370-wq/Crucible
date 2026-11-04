import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { LandingPage } from "@/components/marketing/landing";
import { prisma } from "@/lib/db";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const [verifiedSkills, timedSessions, publicProfiles, sample] = await Promise.all([
    prisma.skillRecord.count({
      where: { source: { in: ["ASSESSMENT", "HUMAN_REVIEW"] } },
    }),
    prisma.assessment.count({
      where: { status: "PUBLISHED", timedMinutes: { not: null } },
    }),
    prisma.candidateProfile.count({
      where: { publicEnabled: true, publicSlug: { not: null } },
    }),
    prisma.candidateProfile.findFirst({
      where: { publicEnabled: true, publicSlug: { not: null } },
      select: { publicSlug: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <LandingPage
      verifiedSkills={verifiedSkills}
      timedSessions={Math.min(60, timedSessions || 60)}
      publicProfiles={publicProfiles}
      sampleProfileSlug={sample?.publicSlug ?? "casey-elite"}
    />
  );
}
