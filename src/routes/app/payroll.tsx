import { createFileRoute, Link } from "@tanstack/react-router";
import { Cable, Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIdr, monthLabel } from "@/lib/format";
import { formatSyncWhen, providerById } from "@/lib/integrations";
import { employerCost } from "@/lib/payroll";
import { useHumanis, useVisibleEmployees } from "@/lib/store";

export const Route = createFileRoute("/app/payroll")({ component: PayrollPage });

function PayrollPage() {
  const role = useHumanis((s) => s.role);
  const meId = useHumanis((s) => s.currentUserId);
  const people = useVisibleEmployees();
  const slips = useHumanis((s) => s.payslips);
  const accurate = useHumanis((s) => s.connectors.find((c) => c.id === "accurate"));
  const period = role === "hr" ? "2026-08" : "2026-08";
  const rows = slips.filter((s) => s.period === period && people.some((p) => p.id === s.employeeId));
  const mine = slips.filter((s) => s.employeeId === meId);
  const totalNet = rows.reduce((a, s) => a + s.net, 0);
  const totalCost = rows.reduce((a, s) => a + employerCost(s), 0);
  const totalTax = rows.reduce((a, s) => a + s.pph21, 0);

  if (role === "employee") {
    return (
      <div>
        <PageHeader
          eyebrow="E-slip"
          title="Slip gaji"
          description="Unduh mandiri. Angka sudah termasuk BPJS dan PPh 21."
        />
        <div className="space-y-3">
          {mine.map((slip) => (
            <Link
              key={slip.id}
              to="/app/payroll/$id"
              params={{ id: slip.id }}
              className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-card transition-[box-shadow] hover:shadow-card-hover"
            >
              <span>
                <span className="block font-display text-lg">{monthLabel(slip.period)}</span>
                <span className="text-sm text-muted">{slip.status === "published" ? "Terbayar" : "Draf"}</span>
              </span>
              <span className="text-right">
                <span className="block font-medium tabular-nums">{formatIdr(slip.net)}</span>
                <span className="text-xs text-muted">take-home</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kompensasi"
        title="Penggajian"
        description="Kalkulator otomatis: gaji pokok, tunjangan, lembur, BPJS, dan PPh 21 progresif."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/app/integrations">
                <Cable /> Integrasi payroll
              </Link>
            </Button>
          </div>
        }
      />
      {accurate ? (
        <Link
          to="/app/integrations"
          className="mb-6 flex flex-col gap-2 rounded-2xl bg-surface p-4 shadow-card transition-[box-shadow] hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            <span className="block text-xs tracking-wide text-muted uppercase">Sistem payroll lokal</span>
            <span className="mt-1 block font-medium">
              {providerById("accurate").name} · {accurate.status === "connected" ? "terhubung" : "tidak terhubung"}
            </span>
            <span className="text-sm text-muted">
              Sinkron {formatSyncWhen(accurate.lastSyncAt)} · file bank & e-Bupot siap diunduh
            </span>
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-accent">
            Buka jembatan <Download className="size-4" />
          </span>
        </Link>
      ) : null}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Take-home" value={formatIdr(totalNet)} hint={monthLabel(period)} />
        <StatCard label="PPh 21" value={formatIdr(totalTax)} hint="Dipotong karyawan" />
        <StatCard label="Biaya perusahaan" value={formatIdr(totalCost)} hint="Termasuk iuran pemberi kerja" />
      </div>
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <ul>
          {rows.map((slip) => {
            const person = people.find((p) => p.id === slip.employeeId);
            if (!person) return null;
            return (
              <li key={slip.id} className="border-b border-line last:border-0">
                <Link
                  to="/app/payroll/$id"
                  params={{ id: slip.id }}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <PersonAvatar person={person} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{person.name}</span>
                      <span className="block text-xs text-muted">
                        Lembur {slip.overtimeHours} jam · PPh {formatIdr(slip.pph21)}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block tabular-nums font-medium">{formatIdr(slip.net)}</span>
                    <Badge tone={slip.status === "published" ? "ok" : "warn"}>{slip.status === "published" ? "Terbayar" : "Draf"}</Badge>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
