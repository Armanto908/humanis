import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskAccount } from "@/lib/format";
import { useHumanis, useMe } from "@/lib/store";

export const Route = createFileRoute("/app/me")({ component: MePage });

function MePage() {
  const me = useMe();
  const updateProfile = useHumanis((s) => s.updateProfile);
  const [address, setAddress] = useState(me.address);
  const [phone, setPhone] = useState(me.phone);
  const [city, setCity] = useState(me.city);
  const [bank, setBank] = useState(me.bankName);
  const [account, setAccount] = useState(me.bankAccount);

  return (
    <div>
      <PageHeader
        eyebrow="Self-service"
        title="Data pribadi"
        description="Perbarui alamat, telepon, dan rekening. Perubahan langsung tercatat di berkas digital."
      />
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-card">
        <PersonAvatar person={me} size="lg" />
        <div>
          <p className="font-display text-2xl">{me.name}</p>
          <p className="text-sm text-muted">
            {me.email} · {me.nik}
          </p>
        </div>
      </div>
      <form
        className="max-w-xl space-y-4 rounded-2xl bg-surface p-5 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile(me.id, { address, phone, city, bankName: bank, bankAccount: account });
          toast.success("Data pribadi diperbarui.");
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telepon</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Alamat</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Kota</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bank">Bank</Label>
            <Input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc">Nomor rekening</Label>
            <Input id="acc" value={account} onChange={(e) => setAccount(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted">Tampilan ringkas untuk HR: {me.bankName} {maskAccount(account)}</p>
        <Button type="submit">Simpan perubahan</Button>
      </form>
    </div>
  );
}
