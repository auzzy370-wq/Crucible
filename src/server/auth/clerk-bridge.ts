import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "@/lib/db";
import { resolveBootstrapRole } from "@/server/auth/admin-bootstrap";
import { createSession } from "@/server/auth/session";
import { writeAudit } from "@/server/security/audit";
import { nanoid } from "nanoid";

export function clerkConfigured() {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function clerkPublishableKey() {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || "";
}

function slugifyName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${base || "candidate"}-${nanoid(6).toLowerCase()}`;
}

export async function loginWithClerkProfile(
  profile: {
    clerkUserId: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  },
  meta?: { ip?: string; userAgent?: string },
) {
  const email = profile.email.toLowerCase().trim();
  const existingLink = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: { provider: "clerk", providerUserId: profile.clerkUserId },
    },
    include: { user: true },
  });

  let user = existingLink?.user ?? (await prisma.user.findUnique({ where: { email } }));
  const role = resolveBootstrapRole({ email, current: user?.role });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name.slice(0, 120) || email,
        passwordHash: null,
        role,
        plan: role === "SUPER_ADMIN" ? "PREMIUM" : "FREE",
        avatarUrl: profile.avatarUrl ?? null,
        candidateProfile:
          role === "SUPER_ADMIN"
            ? undefined
            : {
                create: {
                  headline: "Candidate",
                  preferredTrack: "SOFTWARE_ENGINEERING",
                  publicSlug: slugifyName(profile.name),
                  publicEnabled: false,
                },
              },
      },
    });
  } else if (role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN", plan: "PREMIUM" },
    });
  } else if (profile.avatarUrl && !user.avatarUrl) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: profile.avatarUrl },
    });
  }

  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerUserId: { provider: "clerk", providerUserId: profile.clerkUserId },
    },
    create: {
      userId: user.id,
      provider: "clerk",
      providerUserId: profile.clerkUserId,
      email,
    },
    update: { userId: user.id, email },
  });

  await createSession(user.id, meta);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit({
    actorId: user.id,
    action: "auth.oauth.clerk",
    entityType: "User",
    entityId: user.id,
    ip: meta?.ip,
    metadata: { clerkUserId: profile.clerkUserId, email },
  });

  return user;
}

/**
 * Exchange a Clerk session JWT for a Crucible session.
 */
export async function loginWithClerkToken(
  sessionToken: string,
  meta?: { ip?: string; userAgent?: string },
) {
  if (!process.env.CLERK_SECRET_KEY) throw new Error("Clerk is not configured");

  const payload = await verifyToken(sessionToken, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  const clerkUserId = String(payload.sub || "");
  if (!clerkUserId) throw new Error("Invalid Clerk session");

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) throw new Error("Clerk user has no email");

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    primaryEmail;

  return loginWithClerkProfile(
    {
      clerkUserId,
      email: primaryEmail,
      name,
      avatarUrl: clerkUser.imageUrl,
    },
    meta,
  );
}
