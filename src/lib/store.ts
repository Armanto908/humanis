import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useMemo } from "react";
import { format } from "date-fns";
import {
  ATTENDANCE,
  CLAIMS,
  CONNECTORS,
  DOCS,
  EMPLOYEES,
  INITIAL_CHAT,
  KPIS,
  LEAVE_BALANCES,
  LEAVES,
  PAYSLIPS,
  POSITIONS,
  RETENTION,
  REVIEWS,
  SYNC_JOBS,
  TODAY_ISO,
} from "./seed";
import { inclusiveDays } from "./format";
import { uid } from "./utils";
import { describeSync, syncCounts } from "./integrations";
import type {
  AttendanceRecord,
  ChatMessage,
  Claim,
  ClaimStatus,
  ClaimType,
  ClockMethod,
  CompanyDoc,
  ConnectorEnvironment,
  Employee,
  Kpi,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  OpenPosition,
  PayrollConnector,
  PayrollProviderId,
  Payslip,
  RetentionSignal,
  Review,
  Role,
  SyncJob,
  SyncKind,
} from "./types";

export interface HumanisState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  balances: LeaveBalance[];
  payslips: Payslip[];
  kpis: Kpi[];
  reviews: Review[];
  positions: OpenPosition[];
  claims: Claim[];
  docs: CompanyDoc[];
  retention: RetentionSignal[];
  chat: ChatMessage[];
  connectors: PayrollConnector[];
  syncJobs: SyncJob[];
  currentUserId: string;
  role: Role;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setPersona: (role: Role, userId: string) => void;
  clockIn: (input: { method: ClockMethod; lat?: number; lng?: number; photo?: boolean }) => void;
  clockOut: () => void;
  submitLeave: (input: { type: LeaveType; startDate: string; endDate: string; reason: string }) => void;
  decideLeave: (id: string, decision: "approved" | "rejected", note?: string) => void;
  updateProfile: (id: string, patch: Partial<Employee>) => void;
  submitClaim: (input: { type: ClaimType; amount: number; description: string; receiptName?: string }) => void;
  decideClaim: (id: string, status: ClaimStatus) => void;
  saveReview: (review: Review) => void;
  addChat: (message: ChatMessage) => void;
  connectPayroll: (id: PayrollProviderId, input: { companyCode: string; environment: ConnectorEnvironment }) => void;
  disconnectPayroll: (id: PayrollProviderId) => void;
  runPayrollSync: (id: PayrollProviderId, kind: SyncKind, period: string) => string;
  finishPayrollSync: (jobId: string, period: string) => SyncJob | undefined;
  logPayrollFile: (id: PayrollProviderId, kind: SyncKind, period: string) => void;
  resetDemo: () => void;
}

function baseState() {
  return {
    employees: EMPLOYEES,
    attendance: ATTENDANCE,
    leaves: LEAVES,
    balances: LEAVE_BALANCES,
    payslips: PAYSLIPS,
    kpis: KPIS,
    reviews: REVIEWS,
    positions: POSITIONS,
    claims: CLAIMS,
    docs: DOCS,
    retention: RETENTION,
    chat: INITIAL_CHAT,
    connectors: CONNECTORS,
    syncJobs: SYNC_JOBS,
    currentUserId: "lestari",
    role: "hr" as Role,
  };
}

