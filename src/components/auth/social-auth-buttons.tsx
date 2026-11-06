"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProviderRow = {
  id: string;
  label: string;
  enabled: boolean;
  startUrl: string;
};

const PRIMARY = ["google", "apple", "github"] as const;
const SECONDARY = ["discord", "facebook", "x"] as const;

function ProviderIcon({ id }: { id: string }) {
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
        />
        <path
          fill="#34A853"
          d="M6.6 14.3l-.9.7-2.5 1.9C4.9 19.1 8.2 21 12 21c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.6-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.5z"
        />
        <path
          fill="#4A90E2"
          d="M3.2 7.1C2.4 8.6 2 10.2 2 12s.4 3.4 1.2 4.9l3.4-2.6C6.2 13.4 6 12.7 6 12s.2-1.4.5-2.1L3.2 7.1z"
        />
        <path
          fill="#FBBC05"
          d="M12 6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.4 3.3 14.4 2.5 12 2.5 8.2 2.5 4.9 4.4 3.2 7.1l3.3 2.6C7.9 7.5 9.8 6 12 6z"
        />
      </svg>
    );
  }
  if (id === "apple") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3.1.8c1.3 0 2.1-1.1 2.9-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.7-3.4zM14.2 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
      </svg>
    );
  }
  if (id === "github") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
      </svg>
    );
  }
  const mark: Record<string, string> = { discord: "D", facebook: "f", x: "𝕏" };
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center font-mono text-[10px] font-semibold">
      {mark[id] || "•"}
    </span>
  );
}

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

  const byId = Object.fromEntries(providers.map((p) => [p.id, p]));
  const primary = PRIMARY.map((id) => byId[id]).filter(Boolean) as ProviderRow[];
  const secondary = SECONDARY.map((id) => byId[id]).filter((p) => p?.enabled) as ProviderRow[];
  const anyEnabled = providers.some((p) => p.enabled);

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{heading}</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {!loaded ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-md border border-slate-200 bg-slate-100/80" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {primary.map((p) =>
              p.enabled ? (
                <Button
                  key={p.id}
                  variant="secondary"
                  className={cn(
                    "justify-center gap-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
                    p.id === "apple" && "bg-[#12141a] text-white hover:bg-black",
                  )}
                  asChild
                >
                  <a href={p.startUrl}>
                    <ProviderIcon id={p.id} />
                    {p.label}
                  </a>
                </Button>
              ) : (
                <Button
                  key={p.id}
                  type="button"
                  variant="secondary"
                  disabled
                  title={`Add ${p.label} OAuth credentials to enable`}
                  className="justify-center gap-2 opacity-60"
                >
                  <ProviderIcon id={p.id} />
                  {p.label}
                </Button>
              ),
            )}
          </div>

          {secondary.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {secondary.map((p) => (
                <Button key={p.id} variant="secondary" className="justify-start gap-2" asChild>
                  <a href={p.startUrl}>
                    <ProviderIcon id={p.id} />
                    {p.label}
                  </a>
                </Button>
              ))}
            </div>
          )}

          {!anyEnabled && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
              Social login uses your own Google / Apple / GitHub apps (no Clerk). Add{" "}
              <span className="font-mono">GOOGLE_CLIENT_ID</span> +{" "}
              <span className="font-mono">GOOGLE_CLIENT_SECRET</span> (and Apple / GitHub pairs) in app secrets,
              then set the callback to{" "}
              <span className="font-mono">/api/auth/oauth/&#123;provider&#125;/callback</span>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
