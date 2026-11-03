import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "cyan" | "amber" | "rose" | "emerald" | "violet" }) {
  const styles = {
    default: "border-slate-700 bg-slate-900 text-slate-200",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  }[variant];
  return (
    <div
      className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", styles, className)}
      {...props}
    />
  );
}
