"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LEARN_DEMOS = [
  { label: "Learner", email: "candidate@gauntlet.local", password: "Gauntlet!Cand1" },
  { label: "Premium", email: "premium@gauntlet.local", password: "Gauntlet!Cand1" },
  { label: "Cyber", email: "cyber@gauntlet.local", password: "Gauntlet!Cand1" },
  { label: "Teammate", email: "teammate@gauntlet.local", password: "Gauntlet!Cand1" },
] as const;

const HIRE_DEMOS = [
  { label: "Hiring mgr", email: "hiring@gauntlet.local", password: "Gauntlet!Admin1" },
  { label: "Reviewer", email: "reviewer@gauntlet.local", password: "Gauntlet!Admin1" },
  { label: "Admin", email: "admin@gauntlet.local", password: "Gauntlet!Admin1" },
] as const;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const hireIntent = params.get("intent") === "hire";
  const [mode, setMode] = useState<"learn" | "hire">(hireIntent ? "hire" : "learn");
  const [email, setEmail] = useState(
    hireIntent ? "hiring@gauntlet.local" : "candidate@gauntlet.local",
  );
  const [password, setPassword] = useState(hireIntent ? "Gauntlet!Admin1" : "Gauntlet!Cand1");
  const [loading, setLoading] = useState(false);
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(hireIntent ? "hire" : "learn");
    if (hireIntent) {
      setEmail("hiring@gauntlet.local");
      setPassword("Gauntlet!Admin1");
    }
  }, [hireIntent]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/setup", { cache: "no-store" });
        if (!res.ok) {
          setDbOk(null);
          return;
        }
        const json = await res.json();
        setDbOk(Boolean(json?.data?.databaseReachable));
      } catch {
        setDbOk(null);
      }
    })();
  }, []);

  function pickDemo(account: { email: string; password: string }) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      type LoginJson = { ok?: boolean; error?: { message?: string } };
      let json: LoginJson | null = null;
      try {
        json = text ? (JSON.parse(text) as LoginJson) : null;
      } catch {
        json = null;
      }
      if (!res.ok || !json?.ok) {
        const gateway =
          res.status === 504 || res.status === 502 || res.status === 503
            ? "Login timed out on the server. Retry once — cold starts can be slow."
            : null;
        throw new Error(json?.error?.message || gateway || `Login failed (${res.status})`);
      }
      toast.success("Authenticated");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      let message = err instanceof Error ? err.message : "Login failed";
      if (/load failed|failed to fetch|networkerror/i.test(message)) {
        message = "Could not reach the server. Refresh and try again.";
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const demos = mode === "hire" ? HIRE_DEMOS : LEARN_DEMOS;

  return (
    <Card className="animate-rise relative w-full max-w-md border-cyan-400/20 bg-[#070b12]/90 backdrop-blur-sm">
      <CardHeader>
        <div className="mb-1 flex items-baseline gap-3">
          <span className="font-serif-display text-2xl tracking-tight text-[var(--landing-ink)]">Crucible</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--landing-teal)]">
            Learn · Hire
          </span>
        </div>
        <CardTitle className="font-serif-display text-xl sm:text-2xl">
          {mode === "hire" ? "Hire on evidence" : "Learn by proving"}
        </CardTitle>
        <CardDescription className="text-[var(--landing-mute)]">
          {mode === "hire"
            ? "Assign timed work, review isolated workspaces, and decide with scorecards — never résumé claims alone."
            : "Practice with the same timed judges employers use. Build a verified profile as you learn."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-1">
          <button
            type="button"
            className={cn(
              "min-h-10 rounded-md text-sm transition",
              mode === "learn" ? "bg-cyan-500/15 text-cyan-100" : "text-slate-400 hover:text-slate-200",
            )}
            onClick={() => {
              setMode("learn");
              pickDemo(LEARN_DEMOS[0]);
            }}
          >
            I want to learn
          </button>
          <button
            type="button"
            className={cn(
              "min-h-10 rounded-md text-sm transition",
              mode === "hire" ? "bg-amber-500/15 text-amber-100" : "text-slate-400 hover:text-slate-200",
            )}
            onClick={() => {
              setMode("hire");
              pickDemo(HIRE_DEMOS[0]);
            }}
          >
            I want to hire
          </button>
        </div>

        {mode === "learn" && (
          <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-sm text-slate-300">
            New here?{" "}
            <Link className="font-medium text-cyan-300 hover:underline" href="/register">
              Create a free learner account →
            </Link>
          </div>
        )}
        {mode === "hire" && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-slate-300">
            Employer demos explore assigning, reviewing, and analytics. Production hiring teams use seeded or invited
            staff accounts.
          </div>
        )}

        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {mode === "hire" ? "Hiring demos — click to fill" : "Learner demos — click to fill"}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {demos.map((account) => (
              <button
                key={account.email}
                type="button"
                className="min-h-10 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan-100"
                onClick={() => pickDemo(account)}
              >
                {account.label}
              </button>
            ))}
          </div>
          <div className="mt-2 break-all font-mono text-[11px] text-slate-400">
            {email} / {password}
          </div>
        </div>

        {dbOk === false && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            Database is not connected on this deploy. Add a Neon <span className="font-mono">DATABASE_URL</span> in
            Vercel, redeploy, then run <span className="font-mono">/api/setup</span> once.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
            {error}
          </div>
        )}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button className="w-full" disabled={loading || dbOk === false}>
            {loading ? "Entering…" : mode === "hire" ? "Enter hiring workspace" : "Continue learning"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          {mode === "hire" ? (
            <>
              Looking to practice instead?{" "}
              <button type="button" className="text-cyan-300 hover:underline" onClick={() => setMode("learn")}>
                Switch to learn
              </button>
            </>
          ) : (
            <>
              Hiring talent?{" "}
              <button type="button" className="text-cyan-300 hover:underline" onClick={() => setMode("hire")}>
                Switch to hire
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="landing-root relative flex min-h-screen items-center justify-center px-4 py-8 safe-top safe-bottom">
      <div className="landing-noise pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-50" />
      <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
