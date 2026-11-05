import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-4">
      <Suspense fallback={<p className="text-slate-400">Loading sign-in…</p>}>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/api/auth/clerk/handoff" />
      </Suspense>
    </div>
  );
}
