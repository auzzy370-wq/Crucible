import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { appBaseUrl } from "@/server/auth/oauth/config";

export const runtime = "nodejs";

const COOKIE = "gauntlet_session";

function sessionCookieSecure(req: NextRequest) {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") return true;
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (appUrl.startsWith("https://")) return true;
  return req.headers.get("x-forwarded-proto") === "https";
}

/**
 * One-click magic login — attaches an existing session token as the browser cookie.
 * Used for bootstrap admin access without OAuth app setup.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const base = appBaseUrl(req);
  try {
    const { token } = await ctx.params;
    const fail = new URL("/login", base);
    fail.searchParams.set("oauth_error", "That sign-in link is invalid or expired");

    if (!token || token.length < 20) {
      return Response.redirect(fail.toString(), 302);
    }

    const session = await prisma.session.findUnique({
      where: { token },
      select: { token: true, expiresAt: true },
    });
    if (!session || session.expiresAt < new Date()) {
      return Response.redirect(fail.toString(), 302);
    }

    const secure = sessionCookieSecure(req);
    const cookie = [
      `${COOKIE}=${session.token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Expires=${session.expiresAt.toUTCString()}`,
      secure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    return new Response(null, {
      status: 302,
      headers: {
        Location: new URL("/dashboard", base).toString(),
        "Set-Cookie": cookie,
      },
    });
  } catch (err) {
    const fail = new URL("/login", base);
    fail.searchParams.set(
      "oauth_error",
      err instanceof Error ? err.message.slice(0, 120) : "Sign-in link failed",
    );
    return Response.redirect(fail.toString(), 302);
  }
}