export const useHumanis = create<HumanisState>()(
  persist(
    (set, get) => ({
      ...baseState(),
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setPersona: (role, userId) => set({ role, currentUserId: userId }),
      clockIn: ({ method, lat, lng, photo }) => {
        const { currentUserId, attendance } = get();
        const date = TODAY_ISO;
        const existing = attendance.find((a) => a.employeeId === currentUserId && a.date === date);
        const now = new Date().toISOString();
        const late = new Date().getHours() * 60 + new Date().getMinutes() > 9 * 60 + 15;
        const record: AttendanceRecord = {
          id: existing?.id ?? `att-${currentUserId}-${date}`,
          employeeId: currentUserId,
          date,
          clockIn: now,
          clockInLat: lat,
          clockInLng: lng,
          clockInMethod: method,
          status: method === "gps" && !lat ? "wfh" : late ? "late" : "present",
          photoCaptured: photo,
        };
        set({
          attendance: existing
            ? attendance.map((a) => (a.id === existing.id ? { ...a, ...record } : a))
            : [...attendance, record],
        });
      },
      clockOut: () => {
        const { currentUserId, attendance } = get();
        const date = TODAY_ISO;
        set({
          attendance: attendance.map((a) =>
            a.employeeId === currentUserId && a.date === date
              ? { ...a, clockOut: new Date().toISOString() }
              : a,
          ),
        });
      },
      submitLeave: ({ type, startDate, endDate, reason }) => {
        const { currentUserId, employees, leaves } = get();
        const me = employees.find((e) => e.id === currentUserId);
        const managerId = me?.managerId;
        const approvals = managerId
          ? [
              { approverId: managerId, status: "pending" as const },
              ...(managerId === "lestari" ? [] : [{ approverId: "lestari", status: "pending" as const }]),
            ]
          : [{ approverId: "lestari", status: "pending" as const }];
        const request: LeaveRequest = {
          id: uid("lv"),
          employeeId: currentUserId,
          type,
          startDate,
          endDate,
          days: inclusiveDays(startDate, endDate),
          reason,
          status: "pending",
          approvals,
          createdAt: new Date().toISOString(),
        };
        set({ leaves: [request, ...leaves] });
      },
      decideLeave: (id, decision, note) => {
        const { currentUserId, leaves, balances } = get();
        const now = new Date().toISOString();
        const nextLeaves = leaves.map((leave) => {
          if (leave.id !== id) return leave;
          const approvals = leave.approvals.map((a) =>
            a.approverId === currentUserId || (currentUserId === "lestari" && a.status === "pending")
              ? { ...a, status: decision, at: now, note }
              : a,
          );
          const rejected = approvals.some((a) => a.status === "rejected") || decision === "rejected";
          const approved = !rejected && approvals.every((a) => a.status === "approved");
          return {
            ...leave,
            approvals,
            status: rejected ? ("rejected" as const) : approved ? ("approved" as const) : ("pending" as const),
          };
        });
        const decided = nextLeaves.find((l) => l.id === id);
        let nextBalances = balances;
        if (decided?.status === "approved" && decided.type === "annual") {
          nextBalances = balances.map((b) =>
            b.employeeId === decided.employeeId ? { ...b, annualUsed: b.annualUsed + decided.days } : b,
          );
        }
        if (decided?.status === "approved" && decided.type === "sick") {
          nextBalances = balances.map((b) =>
            b.employeeId === decided.employeeId ? { ...b, sickUsed: b.sickUsed + decided.days } : b,
          );
        }
        set({ leaves: nextLeaves, balances: nextBalances });
      },
      updateProfile: (id, patch) => {
        set({
          employees: get().employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        });
      },
      submitClaim: ({ type, amount, description, receiptName }) => {
        const claim: Claim = {
          id: uid("cl"),
          employeeId: get().currentUserId,
          type,
          amount,
          date: format(new Date(), "yyyy-MM-dd"),
          description,
          status: "pending",
          receiptName,
        };
        set({ claims: [claim, ...get().claims] });
      },
      decideClaim: (id, status) => {
        set({
          claims: get().claims.map((c) => (c.id === id ? { ...c, status } : c)),
        });
      },
      saveReview: (review) => {
        const reviews = get().reviews;
        const exists = reviews.some((r) => r.id === review.id);
        set({ reviews: exists ? reviews.map((r) => (r.id === review.id ? review : r)) : [review, ...reviews] });
      },
      addChat: (message) => set({ chat: [...get().chat, message] }),
      connectPayroll: (id, input) => {
        const now = new Date().toISOString();
        set({
          connectors: get().connectors.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: "connected",
                  companyCode: input.companyCode,
                  environment: input.environment,
                  connectedAt: now,
                  lastError: undefined,
                }
              : c,
          ),
        });
      },
      disconnectPayroll: (id) => {
        set({
          connectors: get().connectors.map((c) =>
            c.id === id
              ? { ...c, status: "disconnected", lastError: undefined, companyCode: undefined, connectedAt: undefined }
              : c,
          ),
        });
      },
      runPayrollSync: (id, kind, _period) => {
        const jobId = uid("sync");
        const startedAt = new Date().toISOString();
        const job: SyncJob = {
          id: jobId,
          providerId: id,
          kind,
          status: "running",
          startedAt,
          pushed: 0,
          pulled: 0,
          skipped: 0,
          message: "Menghubungi sistem payroll…",
        };
        set({
          connectors: get().connectors.map((c) => (c.id === id ? { ...c, status: "syncing" } : c)),
          syncJobs: [job, ...get().syncJobs],
        });
        return jobId;
      },
      finishPayrollSync: (jobId, period) => {
        const job = get().syncJobs.find((j) => j.id === jobId);
        if (!job) return undefined;
        const counts = syncCounts({
          kind: job.kind,
          employees: get().employees,
          attendance: get().attendance,
          slips: get().payslips,
          period,
        });
        const finished: SyncJob = {
          ...job,
          ...counts,
          status: counts.skipped > 0 ? "partial" : "success",
          finishedAt: new Date().toISOString(),
          message: describeSync(job.kind, counts.pushed, counts.pulled, counts.skipped),
        };
        set({
          connectors: get().connectors.map((c) =>
            c.id === job.providerId
              ? { ...c, status: "connected", lastSyncAt: finished.finishedAt, lastError: undefined }
              : c,
          ),
          syncJobs: get().syncJobs.map((j) => (j.id === jobId ? finished : j)),
        });
        return finished;
      },
      logPayrollFile: (id, kind, period) => {
        const counts = syncCounts({
          kind,
          employees: get().employees,
          attendance: get().attendance,
          slips: get().payslips,
          period,
        });
        const now = new Date().toISOString();
        const job: SyncJob = {
          id: uid("sync"),
          providerId: id,
          kind,
          status: counts.skipped > 0 ? "partial" : "success",
          startedAt: now,
          finishedAt: now,
          ...counts,
          message: describeSync(kind, counts.pushed, counts.pulled, counts.skipped),
        };
        set({
          connectors: get().connectors.map((c) =>
            c.id === id ? { ...c, status: "connected", lastSyncAt: now } : c,
          ),
          syncJobs: [job, ...get().syncJobs],
        });
      },
      resetDemo: () => set({ ...baseState() }),
    }),
    {
      name: "humanis-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<HumanisState>;
        return {
          ...current,
          ...p,
          connectors: p.connectors && p.connectors.length > 0 ? p.connectors : current.connectors,
          syncJobs: p.syncJobs && p.syncJobs.length > 0 ? p.syncJobs : current.syncJobs,
        };
      },
      partialize: (state) => ({
        employees: state.employees,
        attendance: state.attendance,
        leaves: state.leaves,
        balances: state.balances,
        payslips: state.payslips,
        kpis: state.kpis,
        reviews: state.reviews,
        claims: state.claims,
        chat: state.chat,
        connectors: state.connectors,
        syncJobs: state.syncJobs,
        currentUserId: state.currentUserId,
        role: state.role,
      }),
    },
  ),
);

export function useMe() {
  return useHumanis((s) => s.employees.find((e) => e.id === s.currentUserId) ?? s.employees[0]);
}

export function useVisibleEmployees() {
  const role = useHumanis((s) => s.role);
  const userId = useHumanis((s) => s.currentUserId);
  const employees = useHumanis((s) => s.employees);
  return useMemo(() => visibleEmployees(role, userId, employees), [role, userId, employees]);
}

export function teamOf(managerId: string, employees: Employee[]): Employee[] {
  const direct = employees.filter((e) => e.managerId === managerId);
  return [employees.find((e) => e.id === managerId), ...direct, ...direct.flatMap((d) => teamOf(d.id, employees).slice(1))].filter(
    (e): e is Employee => Boolean(e),
  );
}

export function visibleEmployees(role: Role, userId: string, employees: Employee[]) {
  if (role === "hr") return employees;
  if (role === "manager") {
    const ids = new Set(teamOf(userId, employees).map((e) => e.id));
    return employees.filter((e) => ids.has(e.id));
  }
  return employees.filter((e) => e.id === userId);
}
