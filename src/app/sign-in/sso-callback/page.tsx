"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/** Completes OAuth redirect (Google / Apple / X) then continues to handoff. */
export default function SSOCallbackPage() {
  return (
    <div className="landing-root flex min-h-screen items-center justify-center px-4">
      <p className="text-sm text-slate-600">Finishing sign-in…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
