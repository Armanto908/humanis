import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { ApprovalBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, LEAVE_LABEL } from "@/lib/format";
import { useHumanis, useMe, useVisibleEmployees } from "@/lib/store";
import type { LeaveType } from "@/lib/types";

export const Route = createFileRoute("/app/leave")({ component: LeavePage });

function LeavePage() {
  const me = useMe();
  const role = useHumanis((s) => s.role);
  const people = useVisibleEmployees();
  const leaves = useHumanis((s) => s.leaves);
  const balances = useHumanis((s) => s.balances);
  const decideLeave = useHumanis((s) => s.decideLeave);
  const submitLeave = useHumanis((s) => s.submitLeave);
  const myBalance = balances.find((b) => b.employeeId === me.id);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("2026-09-22");
  const [endDate, setEndDate] = useState("2026-09-22");
  const [reason, setReason] = useState("");

  const visible = leaves.filter((l) => people.some((p) => p.id === l.employeeId));
  const mine = leaves.filter((l) => l.employeeId === me.id);
  const queue = role === "employee" ? mine : visible;

  return (
    <div>
      <PageHeader
        eyebrow="Cuti & izin"
        title="Pengajuan cuti"
        description="Alur persetujuan berjenjang: atasan, lalu People. Sisa hari selalu terlihat."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Ajukan cuti</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pengajuan baru</DialogTitle>
                <DialogDescription>Cuti tahunan diajukan minimal 7 hari sebelumnya, kecuali sakit.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitLeave({ type, startDate, endDate, reason });
                  toast.success("Pengajuan terkirim ke atasan.");
                  setOpen(false);
                  setReason("");
                }}
              >
                <div className="space-y-1.5">
                  <Label>Jenis</Label>
                  <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LEAVE_LABEL) as LeaveType[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {LEAVE_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start">Mulai</Label>
                    <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end">Selesai</Label>
                    <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reason">Alasan</Label>
                  <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">
                  Kirim
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {myBalance ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Cuti tahunan"
            value={`${myBalance.annual - myBalance.annualUsed}`}
            hint={`dari ${myBalance.annual} hari · terpakai ${myBalance.annualUsed}`}
          />
          <StatCard
            label="Cuti sakit"
            value={`${myBalance.sick - myBalance.sickUsed}`}
            hint={`terpakai ${myBalance.sickUsed} hari`}
          />
        </div>
      ) : null}

      <section className="space-y-3">
        {queue.map((leave) => {
          const person = people.find((p) => p.id === leave.employeeId) ?? me;
          const canDecide =
            leave.status === "pending" &&
            (role === "hr" || leave.approvals.some((a) => a.approverId === me.id && a.status === "pending"));
          return (
            <article key={leave.id} className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar person={person} />
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-muted">
                      {LEAVE_LABEL[leave.type]} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.days}{" "}
                      hari
                    </p>
                  </div>
                </div>
                <ApprovalBadge value={leave.status} />
              </div>
              <p className="mt-3 text-sm text-ink-soft">{leave.reason}</p>
              <ol className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                {leave.approvals.map((a) => {
                  const approver = useHumanis.getState().employees.find((e) => e.id === a.approverId);
                  return (
                    <li key={a.approverId} className="rounded-full bg-surface-2 px-2.5 py-1">
                      {approver?.preferredName ?? a.approverId}: {a.status}
                    </li>
                  );
                })}
              </ol>
              {canDecide ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      decideLeave(leave.id, "approved");
                      toast.success("Pengajuan disetujui.");
                    }}
                  >
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      decideLeave(leave.id, "rejected", "Tidak dapat disetujui pada rentang ini.");
                      toast.success("Pengajuan ditolak.");
                    }}
                  >
                    Tolak
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
        {queue.length === 0 ? <p className="text-sm text-muted">Belum ada pengajuan.</p> : null}
      </section>
    </div>
  );
}
