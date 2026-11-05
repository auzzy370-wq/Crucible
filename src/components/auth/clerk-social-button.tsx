"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ClerkConfig = { enabled: boolean; publishableKey: string | null; note: string };

/**
 * One-button social hub via Clerk. Development Clerk apps include shared
 * Google / GitHub / Apple / Discord / Facebook / X credentials — no per-provider OAuth apps.
 */
export function ClerkSocialButton() {
  const router = useRouter();
  const [config, setConfig] = useState<ClerkConfig | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/clerk/config", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setConfig(json.data);
      } catch {
        setConfig({ enabled: false, publishableKey: null, note: "Clerk unavailable" });
      }
    })();
  }, []);

  async function openClerk() {
    if (!config?.enabled || !config.publishableKey) {
      toast.message(
        "Create a free app at clerk.com (2 minutes), enable social providers, then add CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY in secrets.",
      );
      return;
    }
    setBusy(true);
    try {
      // Load Clerk JS from CDN — avoids heavy Next middleware rewrite
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!w.Clerk) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Could not load Clerk"));
          document.head.appendChild(s);
        });
      }
      const Clerk = w.Clerk;
      const clerk = typeof Clerk === "function" ? new Clerk(config.publishableKey) : Clerk;
      if (typeof clerk.load === "function") await clerk.load();
      await clerk.openSignIn({
        afterSignInUrl: window.location.href,
        afterSignUpUrl: window.location.href,
      });

      // Poll for session after the modal closes / completes
      const started = Date.now();
      while (Date.now() - started < 120_000) {
        await new Promise((r) => setTimeout(r, 600));
        const session = clerk.session;
        if (session) {
          const sessionToken = await session.getToken();
          if (!sessionToken) continue;
          const res = await fetch("/api/auth/clerk", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionToken }),
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error?.message || "Clerk sign-in failed");
          toast.success(`Signed in as ${json.data.email}`);
          router.push("/dashboard");
          router.refresh();
          return;
        }
        // If user closed modal without signing in, bail once Clerk reports no active attempt
        if (clerk.client?.activeSessions?.length === 0 && Date.now() - started > 8_000) {
          // keep waiting — modal may still be open
        }
      }
      toast.message("Sign-in timed out — try again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Social sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  if (!config) {
    return <p className="text-center text-xs text-slate-500">Loading social sign-in…</p>;
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" variant="secondary" disabled={busy} onClick={() => void openClerk()}>
        {busy
          ? "Opening social sign-in…"
          : config.enabled
            ? "Continue with Google / GitHub / Apple / more"
            : "Enable social sign-in (Clerk — free)"}
      </Button>
      <p className="text-center text-[11px] text-slate-500">{config.note}</p>
    </div>
  );
}
