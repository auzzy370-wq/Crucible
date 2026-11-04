"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlanItem = {
  id: string;
  slug: string;
  title: string;
  difficulty: number;
  avgMinutes: number | null;
  done: boolean;
};

type Plan = {
  slug: string;
  title: string;
  subtitle: string;
  company?: string;
  role: string;
  days: number;
  premium: boolean;
  enrolled: boolean;
  completedCount: number;
  totalCount: number;
  percent: number;
  items: PlanItem[];
};

function diffLabel(d: number) {
  if (d <= 3) return "Easy";
  if (d <= 6) return "Medium";
  return "Hard";
}

export function StudyPlansClient(props: { plans: Plan[]; premium: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(props.plans[0]?.slug ?? null);

  async function enroll(planSlug: string, requiresPremium: boolean) {
    if (requiresPremium && !props.premium) {
      toast.error("Premium study plan");
      router.push("/pricing");
      return;
    }
    setBusy(planSlug);
    try {
      const res = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Enroll failed");
      toast.success("Enrolled");
      setOpen(planSlug);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enroll failed");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(planSlug: string, challengeSlug: string, done: boolean) {
    setBusy(`${planSlug}:${challengeSlug}`);
    try {
      const res = await fetch(`/api/study-plans/${planSlug}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeSlug, done: !done }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Update failed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">STUDY PLANS</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Paths with progress</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Role- and company-shaped tracks. Mark problems done as you grind — Premium unlocks exclusive packs.
          </p>
        </div>
        {!props.premium && (
          <Link href="/pricing">
            <Button variant="secondary">Unlock Premium plans</Button>
          </Link>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {props.plans.map((plan) => (
          <Card key={plan.slug} className={plan.premium ? "border-amber-500/20" : undefined}>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                {plan.company && <Badge variant="cyan">{plan.company}</Badge>}
                <Badge>{plan.role}</Badge>
                <Badge variant="amber">{plan.days}d</Badge>
                {plan.premium && <Badge variant="amber">Premium</Badge>}
              </div>
              <CardTitle className="text-lg">{plan.title}</CardTitle>
              <CardDescription>{plan.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>
                    {plan.completedCount}/{plan.totalCount} complete
                  </span>
                  <span className="font-mono">{plan.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${plan.percent}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!plan.enrolled ? (
                  <Button disabled={busy === plan.slug} onClick={() => enroll(plan.slug, plan.premium)}>
                    {busy === plan.slug ? "Enrolling…" : "Start plan"}
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setOpen(open === plan.slug ? null : plan.slug)}>
                    {open === plan.slug ? "Hide problems" : "Show problems"}
                  </Button>
                )}
              </div>
              {plan.enrolled && open === plan.slug && (
                <ul className="space-y-2">
                  {plan.items.map((item, idx) => (
                    <li
                      key={item.slug}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-100">
                          {idx + 1}. {item.title}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {diffLabel(item.difficulty)} · {item.avgMinutes ?? 30}m
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className={`rounded-md border px-2 py-1 text-xs ${
                            item.done
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                              : "border-slate-700 text-slate-400"
                          }`}
                          disabled={busy === `${plan.slug}:${item.slug}`}
                          onClick={() => toggle(plan.slug, item.slug, item.done)}
                        >
                          {item.done ? "Done" : "Mark done"}
                        </button>
                        <Link href="/challenges" className="text-xs text-cyan-300 hover:underline">
                          Open
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
