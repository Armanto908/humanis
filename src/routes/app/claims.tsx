import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { ClaimBadge } from "@/components/status-badge";
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
import { CLAIM_TYPE_LABEL, formatDate, formatIdr } from "@/lib/format";
import { useHumanis, useMe } from "@/lib/store";
import type { ClaimType } from "@/lib/types";

export const Route = createFileRoute("/app/claims")({ component: ClaimsPage });

function ClaimsPage() {
  const me = useMe();
  const role = useHumanis((s) => s.role);
  const employees = useHumanis((s) => s.employees);
  const claims = useHumanis((s) => s.claims);
  const submitClaim = useHumanis((s) => s.submitClaim);
  const decideClaim = useHumanis((s) => s.decideClaim);
  const rows = role === "hr" ? claims : claims.filter((c) => c.employeeId === me.id);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ClaimType>("medical");
  const [amount, setAmount] = useState("250000");
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState("kuitansi.pdf");

  return (
    <div>
      <PageHeader
        eyebrow="Benefit"
        title="Klaim kesehatan"
        description="Unggah bukti, pantau status. Plafon rawat jalan Rp 3.000.000 per tahun."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Ajukan klaim</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Klaim baru</DialogTitle>
                <DialogDescription>Ajukan maksimal 14 hari setelah transaksi, lampirkan kuitansi.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitClaim({
                    type,
                    amount: Number(amount) || 0,
                    description,
                    receiptName: receipt,
                  });
                  toast.success("Klaim terkirim ke People.");
                  setOpen(false);
                  setDescription("");
                }}
              >
                <div className="space-y-1.5">
                  <Label>Jenis</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ClaimType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CLAIM_TYPE_LABEL) as ClaimType[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {CLAIM_TYPE_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amt">Nominal (Rp)</Label>
                  <Input id="amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc">Keterangan</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="file">Nama berkas bukti</Label>
                  <Input id="file" value={receipt} onChange={(e) => setReceipt(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">
                  Kirim
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="space-y-3">
        {rows.map((claim) => {
          const person = employees.find((e) => e.id === claim.employeeId) ?? me;
          return (
            <article key={claim.id} className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar person={person} />
                  <div>
                    <p className="font-medium">{CLAIM_TYPE_LABEL[claim.type]}</p>
                    <p className="text-sm text-muted">
                      {person.name} · {formatDate(claim.date)} · {claim.receiptName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl tabular-nums">{formatIdr(claim.amount)}</p>
                  <ClaimBadge value={claim.status} />
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-soft">{claim.description}</p>
              {role === "hr" && claim.status === "pending" ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      decideClaim(claim.id, "approved");
                      toast.success("Klaim disetujui.");
                    }}
                  >
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      decideClaim(claim.id, "paid");
                      toast.success("Ditandai dibayar.");
                    }}
                  >
                    Bayar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      decideClaim(claim.id, "rejected");
                      toast.success("Klaim ditolak.");
                    }}
                  >
                    Tolak
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
        {rows.length === 0 ? <p className="text-sm text-muted">Belum ada klaim.</p> : null}
      </div>
    </div>
  );
}
