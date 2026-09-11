import { useState } from "react";
import { Camera, MapPin, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useHumanis, useMe } from "@/lib/store";
import { TODAY_ISO } from "@/lib/seed";
import { formatTime } from "@/lib/format";
import { COMPANY } from "@/lib/seed";

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ClockWidget() {
  const me = useMe();
  const attendance = useHumanis((s) => s.attendance);
  const clockIn = useHumanis((s) => s.clockIn);
  const clockOut = useHumanis((s) => s.clockOut);
  const [busy, setBusy] = useState(false);
  const today = attendance.find((a) => a.employeeId === me.id && a.date === TODAY_ISO);

  async function withGps() {
    setBusy(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Lokasi tidak tersedia"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
      });
      const { latitude, longitude } = pos.coords;
      const dist = distanceMeters(latitude, longitude, COMPANY.officeLat, COMPANY.officeLng);
      clockIn({ method: "gps", lat: latitude, lng: longitude });
      toast.success(
        dist <= 250
          ? "Clock-in di radius kantor berhasil."
          : "Clock-in tercatat. Lokasi di luar radius — dicatat sebagai kerja jarak jauh.",
      );
    } catch {
      clockIn({ method: "gps" });
      toast.success("Clock-in tercatat tanpa GPS (izin lokasi ditolak).");
    } finally {
      setBusy(false);
    }
  }

  function withPhoto() {
    clockIn({ method: "photo", photo: true });
    toast.success("Clock-in dengan foto tercatat. Verifikasi wajah akan diproses.");
  }

  return (
    <div className="rounded-2xl bg-accent p-5 text-accent-fg md:p-6">
      <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-70">Presensi hari ini</p>
      <p className="mt-2 font-display text-2xl font-medium tracking-tight">
        {today?.clockIn ? `Masuk ${formatTime(today.clockIn)}` : "Belum clock-in"}
      </p>
      <p className="mt-1 text-sm opacity-80">
        {today?.clockOut
          ? `Pulang ${formatTime(today.clockOut)}`
          : today?.clockIn
            ? "Jangan lupa clock-out saat selesai."
            : "Gunakan GPS di radius kantor, atau foto seluler."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!today?.clockIn ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={withGps}
              className="bg-accent-fg text-accent hover:bg-accent-soft"
            >
              <MapPin /> GPS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={withPhoto}
              className="border-0 bg-accent-mid text-accent-fg shadow-none hover:bg-accent-mid/80"
            >
              <Camera /> Foto
            </Button>
          </>
        ) : !today.clockOut ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              clockOut();
              toast.success("Clock-out tercatat. Hati-hati di jalan.");
            }}
            className="bg-accent-fg text-accent hover:bg-accent-soft"
          >
            <LogOut /> Clock-out
          </Button>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm opacity-80">
            <LogIn className="size-4" /> Hari ini sudah lengkap
          </span>
        )}
      </div>
    </div>
  );
}
