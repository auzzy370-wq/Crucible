import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { writeAudit } from "@/server/security/audit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    await rateLimit(`login:${ip}`, 20);
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
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
