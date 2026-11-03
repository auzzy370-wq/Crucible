import { z } from "zod";
import { jsonOk, withHandler } from "@/server/auth/api";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/server/bootstrap-seed";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  secret: z.string().min(8),
  seed: z.boolean().optional().default(true),
});

/**
 * Bootstrap for Vercel/preview deploys after migrations ran at build time.
 * POST { "secret": "<SETUP_SECRET>", "seed": true }
 */
export async function POST(req: Request) {
  return withHandler(async () => {
    const expected = process.env.SETUP_SECRET;
    if (!expected) throw new AppError("SETUP_SECRET is not configured", 503, "SETUP_DISABLED");

    const body = schema.parse(await req.json());
    if (body.secret !== expected) throw new AppError("Invalid setup secret", 401, "UNAUTHORIZED");

    const before = await prisma.user.count();
    const summary = body.seed ? await seedDatabase() : null;
    const users = await prisma.user.count();
    const challenges = await prisma.challenge.count();

    return jsonOk({
      ok: true,
      usersBefore: before,
      users,
      challenges,
      summary,
      hint: "Sign in with admin@gauntlet.local / Gauntlet!Admin1 (or cyber@gauntlet.local / Gauntlet!Cand1)",
    });
  });
}

export async function GET() {
  return withHandler(async () => {
    try {
      const users = await prisma.user.count();
      const challenges = await prisma.challenge.count();
      return jsonOk({
        databaseReachable: true,
        users,
        challenges,
        setupConfigured: Boolean(process.env.SETUP_SECRET),
        vercel: Boolean(process.env.VERCEL),
      });
    } catch {
      return jsonOk({
        databaseReachable: false,
        users: null,
        challenges: null,
        setupConfigured: Boolean(process.env.SETUP_SECRET),
        vercel: Boolean(process.env.VERCEL),
      });
    }
  });
}
