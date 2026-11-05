import { jsonOk, withHandler } from "@/server/auth/api";
import { clerkConfigured } from "@/server/auth/clerk-bridge";

/** Whether Clerk is ready (does not expose secrets). */
export async function GET() {
  return withHandler(async () => {
    const enabled = clerkConfigured();
    return jsonOk({
      enabled,
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
      note: enabled
        ? "Clerk social (Google, GitHub, Apple, Discord, Facebook, X) is ready."
        : "Run npx clerk@latest auth login && npx clerk@latest env pull in your terminal to finish Clerk setup.",
    });
  });
}
