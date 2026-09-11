export type Role = "hr" | "manager" | "employee";

export type Department =
  | "executive"
  | "engineering"
  | "product"
  | "design"
  | "people"
  | "finance"
  | "marketing"
  | "sales"
  | "operations";

export type EmploymentStatus = "active" | "probation" | "contract" | "leave";
export type ContractType = "permanent" | "contract" | "intern";
export type Ptkp = "TK/0" | "TK/1" | "K/0" | "K/1" | "K/2" | "K/3";

export interface Certification {
  name: string;
  issuer: string;
  year: number;
}

export interface Employee {
  id: string;
  nik: string;
  name: string;
  preferredName: string;
  email: string;
  phone: string;
  initials: string;
  tone: number;
  title: string;
  department: Department;
  managerId: string | null;
  location: string;
  joinDate: string;
  status: EmploymentStatus;
  contractType: ContractType;
  contractEnd?: string;
  grade: string;
  gender: "F" | "M";
  birthDate: string;
  address: string;
  city: string;
  bankName: string;
  bankAccount: string;
  npwp: string;
  ptkp: Ptkp;
  bpjsKes: string;
  bpjsTk: string;
  salary: number;
  allowance: number;
  skills: string[];
  certifications: Certification[];
  facilities: string[];
  emergencyContact: { name: string; relation: string; phone: string };
  bio: string;
}

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "wfh";
export type ClockMethod = "gps" | "photo" | "office";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  clockInLat?: number;
  clockInLng?: number;
  clockInMethod?: ClockMethod;
  status: AttendanceStatus;
  photoCaptured?: boolean;
  notes?: string;
}

export type LeaveType =
  | "annual"
  | "sick"
  | "unpaid"
  | "maternity"
  | "permission"
  | "marriage";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface LeaveApproval {
  approverId: string;
  status: ApprovalStatus;
  at?: string;
  note?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: ApprovalStatus;
  approvals: LeaveApproval[];
  createdAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  annual: number;
  annualUsed: number;
  sick: number;
  sickUsed: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  period: string;
  basic: number;
  allowance: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  bpjsKesEmp: number;
  jhtEmp: number;
  jpEmp: number;
  pph21: number;
  otherDeduction: number;
  bpjsKesEr: number;
  jhtEr: number;
  jpEr: number;
  jkkEr: number;
  jkmEr: number;
  jobExpense: number;
  taxableMonthly: number;
  gross: number;
  net: number;
  status: "draft" | "published";
}

export type KpiStatus = "on_track" | "at_risk" | "behind" | "exceeded";

export interface Kpi {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  period: string;
  weight: number;
  status: KpiStatus;
}

export type ReviewType = "self" | "manager" | "peer";

export interface ReviewScore {
  competency: string;
  score: number;
}

export interface Review {
  id: string;
  employeeId: string;
  cycle: string;
  type: ReviewType;
  reviewerId: string;
  scores: ReviewScore[];
  narrative: string;
  submittedAt?: string;
  status: "draft" | "submitted";
}

export interface OpenPosition {
  id: string;
  title: string;
  department: Department;
  level: string;
  skills: string[];
  description: string;
  postedAt: string;
}

export type ClaimType = "medical" | "transport" | "wellness" | "other";
export type ClaimStatus = "pending" | "approved" | "rejected" | "paid";

export interface Claim {
  id: string;
  employeeId: string;
  type: ClaimType;
  amount: number;
  date: string;
  description: string;
  status: ClaimStatus;
  receiptName?: string;
}

export interface CompanyDoc {
  id: string;
  title: string;
  category: "sop" | "policy" | "handbook" | "form";
  updatedAt: string;
  summary: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
}

export type RiskLevel = "low" | "medium" | "high";

export interface RetentionSignal {
  employeeId: string;
  risk: RiskLevel;
  score: number;
  factors: string[];
  sentiment: number;
}

export interface CompanyInfo {
  name: string;
  legalName: string;
  industry: string;
  hq: string;
  officeLat: number;
  officeLng: number;
  founded: number;
  headcount: number;
}

export type PayrollProviderId =
  | "accurate"
  | "talenta"
  | "jurnal"
  | "sap"
  | "excel"
  | "bca"
  | "ebupot";

export type ConnectorKind = "api" | "file";
export type ConnectorStatus = "disconnected" | "connected" | "syncing" | "error";
export type ConnectorEnvironment = "sandbox" | "production";

export type SyncKind =
  | "master"
  | "attendance"
  | "payroll_push"
  | "payroll_pull"
  | "full"
  | "bank_file"
  | "tax_file"
  | "bpjs_file";

export type SyncJobStatus = "running" | "success" | "partial" | "failed";

export interface PayrollConnector {
  id: PayrollProviderId;
  status: ConnectorStatus;
  environment: ConnectorEnvironment;
  companyCode?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  lastError?: string;
}

export interface SyncJob {
  id: string;
  providerId: PayrollProviderId;
  kind: SyncKind;
  status: SyncJobStatus;
  startedAt: string;
  finishedAt?: string;
  pushed: number;
  pulled: number;
  skipped: number;
  message: string;
}

export interface MappingIssue {
  employeeId: string;
  field: string;
  severity: "block" | "warn";
  message: string;
}
