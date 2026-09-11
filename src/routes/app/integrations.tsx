import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cable,
  Download,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CONNECTOR_STATUS_LABEL,
  formatDateTime,
  formatIdr,
  monthLabel,
  SYNC_KIND_LABEL,
  SYNC_STATUS_LABEL,
} from "@/lib/format";
import {
  accurateMasterCsv,
  accuratePayrollCsv,
  bankRows,
  bcaMultiCreditCsv,
  bpjsSippCsv,
  downloadText,
  ebupotCsv,
  FIELD_MAP,
  fileNameFor,
  formatSyncWhen,
  hasNpwp,
  mappingIssues,
  moneySum,
  PAYROLL_PROVIDERS,
  providerById,
  transferFeeHint,
} from "@/lib/integrations";
import { useHumanis } from "@/lib/store";
import type { ConnectorEnvironment, ConnectorStatus, PayrollProviderId, SyncKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/integrations")({ component: IntegrationsPage });

const PERIODS = ["2026-08", "2026-09"] as const;
const SYNC_OPTIONS: { kind: SyncKind; hint: string }[] = [
  { kind: "master", hint: "NIK, NPWP, PTKP, rekening, gaji pokok" },
  { kind: "attendance", hint: "Hadir, terlambat, jam lembur periode" },
  { kind: "payroll_push", hint: "Komponen yang Humanis sudah hitung" },
  { kind: "payroll_pull", hint: "PPh 21 & take-home dari Accurate" },
  { kind: "full", hint: "Kirim master + kehadiran, tarik hasil" },
];

function statusTone(status: ConnectorStatus) {
  if (status === "connected") return "ok" as const;
  if (status === "syncing") return "accent" as const;
  if (status === "error") return "danger" as const;
  return "neutral" as const;
}

function jobTone(status: string) {
  if (status === "success") return "ok" as const;
  if (status === "partial") return "warn" as const;
  if (status === "failed") return "danger" as const;
  return "accent" as const;
}

function IntegrationsPage() {
  const role = useHumanis((s) => s.role);
  const employees = useHumanis((s) => s.employees);
  const payslips = useHumanis((s) => s.payslips);
  const connectors = useHumanis((s) => s.connectors);
  const jobs = useHumanis((s) => s.syncJobs);
  const connectPayroll = useHumanis((s) => s.connectPayroll);
  const disconnectPayroll = useHumanis((s) => s.disconnectPayroll);
  const runPayrollSync = useHumanis((s) => s.runPayrollSync);
  const finishPayrollSync = useHumanis((s) => s.finishPayrollSync);
  const logPayrollFile = useHumanis((s) => s.logPayrollFile);

  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("2026-08");
  const [syncKind, setSyncKind] = useState<SyncKind>("full");
  const [connectId, setConnectId] = useState<PayrollProviderId | null>(null);
  const [companyCode, setCompanyCode] = useState("ARK-TAL-4402");
  const [token, setToken] = useState("demo-token-arunika");
  const [environment, setEnvironment] = useState<ConnectorEnvironment>("sandbox");
  const [skipped, setSkipped] = useState<string[]>(["kirana"]);

  const issues = useMemo(() => mappingIssues(employees), [employees]);
  const periodSlips = payslips.filter((s) => s.period === period);
  const published = periodSlips.filter((s) => s.status === "published");
  const transfer = bankRows(
    employees,
    published.filter((s) => !skipped.includes(s.employeeId)),
  );
  const accurate = connectors.find((c) => c.id === "accurate");
  const connectedCount = connectors.filter((c) => c.status === "connected" || c.status === "syncing").length;
  const mapped = employees.length - new Set(issues.filter((i) => i.severity === "block").map((i) => i.employeeId)).size;

  function runSync(id: PayrollProviderId, kind: SyncKind) {
    const connector = connectors.find((c) => c.id === id);
    if (!connector || connector.status === "disconnected") {
      toast.error("Hubungkan sistem dulu.");
      return;
    }
    if (connector.status === "syncing") return;
    const jobId = runPayrollSync(id, kind, period);
    window.setTimeout(() => {
      const done = finishPayrollSync(jobId, period);
      if (!done) return;
      if (done.status === "partial") toast.message(done.message);
      else toast.success(done.message);
    }, 1100);
  }

  function downloadMaster() {
    downloadText(fileNameFor("master", period), accurateMasterCsv(employees));
    logPayrollFile("excel", "master", period);
    toast.success("Berkas master karyawan diunduh.");
  }

  function downloadPayroll() {
    downloadText(fileNameFor("payroll", period), accuratePayrollCsv(employees, periodSlips));
    logPayrollFile("excel", "payroll_push", period);
    toast.success(`Berkas gaji ${monthLabel(period)} diunduh.`);
  }

  function downloadBank() {
    downloadText(fileNameFor("bank", period), bcaMultiCreditCsv(transfer, period));
    logPayrollFile("bca", "bank_file", period);
    toast.success("File BCA Multi Credit siap diunggah di KlikBCA Bisnis.");
  }

  function downloadTax() {
    downloadText(fileNameFor("tax", period), ebupotCsv(employees, published, period));
    logPayrollFile("ebupot", "tax_file", period);
    toast.success("CSV e-Bupot diunduh. Magang tanpa NPWP dilewati.");
  }

  function downloadBpjs() {
    downloadText(fileNameFor("bpjs", period), bpjsSippCsv(employees, periodSlips));
    logPayrollFile("excel", "bpjs_file", period);
    toast.success("Berkas SIPP BPJS TK diunduh.");
  }

  if (role !== "hr") {
    return (
      <div>
        <PageHeader title="Integrasi payroll" description="Hanya People yang mengatur jembatan ke sistem gaji." />
        <Button asChild variant="secondary">
          <Link to="/app/payroll">Lihat slip gaji</Link>
        </Button>
      </div>
    );
  }

  const connectMeta = connectId ? providerById(connectId) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Jembatan data"
        title="Integrasi payroll"
        description="Humanis menyimpan orang. Accurate, bank, dan DJP yang menghitung serta membayarkan — tanpa spreadsheet bolak-balik."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={downloadMaster}>
              <Download /> Master CSV
            </Button>
            <Button onClick={() => runSync("accurate", "full")} disabled={accurate?.status !== "connected"}>
              <RefreshCw /> Sinkron Accurate
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sistem terhubung" value={`${connectedCount}/${connectors.length}`} hint="API dan berkas" />
        <StatCard
          label="Karyawan terpetakan"
          value={`${mapped}/${employees.length}`}
          hint={issues.length ? `${issues.length} catatan pemetaan` : "Tanpa catatan"}
        />
        <StatCard
          label="Sinkron terakhir"
          value={formatSyncWhen(accurate?.lastSyncAt)}
          hint={accurate ? providerById("accurate").name : "—"}
        />
        <StatCard
          label={`Take-home ${monthLabel(period)}`}
          value={formatIdr(moneySum(published.map((s) => s.net)))}
          hint={`${published.length} slip terbit`}
        />
      </div>

      <Tabs defaultValue="sistem">
        <TabsList className="mb-4 h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="sistem">Sistem</TabsTrigger>
          <TabsTrigger value="sinkron">Sinkron</TabsTrigger>
          <TabsTrigger value="transfer">Transfer bank</TabsTrigger>
          <TabsTrigger value="pajak">Pajak & BPJS</TabsTrigger>
        </TabsList>

        <TabsContent value="sistem" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {PAYROLL_PROVIDERS.map((provider) => {
              const conn = connectors.find((c) => c.id === provider.id);
              if (!conn) return null;
              const busy = conn.status === "syncing";
              return (
                <article key={provider.id} className="rounded-2xl bg-surface p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-wide text-muted uppercase">{provider.category}</p>
                      <h2 className="mt-1 font-display text-xl">{provider.name}</h2>
                      <p className="text-xs text-muted">{provider.vendor}</p>
                    </div>
                    <Badge tone={statusTone(conn.status)}>{CONNECTOR_STATUS_LABEL[conn.status]}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{provider.blurb}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {provider.objects.map((obj) => (
                      <li key={obj}>
                        <Badge tone="neutral">{obj}</Badge>
                      </li>
                    ))}
                  </ul>
                  {busy ? <Progress value={68} className="mt-4" /> : null}
                  <p className="mt-3 text-xs text-muted">
                    {conn.companyCode ? `${conn.companyCode} · ` : ""}
                    {conn.environment === "sandbox" ? "Sandbox" : "Produksi"}
                    {conn.lastSyncAt ? ` · ${formatSyncWhen(conn.lastSyncAt)}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.kind === "api" && conn.status === "disconnected" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setConnectId(provider.id);
                          setCompanyCode(provider.id === "talenta" ? "ARK-TAL-4402" : `ARK-${provider.id.toUpperCase()}-1001`);
                          setEnvironment(provider.id === "talenta" ? "sandbox" : "production");
                        }}
                      >
                        <Cable /> Hubungkan
                      </Button>
                    ) : null}
                    {provider.kind === "api" && conn.status === "connected" ? (
                      <>
                        <Button size="sm" onClick={() => runSync(provider.id, "full")}>
                          <RefreshCw /> Sinkron
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          disconnectPayroll(provider.id);
                          toast.message(`${provider.name} diputus.`);
                        }}>
                          <Unplug /> Putuskan
                        </Button>
                      </>
                    ) : null}
                    {provider.id === "excel" ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={downloadMaster}>
                          <Download /> Karyawan
                        </Button>
                        <Button size="sm" variant="secondary" onClick={downloadPayroll}>
                          <Download /> Gaji
                        </Button>
                      </>
                    ) : null}
                    {provider.id === "bca" ? (
                      <Button size="sm" variant="secondary" onClick={downloadBank}>
                        <Download /> Multi Credit
                      </Button>
                    ) : null}
                    {provider.id === "ebupot" ? (
                      <Button size="sm" variant="secondary" onClick={downloadTax}>
                        <Download /> CSV DJP
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sinkron" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl bg-surface p-5 shadow-card">
              <h2 className="font-display text-xl">Jalankan sinkron</h2>
              <p className="mt-1 text-sm text-muted">
                Kirim data orang ke Accurate, atau tarik hasil hitung setelah Finance menutup buku.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Periode</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as (typeof PERIODS)[number])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {monthLabel(p)} · {p === "2026-08" ? "Terbit" : "Draf"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Jenis</Label>
                  <Select value={syncKind} onValueChange={(v) => setSyncKind(v as SyncKind)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYNC_OPTIONS.map((opt) => (
                        <SelectItem key={opt.kind} value={opt.kind}>
                          {SYNC_KIND_LABEL[opt.kind]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">{SYNC_OPTIONS.find((o) => o.kind === syncKind)?.hint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => runSync("accurate", syncKind)} disabled={accurate?.status !== "connected"}>
                  <RefreshCw /> Jalankan ke Accurate
                </Button>
                <Button variant="secondary" onClick={downloadPayroll}>
                  <Download /> Unduh CSV pengganti
                </Button>
              </div>
            </section>

            <section className="rounded-2xl bg-surface p-5 shadow-card">
              <h2 className="font-display text-xl">Peta field</h2>
              <p className="mt-1 mb-3 text-sm text-muted">Humanis → Accurate Online</p>
              <ul className="space-y-2 text-sm">
                {FIELD_MAP.map((row) => (
                  <li key={row.humanis} className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0">
                    <span className="text-ink-soft">{row.humanis}</span>
                    <span className="flex items-center gap-2">
                      <ArrowRight className="size-3.5 text-faint" />
                      <span className="font-medium">{row.remote}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <h2 className="font-display text-xl">Catatan pemetaan</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Yang perlu dibersihkan sebelum Finance menutup buku.</p>
            <ul className="space-y-2">
              {issues.map((issue) => {
                const person = employees.find((e) => e.id === issue.employeeId);
                if (!person) return null;
                return (
                  <li
                    key={`${issue.employeeId}-${issue.field}`}
                    className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link to="/app/employees/$id" params={{ id: person.id }} className="flex min-w-0 items-center gap-3">
                      <PersonAvatar person={person} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{person.name}</span>
                        <span className="block text-xs text-muted">{issue.message}</span>
                      </span>
                    </Link>
                    <Badge tone={issue.severity === "block" ? "danger" : "warn"}>
                      {issue.severity === "block" ? "Menghambat" : "Peringatan"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <h2 className="font-display text-xl">Riwayat</h2>
            <ul className="mt-3 divide-y divide-line">
              {jobs.slice(0, 8).map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {providerById(job.providerId).name} · {SYNC_KIND_LABEL[job.kind]}
                    </p>
                    <p className="text-xs text-muted">{job.message}</p>
                  </div>
                  <div className="text-right">
                    <Badge tone={jobTone(job.status)}>{SYNC_STATUS_LABEL[job.status]}</Badge>
                    <p className="mt-1 text-xs text-muted">{formatDateTime(job.startedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-4">
          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs tracking-wide text-muted uppercase">
                  <Landmark className="size-3.5" /> BCA Multi Credit
                </p>
                <h2 className="mt-1 font-display text-2xl">Transfer gaji {monthLabel(period)}</h2>
                <p className="mt-1 text-sm text-muted">{transferFeeHint(bankRows(employees, published))}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={period} onValueChange={(v) => setPeriod(v as (typeof PERIODS)[number])}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {monthLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={downloadBank} disabled={published.length === 0}>
                  <Download /> Unduh file bank
                </Button>
              </div>
            </div>
            {period === "2026-09" ? (
              <p className="mt-4 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
                Slip September masih draf. File bank hanya memuat slip yang sudah terbit.
              </p>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard label="Total transfer" value={formatIdr(moneySum(transfer.map((r) => r.slip.net)))} />
              <StatCard label="In-house BCA" value={transfer.filter((r) => r.inHouse).length} hint="Tanpa biaya LLG" />
              <StatCard label="LLG bank lain" value={transfer.filter((r) => !r.inHouse).length} hint="Mandiri, BNI" />
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
            <ul>
              {bankRows(employees, published).map((row) => {
                const off = skipped.includes(row.employee.id);
                return (
                  <li key={row.employee.id} className="border-b border-line last:border-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSkipped((curr) =>
                          curr.includes(row.employee.id)
                            ? curr.filter((id) => id !== row.employee.id)
                            : [...curr, row.employee.id],
                        )
                      }
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-2",
                        off && "opacity-45",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <PersonAvatar person={row.employee} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{row.employee.name}</span>
                          <span className="block text-xs text-muted">
                            {row.employee.bankName} {row.employee.bankAccount} · {row.inHouse ? "In-house" : `LLG ${row.bankCode}`}
                          </span>
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block tabular-nums font-medium">{formatIdr(row.slip.net)}</span>
                        <span className="text-xs text-muted">{off ? "Dilewati" : "Ikut transfer"}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="pajak" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl bg-surface p-5 shadow-card">
              <p className="flex items-center gap-2 text-xs tracking-wide text-muted uppercase">
                <ShieldCheck className="size-3.5" /> DJP Online
              </p>
              <h2 className="mt-1 font-display text-2xl">e-Bupot Unifikasi</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Kode objek 21-100-01 (pegawai tetap). Masa {period.slice(5)}/{period.slice(0, 4)}. NPWP pemotong
                10.221.884.3-012.000.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted">Wajib pajak</dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums">
                    {employees.filter(hasNpwp).length}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted">PPh 21 dipotong</dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums">
                    {formatIdr(moneySum(published.filter((s) => {
                      const p = employees.find((e) => e.id === s.employeeId);
                      return p ? hasNpwp(p) : false;
                    }).map((s) => s.pph21)))}
                  </dd>
                </div>
              </dl>
              <Button className="mt-4" onClick={downloadTax} disabled={published.length === 0}>
                <Download /> Unduh CSV e-Bupot
              </Button>
            </section>

            <section className="rounded-2xl bg-surface p-5 shadow-card">
              <p className="text-xs tracking-wide text-muted uppercase">BPJS Ketenagakerjaan</p>
              <h2 className="mt-1 font-display text-2xl">Berkas SIPP</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Iuran JHT, JP, JKK, dan JKM sesuai upah sebulan. Siap diunggah ke SIPP sebagai koreksi upah.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted">Peserta</dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums">{periodSlips.length}</dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-xs text-muted">Iuran pemberi kerja</dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums">
                    {formatIdr(
                      moneySum(periodSlips.map((s) => s.jhtEr + s.jpEr + s.jkkEr + s.jkmEr + s.bpjsKesEr)),
                    )}
                  </dd>
                </div>
              </dl>
              <Button className="mt-4" variant="secondary" onClick={downloadBpjs}>
                <Download /> Unduh CSV SIPP
              </Button>
            </section>
          </div>

          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <h2 className="font-display text-xl">Dilewati e-Bupot</h2>
            <p className="mt-1 mb-3 text-sm text-muted">Tanpa NPWP valid, DJP menolak baris.</p>
            <ul className="space-y-2">
              {employees.filter((e) => !hasNpwp(e)).map((person) => (
                <li key={person.id} className="flex items-center justify-between rounded-xl bg-surface-2 p-3">
                  <Link to="/app/employees/$id" params={{ id: person.id }} className="flex items-center gap-3">
                    <PersonAvatar person={person} size="sm" />
                    <span>
                      <span className="block font-medium">{person.name}</span>
                      <span className="block text-xs text-muted">{person.title} · NPWP {person.npwp}</span>
                    </span>
                  </Link>
                  <Badge tone="warn">Dilewati</Badge>
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(connectId)} onOpenChange={(open) => !open && setConnectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hubungkan {connectMeta?.name}</DialogTitle>
            <DialogDescription>
              Demo memakai token sandbox. Di produksi, token disimpan di sisi Finance — tidak pernah di browser karyawan.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!connectId) return;
              if (!companyCode.trim() || !token.trim()) {
                toast.error("Kode perusahaan dan token wajib.");
                return;
              }
              connectPayroll(connectId, { companyCode: companyCode.trim(), environment });
              toast.success(`${connectMeta?.name} terhubung.`);
              setConnectId(null);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="company-code">Kode perusahaan</Label>
              <Input id="company-code" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-token">Token API</Label>
              <Input id="api-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Lingkungan</Label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as ConnectorEnvironment)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Produksi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Simpan koneksi
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
