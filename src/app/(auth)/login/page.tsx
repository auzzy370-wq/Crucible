"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Login failed");
      toast.success("Authenticated");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
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
            Elite software engineering and cybersecurity qualification platform. Seeded admin and candidate accounts available after setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Button className="w-full" disabled={loading}>
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
