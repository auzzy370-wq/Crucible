import { jsonOk, withHandler } from "@/server/auth/api";
import { clerkConfigured, clerkPublishableKey } from "@/server/auth/clerk-bridge";

/** Clerk status + publishable key for the browser (publishable keys are public by design). */
export async function GET() {
  return withHandler(async () => {
    const enabled = clerkConfigured();
    const publishableKey = clerkPublishableKey() || null;
    return jsonOk({
      enabled,
      publishableKey,
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
      note: enabled
        ? "Clerk social (Google, GitHub, Apple, Discord, Facebook, X) is ready."
        : "Add CLERK_SECRET_KEY (and CLERK_PUBLISHABLE_KEY) in secrets to finish Clerk setup.",
    });
  });
}
