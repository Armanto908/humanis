import { format, parseISO, differenceInCalendarDays, differenceInMonths } from "date-fns";
import { id } from "date-fns/locale";
import type {
  ApprovalStatus,
  AttendanceStatus,
  ClaimStatus,
  ClaimType,
  ConnectorStatus,
  ContractType,
  Department,
  EmploymentStatus,
  KpiStatus,
  LeaveType,
  ReviewType,
  RiskLevel,
  Role,
  SyncJobStatus,
  SyncKind,
} from "./types";

export const DEPARTMENT_LABEL: Record<Department, string> = {
  executive: "Direksi",
  engineering: "Engineering",
  product: "Product",
  design: "Desain",
  people: "People",
  finance: "Keuangan",
  marketing: "Brand",
  sales: "Sales",
  operations: "Operasional",
};

export const ROLE_LABEL: Record<Role, string> = {
  hr: "People Partner",
  manager: "People Manager",
  employee: "Karyawan",
};

export const STATUS_LABEL: Record<EmploymentStatus, string> = {
  active: "Aktif",
  probation: "Probation",
  contract: "Kontrak",
  leave: "Cuti panjang",
};

export const CONTRACT_LABEL: Record<ContractType, string> = {
  permanent: "PKWTT",
  contract: "PKWT",
  intern: "Magang",
};

export const LEAVE_LABEL: Record<LeaveType, string> = {
  annual: "Cuti tahunan",
  sick: "Cuti sakit",
  unpaid: "Cuti tidak dibayar",
  maternity: "Cuti melahirkan",
  permission: "Izin",
  marriage: "Cuti menikah",
};

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Hadir",
  late: "Terlambat",
  absent: "Tidak hadir",
  leave: "Cuti",
  wfh: "Kerja jarak jauh",
};

export const KPI_LABEL: Record<KpiStatus, string> = {
  on_track: "On track",
  at_risk: "Perlu perhatian",
  behind: "Tertinggal",
  exceeded: "Melampaui",
};

export const REVIEW_LABEL: Record<ReviewType, string> = {
  self: "Diri sendiri",
  manager: "Atasan",
  peer: "Rekan kerja",
};

export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
  medical: "Kesehatan",
  transport: "Transport",
  wellness: "Wellness",
  other: "Lainnya",
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  paid: "Dibayar",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

export const CONNECTOR_STATUS_LABEL: Record<ConnectorStatus, string> = {
  disconnected: "Belum terhubung",
  connected: "Terhubung",
  syncing: "Menyinkronkan",
  error: "Gagal",
};

export const SYNC_KIND_LABEL: Record<SyncKind, string> = {
  master: "Master karyawan",
  attendance: "Kehadiran & lembur",
  payroll_push: "Kirim komponen gaji",
  payroll_pull: "Tarik hasil hitung",
  full: "Sinkron penuh",
  bank_file: "File transfer bank",
  tax_file: "e-Bupot PPh 21",
  bpjs_file: "Berkas BPJS SIPP",
};

export const SYNC_STATUS_LABEL: Record<SyncJobStatus, string> = {
  running: "Berjalan",
  success: "Berhasil",
  partial: "Sebagian",
  failed: "Gagal",
};

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIdr(value: number) {
  return idr.format(value).replace("Rp", "Rp\u00a0");
}

export function formatDate(value: string, pattern = "d MMM yyyy") {
  return format(parseISO(value), pattern, { locale: id });
}

export function formatDateTime(value: string, pattern = "d MMM, HH:mm") {
  return format(parseISO(value), pattern, { locale: id });
}

export function formatTime(value: string) {
  return format(parseISO(value), "HH:mm", { locale: id });
}

export function monthLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return format(new Date(y, (m ?? 1) - 1, 1), "MMMM yyyy", { locale: id });
}

export function tenureLabel(joinDate: string, now = new Date()) {
  const months = differenceInMonths(now, parseISO(joinDate));
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years <= 0) return `${rem} bln`;
  if (rem === 0) return `${years} thn`;
  return `${years} thn ${rem} bln`;
}

export function inclusiveDays(start: string, end: string) {
  return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function maskAccount(account: string) {
  if (account.length < 4) return account;
  return `•••• ${account.slice(-4)}`;
}
