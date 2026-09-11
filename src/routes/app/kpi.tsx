import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { KpiBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { useHumanis, useVisibleEmployees } from "@/lib/store";

export const Route = createFileRoute("/app/kpi")({ component: KpiPage });

function ratio(current: number, target: number, unit: string) {
  if (target <= 0) return 0;
  const inverse = unit === "jam" || unit === "insiden" || unit === "hari";
  if (inverse) return Math.max(0, Math.min(100, (target / Math.max(current, 0.01)) * 100));
  return Math.max(0, Math.min(140, (current / target) * 100));
}

function KpiPage() {
  const role = useHumanis((s) => s.role);
  const meId = useHumanis((s) => s.currentUserId);
  const people = useVisibleEmployees();
  const allKpis = useHumanis((s) => s.kpis);
  const kpis = useMemo(
    () =>
      allKpis.filter((k) =>
        role === "employee" ? k.employeeId === meId : people.some((p) => p.id === k.employeeId),
      ),
    [allKpis, role, meId, people],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Target"
        title="KPI"
        description="Pemantauan target individu dan tim untuk siklus Q3 2026."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {kpis.map((kpi) => {
          const person = people.find((p) => p.id === kpi.employeeId);
          if (!person) return null;
          return (
            <article key={kpi.id} className="rounded-2xl bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <PersonAvatar person={person} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{kpi.title}</p>
                    <p className="truncate text-xs text-muted">{person.preferredName}</p>
                  </div>
                </div>
                <KpiBadge value={kpi.status} />
              </div>
              <p className="mt-3 text-sm text-ink-soft">{kpi.description}</p>
              <p className="mt-3 font-display text-2xl tabular-nums">
                {kpi.current}
                <span className="text-base text-muted">
                  {" "}
                  / {kpi.target} {kpi.unit}
                </span>
              </p>
              <Progress className="mt-2" value={ratio(kpi.current, kpi.target, kpi.unit)} />
              <p className="mt-2 text-xs text-muted">Bobot {(kpi.weight * 100).toFixed(0)}% · {kpi.period}</p>
            </article>
          );
        })}
      </div>
      {kpis.length === 0 ? <p className="text-sm text-muted">Belum ada KPI pada siklus ini.</p> : null}
    </div>
  );
}
