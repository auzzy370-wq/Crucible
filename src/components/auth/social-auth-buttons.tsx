"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ProviderRow = {
  id: string;
  label: string;
  enabled: boolean;
  startUrl: string;
};

const ICONS: Record<string, string> = {
  google: "G",
  github: "GH",
  apple: "",
  facebook: "f",
  discord: "D",
  x: "𝕏",
};

export function SocialAuthButtons({ heading = "Or continue with" }: { heading?: string }) {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/oauth/providers", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) setProviders(json.data.providers ?? []);
      } catch {
        /* ignore */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const enabled = providers.filter((p) => p.enabled);
  if (!loaded) {
    return <p className="text-center text-xs text-slate-500">Loading sign-in options…</p>;
  }
  if (!enabled.length) {
    return (
      <p className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-center text-xs text-slate-500">
        Social login is ready once Google, GitHub, Apple, Facebook, Discord, or X keys are added in secrets.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{heading}</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {enabled.map((p) => (
          <Button key={p.id} variant="secondary" className="justify-start gap-2" asChild>
            <a href={p.startUrl}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-900 font-mono text-[10px] text-slate-200">
                {ICONS[p.id] || p.label.slice(0, 1)}
              </span>
              {p.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
