import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { AttendanceBadge, EmploymentBadge, KpiBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CONTRACT_LABEL,
  DEPARTMENT_LABEL,
  formatDate,
  formatIdr,
  maskAccount,
  tenureLabel,
} from "@/lib/format";
import { useHumanis } from "@/lib/store";

export const Route = createFileRoute("/app/employees/$id")({ component: EmployeeFile });

function EmployeeFile() {
  const { id } = Route.useParams();
  const employees = useHumanis((s) => s.employees);
  const person = employees.find((e) => e.id === id);
  const manager = employees.find((e) => e.id === person?.managerId);
  const attendanceAll = useHumanis((s) => s.attendance);
  const kpisAll = useHumanis((s) => s.kpis);
  const slipsAll = useHumanis((s) => s.payslips);
  const attendance = useMemo(
    () => attendanceAll.filter((a) => a.employeeId === id).slice().reverse(),
    [attendanceAll, id],
  );
  const kpis = useMemo(() => kpisAll.filter((k) => k.employeeId === id), [kpisAll, id]);
  const slips = useMemo(() => slipsAll.filter((p) => p.employeeId === id), [slipsAll, id]);
  const certs = person?.certifications ?? [];
  const role = useHumanis((s) => s.role);

  if (!person) {
    return (
      <div>
        <PageHeader title="Karyawan tidak ditemukan" />
        <Button asChild variant="secondary">
          <Link to="/app/employees">Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={person.nik}
        title={person.name}
        description={`${person.title} · ${DEPARTMENT_LABEL[person.department]}`}
        actions={
          role !== "employee" ? (
            <Button asChild size="sm">
              <Link to="/app/performance">Buka kinerja</Link>
            </Button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-5 shadow-card">
        <PersonAvatar person={person} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <EmploymentBadge value={person.status} />
            <Badge>{CONTRACT_LABEL[person.contractType]}</Badge>
            <Badge tone="accent">{person.grade}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Bergabung {formatDate(person.joinDate)} · {tenureLabel(person.joinDate)}
            {manager ? ` · Atasan ${manager.name}` : ""}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profil">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="kontrak">Kontrak</TabsTrigger>
          <TabsTrigger value="hadir">Kehadiran</TabsTrigger>
          <TabsTrigger value="kinerja">KPI</TabsTrigger>
          {role === "hr" ? <TabsTrigger value="gaji">Kompensasi</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="profil" className="space-y-4">
          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg">Data diri</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Field k="Email" v={person.email} />
              <Field k="Telepon" v={person.phone} />
              <Field k="Lahir" v={formatDate(person.birthDate)} />
              <Field k="Kota" v={person.city} />
              <Field k="Alamat" v={person.address} />
              <Field k="Kontak darurat" v={`${person.emergencyContact.name} (${person.emergencyContact.relation})`} />
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">{person.bio}</p>
          </section>
          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg">Keterampilan & sertifikasi</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {person.skills.map((s) => (
                <Badge key={s} tone="accent">
                  {s}
                </Badge>
              ))}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {certs.map((c) => (
                <li key={c.name} className="flex justify-between gap-4">
                  <span>
                    {c.name} · {c.issuer}
                  </span>
                  <span className="tabular-nums text-muted">{c.year}</span>
                </li>
              ))}
              {certs.length === 0 ? <li className="text-muted">Belum ada sertifikasi tercatat.</li> : null}
            </ul>
          </section>
        </TabsContent>
        <TabsContent value="kontrak">
          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field k="Jenis" v={CONTRACT_LABEL[person.contractType]} />
              <Field k="Grade" v={person.grade} />
              <Field k="Mulai" v={formatDate(person.joinDate)} />
              <Field k="Berakhir" v={person.contractEnd ? formatDate(person.contractEnd) : "Tidak ditentukan"} />
              <Field k="Fasilitas" v={person.facilities.join(", ") || "—"} />
              <Field k="Lokasi" v={person.location} />
            </dl>
          </section>
        </TabsContent>
        <TabsContent value="hadir">
          <section className="overflow-hidden rounded-2xl bg-surface shadow-card">
            <ul>
              {attendance.slice(0, 12).map((row) => (
                <li key={row.id} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
                  <span className="text-sm">{formatDate(row.date, "EEEE, d MMM")}</span>
                  <AttendanceBadge value={row.status} />
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>
        <TabsContent value="kinerja" className="space-y-3">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{kpi.title}</p>
                  <p className="text-sm text-muted">{kpi.description}</p>
                </div>
                <KpiBadge value={kpi.status} />
              </div>
              <p className="mt-2 font-display text-2xl tabular-nums">
                {kpi.current}
                <span className="text-base text-muted">
                  /{kpi.target} {kpi.unit}
                </span>
              </p>
            </div>
          ))}
          {kpis.length === 0 ? <p className="text-sm text-muted">Belum ada KPI pada siklus ini.</p> : null}
        </TabsContent>
        {role === "hr" ? (
          <TabsContent value="gaji">
            <section className="rounded-2xl bg-surface p-5 shadow-card">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Field k="Gaji pokok" v={formatIdr(person.salary)} />
                <Field k="Tunjangan" v={formatIdr(person.allowance)} />
                <Field k="PTKP" v={person.ptkp} />
                <Field k="NPWP" v={person.npwp} />
                <Field k="Rekening" v={`${person.bankName} ${maskAccount(person.bankAccount)}`} />
                <Field k="BPJS Kes / TK" v={`${person.bpjsKes} / ${person.bpjsTk}`} />
              </dl>
              <div className="mt-4 space-y-2">
                {slips.map((s) => (
                  <Link
                    key={s.id}
                    to="/app/payroll/$id"
                    params={{ id: s.id }}
                    className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm"
                  >
                    <span>{s.period}</span>
                    <span className="tabular-nums font-medium">{formatIdr(s.net)}</span>
                  </Link>
                ))}
              </div>
            </section>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{k}</dt>
      <dd className="mt-0.5 text-ink">{v}</dd>
    </div>
  );
}
