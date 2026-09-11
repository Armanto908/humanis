import { createFileRoute } from "@tanstack/react-router";
import { ClockWidget } from "@/components/clock-widget";
import { PageHeader } from "@/components/page-header";
import { PersonAvatar } from "@/components/person-avatar";
import { AttendanceBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { formatDate, formatTime } from "@/lib/format";
import { TODAY_ISO } from "@/lib/seed";
import { useHumanis, useVisibleEmployees } from "@/lib/store";

export const Route = createFileRoute("/app/attendance")({ component: AttendancePage });

function AttendancePage() {
  const role = useHumanis((s) => s.role);
  const meId = useHumanis((s) => s.currentUserId);
  const people = useVisibleEmployees();
  const attendance = useHumanis((s) => s.attendance);

  const today = attendance.filter((a) => a.date === TODAY_ISO && people.some((p) => p.id === a.employeeId));
  const mine = attendance.filter((a) => a.employeeId === meId).slice().reverse();
  const late = today.filter((a) => a.status === "late").length;
  const wfh = today.filter((a) => a.status === "wfh").length;
  const absent = today.filter((a) => a.status === "absent").length;

  return (
    <div>
      <PageHeader
        eyebrow="Presensi"
        title="Kehadiran"
        description="Clock-in berbasis lokasi atau foto seluler. Keterlambatan dihitung setelah 09.15."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClockWidget />
        </div>
        {role !== "employee" ? (
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <StatCard label="Terlambat" value={late} />
            <StatCard label="Jarak jauh" value={wfh} />
            <StatCard label="Tidak hadir" value={absent} />
          </div>
        ) : (
          <StatCard label="Catatan bulan ini" value={mine.length} hint="Hari kerja tercatat" />
        )}
      </div>

      {role !== "employee" ? (
        <section className="mt-6 overflow-hidden rounded-2xl bg-surface shadow-card">
          <header className="border-b border-line px-4 py-3">
            <h2 className="font-display text-lg">Hari ini · {formatDate(TODAY_ISO, "EEEE d MMMM")}</h2>
          </header>
          <ul>
            {people.map((person) => {
              const row = today.find((a) => a.employeeId === person.id);
              return (
                <li key={person.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
                  <span className="flex min-w-0 items-center gap-3">
                    <PersonAvatar person={person} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{person.name}</span>
                      <span className="block text-xs text-muted">
                        {row?.clockIn ? formatTime(row.clockIn) : "—"}
                        {row?.clockOut ? ` – ${formatTime(row.clockOut)}` : ""}
                      </span>
                    </span>
                  </span>
                  {row ? <AttendanceBadge value={row.status} /> : <AttendanceBadge value="absent" />}
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-2xl bg-surface shadow-card">
          <header className="border-b border-line px-4 py-3">
            <h2 className="font-display text-lg">Riwayat saya</h2>
          </header>
          <ul>
            {mine.slice(0, 14).map((row) => (
              <li key={row.id} className="flex items-center justify-between px-4 py-3 even:bg-surface-2/60">
                <span className="text-sm">{formatDate(row.date, "EEEE, d MMM")}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-muted">
                    {row.clockIn ? formatTime(row.clockIn) : "—"}
                    {row.clockOut ? ` – ${formatTime(row.clockOut)}` : ""}
                  </span>
                  <AttendanceBadge value={row.status} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
