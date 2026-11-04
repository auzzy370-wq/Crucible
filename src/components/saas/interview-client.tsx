"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { COMPANIES } from "@/lib/saas";

type Sim = {
  id: string;
  company: string;
  role: string;
  status: string;
  timedMinutes: number;
  createdAt: string;
  challenge: { title: string; slug: string; difficulty: number };
};

export function InterviewClient(props: { premium: boolean; sims: Sim[] }) {
  const router = useRouter();
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Software Engineer");
  const [busy, setBusy] = useState(false);

  async function start() {
    if (!props.premium) {
      toast.error("Interview Simulations require Premium");
      router.push("/pricing");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company, role }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not start");
      toast.success(`${company} simulation ready — ${json.data.timedMinutes}m`);
      if (json.data.workspaceId) {
        router.push(`/workspace/${json.data.workspaceId}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">INTERVIEW SIMULATIONS</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Practice under pressure</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Choose a company, get a timed question pulled from real frequency data, and test your skills with Lightning
            Judge priority when you&apos;re on Premium.
          </p>
        </div>
        {!props.premium && (
          <Link href="/pricing">
            <Button>Unlock with Premium</Button>
          </Link>
        )}
      </header>

      <Card className={props.premium ? "border-cyan-500/25" : "border-slate-800"}>
        <CardHeader>
          <CardTitle>Start a mock loop</CardTitle>
          <CardDescription>
            {props.premium
              ? "Premium: company packs + timed workspace provisioned instantly."
              : "Preview the flow — upgrade to launch a live simulation."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompany(c)}
                className={`rounded-md border px-2.5 py-1.5 text-xs ${
                  company === c
                    ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100"
                    : "border-slate-800 text-slate-400 hover:bg-slate-900"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" />
          </div>
          <Button disabled={busy} onClick={start}>
            {busy ? "Provisioning…" : `Start ${company} simulation`}
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent simulations</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {props.sims.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="cyan">{s.company}</Badge>
                  <Badge>{s.status}</Badge>
                  <Badge variant="amber">{s.timedMinutes}m</Badge>
                </div>
                <CardTitle className="text-base">{s.challenge.title}</CardTitle>
                <CardDescription>
                  {s.role} · {new Date(s.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
          {!props.sims.length && (
            <Card className="md:col-span-2">
              <CardContent className="py-10 text-center text-slate-500">No simulations yet.</CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
