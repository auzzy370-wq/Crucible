"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/** Completes OAuth redirect (Google / Apple / X) then continues to handoff. */
export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-4">
      <p className="text-sm text-slate-400">Finishing sign-in…</p>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
