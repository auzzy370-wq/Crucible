"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "Secondary OpenAI-compatible",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
  });

  async function load() {
    const res = await fetch("/api/admin/ai-providers");
    const json = await res.json();
    if (json.ok) setProviders(json.data);
    else toast.error(json.error?.message || "Admin only");
  }

  useEffect(() => {
    void load();
  }, []);

  async function addProvider() {
    const res = await fetch("/api/admin/ai-providers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, enabled: true }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Failed");
    toast.success("Provider added");
    await load();
  }

  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">SUPER ADMIN</p>
        <h1 className="mt-2 text-3xl font-semibold">Platform security & AI configuration</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Configure LLM providers via environment variable names — never hardcoded keys. Manage scoring policies and
          execution isolation posture for both software engineering and cybersecurity labs.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((p) => (
              <div key={p.id} className="rounded-lg border border-slate-800 p-3 text-sm">
                <div className="font-medium">{p.name}</div>
                <div className="font-mono text-xs text-slate-500">
                  {p.model} · key env {p.apiKeyEnv}
                </div>
                <div className="mt-1 flex gap-2">
                  {p.isDefault && <Badge variant="cyan">default</Badge>}
                  <Badge variant={p.apiKeyConfigured ? "emerald" : "amber"}>
                    {p.apiKeyConfigured ? "key present" : "mock fallback"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(form).map(([k, v]) => (
              <Input
                key={k}
                value={v}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={k}
              />
            ))}
            <Button onClick={addProvider}>Save provider</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security posture notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p>
            Candidate code executes in disposable sandboxes with CPU/memory/timeouts and restricted networking. Docker
            socket must not be available inside candidate workloads. Cybersecurity controlled-vuln labs are isolated and
            must never target external systems.
          </p>
          <p>
            Audit logs capture auth, assignment, execution, review, and incident actions. Session cookies are HTTP-only.
            Résumé uploads validate PDF magic bytes and size.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
