"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const clerkReady = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Official Clerk sign-in — unlocks Google / GitHub / Apple / Discord / Facebook / X
 * from the Clerk Dashboard social toggles (shared credentials in development).
 */
export function ClerkSocialButton() {
  if (!clerkReady) {
    return (
      <div className="space-y-2">
        <Button className="w-full" variant="secondary" disabled>
          Social sign-in (Clerk keys pending)
        </Button>
        <p className="text-center text-[11px] text-slate-500">
          Finish setup: in your own terminal run{" "}
          <code className="text-slate-300">npx clerk@latest auth login</code> then{" "}
          <code className="text-slate-300">npx clerk@latest env pull</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" variant="secondary" asChild>
        <Link href="/sign-in">Continue with Google / GitHub / Apple / more</Link>
      </Button>
      <p className="text-center text-[11px] text-slate-500">
        Powered by Clerk — social providers configured in your Clerk Dashboard.
      </p>
    </div>
  );
}
