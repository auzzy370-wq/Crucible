"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TRACKS = [
  { value: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
  { value: "CYBERSECURITY", label: "Cybersecurity" },
  { value: "SECURE_FULL_STACK", label: "Secure Full-Stack" },
  { value: "PLATFORM_SRE", label: "Platform / SRE" },
  { value: "DATA_ML", label: "Data / ML Engineering" },
  { value: "MOBILE", label: "Mobile Engineering" },
  { value: "PRIVACY_ENGINEERING", label: "Privacy Engineering" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    track: "SOFTWARE_ENGINEERING",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          track: form.track,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Registration failed");
      toast.success("Account created — welcome to Crucible");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      toast.error(message);
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
          <CardTitle className="font-serif-display text-xl sm:text-2xl">Create your account</CardTitle>
          <CardDescription className="text-[var(--landing-mute)]">
            Real accounts are free. Demo logins stay on the sign-in page for exploration — use your email here to keep
            your verified profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                required
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                required
                type="password"
                autoComplete="new-password"
                minLength={10}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <p className="font-mono text-[11px] text-slate-500">At least 10 characters, with a letter and a number.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                required
                type="password"
                autoComplete="new-password"
                minLength={10}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track">Preferred track</Label>
              <select
                id="track"
                className="flex h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-base text-slate-100 sm:text-sm"
                value={form.track}
                onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
              >
                {TRACKS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link className="text-cyan-300 hover:underline" href="/login">
              Sign in
            </Link>
            {" · "}
            <Link className="text-slate-400 hover:underline" href="/login">
              Try demos
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
