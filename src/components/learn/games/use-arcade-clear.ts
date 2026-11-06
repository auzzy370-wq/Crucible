"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function useArcadeClear(gameSlug: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function reportClear(opts?: { perfect?: boolean; score?: number }) {
    setBusy(true);
    try {
      const res = await fetch("/api/learn/games/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          gameSlug,
          perfect: Boolean(opts?.perfect),
          score: opts?.score,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Could not save");
      const xp = Number(json.data?.xpEarned ?? 0);
      if (xp > 0) toast.success(`Game cleared · +${xp} XP`);
      else toast.success("Nice run — streak updated");
      router.refresh();
      return json.data as { xpEarned: number; firstClear: boolean };
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { reportClear, busy };
}
