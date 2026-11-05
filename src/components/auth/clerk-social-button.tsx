"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Strategy = "oauth_google" | "oauth_apple" | "oauth_x";

const PROVIDERS: { strategy: Strategy; label: string; mark: string }[] = [
  { strategy: "oauth_google", label: "Continue with Google", mark: "G" },
  { strategy: "oauth_apple", label: "Continue with Apple", mark: "A" },
  { strategy: "oauth_x", label: "Continue with X", mark: "𝕏" },
];

function ClerkOAuthButtons() {
  const { isLoaded, signIn } = useSignIn();
  const [busy, setBusy] = useState<Strategy | null>(null);

  async function startOAuth(strategy: Strategy) {
    if (!isLoaded || !signIn) {
      // Fall back to Clerk SignIn UI (still shows Google)
      window.location.href = "/sign-in";
      return;
    }
    setBusy(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/api/auth/clerk/handoff",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not open the provider sign-in page";
      toast.error(message);
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <Button
          key={p.strategy}
          className="w-full justify-start gap-3"
          variant={p.strategy === "oauth_google" ? "default" : "secondary"}
          disabled={Boolean(busy) || !isLoaded}
          onClick={() => void startOAuth(p.strategy)}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-black/20 font-mono text-[11px]">
            {p.mark}
          </span>
          {busy === p.strategy ? "Redirecting…" : p.label}
        </Button>
      ))}
      <p className="text-center text-[11px] text-slate-500">
        Google opens the Google account page.{" "}
        <Link href="/sign-in" className="text-cyan-400/90 underline-offset-2 hover:underline">
          All Clerk options
        </Link>
      </p>
    </div>
  );
}

/**
 * One-tap social buttons — Google / Apple / X jump straight to the provider page
 * (Clerk development shared credentials; toggled in the Clerk Dashboard).
 */
export function ClerkSocialButton() {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [note, setNote] = useState("Checking Clerk…");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/clerk/config", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) {
          setEnabled(Boolean(json.data.enabled));
          setNote(json.data.note || "");
        }
      } catch {
        setNote("Clerk unavailable");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return <p className="text-center text-xs text-slate-500">Loading social sign-in…</p>;
  }

  if (!enabled) {
    return (
      <div className="space-y-2">
        <Button className="w-full" variant="secondary" disabled>
          Social sign-in (Clerk secret pending)
        </Button>
        <p className="text-center text-[11px] text-slate-500">{note}</p>
      </div>
    );
  }

  return <ClerkOAuthButtons />;
}
