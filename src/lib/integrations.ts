import type {
  AttendanceRecord,
  ConnectorKind,
  Employee,
  MappingIssue,
  PayrollProviderId,
  Payslip,
  SyncKind,
} from "./types";
import { DEPARTMENT_LABEL, monthLabel } from "./format";
import { COMPANY } from "./seed";

export const BANK_CODES: Record<string, string> = {
  BCA: "014",
  Mandiri: "008",
  BNI: "009",
  BRI: "002",
};

export const HOUSE_BANK = "BCA";

export interface PayrollProvider {
  id: PayrollProviderId;
  name: string;
  vendor: string;
  kind: ConnectorKind;
  category: string;
  blurb: string;
  objects: string[];
}

export const PAYROLL_PROVIDERS: PayrollProvider[] = [
  {
    id: "accurate",
    name: "Accurate Online",
    vendor: "Cipta Piranti",
    kind: "api",
    category: "Payroll & akuntansi",
    blurb: "Sistem payroll lokal yang dipakai Finance Arunika. Master karyawan, jurnal gaji, dan komponen BPJS/PPh 21.",
    objects: ["Karyawan", "Komponen gaji", "Jurnal penggajian"],
  },
  {
    id: "talenta",
    name: "Mekari Talenta",
    vendor: "Mekari",
    kind: "api",
    category: "HRIS payroll",
    blurb: "Jika cabang memakai Talenta, Humanis mendorong data orang dan menarik slip yang sudah dihitung di sana.",
    objects: ["Employee", "Attendance", "Payslip"],
  },
  {
    id: "jurnal",
    name: "Mekari Jurnal",
    vendor: "Mekari",
    kind: "api",
    category: "Akuntansi",
    blurb: "Membukukan biaya gaji, iuran pemberi kerja, dan utang pajak ke buku besar tanpa entri manual.",
    objects: ["Jurnal", "Bagan akun", "Biaya gaji"],
  },
  {
    id: "sap",
    name: "SAP HCM",
    vendor: "SAP",
    kind: "api",
    category: "Enterprise",
    blurb: "Untuk grup yang masih menutup buku di SAP. Humanis menjadi sumber master, SAP tetap mesin hitung.",
    objects: ["Infotype 0002", "Payroll cluster", "Bank details"],
  },
  {
    id: "excel",
    name: "Berkas Excel",
    vendor: "Humanis",
    kind: "file",
    category: "Impor/ekspor",
    blurb: "Template CSV yang dikenali Accurate, Talenta, dan spreadsheet Finance. Siap unduh kapan saja.",
    objects: ["Master karyawan", "Lembur", "Slip"],
  },
  {
    id: "bca",
    name: "BCA Multi Credit",
    vendor: "Bank Central Asia",
    kind: "file",
    category: "Transfer gaji",
    blurb: "File gaji ke rekening BCA (in-house) dan bank lain (LLG). Siap diunggah di KlikBCA Bisnis.",
    objects: ["In-house", "LLG", "Rekening tujuan"],
  },
  {
    id: "ebupot",
    name: "e-Bupot Unifikasi",
    vendor: "Direktorat Jenderal Pajak",
    kind: "file",
    category: "PPh 21",
    blurb: "CSV masa pajak untuk unggah ke DJP Online. NPWP kosong otomatis dilewati.",
    objects: ["21-100-01", "Bruto", "PPh dipotong"],
  },
];

export const FIELD_MAP: { humanis: string; remote: string; required: boolean }[] = [
  { humanis: "NIK", remote: "No. Karyawan", required: true },
  { humanis: "Nama", remote: "Nama lengkap", required: true },
  { humanis: "NPWP", remote: "NPWP", required: true },
  { humanis: "Status PTKP", remote: "Status PTKP", required: true },
  { humanis: "Bank + no. rekening", remote: "Bank / No. Rek", required: true },
  { humanis: "Gaji pokok", remote: "Gaji pokok", required: true },
  { humanis: "Tunjangan tetap", remote: "Tunjangan", required: true },
  { humanis: "Jam lembur", remote: "Jam lembur", required: false },
  { humanis: "No. BPJS Kes / TK", remote: "BPJS", required: false },
  { humanis: "Kode objek pajak", remote: "21-100-01", required: false },
];

export function hasNpwp(employee: Employee) {
  const value = employee.npwp.replace(/[.\s-]/g, "");
  return value.length >= 15 && /^\d+$/.test(value);
}

