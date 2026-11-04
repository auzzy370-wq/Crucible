"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_PRICING, PREMIUM_FEATURES } from "@/lib/saas";

export function PricingClient(props: { premium: boolean; planExpiresAt?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");

  async function upgrade() {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Upgrade failed");
      toast.success("Premium unlocked");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upgrade failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise space-y-8">
      <header className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">CRUCIBLE SAAS</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Interview prep that feels like the real loop
        </h1>
        <p className="mt-3 text-slate-400">
          Free forever for core problemset practice. Premium unlocks company intel, lightning judging, simulations,
          autocomplete, debugger, and unlimited playgrounds.
        </p>
        {props.premium && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100">
            <Badge variant="amber">Premium</Badge>
            Active
            {props.planExpiresAt ? ` · renews/expires ${new Date(props.planExpiresAt).toLocaleDateString()}` : ""}
          </div>
        )}
      </header>

      <section className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Core coding problemset + project assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="font-mono text-3xl text-slate-100">$0</div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Public coding problems</li>
              <li>60-minute timed sessions</li>
              <li>3 playgrounds</li>
              <li>Standard judge queue</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Premium</CardTitle>
              <Badge variant="cyan">Most popular</Badge>
            </div>
            <CardDescription>Everything teams use to prep for FAANG + startups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="font-mono text-3xl text-slate-50">
                ${interval === "yearly" ? PLAN_PRICING.yearly : PLAN_PRICING.monthly}
              </div>
              <div className="pb-1 text-sm text-slate-400">/{interval === "yearly" ? "year" : "month"}</div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={interval === "monthly" ? "default" : "secondary"}
                onClick={() => setInterval("monthly")}
              >
                Monthly
              </Button>
              <Button
                type="button"
                size="sm"
                variant={interval === "yearly" ? "default" : "secondary"}
                onClick={() => setInterval("yearly")}
              >
                Yearly · save more
              </Button>
            </div>
            <Button className="w-full" disabled={busy || props.premium} onClick={upgrade}>
              {props.premium ? "Already Premium" : busy ? "Activating…" : "Upgrade to Premium"}
            </Button>
            <p className="text-xs text-slate-500">Demo billing activates instantly — swap in Stripe Checkout for prod.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PREMIUM_FEATURES.map((f) => (
          <Card key={f.id} className="border-slate-800/90">
            <CardHeader>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-400">{f.blurb}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
