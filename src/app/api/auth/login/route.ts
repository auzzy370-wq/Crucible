import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { writeAudit } from "@/server/security/audit";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    await rateLimit(`login:${ip}`, 20);
    const body = schema.parse(await req.json());
    let user;
    try {
      const { ensurePlatformSeeded } = await import("@/server/platform/ensure-seeded");
      await ensurePlatformSeeded();
      user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(
        "Database is not connected yet. Publish with a Postgres database, then refresh and try again.",
        503,
        "DATABASE_UNAVAILABLE",
      );
    }
    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }
    if (!user.passwordHash) {
      throw new AppError(
        "This account uses social sign-in. Continue with Google, GitHub, Apple, Facebook, Discord, or X.",
        401,
        "OAUTH_ONLY",
      );
    }
    if (!(await verifyPassword(body.password, user.passwordHash))) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }
    if (!user.emailVerifiedAt) {
      throw new AppError(
        "Verify your email before signing in. Check your inbox for the Crucible link.",
        403,
        "EMAIL_NOT_VERIFIED",
      );
    }
    const { resolveBootstrapRole } = await import("@/server/auth/admin-bootstrap");
    const role = resolveBootstrapRole({ email: user.email, current: user.role });
    // Only promote after the inbox is proven — blocks squat + SUPER_ADMIN_EMAILS takeover.
    if (role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN" && user.emailVerifiedAt) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "SUPER_ADMIN", plan: "PREMIUM" },
      });
    }
    await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await writeAudit({
      actorId: user.id,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      ip,
    });
    return jsonOk({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  });
}
