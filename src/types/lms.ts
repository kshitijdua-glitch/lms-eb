export type UserRole = "agent" | "manager" | "cluster_head" | "data_admin";

export type LeadStage = "new" | "contacted" | "interested" | "bank_selected" | "stb_submitted" | "approved" | "declined" | "disbursed" | "closed_lost";

export type DispositionType =
  // Follow-Up
  | "hot_follow_up"
  | "warm_follow_up"
  | "cold_follow_up"
  | "document_follow_up"
  | "callback_requested"
  | "price_discussion_pending"
  // Not Contactable
  | "number_busy"
  | "no_response"
  | "switched_off"
  | "invalid_number"
  | "call_dropped"
  | "wrong_number"
  // Not Interested
  | "already_has_loan"
  | "does_not_need"
  | "rate_too_high"
  | "will_decide_later"
  | "chose_competitor"
  // Negative
  | "language_barrier"
  | "hung_up"
  // BRE Ineligible
  | "credit_score_low"
  | "income_below"
  | "age_outside"
  | "pin_not_serviceable"
  | "too_many_loans"
  | "high_dpd"
  | "recent_writeoff"
  // Documents Pending
  | "pan_not_available"
  | "income_proof_not_ready"
  | "address_proof_pending"
  | "bank_statement_not_available"
  | "photo_id_missing"
  // Outcome
  | "stb_qualified"
  | "duplicate"
  // Closed
  | "closed_sanctioned_elsewhere"
  | "closed_changed_mind"
  | "closed_unreachable"
  // Legacy compat
  | "connected_interested"
  | "connected_not_interested"
  | "connected_callback"
  | "not_contactable"
  | "ringing_no_answer"
  | "busy"
  | "dnc"
  | "documents_pending"
  | "bre_eligible"
  | "bre_ineligible"
  | "stb_initiated"
  | "stb_approved"
  | "stb_declined"
  | "disbursed"
  // Section 5.6 — Manual Call requirements
  | "needs_more_information"
  | "ringing"
  | "not_reachable"
  | "duplicate_lead"
  | "do_not_contact"
  | "consent_missing"
  | "customer_complaint";

export type DispositionCategory =
  | "follow_up"
  | "not_contactable"
  | "not_interested"
  | "negative"
  | "bre_ineligible"
  | "compliance"
  | "documents_pending"
  | "outcome"
  | "closed"
  | "connected"
  | "not_connected";

export type ProductType = "personal_loan" | "home_loan" | "business_loan" | "credit_card" | "loan_against_property";

export type EmploymentType = "salaried" | "self_employed" | "business_owner";

export type Priority = "hot" | "warm" | "cold";

export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  agentId: string;
  agentName: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  pan: string;
  dob: string;
  city: string;
  state: string;
  pinCode: string;
  companyName: string;
  employmentType: EmploymentType;
  monthlyIncome: number;
  existingObligations: number;
  foir: number;
  productType: ProductType;
  loanAmount: number;
  stage: LeadStage;
  disposition: DispositionType;
  priority: Priority;
  source: string;
  leadSource: string;
  assignedAgentId: string;
  assignedTeamId: string;
  creditScore: number | null;
  existingLoans: ExistingLoan[];
  selectedBanks: SelectedBank[];
  stbSubmissions: STBSubmission[];
  callLogs: CallLog[];
  followUps: FollowUp[];
  notes: LeadNote[];
  createdAt: string;
  lastActivityAt: string;
  allocatedAt: string;
  consentStatus: "not_sent" | "sent" | "received" | "expired";
  retryCount: number;
  expiresAt: string;
}

export interface ExistingLoan {
  id: string;
  bankName: string;
  loanType: string;
  outstandingAmount: number;
  emi: number;
  tenure: number;
}

export interface SelectedBank {
  partnerId: string;
  partnerName: string;
  productType: ProductType;
  selectedAt: string;
  selectedBy: string;
}

export interface STBSubmission {
  id: string;
  partnerId: string;
  partnerName: string;
  submittedAt: string;
  status: "submitted" | "approved" | "declined" | "disbursed";
  approvedAmount: number | null;
  sanctionAmount: number | null;
  disbursedAmount: number | null;
  disbursementDate: string | null;
  remarks: string;
  integrationType: "api" | "portal" | "email";
}

export interface CallLog {
  id: string;
  timestamp: string;
  outcome: "connected" | "not_connected";
  duration: number;
  disposition: DispositionType;
  notes: string;
  agentId: string;
  agentName: string;
  nextAction: "follow_up" | "stb" | "close" | "none";
  followUpDate: string | null;
}

export interface FollowUp {
  id: string;
  scheduledAt: string;
  type: "call" | "document_collection" | "stb_follow_up";
  status: "pending" | "completed" | "missed";
  notes: string;
  subType?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  teamId: string;
  teamName: string;
  managerId: string;
  managerName: string;
  status: "active" | "inactive";
  joinedAt: string;
  leadsAssigned: number;
  leadsConverted: number;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  agentCount: number;
}

export interface LendingPartner {
  id: string;
  name: string;
  products: ProductType[];
  integrationType: "api" | "portal" | "email";
  minCreditScore: number;
  maxFoir: number;
  minIncome: number;
  status: "active" | "inactive";
}

export interface ProductDefinition {
  id: string; // ProductType slug or custom slug
  label: string;
  status: "active" | "inactive";
  isCustom?: boolean;
}

export interface DispositionConfig {
  type: DispositionType;
  label: string;
  category: DispositionCategory;
  group: string;
  requiresFollowUp: boolean;
}

export type NotificationScope = "agent" | "team" | "org" | "admin";

export interface Notification {
  id: string;
  type: "follow_up_due" | "follow_up_missed" | "lead_expiry" | "consent_received" | "lead_reassigned" | "new_allocation" | "stb_status_update" | "agent_missed_fu" | "nc_escalation" | "agent_not_logged_in" | "stb_initiated_by_agent" | "batch_uploaded" | "allocation_done" | "export_completed" | "config_changed";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  leadId?: string;
  scope: NotificationScope;
  agentId?: string;
  teamId?: string;
  /** Optional override for click-through navigation. Defaults: leadId → /leads/:id */
  clickTarget?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: "lead" | "batch" | "stb" | "agent" | "config" | "report" | "follow_up";
  entityId: string;
  entityLabel?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  notes?: string;
}
