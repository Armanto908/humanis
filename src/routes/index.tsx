import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Fingerprint,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

const MODULES = [
  {
    icon: Users,
    title: "Berkas digital karyawan",
    body: "Profil, kontrak, sertifikasi, dan fasilitas dalam satu kartu yang tenang — bukan folder yang hilang.",
  },
  {
    icon: Fingerprint,
    title: "Presensi & cuti",
    body: "Clock-in GPS atau foto, cuti berjenjang, sisa hari yang selalu terlihat.",
  },
  {
    icon: Wallet,
    title: "Payroll Indonesia",
    body: "Hitung BPJS & PPh 21, lalu kirim ke Accurate, file bank BCA, dan e-Bupot — tanpa spreadsheet bolak-balik.",
  },
  {
    icon: Target,
    title: "Kinerja 360 & KPI",
    body: "Penilaian atasan, rekan, dan diri sendiri. Target tim yang bergerak di depan mata.",
  },
  {
    icon: Bot,
    title: "Asisten People",
    body: "Tanya sisa cuti, klaim medis, atau syarat lembur. Bot menjawab dari peraturan perusahaan.",
  },
  {
    icon: Sparkles,
    title: "Retensi & mobilitas",
    body: "Deteksi burnout lebih awal. Cocokkan keterampilan lama ke lowongan baru sebelum merekrut luar.",
  },
];

function Home() {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <Button asChild size="sm">
          <Link to="/masuk">
            Masuk portal <ArrowRight />
          </Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl items-end gap-10 px-4 pt-8 pb-16 md:grid-cols-12 md:px-8 md:pt-16 md:pb-24">
        <div className="md:col-span-7">
          <p className="enter-up text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Humanis · PT Arunika Digital
          </p>
          <h1 className="enter-up enter-up-1 mt-4 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl md:text-6xl">
            Orang bukan baris di spreadsheet.
          </h1>
          <p className="enter-up enter-up-2 mt-5 max-w-xl text-base text-muted md:text-lg">
            Platform pengelolaan karyawan berbasis AI yang memahami manusia dan efisiensi bisnis — dari
            presensi, cuti, payroll BPJS & PPh 21, hingga kinerja dan retensi.
          </p>
          <div className="enter-up enter-up-3 mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/masuk">
                Coba portal demo <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#modul">Lihat modul</a>
            </Button>
          </div>
        </div>
        <aside className="enter-up enter-up-4 md:col-span-5">
          <div className="rounded-3xl bg-surface p-2 shadow-card">
            <div className="rounded-2xl bg-accent p-5 text-accent-fg">
              <p className="text-xs tracking-[0.16em] uppercase opacity-70">Dasbor hari ini</p>
              <p className="mt-2 font-display text-3xl">18 orang · 94% hadir</p>
              <p className="mt-1 text-sm opacity-80">2 cuti menunggu · 1 sinyal retensi tinggi</p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[
                ["Payroll Agustus", "Terbayar"],
                ["eNPS", "36"],
                ["Cuti terpakai", "41 hari"],
                ["Open role", "2 internal"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-surface-2 px-3 py-3">
                  <p className="text-xs text-muted">{k}</p>
                  <p className="mt-1 font-medium tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section id="modul" className="border-t border-line bg-surface/50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Modul inti</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-medium tracking-tight md:text-4xl">
            HR yang rapat. Tanpa terasa kaku.
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => (
              <article key={mod.title} className="rounded-2xl bg-surface p-5 shadow-card">
                <mod.icon className="size-5 text-accent" />
                <h3 className="mt-4 font-display text-xl font-medium">{mod.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{mod.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-8 rounded-3xl bg-ink px-6 py-10 text-accent-fg md:grid-cols-2 md:px-12 md:py-14">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase opacity-60">Kecerdasan buatan</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
              AI yang menulis draf, bukan yang menggantikan atasan.
            </h2>
          </div>
          <ul className="space-y-4 text-sm leading-relaxed text-accent-soft">
            <li>Asisten FAQ menjawab sisa cuti, klaim, dan SOP dari dokumen perusahaan.</li>
            <li>Generator review kinerja menyusun narasi objektif dari KPI — manajer yang mengedit.</li>
            <li>Mobilitas internal mencocokkan keterampilan sebelum pasang lowongan ke luar.</li>
            <li>Analisis retensi membaca pola hadir dan pulsa tim, lalu mengusulkan percakapan.</li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <Logo />
          <p>Demo People Ops untuk PT Arunika Digital. Data fiktif, perhitungan pajak bersifat ilustratif.</p>
        </div>
      </footer>
    </div>
  );
}
