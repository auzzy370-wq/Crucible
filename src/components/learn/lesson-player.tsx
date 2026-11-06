"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonBody } from "@/components/learn/lesson-body";
import { ForgeSparks, XpBurst } from "@/components/learn/forge-fun";
import { LESSON_XP } from "@/server/learning/gamification";

export function LessonPlayer(props: {
  track: "interview" | "ai";
  pathLabel: string;
  pathHref: string;
  progressApi: string;
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
  lessonHref: (slug: string) => string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(props.done);
  const [busy, setBusy] = useState(false);
  const [celebration, setCelebration] = useState<{
    xp: number;
    combo: number;
    chapter: number;
  } | null>(null);

  async function mark(doneNext: boolean) {
    setBusy(true);
    try {
      const res = await fetch(props.progressApi, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug: props.slug, done: doneNext }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      setDone(doneNext);
      const xp = Number(json.data?.xpEarned ?? 0);
      const combo = Number(json.data?.comboXp ?? 0);
      const chapter = Number(json.data?.chapterXp ?? 0);
      if (doneNext && xp > 0) {
        setCelebration({ xp, combo, chapter });
        const bits = [`+${xp} XP`];
        if (combo) bits.push(`combo +${combo}`);
        if (chapter) bits.push(`chapter +${chapter}`);
        toast.success(`Lesson cleared · ${bits.join(" · ")}`);
      } else {
        toast.message(doneNext ? "Lesson marked complete" : "Marked incomplete");
        if (!doneNext) setCelebration(null);
      }
      if (doneNext && props.nextSlug) {
        // brief beat so celebration is visible
        setTimeout(() => router.push(props.lessonHref(props.nextSlug!)), 700);
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
    <div className="animate-rise mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={props.pathHref} className="text-teal-700 hover:underline">
          ← {props.pathLabel}
        </Link>
        <span className="text-slate-500">/</span>
        <span className="capitalize text-slate-500">{props.level}</span>
      </div>

      <header>
        <div className="flex flex-wrap gap-2">
          <Badge variant="cyan">{props.level}</Badge>
          <Badge>{props.minutes} min</Badge>
          <Badge variant="amber">+{LESSON_XP} XP</Badge>
          {done && <Badge variant="emerald">cleared</Badge>}
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

      {celebration && (
        <div className="learn-quest-card relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5">
          <ForgeSparks density={10} />
          <XpBurst amount={celebration.xp} active />
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-800">Lesson cleared</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-900">+{celebration.xp} XP</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="cyan">lesson +{LESSON_XP}</Badge>
              {celebration.combo > 0 && <Badge variant="amber">same-day combo +{celebration.combo}</Badge>}
              {celebration.chapter > 0 && <Badge variant="emerald">chapter clear +{celebration.chapter}</Badge>}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {props.nextSlug ? "Loading next node…" : "Chapter or path may be complete — check the map."}
            </p>
          </div>
        </div>
      )}

      <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 sm:p-6">
        <LessonBody md={props.bodyMd} />
      </article>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {!done ? (
          <Button disabled={busy} onClick={() => void mark(true)}>
            Clear lesson (+{LESSON_XP} XP){props.nextSlug ? " & continue" : ""}
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
        <Link href="/learn">
          <Button variant="ghost">Learn hub →</Button>
        </Link>
      </div>

      <nav className="flex justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
        {props.prevSlug ? (
          <Link href={props.lessonHref(props.prevSlug)} className="text-slate-600 hover:text-teal-800">
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {props.nextSlug ? (
          <Link href={props.lessonHref(props.nextSlug)} className="text-teal-700 hover:underline">
            Next →
          </Link>
        ) : (
          <Link href={props.pathHref} className="text-teal-700 hover:underline">
            Back to path →
          </Link>
        )}
      </nav>
    </div>
  );
}
