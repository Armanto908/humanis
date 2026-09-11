import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ClockWidget } from "@/components/clock-widget";
import { PageHeader } from "@/components/page-header";
import { PersonRow } from "@/components/person-row";
import { StatCard } from "@/components/stat-card";
import { ApprovalBadge, RiskBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DEPARTMENT_LABEL, formatIdr } from "@/lib/format";
import { TODAY_ISO } from "@/lib/seed";
import { useHumanis, useMe, useVisibleEmployees } from "@/lib/store";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const me = useMe();
  const role = useHumanis((s) => s.role);
  const employees = useVisibleEmployees();
  const attendance = useHumanis((s) => s.attendance);
  const leaves = useHumanis((s) => s.leaves);
  const payslips = useHumanis((s) => s.payslips);
  const retention = useHumanis((s) => s.retention);
  const kpis = useHumanis((s) => s.kpis);
  const claims = useHumanis((s) => s.claims);
  const accurate = useHumanis((s) => s.connectors.find((c) => c.id === "accurate"));

  const today = attendance.filter((a) => a.date === TODAY_ISO && employees.some((e) => e.id === a.employeeId));
  const present = today.filter((a) => a.status === "present" || a.status === "wfh" || a.status === "late").length;
  const pendingLeave = leaves.filter(
    (l) => l.status === "pending" && employees.some((e) => e.id === l.employeeId),
  );
  const aug = payslips.filter((p) => p.period === "2026-08" && p.status === "published");
  const payrollNet = aug.filter((p) => employees.some((e) => e.id === p.employeeId)).reduce((s, p) => s + p.net, 0);
  const highRisk = retention.filter((r) => r.risk !== "low" && employees.some((e) => e.id === r.employeeId));

  const deptData = Object.entries(
    employees.reduce<Record<string, number>>((acc, e) => {
      acc[DEPARTMENT_LABEL[e.department]] = (acc[DEPARTMENT_LABEL[e.department]] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const myKpis = kpis.filter((k) => k.employeeId === me.id);
  const mySlip = payslips.find((p) => p.employeeId === me.id && p.period === "2026-08");
  const myClaims = claims.filter((c) => c.employeeId === me.id);

  if (role === "employee") {
    return (
      <div>
        <PageHeader
          eyebrow={`Selamat datang, ${me.preferredName}`}
          title="Portal karyawan"
          description="Presensi, cuti, slip gaji, dan dokumen — tanpa antre di meja People."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ClockWidget />
          </div>
          <StatCard
            label="Slip Agustus"
            value={mySlip ? formatIdr(mySlip.net) : "—"}
            hint="Gaji bersih setelah BPJS & PPh 21"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="KPI on track" value={`${myKpis.filter((k) => k.status === "on_track" || k.status === "exceeded").length}/${myKpis.length || 1}`} />
          <StatCard label="Klaim aktif" value={myClaims.filter((c) => c.status === "pending" || c.status === "approved").length} />
          <StatCard label="Cuti menunggu" value={leaves.filter((l) => l.employeeId === me.id && l.status === "pending").length} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/app/me">Lengkapi data diri</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/assistant">Tanya asisten AI</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={role === "hr" ? "People ops" : "Tim saya"}
        title={role === "hr" ? "Dasbor Humanis" : `Tim ${me.preferredName}`}
        description={
          role === "hr"
            ? "Kehadiran, payroll, cuti, dan sinyal orang — dalam satu pandangan."
            : "Yang perlu keputusan hari ini, tanpa membuka sepuluh tab."
        }
        actions={
          <Button asChild size="sm">
            <Link to="/app/assistant">
              Asisten AI <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hadir hari ini" value={`${present}/${employees.length}`} hint={`${TODAY_ISO}`} />
        <StatCard label="Cuti menunggu" value={pendingLeave.length} hint="Perlu persetujuan" />
        <StatCard label="Payroll Agustus" value={formatIdr(payrollNet)} hint="Take-home terbit" />
        <StatCard label="Sinyal retensi" value={highRisk.length} hint="Perlu percakapan" />
      </div>

      {role === "hr" && accurate ? (
        <Link
          to="/app/integrations"
          className="mt-4 flex flex-col gap-1 rounded-2xl bg-surface p-4 shadow-card transition-[box-shadow] hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            <span className="block text-xs tracking-wide text-muted uppercase">Payroll lokal</span>
            <span className="mt-1 block font-medium">Accurate Online terhubung · {employees.length} karyawan terpetakan</span>
            <span className="text-sm text-muted">Kirim master, tarik PPh 21, unduh file BCA dan e-Bupot</span>
          </span>
          <span className="text-sm font-medium text-accent">Buka integrasi</span>
        </Link>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl bg-surface p-5 shadow-card lg:col-span-3">
          <h2 className="font-display text-lg">Komposisi tim</h2>
          <p className="mb-4 text-sm text-muted">Headcount per fungsi</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-2)" }}
                  contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 12 }}
                />
                <Bar dataKey="value" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-lg">Persetujuan cuti</h2>
          <div className="mt-3 space-y-3">
            {pendingLeave.slice(0, 4).map((leave) => {
              const person = employees.find((e) => e.id === leave.employeeId);
              if (!person) return null;
              return (
                <div key={leave.id} className="flex items-center justify-between gap-2">
                  <PersonRow person={person} extra={`${leave.days} hari`} />
                  <ApprovalBadge value={leave.status} />
                </div>
              );
            })}
            {pendingLeave.length === 0 ? <p className="text-sm text-muted">Tidak ada antrean.</p> : null}
            <Button asChild variant="ghost" size="sm" className="px-0">
              <Link to="/app/leave">Buka antrian cuti</Link>
            </Button>
          </div>
        </div>
      </div>

      {role === "hr" && highRisk.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Perlu perhatian</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/retention">Analisis retensi</Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {highRisk.slice(0, 4).map((signal) => {
              const person = employees.find((e) => e.id === signal.employeeId);
              if (!person) return null;
              return (
                <div key={signal.employeeId} className="flex items-center justify-between rounded-xl bg-surface-2 p-3">
                  <PersonRow person={person} extra={signal.factors[0]} link />
                  <RiskBadge value={signal.risk} />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
