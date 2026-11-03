import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="font-mono text-xs tracking-[0.3em] text-cyan-300">SETTINGS</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Platform configuration</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm text-slate-400">
          <div>APP_URL = {process.env.NEXT_PUBLIC_APP_URL}</div>
          <div>EXECUTION_MODE = {process.env.EXECUTION_MODE ?? "process"}</div>
          <div>AI_FALLBACK_MOCK = {process.env.AI_FALLBACK_MOCK ?? "true"}</div>
          <div>Theme = dark (default) · light toggle via next-themes class strategy</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Privacy & employment decisioning</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          Human oversight is mandatory for qualification. Candidates may request accommodations on their profile.
          Automated scores assist reviewers and never autonomously hire. Data retention defaults: candidate artifacts 365
          days; audit logs longer for compliance. Deletion workflows are initiated by Super Admin via audit-logged
          operations.
        </CardContent>
      </Card>
    </div>
  );
}
