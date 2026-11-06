import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-4">
      <Suspense fallback={<p className="text-slate-600">Loading sign-up…</p>}>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/api/auth/clerk/handoff" />
      </Suspense>
    </div>
  );
}
