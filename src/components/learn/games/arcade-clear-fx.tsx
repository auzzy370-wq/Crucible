"use client";

import { useEffect, useState } from "react";
import { ForgeSparks, XpBurst } from "@/components/learn/forge-fun";

/** Brief overlay when an arcade drill banks XP. */
export function ArcadeClearFx({
  xp,
  trigger,
}: {
  xp: number;
  trigger: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger || xp <= 0) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 1400);
    return () => window.clearTimeout(t);
  }, [trigger, xp]);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-100/50 to-transparent" />
      <ForgeSparks density={12} />
      <XpBurst amount={xp} active />
    </div>
  );
}
