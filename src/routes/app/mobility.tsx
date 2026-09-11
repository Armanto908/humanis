import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PersonRow } from "@/components/person-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { matchInternal } from "@/lib/ai";
import { DEPARTMENT_LABEL } from "@/lib/format";
import { useHumanis } from "@/lib/store";
import type { OpenPosition } from "@/lib/types";

export const Route = createFileRoute("/app/mobility")({ component: MobilityPage });

function MobilityPage() {
  const positions = useHumanis((s) => s.positions);
  const employees = useHumanis((s) => s.employees);
  const [active, setActive] = useState<OpenPosition>(positions[0]);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await matchInternal({
      data: {
        position: `${active.title} (${DEPARTMENT_LABEL[active.department]}, ${active.level})`,
        requirements: `${active.description} Keterampilan: ${active.skills.join(", ")}`,
        candidates: employees
          .map((e) => `${e.name} | ${e.title} | ${DEPARTMENT_LABEL[e.department]} | skills: ${e.skills.join(", ")}`)
          .join("\n"),
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error === "unavailable" ? "AI tidak tersedia. Menampilkan kecocokan manual." : "Gagal mencocokkan.");
      const scored = employees
        .map((e) => ({
          e,
          n: e.skills.filter((s) => active.skills.some((r) => r.toLowerCase() === s.toLowerCase())).length,
        }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 4);
      setResult(
        scored
          .map(
            ({ e, n }) =>
              `${e.name} — ${n} keterampilan bertemu. ${e.title} di ${DEPARTMENT_LABEL[e.department]}.`,
          )
          .join("\n"),
      );
      return;
    }
    setResult(res.text);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Internal first"
        title="Mobilitas internal"
        description="Cocokkan keterampilan karyawan lama ke posisi baru sebelum merekrut orang luar."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {positions.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActive(p);
                setResult("");
              }}
              className={`w-full rounded-2xl p-5 text-left shadow-card ${
                active.id === p.id ? "bg-accent text-accent-fg" : "bg-surface hover:shadow-card-hover"
              }`}
            >
              <p className="font-display text-xl">{p.title}</p>
              <p className={`mt-1 text-sm ${active.id === p.id ? "opacity-80" : "text-muted"}`}>
                {DEPARTMENT_LABEL[p.department]} · {p.level}
              </p>
              <p className={`mt-2 text-sm ${active.id === p.id ? "opacity-90" : "text-ink-soft"}`}>{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <Badge key={s} tone={active.id === p.id ? "neutral" : "accent"}>
                    {s}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg">Kandidat internal</h2>
            <Button size="sm" disabled={busy} onClick={() => void run()}>
              {busy ? "Mencocokkan…" : "Cocokkan dengan AI"}
            </Button>
          </div>
          {result ? (
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-soft">{result}</pre>
          ) : (
            <div className="mt-4 space-y-3">
              {employees
                .filter((e) => e.department === active.department || e.skills.some((s) => active.skills.includes(s)))
                .slice(0, 5)
                .map((e) => (
                  <PersonRow key={e.id} person={e} extra={e.skills.slice(0, 3).join(", ")} link />
                ))}
              <p className="text-xs text-muted">Jalankan pencocokan AI untuk ranking dan alasan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
