"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Crosshair,
  Boxes,
  GitBranch,
  ScrollText,
  Settings,
  Terminal,
  Siren,
  Network,
  LogOut,
  BrainCircuit,
  Menu,
  X,
  Sparkles,
  FlaskConical,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Operations", icon: LayoutDashboard },
  { href: "/challenges", label: "Problemset", icon: Boxes },
  { href: "/interview", label: "Interview Sims", icon: Timer },
  { href: "/playgrounds", label: "Playgrounds", icon: FlaskConical },
  { href: "/pricing", label: "Premium", icon: Sparkles },
  { href: "/assessments", label: "Assessments", icon: Crosshair },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/reviews", label: "Technical Review", icon: ScrollText },
  { href: "/teams", label: "Team Crucible", icon: Network },
  { href: "/incidents", label: "Incident Sims", icon: Siren },
  { href: "/architecture", label: "Architecture", icon: BrainCircuit },
  { href: "/workspace", label: "Workspace", icon: Terminal },
  { href: "/admin", label: "Admin / Security", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 px-3 pb-6">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active ? "bg-cyan-500/10 text-cyan-200" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string; plan?: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const brand = (
    <div className="flex items-center gap-3">
      <div className="pulse-live flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300">
        CR
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold tracking-[0.22em] text-slate-100">CRUCIBLE</div>
        <div className="truncate text-[10px] font-medium tracking-[0.18em] text-cyan-300/90">PROVE THE CRAFT</div>
      </div>
    </div>
  );

  const userBlock = (
    <div className="border-t border-slate-800/80 p-4">
      <div className="mb-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium text-slate-100">{user.name}</div>
          {user.plan === "PREMIUM" && <Badge variant="amber">Premium</Badge>}
        </div>
        <div className="truncate font-mono text-xs text-slate-500">{user.role}</div>
      </div>
      {user.plan !== "PREMIUM" && (
        <Link href="/pricing" className="mb-2 block text-center text-xs text-amber-200 hover:underline">
          Upgrade to Premium →
        </Link>
      )}
      <Button variant="secondary" size="sm" className="w-full" onClick={logout}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/95 px-4 py-3 backdrop-blur lg:hidden safe-top">
        <Link href="/dashboard" className="min-w-0">
          {brand}
        </Link>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-label="Close menu overlay"
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(100%,20rem)] max-w-full flex-col border-r border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-200 ease-out safe-top safe-bottom",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            {brand}
            <Button type="button" variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="px-5 pb-3">
            <Badge variant="cyan" className="mb-2">
              Elite Qualification
            </Badge>
            <p className="text-xs leading-relaxed text-slate-400">
              Software engineering & cybersecurity tracks. Demonstrated ability over résumé claims.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
          {userBlock}
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden border-r border-slate-800/80 bg-slate-950/80 backdrop-blur lg:flex lg:flex-col">
        <div className="px-5 py-5">{brand}</div>
        <div className="px-5 pb-4">
          <Badge variant="cyan" className="mb-2">
            Elite Qualification
          </Badge>
          <p className="text-xs leading-relaxed text-slate-400">
            Software engineering & cybersecurity tracks. Demonstrated ability over résumé claims.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks pathname={pathname} />
        </div>
        {userBlock}
      </aside>

      <main className="relative min-h-[calc(100vh-3.75rem)] min-w-0 lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 safe-bottom">
          {children}
        </div>
      </main>
      <Link href="/assessments" className="sr-only">
        <GitBranch />
      </Link>
    </div>
  );
}
