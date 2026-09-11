import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { useHumanis } from "@/lib/store";

export const Route = createFileRoute("/app/docs")({ component: DocsPage });

const CAT = {
  sop: "SOP",
  policy: "Kebijakan",
  handbook: "Buku saku",
  form: "Formulir",
} as const;

function DocsPage() {
  const docs = useHumanis((s) => s.docs);
  const [open, setOpen] = useState(docs[0]?.id);

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Dokumen perusahaan"
        description="SOP, peraturan, dan kebijakan internal. Sumber jawaban asisten People."
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => setOpen(doc.id)}
                className={`w-full rounded-2xl p-4 text-left shadow-card ${
                  open === doc.id ? "bg-accent text-accent-fg" : "bg-surface hover:shadow-card-hover"
                }`}
              >
                <p className="font-medium">{doc.title}</p>
                <p className={`mt-1 text-xs ${open === doc.id ? "opacity-80" : "text-muted"}`}>
                  {CAT[doc.category]} · {formatDate(doc.updatedAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
        {docs
          .filter((d) => d.id === open)
          .map((doc) => (
            <article key={doc.id} className="rounded-2xl bg-surface p-5 shadow-card md:p-8">
              <Badge tone="accent">{CAT[doc.category]}</Badge>
              <h2 className="mt-3 font-display text-2xl">{doc.title}</h2>
              <p className="mt-2 text-sm text-muted">{doc.summary}</p>
              <p className="mt-6 text-sm leading-relaxed text-ink-soft">{doc.content}</p>
            </article>
          ))}
      </div>
    </div>
  );
}
