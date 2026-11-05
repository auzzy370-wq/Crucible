import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { appBaseUrl } from "@/server/auth/oauth/config";
import { loginWithClerkProfile } from "@/server/auth/clerk-bridge";

export const runtime = "nodejs";

/**
 * After Clerk Account Portal / embedded sign-in, sync the Clerk user into a
 * Crucible session cookie and send them to the dashboard.
 */
export async function GET(req: NextRequest) {
  const base = appBaseUrl(req);
  const fail = new URL("/login", base);
  fail.searchParams.set("oauth_error", "Clerk sign-in did not complete");

  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return Response.redirect(fail.toString(), 302);
    }
    const session = await auth();
    if (!session.userId) {
      return Response.redirect(new URL("/sign-in", base).toString(), 302);
    }
    const user = await currentUser();
    if (!user) {
      return Response.redirect(fail.toString(), 302);
    }
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress;
    if (!email) {
      fail.searchParams.set("oauth_error", "Clerk account has no email");
      return Response.redirect(fail.toString(), 302);
    }
    await loginWithClerkProfile({
      clerkUserId: user.id,
      email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || email,
      avatarUrl: user.imageUrl,
    }, {
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    return Response.redirect(new URL("/dashboard", base).toString(), 302);
  } catch (err) {
    fail.searchParams.set(
      "oauth_error",
      err instanceof Error ? err.message.slice(0, 160) : "Clerk handoff failed",
    );
    return Response.redirect(fail.toString(), 302);
  }
}
