import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { RiskBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { analyzeRetention } from "@/lib/ai";
import { tenureLabel } from "@/lib/format";
import { useHumanis } from "@/lib/store";

export const Route = createFileRoute("/app/retention")({ component: RetentionPage });

function RetentionPage() {
  const employees = useHumanis((s) => s.employees);
  const retention = useHumanis((s) => s.retention);
  const attendance = useHumanis((s) => s.attendance);
  const kpis = useHumanis((s) => s.kpis);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const high = retention.filter((r) => r.risk === "high").length;
  const mid = retention.filter((r) => r.risk === "medium").length;

  async function run() {
    setBusy(true);
    const snapshot = retention
      .map((r) => {
        const e = employees.find((p) => p.id === r.employeeId);
        const att = attendance.filter((a) => a.employeeId === r.employeeId);
        const late = att.filter((a) => a.status === "late").length;
        const kpi = kpis.filter((k) => k.employeeId === r.employeeId);
        return `${e?.name}: risiko ${r.risk} (${r.score}), sentimen ${r.sentiment}, masa kerja ${e ? tenureLabel(e.joinDate) : "-"}, terlambat ${late}, faktor: ${r.factors.join("; ")}, kpi: ${kpi.map((k) => `${k.title} ${k.status}`).join(", ")}`;
      })
      .join("\n");
    const res = await analyzeRetention({ data: { snapshot } });
    setBusy(false);
    if (!res.ok) {
      toast.error("Analisis AI tidak tersedia. Sinyal di bawah tetap valid.");
      setNote(
        "Bima: kurangi lembur, pecah pekerjaan, 1:1 dua kali seminggu.\nGilang: rencana 30 hari pipeline, dampingan Brand Lead.\nKirana: tetapkan mentor desain formal.",
      );
      return;
    }
    setNote(res.text);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Predictive"
        title="Retensi & pulsa"
        description="Pola kehadiran, KPI, dan survei untuk mendeteksi burnout atau niat pindah lebih awal."
        actions={
          <Button disabled={busy} onClick={() => void run()}>
            {busy ? "Menganalisis…" : "Analisis dengan AI"}
          </Button>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Risiko tinggi" value={high} />
        <StatCard label="Perlu dipantau" value={mid} />
        <StatCard label="Sinyal aktif" value={retention.length} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {retention.map((signal) => {
          const person = employees.find((e) => e.id === signal.employeeId);
          if (!person) return null;
          return (
            <article key={signal.employeeId} className="rounded-2xl bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar person={person} />
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-xs text-muted">{person.title}</p>
                  </div>
                </div>
                <RiskBadge value={signal.risk} />
              </div>
              <p className="mt-3 font-display text-3xl tabular-nums">{signal.score}</p>
              <p className="text-xs text-muted">Skor risiko · sentimen {signal.sentiment.toFixed(2)}</p>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-ink-soft">
                {signal.factors.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      {note ? (
        <section className="mt-6 rounded-2xl bg-ink p-5 text-accent-fg md:p-6">
          <h2 className="font-display text-xl">Catatan AI</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-accent-soft">{note}</pre>
        </section>
      ) : null}
    </div>
  );
}