export function mappingIssues(employees: Employee[]): MappingIssue[] {
  const issues: MappingIssue[] = [];
  for (const employee of employees) {
    if (!hasNpwp(employee)) {
      issues.push({
        employeeId: employee.id,
        field: "npwp",
        severity: employee.contractType === "intern" ? "warn" : "block",
        message:
          employee.contractType === "intern"
            ? "NPWP kosong. Magang dilewati di e-Bupot; Accurate tetap menerima master."
            : "NPWP tidak valid — impor PPh 21 akan ditolak.",
      });
    }
    if (!employee.bankAccount || employee.bankAccount.length < 8) {
      issues.push({
        employeeId: employee.id,
        field: "bankAccount",
        severity: "block",
        message: "Nomor rekening tidak lengkap. File bank tidak bisa memuat baris ini.",
      });
    }
    if (!BANK_CODES[employee.bankName]) {
      issues.push({
        employeeId: employee.id,
        field: "bankName",
        severity: "warn",
        message: `Bank ${employee.bankName} belum di peta kode kliring. Periksa sebelum unggah LLG.`,
      });
    }
    if (employee.contractType === "intern") {
      issues.push({
        employeeId: employee.id,
        field: "jp",
        severity: "warn",
        message: "Magang biasanya tidak diikutsertakan Jaminan Pensiun. Accurate perlu flag non-JP.",
      });
    }
  }
  return issues;
}

