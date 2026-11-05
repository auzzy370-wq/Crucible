import { z } from "zod";
import { jsonOk, withHandler } from "@/server/auth/api";
import { AppError } from "@/lib/errors";
import { clerkConfigured, loginWithClerkToken } from "@/server/auth/clerk-bridge";
import { rateLimit } from "@/server/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  sessionToken: z.string().min(20),
});

/** Exchange Clerk session → Crucible cookie session. */
export async function POST(req: Request) {
  return withHandler(async () => {
    if (!clerkConfigured()) {
      throw new AppError(
        "Social login hub is not configured yet. Add CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.",
        503,
        "CLERK_DISABLED",
      );
    }
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    await rateLimit(`clerk:${ip}`, 30);
    const body = schema.parse(await req.json());
    const user = await loginWithClerkToken(body.sessionToken, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    return jsonOk({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  });
}
