import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  Building2,
  Cable,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Fingerprint,
  LayoutDashboard,
  Menu,
  Receipt,
  Sparkles,
  Target,
  Users,
  Wallet,
  HeartPulse,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PersonAvatar } from "@/components/person-avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_PERSONAS } from "@/lib/seed";
import { ROLE_LABEL } from "@/lib/format";
import { useHumanis, useMe } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Users; roles: Role[] };

const NAV: NavItem[] = [
  { to: "/app", label: "Dasbor", icon: LayoutDashboard, roles: ["hr", "manager", "employee"] },
  { to: "/app/me", label: "Portal saya", icon: UserRound, roles: ["employee"] },
  { to: "/app/employees", label: "Karyawan", icon: Users, roles: ["hr", "manager"] },
  { to: "/app/org", label: "Organisasi", icon: Building2, roles: ["hr", "manager"] },
  { to: "/app/attendance", label: "Kehadiran", icon: Fingerprint, roles: ["hr", "manager", "employee"] },
  { to: "/app/leave", label: "Cuti & izin", icon: CalendarDays, roles: ["hr", "manager", "employee"] },
  { to: "/app/payroll", label: "Penggajian", icon: Wallet, roles: ["hr", "employee"] },
  { to: "/app/integrations", label: "Integrasi", icon: Cable, roles: ["hr"] },
  { to: "/app/performance", label: "Kinerja 360", icon: ClipboardCheck, roles: ["hr", "manager"] },
  { to: "/app/kpi", label: "KPI", icon: Target, roles: ["hr", "manager", "employee"] },
  { to: "/app/assistant", label: "Asisten AI", icon: Bot, roles: ["hr", "manager", "employee"] },
  { to: "/app/mobility", label: "Mobilitas", icon: Sparkles, roles: ["hr"] },
  { to: "/app/retention", label: "Retensi", icon: HeartPulse, roles: ["hr"] },
  { to: "/app/claims", label: "Klaim", icon: Receipt, roles: ["hr", "employee"] },
  { to: "/app/docs", label: "Dokumen", icon: FileText, roles: ["hr", "manager", "employee"] },
];

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.filter((item) => item.roles.includes(role)).map((item) => {
        const active = item.to === "/app" ? pathname === "/app" : pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PersonaSwitch() {
  const me = useMe();
  const role = useHumanis((s) => s.role);
  const employees = useHumanis((s) => s.employees);
  const setPersona = useHumanis((s) => s.setPersona);
  const resetDemo = useHumanis((s) => s.resetDemo);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-surface-2">
          <PersonAvatar person={me} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{me.preferredName}</span>
            <span className="block truncate text-xs text-muted">{ROLE_LABEL[role]}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Masuk sebagai</DropdownMenuLabel>
        {DEMO_PERSONAS.map((p) => {
          const person = employees.find((e) => e.id === p.userId);
          if (!person) return null;
          return (
            <DropdownMenuItem key={p.role} onSelect={() => setPersona(p.role, p.userId)}>
              <PersonAvatar person={person} size="sm" />
              <span>
                <span className="block text-sm">{person.preferredName}</span>
                <span className="block text-xs text-muted">{ROLE_LABEL[p.role]}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => resetDemo()}>Pulihkan data demo</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/">Keluar ke beranda</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const role = useHumanis((s) => s.role);
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="mb-6 px-1" onClick={onNavigate}>
        <Logo />
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavLinks role={role} onNavigate={onNavigate} />
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <PersonaSwitch />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const hydrated = useHumanis((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p className="font-display text-xl text-muted">Humanis</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface/70 p-4 lg:flex lg:flex-col">
        <SidebarBody />
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/85 px-4 backdrop-blur-md lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-bg">
              <SidebarBody onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Logo />
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
            <Activity className="size-3.5" /> Demo Arunika
          </span>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-16 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
