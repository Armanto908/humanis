import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askHrBot } from "@/lib/ai";
import { LEAVE_LABEL } from "@/lib/format";
import { useHumanis, useMe } from "@/lib/store";
import { uid } from "@/lib/utils";

export const Route = createFileRoute("/app/assistant")({ component: AssistantPage });

const SUGGESTIONS = [
  "Sisa cuti saya berapa?",
  "Bagaimana klaim medis?",
  "Syarat mengajukan lembur apa?",
  "Kapan slip gaji terbit?",
  "Bagaimana integrasi ke Accurate?",
];

function AssistantPage() {
  const me = useMe();
  const meId = useHumanis((s) => s.currentUserId);
  const chat = useHumanis((s) => s.chat);
  const addChat = useHumanis((s) => s.addChat);
  const balances = useHumanis((s) => s.balances);
  const allLeaves = useHumanis((s) => s.leaves);
  const balance = balances.find((b) => b.employeeId === meId);
  const leaves = useMemo(() => allLeaves.filter((l) => l.employeeId === meId), [allLeaves, meId]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || busy) return;
    addChat({ id: uid("msg"), role: "user", content: trimmed, at: new Date().toISOString() });
    setText("");
    setBusy(true);
    const context = [
      `Nama: ${me.name}`,
      `Jabatan: ${me.title}`,
      `Tipe kontrak: ${me.contractType}`,
      `Cuti tahunan sisa: ${(balance?.annual ?? 0) - (balance?.annualUsed ?? 0)} dari ${balance?.annual ?? 0}`,
      `Cuti sakit sisa: ${(balance?.sick ?? 0) - (balance?.sickUsed ?? 0)}`,
      `Pengajuan: ${leaves.map((l) => `${LEAVE_LABEL[l.type]} ${l.startDate} (${l.status})`).join("; ") || "tidak ada"}`,
    ].join("\n");
    const history = [...useHumanis.getState().chat, { role: "user" as const, content: trimmed }];
    const res = await askHrBot({
      data: {
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        context,
      },
    });
    setBusy(false);
    if (!res.ok) {
      addChat({
        id: uid("msg"),
        role: "assistant",
        content:
          res.error === "unavailable"
            ? "Asisten AI sedang tidak tersedia di lingkungan ini. Untuk sisa cuti, buka menu Cuti. Klaim medis: plafon Rp 3.000.000/tahun, ajukan max 14 hari. Lembur wajib disetujui atasan, jam pertama 1,5×."
            : "Maaf, saya gagal menjawab. Coba lagi atau tanya People Partner.",
        at: new Date().toISOString(),
      });
      if (res.error !== "unavailable") toast.error("Gagal menghubungi asisten.");
      return;
    }
    addChat({ id: uid("msg"), role: "assistant", content: res.text, at: new Date().toISOString() });
    queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <PageHeader
        eyebrow="People bot"
        title="Asisten HR"
        description="Tanya kebijakan, sisa cuti, klaim, atau syarat lembur. Jawaban bersumber dari peraturan Arunika."
      />
      <div className="flex flex-1 flex-col rounded-2xl bg-surface shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
          {chat.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[min(36rem,90%)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-accent text-accent-fg" : "bg-surface-2 text-ink"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy ? <p className="text-sm text-muted">Menyusun jawaban…</p> : null}
          <div ref={endRef} />
        </div>
        <div className="border-t border-line p-3 md:p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="rounded-full bg-surface-2 px-3 py-1.5 text-xs text-ink-soft hover:bg-bg-warm"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pertanyaan…"
              className="min-h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(text);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Kirim">
              <Send />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