export function csvEscape(value: string | number) {
  const text = String(value);
  if (/[;"\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function toCsv(headers: string[], rows: (string | number)[][], separator = ";") {
  const lines = [
    headers.map(csvEscape).join(separator),
    ...rows.map((row) => row.map(csvEscape).join(separator)),
  ];
  return `\uFEFF${lines.join("\n")}\n`;
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function accurateMasterCsv(employees: Employee[]) {
  return toCsv(
    [
      "No. Karyawan",
      "Nama",
      "Departemen",
      "Jabatan",
      "NPWP",
      "Status PTKP",
      "Bank",
      "No. Rekening",
      "Gaji Pokok",
      "Tunjangan",
      "No. BPJS Kes",
      "No. BPJS TK",
    ],
    employees.map((e) => [
      e.nik,
      e.name,
      DEPARTMENT_LABEL[e.department],
      e.title,
      hasNpwp(e) ? e.npwp : "",
      e.ptkp,
      e.bankName,
      e.bankAccount,
      e.salary,
      e.allowance,
      e.bpjsKes,
      e.bpjsTk,
    ]),
  );
}

export function accuratePayrollCsv(employees: Employee[], slips: Payslip[]) {
  return toCsv(
    [
      "Masa",
      "No. Karyawan",
      "Nama",
      "Gaji Pokok",
      "Tunjangan",
      "Lembur Jam",
      "Lembur Rupiah",
      "Bonus",
      "BPJS Kes Karyawan",
      "JHT Karyawan",
      "JP Karyawan",
      "PPh 21",
      "Take Home",
      "BPJS Kes Perusahaan",
      "JHT Perusahaan",
      "JP Perusahaan",
      "JKK",
      "JKM",
    ],
    slips.map((slip) => {
      const person = employees.find((e) => e.id === slip.employeeId);
      return [
        slip.period,
        person?.nik ?? "",
        person?.name ?? "",
        slip.basic,
        slip.allowance,
        slip.overtimeHours,
        slip.overtimePay,
        slip.bonus,
        slip.bpjsKesEmp,
        slip.jhtEmp,
        slip.jpEmp,
        slip.pph21,
        slip.net,
        slip.bpjsKesEr,
        slip.jhtEr,
        slip.jpEr,
        slip.jkkEr,
        slip.jkmEr,
      ];
    }),
  );
}

export interface BankRow {
  employee: Employee;
  slip: Payslip;
  inHouse: boolean;
  bankCode: string;
}

export function bankRows(employees: Employee[], slips: Payslip[]): BankRow[] {
  return slips
    .map((slip) => {
      const employee = employees.find((e) => e.id === slip.employeeId);
      if (!employee) return null;
      return {
        employee,
        slip,
        inHouse: employee.bankName === HOUSE_BANK,
        bankCode: BANK_CODES[employee.bankName] ?? "000",
      };
    })
    .filter((row): row is BankRow => Boolean(row));
}

export function bcaMultiCreditCsv(rows: BankRow[], period: string) {
  const remark = `GAJI ${monthLabel(period).toUpperCase()}`;
  return toCsv(
    [
      "No",
      "Transfer Type",
      "Bank Code",
      "Beneficiary Account",
      "Beneficiary Name",
      "Amount",
      "Remarks",
      "NIK",
    ],
    rows.map((row, index) => [
      index + 1,
      row.inHouse ? "IN-HOUSE" : "LLG",
      row.bankCode,
      row.employee.bankAccount,
      row.employee.name.toUpperCase(),
      row.slip.net,
      remark,
      row.employee.nik,
    ]),
    ",",
  );
}

export function ebupotCsv(employees: Employee[], slips: Payslip[], period: string) {
  const [year, month] = period.split("-");
  return toCsv(
    [
      "Masa Pajak",
      "Tahun Pajak",
      "NPWP",
      "Nama",
      "Kode Objek Pajak",
      "Penghasilan Bruto",
      "Tarif",
      "PPh Dipotong",
      "NPWP Pemotong",
      "Nama Pemotong",
    ],
    slips
      .map((slip) => {
        const person = employees.find((e) => e.id === slip.employeeId);
        if (!person || !hasNpwp(person)) return null;
        const rate = slip.gross === 0 ? 0 : Math.round((slip.pph21 / slip.gross) * 10000) / 100;
        return [
          month,
          year,
          person.npwp,
          person.name,
          "21-100-01",
          slip.gross,
          rate,
          slip.pph21,
          "10.221.884.3-012.000",
          COMPANY.legalName,
        ];
      })
      .filter((row): row is (string | number)[] => Boolean(row)),
  );
}

export function bpjsSippCsv(employees: Employee[], slips: Payslip[]) {
  return toCsv(
    ["NIK", "Nama", "No. BPJS TK", "Upah", "Iuran JHT Karyawan", "Iuran JP Karyawan", "JKK Perusahaan", "JKM Perusahaan", "JHT Perusahaan", "JP Perusahaan"],
    slips.map((slip) => {
      const person = employees.find((e) => e.id === slip.employeeId);
      return [
        person?.nik ?? "",
        person?.name ?? "",
        person?.bpjsTk ?? "",
        slip.basic,
        slip.jhtEmp,
        slip.jpEmp,
        slip.jkkEr,
        slip.jkmEr,
        slip.jhtEr,
        slip.jpEr,
      ];
    }),
  );
}

export function fileNameFor(kind: "master" | "payroll" | "bank" | "tax" | "bpjs", period?: string) {
  const stamp = period ?? "all";
  const map = {
    master: `arunika-accurate-karyawan-${stamp}.csv`,
    payroll: `arunika-accurate-gaji-${stamp}.csv`,
    bank: `arunika-bca-multicredit-${stamp}.csv`,
    tax: `arunika-ebupot-21-${stamp}.csv`,
    bpjs: `arunika-bpjs-sipp-${stamp}.csv`,
  };
  return map[kind];
}

export function describeSync(kind: SyncKind, pushed: number, pulled: number, skipped: number) {
  const skip = skipped > 0 ? ` ${skipped} baris dilewati.` : "";
  switch (kind) {
    case "master":
      return `Mengirim ${pushed} master karyawan ke payroll lokal.${skip}`;
    case "attendance":
      return `Mengirim ${pushed} rekap kehadiran & lembur.${skip}`;
    case "payroll_push":
      return `Mengirim ${pushed} komponen gaji (pokok, tunjangan, lembur, klaim).${skip}`;
    case "payroll_pull":
      return `Menarik ${pulled} hasil hitung PPh 21 & take-home.${skip}`;
    case "full":
      return `Sinkron penuh: ${pushed} kirim, ${pulled} tarik.${skip}`;
    case "bank_file":
      return `Berkas transfer ${pushed} rekening siap diunggah.`;
    case "tax_file":
      return `Berkas e-Bupot ${pushed} WP.`;
    case "bpjs_file":
      return `Berkas SIPP ${pushed} peserta.`;
  }
}

export function syncCounts(input: {
  kind: SyncKind;
  employees: Employee[];
  attendance: AttendanceRecord[];
  slips: Payslip[];
  period: string;
}) {
  const issues = mappingIssues(input.employees);
  const blocked = new Set(issues.filter((i) => i.severity === "block").map((i) => i.employeeId));
  const internSkipped = input.employees.filter((e) => e.contractType === "intern" && !hasNpwp(e)).length;
  const active = input.employees.filter((e) => !blocked.has(e.id));
  const periodSlips = input.slips.filter((s) => s.period === input.period);
  const periodAtt = input.attendance.filter((a) => a.date.startsWith(input.period));

  switch (input.kind) {
    case "master":
      return { pushed: input.employees.length, pulled: 0, skipped: internSkipped };
    case "attendance":
      return { pushed: periodAtt.length, pulled: 0, skipped: 0 };
    case "payroll_push":
      return { pushed: periodSlips.length, pulled: 0, skipped: internSkipped };
    case "payroll_pull":
      return { pushed: 0, pulled: periodSlips.length - internSkipped, skipped: internSkipped };
    case "full":
      return {
        pushed: input.employees.length + periodAtt.length,
        pulled: periodSlips.length - internSkipped,
        skipped: internSkipped,
      };
    case "bank_file":
      return { pushed: periodSlips.filter((s) => s.status === "published").length, pulled: 0, skipped: blocked.size };
    case "tax_file":
      return { pushed: active.filter(hasNpwp).length, pulled: 0, skipped: internSkipped };
    case "bpjs_file":
      return { pushed: periodSlips.length, pulled: 0, skipped: 0 };
  }
}

export function providerById(id: PayrollProviderId) {
  return PAYROLL_PROVIDERS.find((p) => p.id === id)!;
}

export function formatSyncWhen(iso?: string) {
  if (!iso) return "Belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function moneySum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

export function transferFeeHint(rows: BankRow[]) {
  const llg = rows.filter((r) => !r.inHouse).length;
  const inHouse = rows.length - llg;
  return `${inHouse} in-house BCA · ${llg} LLG ke bank lain`;
}
