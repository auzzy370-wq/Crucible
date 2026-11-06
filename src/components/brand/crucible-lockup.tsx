import Link from "next/link";
import { cn } from "@/lib/utils";

/** Geometric crucible mark — vessel + molten core. */
export function CrucibleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("h-full w-full", className)}>
      <path
        d="M8 10h24l-2.5 4.5v11.5c0 4.2-3.6 7.5-9.5 7.5S10.5 29.7 10.5 25.5V14.5L8 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 10V7.5C14 6.1 15.1 5 16.5 5h7C24.9 5 26 6.1 26 7.5V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22.5" r="4" fill="currentColor" fillOpacity="0.9" />
      <path
        d="M20 16.5v2.2M16.8 18.8l1.4 1.4M23.2 18.8l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
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
    mark: "h-8 w-8 rounded-lg p-1.5",
    title: "text-base tracking-[-0.02em]",
    tag: "text-[9px] tracking-[0.18em]",
  },
  md: {
    mark: "h-10 w-10 rounded-xl p-2",
    title: "text-xl tracking-[-0.02em]",
    tag: "text-[10px] tracking-[0.2em]",
  },
  lg: {
    mark: "h-12 w-12 rounded-xl p-2.5",
    title: "text-2xl tracking-[-0.025em]",
    tag: "text-[11px] tracking-[0.22em]",
  },
};

export function CrucibleLockup({
  href = "/dashboard",
  size = "md",
  showTagline = true,
  className,
  markClassName,
}: LockupProps) {
  const s = sizes[size];
  const inner = (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "crucible-mark flex shrink-0 items-center justify-center text-teal-500",
          s.mark,
          markClassName,
        )}
      >
        <CrucibleGlyph />
      </div>
      <div className="min-w-0">
        <div className={cn("truncate font-serif-display leading-none text-slate-900", s.title)}>
          Crucible
        </div>
        {showTagline && (
          <div className={cn("mt-1 truncate font-mono font-medium text-teal-600", s.tag)}>
            PROVE THE CRAFT
          </div>
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
