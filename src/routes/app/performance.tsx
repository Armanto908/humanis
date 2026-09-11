import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateReview } from "@/lib/ai";
import { ATTENDANCE_LABEL, REVIEW_LABEL } from "@/lib/format";
import { COMPETENCIES } from "@/lib/seed";
import { useHumanis, useMe, useVisibleEmployees } from "@/lib/store";
import { uid } from "@/lib/utils";

export const Route = createFileRoute("/app/performance")({ component: PerformancePage });

function PerformancePage() {
  const me = useMe();
  const role = useHumanis((s) => s.role);
  const people = useVisibleEmployees();
  const reviews = useHumanis((s) => s.reviews);
  const kpis = useHumanis((s) => s.kpis);
  const attendance = useHumanis((s) => s.attendance);
  const saveReview = useHumanis((s) => s.saveReview);
  const subjects = people.filter((p) => (role === "hr" ? true : p.id !== me.id || role === "manager"));
  const [selected, setSelected] = useState(subjects[0]?.id ?? me.id);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const person = people.find((p) => p.id === selected) ?? me;
  const pack = reviews.filter((r) => r.employeeId === person.id);
  const existing = pack.find((r) => r.type === "manager" && r.reviewerId === me.id);

  async function runAi() {
    setBusy(true);
    const kpiText = kpis
      .filter((k) => k.employeeId === person.id)
      .map((k) => `${k.title}: ${k.current}/${k.target} ${k.unit} (${k.status})`)
      .join("\n");
    const reviewText = pack
      .filter((r) => r.narrative)
      .map((r) => `${REVIEW_LABEL[r.type]}: ${r.narrative}`)
      .join("\n");
    const att = attendance.filter((a) => a.employeeId === person.id);
    const summary = Object.entries(
      att.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .map(([k, v]) => `${ATTENDANCE_LABEL[k as keyof typeof ATTENDANCE_LABEL]}: ${v}`)
      .join(", ");
    const res = await generateReview({
      data: {
        name: person.name,
        title: person.title,
        kpis: kpiText || "Tidak ada KPI",
        reviews: reviewText || "Belum ada umpan balik",
        attendance: summary || "Tidak ada data",
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error === "unavailable" ? "Asisten AI sedang tidak tersedia." : "Gagal menulis draf.");
      return;
    }
    setDraft(res.text);
    toast.success("Draf siap. Sunting sebelum dikirim.");
  }

  return (
    <div>
      <PageHeader
        eyebrow="360°"
        title="Penilaian kinerja"
        description="Atasan, rekan, dan diri sendiri. AI menyusun draf — manajer yang memutuskan nadanya."
      />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl bg-surface p-2 shadow-card">
          {subjects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelected(p.id);
                setDraft(existing && p.id === selected ? draft : "");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${
                p.id === selected ? "bg-accent-soft" : "hover:bg-surface-2"
              }`}
            >
              <PersonAvatar person={p} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{p.preferredName}</span>
                <span className="block truncate text-xs text-muted">{p.title}</span>
              </span>
            </button>
          ))}
        </aside>
        <div className="space-y-4">
          <section className="rounded-2xl bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <PersonAvatar person={person} />
              <div>
                <p className="font-display text-xl">{person.name}</p>
                <p className="text-sm text-muted">Siklus Q3 2026</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {pack.map((r) => (
                <article key={r.id} className="rounded-xl bg-surface-2 p-3">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">{REVIEW_LABEL[r.type]}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {r.narrative || (r.status === "draft" ? "Draf masih kosong." : "—")}
                  </p>
                  <p className="mt-2 text-xs tabular-nums text-muted">
                    rata-rata {(r.scores.reduce((a, s) => a + s.score, 0) / (r.scores.length || 1)).toFixed(1)} / 5
                  </p>
                </article>
              ))}
              {pack.length === 0 ? <p className="text-sm text-muted">Belum ada paket 360.</p> : null}
            </div>
          </section>
          {role !== "employee" ? (
            <section className="rounded-2xl bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg">Draf atasan</h2>
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => void runAi()}>
                  {busy ? "Menyusun…" : "Tulis dengan AI"}
                </Button>
              </div>
              <Textarea
                className="mt-3 min-h-40"
                value={draft || existing?.narrative || ""}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Narasi penilaian…"
              />
              <Button
                className="mt-3"
                onClick={() => {
                  saveReview({
                    id: existing?.id ?? uid("rv"),
                    employeeId: person.id,
                    cycle: "Q3 2026",
                    type: "manager",
                    reviewerId: me.id,
                    scores: existing?.scores ?? COMPETENCIES.map((c) => ({ competency: c, score: 4 })),
                    narrative: draft || existing?.narrative || "",
                    submittedAt: new Date().toISOString(),
                    status: "submitted",
                  });
                  toast.success("Penilaian atasan disimpan.");
                }}
              >
                Simpan penilaian
              </Button>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
