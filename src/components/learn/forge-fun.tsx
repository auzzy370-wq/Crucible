"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/** Ambient forge sparks — decorative, brand-orange, density scales with heat. */
export function ForgeSparks({
  density = 8,
  className,
}: {
  density?: number;
  className?: string;
}) {
  const sparks = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 37) % 84)}%`,
        delay: `${(i * 0.35) % 2.4}s`,
        duration: `${2.2 + (i % 5) * 0.35}s`,
        size: 3 + (i % 3),
      })),
    [density],
  );

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {sparks.map((s) => (
        <span
          key={s.id}
          className="forge-spark absolute bottom-2 rounded-full bg-[var(--brand)]"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}

/** Count XP up on mount for a snappy forge feel. */
export function AnimatedXp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{shown.toLocaleString()}</span>;
}

/** Floating +XP burst used after clears. */
export function XpBurst({
  amount,
  label = "XP",
  active,
}: {
  amount: number;
  label?: string;
  active: boolean;
}) {
  if (!active || amount <= 0) return null;
  return (
    <div className="forge-xp-burst pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center" aria-live="polite">
      <span className="rounded-md bg-[var(--brand)] px-3 py-1.5 font-mono text-sm font-semibold text-white shadow-lg shadow-orange-500/25">
        +{amount} {label}
      </span>
    </div>
  );
}

/** Cleared quest stamp. */
export function QuestClearedMark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="forge-quest-check inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 text-xs font-bold text-white">
      ✓
    </span>
  );
}

/** Shimmer overlay for unlocked medals. */
export function MedalShine({ active }: { active: boolean }) {
  if (!active) return null;
  return <span className="forge-medal-shine pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden />;
}
