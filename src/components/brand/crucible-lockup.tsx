import Link from "next/link";
import { cn } from "@/lib/utils";

/** Stamp mark — bold C cut from a rounded plate. */
export function CrucibleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("h-full w-full", className)}>
      <rect width="40" height="40" rx="6" fill="currentColor" />
      <path
        d="M27.5 12.8a9.6 9.6 0 1 0 0 14.4"
        stroke="var(--mark-cut, #07090d)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type LockupProps = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  /** Hide the wordmark below this breakpoint (mark stays). */
  wordmarkFrom?: "sm" | "md" | "always";
  className?: string;
  markClassName?: string;
};

const sizes = {
  sm: {
    mark: "h-8 w-8",
    title: "text-[1.05rem] tracking-[-0.03em]",
    tag: "text-[9px] tracking-[0.16em]",
    gap: "gap-2",
  },
  md: {
    mark: "h-11 w-11",
    title: "text-[1.7rem] tracking-[-0.035em]",
    tag: "text-[10px] tracking-[0.18em]",
    gap: "gap-2.5",
  },
  lg: {
    mark: "h-12 w-12",
    title: "text-[2rem] tracking-[-0.04em]",
    tag: "text-[11px] tracking-[0.2em]",
    gap: "gap-3",
  },
};

export function CrucibleLockup({
  href = "/dashboard",
  size = "md",
  showTagline = false,
  wordmarkFrom = "always",
  className,
  markClassName,
}: LockupProps) {
  const s = sizes[size];
  const wordmarkVisibility =
    wordmarkFrom === "sm" ? "hidden sm:block" : wordmarkFrom === "md" ? "hidden md:block" : "block";
  const inner = (
    <div className={cn("flex items-center", s.gap, className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center text-[var(--brand)] [--mark-cut:#f7fbfd] dark:[--mark-cut:#07090d]",
          s.mark,
          markClassName,
        )}
      >
        <CrucibleGlyph />
      </div>
      <div className={cn("min-w-0 leading-none", wordmarkVisibility)}>
        <div className={cn("font-serif-display text-slate-900", s.title)}>Crucible</div>
        {showTagline && (
          <div className={cn("mt-1.5 font-mono text-slate-500", s.tag)}>PROVE THE CRAFT</div>
        )}
      </div>
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40">
      {inner}
    </Link>
  );
}
