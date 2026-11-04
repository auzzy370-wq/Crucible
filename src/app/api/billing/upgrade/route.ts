import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import { writeAudit } from "@/server/security/audit";

const schema = z.object({
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

/** Local/mock Stripe upgrade — flips plan to PREMIUM immediately. */
export async function POST(req: Request) {
  return withHandler(async () => {
    const user = await requireUser();
    const body = schema.parse(await req.json().catch(() => ({ interval: "monthly" })));
    const days = body.interval === "yearly" ? 365 : 31;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "PREMIUM",
        planExpiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
      select: { id: true, email: true, plan: true, planExpiresAt: true },
    });
    await writeAudit({
      actorId: user.id,
      action: "billing.upgrade",
      entityType: "User",
      entityId: user.id,
      metadata: { interval: body.interval, mock: true },
    });
    return jsonOk({
      ...updated,
      message: "Premium activated (demo billing — wire Stripe for production).",
    });
  });
}

export async function DELETE() {
  return withHandler(async () => {
    const user = await requireUser();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { plan: "FREE", planExpiresAt: null },
      select: { id: true, email: true, plan: true, planExpiresAt: true },
    });
    return jsonOk(updated);
  });
}
