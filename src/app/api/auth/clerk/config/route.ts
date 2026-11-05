import { jsonOk, withHandler } from "@/server/auth/api";
import { clerkConfigured, clerkPublishableKey } from "@/server/auth/clerk-bridge";

/** Public Clerk publishable key for the browser (no secret). */
export async function GET() {
  return withHandler(async () => {
    return jsonOk({
      enabled: clerkConfigured(),
      publishableKey: clerkConfigured() ? clerkPublishableKey() : null,
      note: clerkConfigured()
        ? "Clerk social (Google, GitHub, Apple, Discord, Facebook, X) is ready."
        : "Add CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY from a free clerk.com app to unlock all social logins with one setup.",
    });
  });
}
