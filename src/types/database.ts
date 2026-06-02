export type UserRole = "adviser" | "admin";
export type SubscriptionTier = "starter" | "pro" | "elite";

export type LeadSource = "website" | "referral" | "manual" | "ai";
export type LeadStatus = "new" | "qualified" | "assigned" | "converted" | "lost";

export type ClientStatus = "active" | "inactive" | "archived";
export type RiskProfile = "conservative" | "balanced" | "growth" | "aggressive";

export type CaseType = "mortgage" | "insurance" | "investment" | "pension";
export type CaseStage =
  | "discovery"
  | "documents"
  | "application"
  | "review"
  | "completed";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed";

export type DocumentType =
  | "id"
  | "bank_statement"
  | "payslip"
  | "policy"
  | "proof_of_address"
  | "other";
export type DocumentStatus = "requested" | "uploaded" | "verified";

export type AppointmentType = "call" | "meeting" | "review";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export type CommunicationType = "email" | "sms" | "note" | "call";

export type ApplicationStatus = "submitted" | "under_review" | "approved" | "rejected";
export type AppDocClassifiedType =
  | "id"
  | "payslip"
  | "bank_statement"
  | "proof_of_address"
  | "policy"
  | "other"
  | "unknown";
export type AppDocStatus = "uploaded" | "verified" | "rejected" | "pending_classification";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  website_slug: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface Lead {
  id: string;
  adviser_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource | null;
  status: LeadStatus;
  ai_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  adviser_id: string;
  lead_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  address: string | null;
  status: ClientStatus;
  risk_profile: RiskProfile | null;
  created_at: string;
}

export interface Case {
  id: string;
  adviser_id: string;
  client_id: string;
  title: string;
  type: CaseType | null;
  stage: CaseStage;
  value: number | null;
  probability: number | null;
  expected_close: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  adviser_id: string;
  case_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
}

export interface AppDocument {
  id: string;
  case_id: string | null;
  client_id: string | null;
  adviser_id: string;
  name: string;
  file_url: string | null;
  type: DocumentType | null;
  status: DocumentStatus;
  uploaded_at: string | null;
}

export interface Appointment {
  id: string;
  adviser_id: string;
  client_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  type: AppointmentType | null;
  location: string | null;
  notes: string | null;
  status: AppointmentStatus;
}

export interface ComplianceLog {
  id: string;
  adviser_id: string;
  case_id: string | null;
  action: string;
  detail: string | null;
  logged_at: string;
}

export interface Communication {
  id: string;
  adviser_id: string;
  client_id: string | null;
  type: CommunicationType | null;
  subject: string | null;
  body: string | null;
  sent_at: string;
}

export interface B2BApplication {
  id: string;
  adviser_id: string;
  client_id: string | null;
  status: ApplicationStatus;
  applicant_full_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  applicant_dob: string | null;
  applicant_address: string | null;
  employment: string | null;
  annual_income: number | null;
  loan_amount: number | null;
  property_value: number | null;
  intent: string | null;
  credit_notes: string | null;
  raw_payload: Record<string, unknown>;
  reviewer_notes: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  ai_classified_type: AppDocClassifiedType | null;
  ai_confidence: number | null;
  ai_summary: string | null;
  status: AppDocStatus;
  uploaded_at: string;
}

export interface LenderFormTemplate {
  id: string;
  lender_name: string;
  fields: {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    required: boolean;
    options?: string[];
  }[];
  created_at: string;
}

export interface LenderAutofill {
  id: string;
  application_id: string;
  adviser_id: string;
  lender_id: string;
  filled_payload: Record<string, string | number | null>;
  ai_warnings: string[];
  created_at: string;
}
