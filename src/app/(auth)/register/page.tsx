"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    track: "SOFTWARE_ENGINEERING",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Registration failed");
      toast.success("Account created");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-root relative flex min-h-screen items-center justify-center px-4 py-8 safe-top safe-bottom">
      <div className="landing-noise pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-50" />
      <Card className="animate-rise relative w-full max-w-lg border-cyan-400/20 bg-[#070b12]/90 backdrop-blur-sm">
        <CardHeader>
          <div className="mb-1 flex items-baseline gap-3">
            <span className="font-serif-display text-2xl tracking-tight text-[var(--landing-ink)]">Crucible</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--landing-teal)]">
              Enter the crucible
            </span>
          </div>
          <CardTitle className="font-serif-display text-xl sm:text-2xl">Start free</CardTitle>
          <CardDescription className="text-[var(--landing-mute)]">
            Choose a primary track — software engineering or cybersecurity. Timed sessions, hidden harnesses, and a
            verified profile when you prove the craft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                required
                type="password"
                minLength={10}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred track</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
              >
                <option value="SOFTWARE_ENGINEERING">Software Engineering</option>
                <option value="CYBERSECURITY">Cybersecurity</option>
                <option value="SECURE_FULL_STACK">Secure Full-Stack</option>
              </select>
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Already registered?{" "}
            <Link className="text-cyan-300 hover:underline" href="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
