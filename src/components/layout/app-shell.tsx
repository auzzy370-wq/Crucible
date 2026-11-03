"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Operations", icon: LayoutDashboard },
  { href: "/assessments", label: "Assessments", icon: Crosshair },
  { href: "/challenges", label: "Challenge Library", icon: Boxes },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/reviews", label: "Technical Review", icon: ScrollText },
  { href: "/teams", label: "Team Gauntlets", icon: Network },
  { href: "/incidents", label: "Incident Sims", icon: Siren },
  { href: "/architecture", label: "Architecture", icon: BrainCircuit },
  { href: "/workspace", label: "Workspace", icon: Terminal },
  { href: "/admin", label: "Admin / Security", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="pulse-live flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300">
            EG
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[0.18em] text-slate-100">ENGINEERING</div>
            <div className="text-xs font-semibold tracking-[0.28em] text-cyan-300">GAUNTLET</div>
          </div>
        </div>
        <div className="px-5 pb-4">
          <Badge variant="cyan" className="mb-2">
            Elite Qualification
          </Badge>
          <p className="text-xs leading-relaxed text-slate-400">
            Software engineering & cybersecurity tracks. Demonstrated ability over résumé claims.
          </p>
        </div>
        <nav className="space-y-1 px-3 pb-6">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-cyan-500/10 text-cyan-200" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-slate-800/80 p-4">
          <div className="mb-3">
            <div className="text-sm font-medium text-slate-100">{user.name}</div>
            <div className="font-mono text-xs text-slate-500">{user.role}</div>
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <Link href="/assessments" className="sr-only">
        <GitBranch />
      </Link>
    </div>
  );
}
