import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { LandingPage } from "@/components/marketing/landing";
import { prisma } from "@/lib/db";

export default async function Home() {
  try {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  } catch {
    /* session/db unavailable — still show marketing landing */
  }

  let verifiedSkills = 0;
  let timedSessions = 60;
  let publicProfiles = 0;
  let sampleSlug = "casey-elite";
  try {
    const [skills, timed, profiles, sample] = await Promise.all([
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
    verifiedSkills = skills;
    timedSessions = Math.min(60, timed || 60);
    publicProfiles = profiles;
    sampleSlug = sample?.publicSlug ?? "casey-elite";
  } catch {
    /* landing still renders with safe defaults when the database is down */
  }

  return (
    <LandingPage
      verifiedSkills={verifiedSkills}
      timedSessions={timedSessions}
      publicProfiles={publicProfiles}
      sampleProfileSlug={sampleSlug}
    />
  );
}
