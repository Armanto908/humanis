import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatIdr, monthLabel } from "@/lib/format";
import { employerCost } from "@/lib/payroll";
import { COMPANY } from "@/lib/seed";
import { useHumanis } from "@/lib/store";

export const Route = createFileRoute("/app/payroll/$id")({ component: PayslipPage });

function PayslipPage() {
  const { id } = Route.useParams();
  const slip = useHumanis((s) => s.payslips.find((p) => p.id === id));
  const person = useHumanis((s) => s.employees.find((e) => e.id === slip?.employeeId));

  if (!slip || !person) {
    return (
      <div>
        <PageHeader title="Slip tidak ditemukan" />
        <Button asChild variant="secondary">
          <Link to="/app/payroll">Kembali</Link>
        </Button>
      </div>
    );
  }

  const rows: [string, number][] = [
    ["Gaji pokok", slip.basic],
    ["Tunjangan", slip.allowance],
    [`Lembur (${slip.overtimeHours} jam)`, slip.overtimePay],
    ["Bonus", slip.bonus],
  ];
  const deductions: [string, number][] = [
    ["BPJS Kesehatan (1%)", slip.bpjsKesEmp],
    ["JHT (2%)", slip.jhtEmp],
    ["Jaminan Pensiun (1%)", slip.jpEmp],
    ["PPh 21", slip.pph21],
  ];

  return (
    <div>
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/app/payroll">
          <ArrowLeft /> Penggajian
        </Link>
      </Button>
      <PageHeader eyebrow="E-slip" title={monthLabel(slip.period)} description={COMPANY.legalName} />
      <article className="rounded-2xl bg-surface p-5 shadow-card md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="font-display text-2xl">{person.name}</p>
            <p className="text-sm text-muted">
              {person.nik} · {person.title}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-wide text-muted uppercase">Take-home</p>
            <p className="font-display text-3xl tabular-nums">{formatIdr(slip.net)}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <Column title="Penghasilan" items={rows} total={slip.gross} totalLabel="Bruto" />
          <Column title="Potongan" items={deductions} total={slip.gross - slip.net} totalLabel="Total potongan" />
        </div>
        <div className="mt-8 rounded-xl bg-surface-2 p-4 text-sm">
          <p className="font-medium">Iuran pemberi kerja (tidak dipotong dari gaji)</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li className="flex justify-between">
              <span>BPJS Kes 4%</span>
              <span className="tabular-nums">{formatIdr(slip.bpjsKesEr)}</span>
            </li>
            <li className="flex justify-between">
              <span>JHT 3,7% + JP 2% + JKK + JKM</span>
              <span className="tabular-nums">{formatIdr(slip.jhtEr + slip.jpEr + slip.jkkEr + slip.jkmEr)}</span>
            </li>
            <li className="flex justify-between font-medium text-ink">
              <span>Biaya perusahaan</span>
              <span className="tabular-nums">{formatIdr(employerCost(slip))}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-faint">
            PPh 21 dihitung dari penghasilan kena pajak tahunan setelah biaya jabatan dan iuran wajib, dikurangi PTKP{" "}
            {person.ptkp}. Perhitungan bersifat ilustratif.
          </p>
        </div>
      </article>
    </div>
  );
}

function Column({
  title,
  items,
  total,
  totalLabel,
}: {
  title: string;
  items: [string, number][];
  total: number;
  totalLabel: string;
}) {
  return (
    <div>
      <h2 className="text-xs font-medium tracking-wide text-muted uppercase">{title}</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map(([label, value]) => (
          <li key={label} className="flex justify-between gap-4">
            <span className="text-ink-soft">{label}</span>
            <span className="tabular-nums">{formatIdr(value)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-line pt-2 font-medium">
          <span>{totalLabel}</span>
          <span className="tabular-nums">{formatIdr(total)}</span>
        </li>
      </ul>
    </div>
  );
}
