"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gauntlet.local");
  const [password, setPassword] = useState("Gauntlet!Admin1");
  const [loading, setLoading] = useState(false);
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/setup");
        const json = await res.json();
        setDbOk(Boolean(json?.data?.databaseReachable));
      } catch {
        setDbOk(false);
      }
    })();
  }, []);

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
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error?.message || `Login failed (${res.status})`);
      }
      toast.success("Authenticated");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 grid-overlay" />
      <Card className="animate-rise relative w-full max-w-md border-cyan-500/20">
        <CardHeader>
          <div className="mb-2 font-mono text-xs tracking-[0.35em] text-cyan-300">ENGINEERING GAUNTLET</div>
          <CardTitle className="text-2xl">Sign in to operations</CardTitle>
          <CardDescription>
            Elite software engineering and cybersecurity qualification platform. Seeded admin and candidate accounts
            available after setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbOk === false && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              Database is not connected on this deploy. Add a Neon <span className="font-mono">DATABASE_URL</span> in
              Vercel, redeploy, then run <span className="font-mono">/api/setup</span> once. Claiming the temporary
              URL alone will not make login work.
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
              {loading ? "Authenticating…" : "Enter platform"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Candidate?{" "}
            <Link className="text-cyan-300 hover:underline" href="/register">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
