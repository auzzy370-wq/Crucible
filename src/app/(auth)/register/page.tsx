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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 grid-overlay" />
      <Card className="animate-rise relative w-full max-w-lg border-emerald-500/20">
        <CardHeader>
          <div className="mb-2 font-mono text-xs tracking-[0.35em] text-emerald-300">CANDIDATE ONBOARDING</div>
          <CardTitle className="text-2xl">Create candidate account</CardTitle>
          <CardDescription>
            Choose a primary track. You can still be assigned assessments across software engineering and cybersecurity.
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
