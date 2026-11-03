import { z } from "zod";
import { AssessmentTrack } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { writeAudit } from "@/server/security/audit";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(200),
  track: z.nativeEnum(AssessmentTrack).default("SOFTWARE_ENGINEERING"),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    await rateLimit(`register:${ip}`, 10);
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already registered", 409, "EMAIL_TAKEN");

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash: await hashPassword(body.password),
        role: "CANDIDATE",
        candidateProfile: {
          create: {
            headline: "Candidate",
            preferredTrack: body.track,
            cybersecurity: body.track === "CYBERSECURITY" ? ["interested"] : [],
          },
        },
      },
    });

    await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
    await writeAudit({
      actorId: user.id,
      action: "auth.register",
      entityType: "User",
      entityId: user.id,
      metadata: { track: body.track },
      ip,
    });

    return jsonOk({ id: user.id, email: user.email, name: user.name, role: user.role });
  });
}
