import type { Employee, Payslip, Ptkp } from "./types";

export const BPJS_KES_CAP = 12_000_000;
export const JP_CAP = 10_547_400;
export const JOB_EXPENSE_MONTHLY_CAP = 500_000;

export const PTKP: Record<Ptkp, number> = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "K/0": 58_500_000,
  "K/1": 63_000_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
};

export function overtimePay(basic: number, hours: number) {
  if (hours <= 0) return 0;
  const hourly = basic / 173;
  if (hours <= 1) return Math.round(hourly * 1.5 * hours);
  return Math.round(hourly * 1.5 + hourly * 2 * (hours - 1));
}

function progressiveTax(pkp: number) {
  let remaining = pkp;
  let tax = 0;
  const brackets: [number, number][] = [
    [60_000_000, 0.05],
    [190_000_000, 0.15],
    [250_000_000, 0.25],
    [4_500_000_000, 0.3],
    [Number.POSITIVE_INFINITY, 0.35],
  ];
  for (const [size, rate] of brackets) {
    const slice = Math.min(remaining, size);
    tax += slice * rate;
    remaining -= slice;
    if (remaining <= 0) break;
  }
  return Math.round(tax);
}

export function calcPayslip(
  employee: Employee,
  period: string,
  overtimeHours: number,
  bonus: number,
  status: Payslip["status"] = "published",
): Payslip {
  const basic = employee.salary;
  const allowance = employee.allowance;
  const ot = overtimePay(basic, overtimeHours);
  const gross = basic + allowance + ot + bonus;

  const kesBase = Math.min(basic, BPJS_KES_CAP);
  const jpBase = Math.min(basic, JP_CAP);

  const bpjsKesEmp = Math.round(kesBase * 0.01);
  const jhtEmp = Math.round(basic * 0.02);
  const jpEmp = Math.round(jpBase * 0.01);

  const bpjsKesEr = Math.round(kesBase * 0.04);
  const jhtEr = Math.round(basic * 0.037);
  const jpEr = Math.round(jpBase * 0.02);
  const jkkEr = Math.round(basic * 0.0024);
  const jkmEr = Math.round(basic * 0.003);

  const jobExpense = Math.min(Math.round(gross * 0.05), JOB_EXPENSE_MONTHLY_CAP);
  const taxableMonthly = Math.max(0, gross - jobExpense - bpjsKesEmp - jhtEmp - jpEmp);
  const pkp = Math.max(0, taxableMonthly * 12 - PTKP[employee.ptkp]);
  const pph21 = Math.round(progressiveTax(pkp) / 12);
  const net = gross - bpjsKesEmp - jhtEmp - jpEmp - pph21;

  return {
    id: `slip-${employee.id}-${period}`,
    employeeId: employee.id,
    period,
    basic,
    allowance,
    overtimeHours,
    overtimePay: ot,
    bonus,
    bpjsKesEmp,
    jhtEmp,
    jpEmp,
    pph21,
    otherDeduction: 0,
    bpjsKesEr,
    jhtEr,
    jpEr,
    jkkEr,
    jkmEr,
    jobExpense,
    taxableMonthly,
    gross,
    net,
    status,
  };
}

export function employerCost(slip: Payslip) {
  return slip.gross + slip.bpjsKesEr + slip.jhtEr + slip.jpEr + slip.jkkEr + slip.jkmEr;
}
