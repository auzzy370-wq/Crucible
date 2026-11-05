import { createClerkClient, verifyToken } from "@clerk/backend";
import { prisma } from "@/lib/db";
import { resolveBootstrapRole } from "@/server/auth/admin-bootstrap";
import { createSession } from "@/server/auth/session";
import { writeAudit } from "@/server/security/audit";
import { nanoid } from "nanoid";

export function clerkConfigured() {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);
}

export function clerkPublishableKey() {
  return process.env.CLERK_PUBLISHABLE_KEY || "";
}

function slugifyName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${base || "candidate"}-${nanoid(6).toLowerCase()}`;
}

/**
 * Exchange a Clerk session JWT for a Crucible session.
 * Clerk's development instance ships shared Google/GitHub/Apple/etc credentials —
 * so one Clerk app unlocks social login without building each OAuth app yourself.
 */
export async function loginWithClerkToken(
  sessionToken: string,
  meta?: { ip?: string; userAgent?: string },
) {
  if (!clerkConfigured()) throw new Error("Clerk is not configured");

  const payload = await verifyToken(sessionToken, {
    secretKey: process.env.CLERK_SECRET_KEY!,
  });
  const clerkUserId = String(payload.sub || "");
  if (!clerkUserId) throw new Error("Invalid Clerk session");

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) throw new Error("Clerk user has no email");

  const email = primaryEmail.toLowerCase();
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    email;

  const existingLink = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerUserId: { provider: "clerk", providerUserId: clerkUserId },
    },
    include: { user: true },
  });

  let user = existingLink?.user ?? (await prisma.user.findUnique({ where: { email } }));
  const role = resolveBootstrapRole({ email, current: user?.role });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name.slice(0, 120),
        passwordHash: null,
        role,
        plan: role === "SUPER_ADMIN" ? "PREMIUM" : "FREE",
        avatarUrl: clerkUser.imageUrl || null,
        candidateProfile:
          role === "SUPER_ADMIN"
            ? undefined
            : {
                create: {
                  headline: "Candidate",
                  preferredTrack: "SOFTWARE_ENGINEERING",
                  publicSlug: slugifyName(name),
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
  }

  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerUserId: { provider: "clerk", providerUserId: clerkUserId },
    },
    create: {
      userId: user.id,
      provider: "clerk",
      providerUserId: clerkUserId,
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
    metadata: { clerkUserId, email },
  });

  return user;
}
