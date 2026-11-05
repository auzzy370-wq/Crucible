import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const clerkReady = Boolean(
  process.env.CLERK_SECRET_KEY &&
    (process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
);

/**
 * When Clerk keys are present (env pull), attach Clerk auth state.
 * Otherwise pass through so Crucible cookie sessions keep working.
 */
export default clerkReady
  ? clerkMiddleware()
  : function passThrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
