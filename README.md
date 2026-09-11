# Humanis

**Live:** [https://humanis-id.netlify.app](https://humanis-id.netlify.app)

Platform pengelolaan karyawan berbasis AI — People Ops untuk studio fiktif **PT Arunika Digital**.

Tagline: *Platform Pengelolaan Karyawan Berbasis AI yang Memahami Manusia dan Efisiensi Bisnis.*

## Yang ada di portal

- Berkas digital karyawan dan bagan organisasi
- Presensi GPS/foto, cuti berjenjang
- Payroll Indonesia: BPJS, PPh 21, e-slip
- Integrasi payroll lokal (Accurate, file bank BCA, e-Bupot)
- Kinerja 360, KPI, asisten People, retensi, mobilitas internal
- Portal mandiri karyawan

Data demo fiktif. Perhitungan pajak bersifat ilustratif.

## Masuk demo

Pilih peran di halaman masuk:

| Peran | Nama |
| --- | --- |
| People Partner | Lestari Wulandari |
| People Manager | Raka Putra |
| Karyawan | Nadia Kusuma |

## Stack

React 19, TanStack Start, Tailwind CSS v4, Zustand.

## Menjalankan lokal

```bash
git clone https://github.com/Armanto908/humanis.git
cd humanis
npm install
npm run dev
```

Tidak ada login nyata: pilih persona demo di halaman masuk. Data tersimpan di `localStorage` browser.

## Catatan

Perhitungan BPJS/PPh 21 dan file ekspor (Accurate, BCA Multi Credit, e-Bupot, BPJS SIPP) bersifat demo/ilustratif, bukan nasihat pajak.

