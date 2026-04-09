export type UserRole = "agent" | "team_leader" | "manager" | "cluster_head" | "data_admin";

export type LeadStage = "new" | "contacted" | "interested" | "bre_done" | "stb_submitted" | "approved" | "declined" | "disbursed" | "closed_lost";

export type DispositionType =
  | "connected_interested"
  | "connected_not_interested"
  | "connected_callback"
  | "not_contactable"
  | "wrong_number"
  | "switched_off"
  | "ringing_no_answer"
  | "busy"
  | "dnc"
  | "documents_pending"
  | "bre_eligible"
  | "bre_ineligible"
  | "stb_initiated"
  | "stb_approved"
  | "stb_declined"
  | "disbursed";

export type ProductType = "personal_loan" | "home_loan" | "business_loan" | "credit_card" | "loan_against_property";

export type EmploymentType = "salaried" | "self_employed" | "business_owner";

export type Priority = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  pan: string;
  dob: string;
  city: string;
  state: string;
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
  assignedAgentId: string;
  assignedTeamId: string;
  creditScore: number | null;
  bureauStatus: "not_pulled" | "pulled" | "expired";
  breResult: BREResult | null;
  stbSubmissions: STBSubmission[];
  callLogs: CallLog[];
  followUps: FollowUp[];
  notes: string;
  createdAt: string;
  lastActivityAt: string;
  allocatedAt: string;
  consentStatus: "not_sent" | "sent" | "received" | "expired";
  retryCount: number;
}

export interface BREResult {
  timestamp: string;
  eligiblePartners: { partnerId: string; partnerName: string; maxAmount: number; minRate: number; tenure: number }[];
  ineligiblePartners: { partnerId: string; partnerName: string; reason: string }[];
}

export interface STBSubmission {
  id: string;
  partnerId: string;
  partnerName: string;
  submittedAt: string;
  status: "submitted" | "approved" | "declined" | "disbursed";
  approvedAmount: number | null;
  disbursedAmount: number | null;
  remarks: string;
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
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  teamId: string;
  teamName: string;
  tlId: string;
  tlName: string;
  status: "active" | "inactive";
  joinedAt: string;
  leadsAssigned: number;
  leadsConverted: number;
}

export interface Team {
  id: string;
  name: string;
  tlId: string;
  tlName: string;
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

export interface DispositionConfig {
  type: DispositionType;
  label: string;
  category: "connected" | "not_connected" | "outcome";
  requiresFollowUp: boolean;
}
