import { createFileRoute } from "@tanstack/react-router";
import { OrgChart } from "@/components/org-chart";
import { PageHeader } from "@/components/page-header";
import { useVisibleEmployees } from "@/lib/store";

export const Route = createFileRoute("/app/org")({ component: OrgPage });

function OrgPage() {
  const people = useVisibleEmployees();
  return (
    <div>
      <PageHeader
        eyebrow="Struktur"
        title="Bagan organisasi"
        description="Posisi mengikuti atasan langsung. Rotasi atau promosi mengubah pohon ini secara otomatis."
      />
      <div className="rounded-2xl bg-surface p-4 shadow-card md:p-8">
        <OrgChart people={people} />
      </div>
    </div>
  );
}
