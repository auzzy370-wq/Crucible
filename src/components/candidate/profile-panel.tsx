"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CandidateProfilePanel() {
  const [profile, setProfile] = useState<any>(null);
  const [cyber, setCyber] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/candidates/me");
    const json = await res.json();
    if (json.ok) {
      setProfile(json.data);
      setCyber((json.data.cybersecurity ?? []).join(", "));
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    const res = await fetch("/api/candidates/me", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        headline: profile.headline,
        bio: profile.bio,
        portfolioUrl: profile.portfolioUrl || "",
        githubUrl: profile.githubUrl || "",
        cybersecurity: cyber
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        preferredTrack: profile.preferredTrack,
        accommodations: profile.accommodations,
        publicSlug: profile.publicSlug || "",
        publicEnabled: Boolean(profile.publicEnabled),
      }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Save failed");
    setProfile(json.data);
    toast.success("Profile updated");
  }

  async function uploadResume(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/candidates/me/resume", { method: "POST", body: fd });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error?.message || "Upload failed");
    toast.success("Résumé uploaded & analyzed (claims only)");
    await load();
  }

  if (loading) return <div className="text-slate-400">Loading profile…</div>;
  if (!profile) return <div className="text-rose-300">Profile unavailable</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={profile.headline ?? ""}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Preferred track</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
              value={profile.preferredTrack}
              onChange={(e) => setProfile({ ...profile, preferredTrack: e.target.value })}
            >
              <option value="SOFTWARE_ENGINEERING">Software Engineering</option>
              <option value="CYBERSECURITY">Cybersecurity</option>
              <option value="SECURE_FULL_STACK">Secure Full-Stack</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Cybersecurity focus areas (comma-separated)</Label>
            <Input value={cyber} onChange={(e) => setCyber(e.target.value)} placeholder="appsec, detection, IR, iam" />
          </div>
          <div className="space-y-2">
            <Label>Accessibility accommodations</Label>
            <Textarea
              value={profile.accommodations ?? ""}
              onChange={(e) => setProfile({ ...profile, accommodations: e.target.value })}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-slate-800 p-3">
            <Label>Public qualification profile</Label>
            <p className="text-xs text-slate-500">
              Share verified skills with employers. Claimed résumé skills never appear on the public page.
            </p>
            <Input
              placeholder="public-slug"
              value={profile.publicSlug ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  publicSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(profile.publicEnabled)}
                onChange={(e) => setProfile({ ...profile, publicEnabled: e.target.checked })}
              />
              Publish at /u/{profile.publicSlug || "…"}
            </label>
            {profile.publicEnabled && profile.publicSlug && (
              <a className="text-sm text-cyan-300 hover:underline" href={`/u/${profile.publicSlug}`} target="_blank" rel="noreferrer">
                Open public profile →
              </a>
            )}
          </div>
          <Button onClick={save}>Save profile</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Résumé upload (PDF)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0])}
            />
            <p className="mt-2 text-xs text-amber-200/90">
              AI extraction marks skills as CLAIMED only. Assessment and human review verification are separate lanes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill evidence lanes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                ["claimed", "Claimed", "amber"],
                ["portfolio", "Portfolio", "cyan"],
                ["assessment", "Assessment verified", "emerald"],
                ["humanReview", "Human review", "violet"],
              ] as const
            ).map(([key, label, variant]) => (
              <div key={key}>
                <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">{label}</div>
                <div className="flex flex-wrap gap-1">
                  {(profile.skillBuckets?.[key] ?? []).map((s: any) => (
                    <Badge key={s.id} variant={variant as any}>
                      {s.name}
                    </Badge>
                  ))}
                  {!(profile.skillBuckets?.[key] ?? []).length && (
                    <span className="text-xs text-slate-500">None yet</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
