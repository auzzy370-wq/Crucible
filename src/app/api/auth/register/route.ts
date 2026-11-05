import { z } from "zod";
import { AssessmentTrack } from "@prisma/client";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { jsonOk, withHandler } from "@/server/auth/api";
import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { rateLimit } from "@/server/security/rate-limit";
import { writeAudit } from "@/server/security/audit";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200)
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), {
      message: "Password needs at least one letter and one number",
    }),
  track: z.nativeEnum(AssessmentTrack).default("SOFTWARE_ENGINEERING"),
});

function slugifyName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${base || "candidate"}-${nanoid(6).toLowerCase()}`;
}

export async function POST(req: Request) {
  return withHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    await rateLimit(`register:${ip}`, 10);
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    // Keep seeded demo identities reserved so real signups don't collide with demos
    if (email.endsWith("@gauntlet.local")) {
      throw new AppError(
        "That email domain is reserved for demo accounts. Use your real email to register.",
        400,
        "DEMO_EMAIL_RESERVED",
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already registered", 409, "EMAIL_TAKEN");

    const publicSlug = slugifyName(body.name);

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash: await hashPassword(body.password),
        role: "CANDIDATE",
        plan: "FREE",
        candidateProfile: {
          create: {
            headline: "Candidate",
            preferredTrack: body.track,
            publicSlug,
            publicEnabled: false,
            cybersecurity: body.track === "CYBERSECURITY" ? ["interested"] : [],
          },
        },
        streak: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      },
      include: { candidateProfile: true },
    });

    await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
    await writeAudit({
      actorId: user.id,
      action: "auth.register",
      entityType: "User",
      entityId: user.id,
      metadata: { track: body.track, publicSlug },
      ip,
    });

    return jsonOk({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      track: body.track,
      publicSlug,
    });
  });
}
