"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonBody } from "@/components/learn/lesson-body";

export function AiLessonClient(props: {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: string;
  skills: string[];
  practiceSlug?: string | null;
  bodyMd: string;
  done: boolean;
  prevSlug: string | null;
  nextSlug: string | null;
}) {
  const router = useRouter();
  const [done, setDone] = useState(props.done);
  const [busy, setBusy] = useState(false);

  async function mark(doneNext: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/learn/ai/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug: props.slug, done: doneNext }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      setDone(doneNext);
      const xp = Number(json.data?.xpEarned ?? 0);
      toast.success(
        doneNext
          ? xp > 0
            ? `Lesson cleared · +${xp} XP · streak updated`
            : "Lesson marked complete"
          : "Marked incomplete",
      );
      if (doneNext && props.nextSlug) router.push(`/learn/ai/${props.nextSlug}`);
      else router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/learn/ai" className="text-teal-700 hover:underline">
          ← AI Craft
        </Link>
        <span className="text-slate-600">/</span>
        <span className="capitalize text-slate-500">{props.level}</span>
      </div>

      <header>
        <div className="flex flex-wrap gap-2">
          <Badge variant="violet">{props.level}</Badge>
          <Badge>{props.minutes} min</Badge>
          {done && <Badge variant="emerald">completed</Badge>}
        </div>
        <h1 className="mt-3 font-serif-display text-2xl sm:text-3xl">{props.title}</h1>
        <p className="mt-2 text-slate-600">{props.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {props.skills.map((s) => (
            <Badge key={s} variant="cyan">
              {s}
            </Badge>
          ))}
        </div>
      </header>

      <article className="rounded-2xl border border-slate-200 bg-white/70 p-5 sm:p-6">
        <LessonBody md={props.bodyMd} />
      </article>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {!done ? (
          <Button disabled={busy} onClick={() => void mark(true)}>
            Clear lesson (+50 XP){props.nextSlug ? " & continue" : ""}
          </Button>
        ) : (
          <Button variant="secondary" disabled={busy} onClick={() => void mark(false)}>
            Mark incomplete
          </Button>
        )}
        {props.practiceSlug && (
          <Link href={`/challenges?q=${encodeURIComponent(props.practiceSlug)}`}>
            <Button variant="secondary">Practice in problem bank</Button>
          </Link>
        )}
        <Link href="/challenges">
          <Button variant="ghost">Practice a problem →</Button>
        </Link>
      </div>

      <nav className="flex justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
        {props.prevSlug ? (
          <Link href={`/learn/ai/${props.prevSlug}`} className="text-slate-600 hover:text-teal-800">
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {props.nextSlug ? (
          <Link href={`/learn/ai/${props.nextSlug}`} className="text-teal-700 hover:underline">
            Next →
          </Link>
        ) : (
          <Link href="/learn/ai" className="text-teal-700 hover:underline">
            Back to path →
          </Link>
        )}
      </nav>
    </div>
  );
}
