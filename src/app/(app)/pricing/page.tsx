import { getSessionUser, isPremium } from "@/server/auth/session";
import { PricingClient } from "@/components/saas/pricing-client";

export default async function PricingPage() {
  const user = await getSessionUser();
  return (
    <PricingClient
      premium={isPremium(user)}
      planExpiresAt={user?.planExpiresAt?.toISOString() ?? null}
    />
  );
}
