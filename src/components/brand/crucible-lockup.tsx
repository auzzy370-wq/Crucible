import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Stamp mark — a solid “C” cut from a rounded plate.
 * Reads at 16px; no illustrative pot/vessel.
 */
export function CrucibleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={cn("h-full w-full", className)}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M22.2 10.4a7.6 7.6 0 1 0 0 11.2"
        stroke="var(--mark-cut, #070d14)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type LockupProps = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  markClassName?: string;
};

const sizes = {
  sm: {
    mark: "h-7 w-7",
    title: "text-[15px] tracking-[-0.03em]",
    tag: "text-[9px] tracking-[0.16em]",
    gap: "gap-2.5",
  },
  md: {
    mark: "h-9 w-9",
    title: "text-[1.35rem] tracking-[-0.03em]",
    tag: "text-[10px] tracking-[0.18em]",
    gap: "gap-3",
  },
  lg: {
    mark: "h-11 w-11",
    title: "text-[1.65rem] tracking-[-0.035em]",
    tag: "text-[11px] tracking-[0.2em]",
    gap: "gap-3.5",
  },
};

export function CrucibleLockup({
  href = "/dashboard",
  size = "md",
  showTagline = false,
  className,
  markClassName,
}: LockupProps) {
  const s = sizes[size];
  const inner = (
    <div className={cn("flex items-center", s.gap, className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center text-teal-500 [--mark-cut:#f3f8fc] dark:[--mark-cut:#070d14]",
          s.mark,
          markClassName,
        )}
      >
        <CrucibleGlyph />
      </div>
      <div className="min-w-0 leading-none">
        <div className={cn("truncate font-serif-display text-slate-900", s.title)}>Crucible</div>
        {showTagline && (
          <div className={cn("mt-1.5 truncate font-mono text-slate-500", s.tag)}>PROVE THE CRAFT</div>
        )}
      </div>
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40">
      {inner}
    </Link>
  );
}
