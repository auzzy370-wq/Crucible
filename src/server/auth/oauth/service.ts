import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { resolveBootstrapRole } from "@/server/auth/admin-bootstrap";
import { createSession } from "@/server/auth/session";
import { writeAudit } from "@/server/security/audit";
import type { OAuthProfile } from "./types";

function slugifyName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${base || "candidate"}-${nanoid(6).toLowerCase()}`;
}

/**
 * Find or create a Crucible user from a verified OAuth profile, then open a session.
 */
export async function loginWithOAuthProfile(
  profile: OAuthProfile,
  meta?: { ip?: string; userAgent?: string },
) {
  const email = profile.email.toLowerCase().trim();

  const existingLink = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: profile.provider,
        providerUserId: profile.providerUserId,
      },
    },
    include: { user: true },
  });

  let user = existingLink?.user ?? null;

  // Link-by-email only when the provider proved the inbox. Otherwise an attacker
  // could attach Discord/X (or similar) to a victim account that shares an address.
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      if (!profile.emailVerified) {
        throw new AppError(
          "Sign in with a verified email before linking this provider to an existing account",
          403,
          "OAUTH_EMAIL_UNVERIFIED",
        );
      }
      user = byEmail;
    }
  }

  const bootstrapRole = resolveBootstrapRole({
    email,
    provider: profile.provider,
    providerUserId: profile.providerUserId,
    current: user?.role,
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name.slice(0, 120) || email,
        passwordHash: null,
        role: bootstrapRole,
        plan: bootstrapRole === "SUPER_ADMIN" ? "PREMIUM" : "FREE",
        avatarUrl: profile.avatarUrl ?? null,
        githubLogin: profile.githubLogin ?? null,
        candidateProfile:
          bootstrapRole === "SUPER_ADMIN"
            ? undefined
            : {
                create: {
                  headline: "Candidate",
                  preferredTrack: "SOFTWARE_ENGINEERING",
                  publicSlug: slugifyName(profile.name || email),
                  publicEnabled: false,
                },
              },
      },
    });
  } else {
    const promote = bootstrapRole === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN";
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(profile.avatarUrl && !user.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        ...(profile.githubLogin && !user.githubLogin ? { githubLogin: profile.githubLogin } : {}),
        ...(promote ? { role: "SUPER_ADMIN", plan: "PREMIUM" } : {}),
        lastLoginAt: new Date(),
      },
    });
  }

  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerUserId: {
        provider: profile.provider,
        providerUserId: profile.providerUserId,
      },
    },
    create: {
      userId: user.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email,
    },
    update: {
      userId: user.id,
      email,
    },
  });

  await createSession(user.id, meta);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit({
    actorId: user.id,
    action: `auth.oauth.${profile.provider}`,
    entityType: "User",
    entityId: user.id,
    ip: meta?.ip,
    metadata: { provider: profile.provider, emailVerified: profile.emailVerified },
  });

  return user;
}
