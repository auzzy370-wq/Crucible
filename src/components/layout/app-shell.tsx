"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Crosshair,
  Boxes,
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
  Timer,
  CalendarDays,
  Route,
  Trophy,
  BookOpen,
  UserRound,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
  hint?: string;
};

type NavGroup = {
  id: string;
  title: string;
  roles?: string[];
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  /** Learner: Learn → Practice → Compete → You */
  {
    id: "learn",
    title: "1 · Learn",
    roles: ["CANDIDATE", "TEAM_MEMBER"],
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard, hint: "What’s next" },
      { href: "/learn", label: "Learn", icon: BookOpen, hint: "Interview + AI lessons" },
      { href: "/study-plans", label: "Study plans", icon: Route, hint: "Company & role packs" },
    ],
  },
  {
    id: "practice",
    title: "2 · Practice",
    roles: ["CANDIDATE", "TEAM_MEMBER"],
    items: [
      { href: "/daily", label: "Daily", icon: CalendarDays, hint: "One timed session" },
      { href: "/challenges", label: "Problem bank", icon: Boxes, hint: "Browse & solve" },
      { href: "/interview", label: "Company mocks", icon: Timer, hint: "Timed interview sim" },
      { href: "/workspace", label: "Workspaces", icon: Terminal, hint: "Open IDE sessions" },
    ],
  },
  {
    id: "compete",
    title: "3 · Compete",
    roles: ["CANDIDATE", "TEAM_MEMBER"],
    items: [
      { href: "/ai-vs-human", label: "AI vs Human", icon: BrainCircuit, hint: "Same challenge, fair judge" },
      { href: "/tournaments", label: "Tournaments", icon: Trophy, hint: "Live events" },
      { href: "/leaderboards", label: "Leaderboards", icon: BarChart3, hint: "Standings" },
    ],
  },
  {
    id: "you",
    title: "4 · You",
    roles: ["CANDIDATE", "TEAM_MEMBER"],
    items: [
      { href: "/candidates", label: "Verified profile", icon: UserRound, hint: "Proof employers see" },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    id: "team-member",
    title: "Team",
    roles: ["TEAM_MEMBER"],
    items: [
      { href: "/teams", label: "Team crucible", icon: Network },
      { href: "/incidents", label: "Incident sims", icon: Siren },
    ],
  },
  {
    id: "hiring",
    title: "Hire",
    roles: ["SUPER_ADMIN", "HIRING_MANAGER", "TECHNICAL_REVIEWER"],
    items: [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard, hint: "Pipeline" },
      { href: "/assessments", label: "Assessments", icon: Crosshair, hint: "Create & assign", roles: ["SUPER_ADMIN", "HIRING_MANAGER"] },
      { href: "/candidates", label: "Candidates", icon: Users, hint: "Evidence" },
      { href: "/reviews", label: "Reviews", icon: ScrollText, hint: "Hire decisions" },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "staff-tools",
    title: "Tools",
    roles: ["SUPER_ADMIN", "HIRING_MANAGER", "TECHNICAL_REVIEWER"],
    items: [
      { href: "/challenges", label: "Challenge bank", icon: Boxes },
      { href: "/workspace", label: "Workspaces", icon: Terminal },
      { href: "/teams", label: "Team crucible", icon: Network },
      { href: "/incidents", label: "Incident sims", icon: Siren },
      { href: "/architecture", label: "Architecture", icon: BrainCircuit, roles: ["SUPER_ADMIN", "HIRING_MANAGER", "TECHNICAL_REVIEWER"] },
      { href: "/ai-vs-human", label: "AI vs Human", icon: BrainCircuit },
      { href: "/admin", label: "Admin", icon: Shield, roles: ["SUPER_ADMIN"] },
    ],
  },
  {
    id: "staff-account",
    title: "Account",
    roles: ["SUPER_ADMIN", "HIRING_MANAGER", "TECHNICAL_REVIEWER"],
    items: [
      { href: "/pricing", label: "Billing", icon: Sparkles },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function visibleGroups(role: string) {
  return NAV_GROUPS.map((group) => {
    if (group.roles && !group.roles.includes(role)) return null;
    const items = group.items.filter((item) => !item.roles || item.roles.includes(role));
    if (!items.length) return null;
    return { ...group, items };
  }).filter(Boolean) as NavGroup[];
}

function NavLinks({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string;
  role: string;
  onNavigate?: () => void;
}) {
  const groups = useMemo(() => visibleGroups(role), [role]);

  return (
    <nav className="space-y-5 px-3 pb-6">
      {groups.map((group) => (
        <div key={group.id}>
          <div className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-600">
            {group.title}
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              // Prefer exact / child match; avoid /learn lighting up unrelated paths.
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={`${group.id}-${item.href}-${item.label}`}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active ? "bg-cyan-500/10 text-cyan-200" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block leading-tight">{item.label}</span>
                    {item.hint && (
                      <span className={cn("block text-[11px] leading-tight", active ? "text-cyan-200/60" : "text-slate-600")}>
                        {item.hint}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
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
  const isCandidate = user.role === "CANDIDATE" || user.role === "TEAM_MEMBER";
  const isStaff = ["SUPER_ADMIN", "HIRING_MANAGER", "TECHNICAL_REVIEWER"].includes(user.role);

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
        <div className="truncate font-mono text-xs text-slate-500">
          {isCandidate ? "Learner" : isStaff ? "Hiring team" : user.role}
        </div>
      </div>
      {user.plan !== "PREMIUM" && !isStaff && (
        <Link href="/pricing" className="mb-2 block text-center text-xs text-amber-200 hover:underline">
          Upgrade to Premium →
        </Link>
      )}
      <Button variant="secondary" size="sm" className="w-full" onClick={logout}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );

  const mobileTabs = isStaff
    ? user.role === "TECHNICAL_REVIEWER"
      ? ([
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/analytics", label: "Stats", icon: BarChart3 },
          { href: "/candidates", label: "People", icon: Users },
          { href: "/reviews", label: "Review", icon: ScrollText },
        ] as const)
      : ([
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/analytics", label: "Stats", icon: BarChart3 },
          { href: "/assessments", label: "Assign", icon: Crosshair },
          { href: "/reviews", label: "Review", icon: ScrollText },
        ] as const)
    : ([
        { href: "/dashboard", label: "Home", icon: LayoutDashboard },
        { href: "/learn", label: "Learn", icon: BookOpen },
        { href: "/challenges", label: "Practice", icon: Boxes },
        { href: "/ai-vs-human", label: "Compete", icon: BrainCircuit },
      ] as const);

  const inWorkspaceSession = /^\/workspace\/[^/]+/.test(pathname);

  const journeyCopy = isCandidate
    ? {
        badge: "Your path",
        body: "Learn → Practice → Compete → prove it on your profile",
      }
    : {
        badge: "Hiring path",
        body: "Create a test → assign → review evidence → decide",
      };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/95 px-3 py-3 backdrop-blur sm:px-4 lg:hidden safe-top">
        <Link href="/dashboard" className="min-w-0">
          {brand}
        </Link>
        {/* Menu lives in the bottom tab "More" when tabs are shown; only keep top control in workspace (no bottom bar). */}
        {inWorkspaceSession ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="min-h-11 min-w-11"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        ) : (
          <div className="min-h-11 min-w-11" aria-hidden />
        )}
      </header>

      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn("absolute inset-0 bg-black/60 transition-opacity", open ? "opacity-100" : "opacity-0")}
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
              {journeyCopy.badge}
            </Badge>
            <p className="text-xs leading-relaxed text-slate-400">{journeyCopy.body}</p>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <NavLinks pathname={pathname} role={user.role} onNavigate={() => setOpen(false)} />
          </div>
          {userBlock}
        </aside>
      </div>

      <aside className="hidden border-r border-slate-800/80 bg-slate-950/80 backdrop-blur lg:flex lg:flex-col">
        <div className="px-5 py-5">{brand}</div>
        <div className="px-5 pb-4">
          <Badge variant="cyan" className="mb-2">
            {journeyCopy.badge}
          </Badge>
          <p className="text-xs leading-relaxed text-slate-400">{journeyCopy.body}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks pathname={pathname} role={user.role} />
        </div>
        {userBlock}
      </aside>

      <main className="relative min-h-[calc(100vh-3.75rem)] min-w-0 lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />
        <div
          className={cn(
            "relative mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:pb-6",
            !inWorkspaceSession && "mobile-bottom-pad",
          )}
        >
          {children}
        </div>
      </main>

      {!inWorkspaceSession && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur lg:hidden safe-bottom"
          aria-label="Primary"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1 py-1.5">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium",
                    active ? "bg-cyan-500/10 text-cyan-200" : "text-slate-500 hover:text-slate-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-medium text-slate-500 hover:text-slate-200"
            >
              <Menu className="h-4 w-4" />
              More
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
