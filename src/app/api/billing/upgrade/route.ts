import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import { writeAudit } from "@/server/security/audit";
import { planDays } from "@/server/saas/stripe";

const schema = z.object({
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

/** @deprecated Prefer /api/billing/checkout — kept for demo one-click mock upgrades. */
export async function POST(req: Request) {
  return withHandler(async () => {
    const user = await requireUser();
    const body = schema.parse(await req.json().catch(() => ({ interval: "monthly" })));
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "PREMIUM",
        planExpiresAt: new Date(Date.now() + planDays(body.interval) * 24 * 60 * 60 * 1000),
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
      message: "Premium activated (demo). Use /api/billing/checkout for Stripe.",
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
