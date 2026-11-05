"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Official Clerk sign-in — unlocks Google / GitHub / Apple / Discord / Facebook / X
 * from the Clerk Dashboard social toggles (shared credentials in development).
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
