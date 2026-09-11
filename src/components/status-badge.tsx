import { Badge } from "@/components/ui/badge";
import {
  APPROVAL_LABEL,
  ATTENDANCE_LABEL,
  CLAIM_STATUS_LABEL,
  KPI_LABEL,
  RISK_LABEL,
  STATUS_LABEL,
} from "@/lib/format";
import type {
  ApprovalStatus,
  AttendanceStatus,
  ClaimStatus,
  EmploymentStatus,
  KpiStatus,
  RiskLevel,
} from "@/lib/types";

const approvalTone = {
  pending: "warn",
  approved: "ok",
  rejected: "danger",
} as const;

const attendanceTone = {
  present: "ok",
  wfh: "accent",
  late: "warn",
  leave: "neutral",
  absent: "danger",
} as const;

const kpiTone = {
  on_track: "accent",
  exceeded: "ok",
  at_risk: "warn",
  behind: "danger",
} as const;

const empTone = {
  active: "ok",
  probation: "warn",
  contract: "accent",
  leave: "neutral",
} as const;

const riskTone = {
  low: "ok",
  medium: "warn",
  high: "danger",
} as const;

export function ApprovalBadge({ value }: { value: ApprovalStatus }) {
  return <Badge tone={approvalTone[value]}>{APPROVAL_LABEL[value]}</Badge>;
}

export function AttendanceBadge({ value }: { value: AttendanceStatus }) {
  return <Badge tone={attendanceTone[value]}>{ATTENDANCE_LABEL[value]}</Badge>;
}

export function KpiBadge({ value }: { value: KpiStatus }) {
  return <Badge tone={kpiTone[value]}>{KPI_LABEL[value]}</Badge>;
}

export function EmploymentBadge({ value }: { value: EmploymentStatus }) {
  return <Badge tone={empTone[value]}>{STATUS_LABEL[value]}</Badge>;
}

export function ClaimBadge({ value }: { value: ClaimStatus }) {
  return <Badge tone={approvalTone[value === "paid" ? "approved" : value]}>{CLAIM_STATUS_LABEL[value]}</Badge>;
}

export function RiskBadge({ value }: { value: RiskLevel }) {
  return <Badge tone={riskTone[value]}>{RISK_LABEL[value]}</Badge>;
}
