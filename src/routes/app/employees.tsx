import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { EmploymentBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTRACT_LABEL, DEPARTMENT_LABEL, tenureLabel } from "@/lib/format";
import { useVisibleEmployees } from "@/lib/store";
import type { Department } from "@/lib/types";

export const Route = createFileRoute("/app/employees")({ component: EmployeesPage });

function EmployeesPage() {
  const people = useVisibleEmployees();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return people.filter((e) => {
      const matchQ =
        !query ||
        e.name.toLowerCase().includes(query) ||
        e.title.toLowerCase().includes(query) ||
        e.nik.toLowerCase().includes(query);
      const matchD = dept === "all" || e.department === dept;
      return matchQ && matchD;
    });
  }, [people, q, dept]);

  const depts = Array.from(new Set(people.map((e) => e.department))) as Department[];

  return (
    <div>
      <PageHeader
        eyebrow="Database"
        title="Karyawan"
        description="Berkas digital: data diri, kontrak, dan posisi dalam satu direktori."
      />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, jabatan, NIK…" className="pl-10" />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Fungsi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua fungsi</SelectItem>
            {depts.map((d) => (
              <SelectItem key={d} value={d}>
                {DEPARTMENT_LABEL[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="hidden grid-cols-12 gap-2 border-b border-line px-4 py-3 text-xs font-medium tracking-wide text-muted uppercase md:grid">
          <span className="col-span-4">Nama</span>
          <span className="col-span-3">Jabatan</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Masa kerja</span>
          <span className="col-span-1">NIK</span>
        </div>
        <ul>
          {filtered.map((person) => (
            <li key={person.id} className="border-b border-line last:border-0">
              <Link
                to="/app/employees/$id"
                params={{ id: person.id }}
                className="grid grid-cols-1 items-center gap-2 px-4 py-3 transition-colors hover:bg-surface-2 md:grid-cols-12"
              >
                <span className="flex items-center gap-3 md:col-span-4">
                  <PersonAvatar person={person} />
                  <span>
                    <span className="block font-medium">{person.name}</span>
                    <span className="block text-xs text-muted md:hidden">{person.title}</span>
                  </span>
                </span>
                <span className="hidden text-sm text-ink-soft md:col-span-3 md:block">{person.title}</span>
                <span className="md:col-span-2">
                  <EmploymentBadge value={person.status} />
                  <span className="ml-2 text-xs text-muted">{CONTRACT_LABEL[person.contractType]}</span>
                </span>
                <span className="hidden text-sm tabular-nums text-ink-soft md:col-span-2 md:block">
                  {tenureLabel(person.joinDate)}
                </span>
                <span className="hidden font-mono text-xs text-muted md:col-span-1 md:block">{person.nik}</span>
              </Link>
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted">Tidak ada yang cocok.</p> : null}
      </div>
    </div>
  );
}
