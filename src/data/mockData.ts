import { Lead, Agent, Team, LendingPartner, DispositionConfig, Notification, type DispositionType, type LeadStage, type ProductType, type EmploymentType, type Priority } from "@/types/lms";
import { calculatePriority, defaultPriorityConfig } from "@/utils/priorityEngine";

// Teams
export const teams: Team[] = [
  { id: "team-1", name: "Alpha Squad", managerId: "mgr-1", managerName: "Vikram Mehta", agentCount: 5 },
  { id: "team-2", name: "Beta Force", managerId: "mgr-2", managerName: "Anjali Kapoor", agentCount: 5 },
];

// Agents
export const agents: Agent[] = [
  { id: "agent-1", name: "Amit Verma", email: "amit@lms.com", phone: "9876543210", teamId: "team-1", teamName: "Alpha Squad", managerId: "mgr-1", managerName: "Vikram Mehta", status: "active", joinedAt: "2024-01-15", leadsAssigned: 120, leadsConverted: 28 },
  { id: "agent-2", name: "Sneha Gupta", email: "sneha@lms.com", phone: "9876543211", teamId: "team-1", teamName: "Alpha Squad", managerId: "mgr-1", managerName: "Vikram Mehta", status: "active", joinedAt: "2024-02-01", leadsAssigned: 95, leadsConverted: 22 },
  { id: "agent-3", name: "Rahul Jain", email: "rahul@lms.com", phone: "9876543212", teamId: "team-1", teamName: "Alpha Squad", managerId: "mgr-1", managerName: "Vikram Mehta", status: "active", joinedAt: "2024-03-10", leadsAssigned: 80, leadsConverted: 15 },
  { id: "agent-4", name: "Meera Patel", email: "meera@lms.com", phone: "9876543213", teamId: "team-1", teamName: "Alpha Squad", managerId: "mgr-1", managerName: "Vikram Mehta", status: "active", joinedAt: "2024-01-20", leadsAssigned: 110, leadsConverted: 30 },
  { id: "agent-5", name: "Karan Singh", email: "karan@lms.com", phone: "9876543214", teamId: "team-1", teamName: "Alpha Squad", managerId: "mgr-1", managerName: "Vikram Mehta", status: "inactive", joinedAt: "2024-04-05", leadsAssigned: 45, leadsConverted: 8 },
  { id: "agent-6", name: "Pooja Reddy", email: "pooja@lms.com", phone: "9876543215", teamId: "team-2", teamName: "Beta Force", managerId: "mgr-2", managerName: "Anjali Kapoor", status: "active", joinedAt: "2024-02-15", leadsAssigned: 100, leadsConverted: 25 },
  { id: "agent-7", name: "Deepak Nair", email: "deepak@lms.com", phone: "9876543216", teamId: "team-2", teamName: "Beta Force", managerId: "mgr-2", managerName: "Anjali Kapoor", status: "active", joinedAt: "2024-03-01", leadsAssigned: 88, leadsConverted: 20 },
  { id: "agent-8", name: "Anita Desai", email: "anita@lms.com", phone: "9876543217", teamId: "team-2", teamName: "Beta Force", managerId: "mgr-2", managerName: "Anjali Kapoor", status: "active", joinedAt: "2024-01-10", leadsAssigned: 130, leadsConverted: 35 },
  { id: "agent-9", name: "Priya Sharma", email: "priya@lms.com", phone: "9876543218", teamId: "team-1", teamName: "Alpha Squad", managerId: "mgr-1", managerName: "Vikram Mehta", status: "active", joinedAt: "2023-06-01", leadsAssigned: 50, leadsConverted: 12 },
  { id: "agent-10", name: "Ravi Kumar", email: "ravi@lms.com", phone: "9876543219", teamId: "team-2", teamName: "Beta Force", managerId: "mgr-2", managerName: "Anjali Kapoor", status: "active", joinedAt: "2023-07-15", leadsAssigned: 60, leadsConverted: 15 },
];

// Lending Partners
export const lendingPartners: LendingPartner[] = [
  { id: "lp-1", name: "HDFC Bank", products: ["personal_loan", "home_loan"], integrationType: "api", minCreditScore: 700, maxFoir: 55, minIncome: 25000, status: "active" },
  { id: "lp-2", name: "ICICI Bank", products: ["personal_loan", "credit_card"], integrationType: "api", minCreditScore: 680, maxFoir: 60, minIncome: 20000, status: "active" },
  { id: "lp-3", name: "Bajaj Finserv", products: ["personal_loan", "business_loan"], integrationType: "portal", minCreditScore: 650, maxFoir: 65, minIncome: 18000, status: "active" },
  { id: "lp-4", name: "Tata Capital", products: ["personal_loan", "loan_against_property"], integrationType: "email", minCreditScore: 720, maxFoir: 50, minIncome: 30000, status: "active" },
  { id: "lp-5", name: "Axis Bank", products: ["home_loan", "personal_loan", "credit_card"], integrationType: "api", minCreditScore: 690, maxFoir: 58, minIncome: 22000, status: "inactive" },
];

// Grouped Disposition Config
export const dispositionConfigs: DispositionConfig[] = [
  // Follow-Up
  { type: "hot_follow_up", label: "Hot Follow-Up", category: "follow_up", group: "Follow-Up", requiresFollowUp: true },
  { type: "warm_follow_up", label: "Warm Follow-Up", category: "follow_up", group: "Follow-Up", requiresFollowUp: true },
  { type: "cold_follow_up", label: "Cold Follow-Up", category: "follow_up", group: "Follow-Up", requiresFollowUp: true },
  { type: "document_follow_up", label: "Document Follow-Up", category: "follow_up", group: "Follow-Up", requiresFollowUp: true },
  { type: "callback_requested", label: "Callback Requested", category: "follow_up", group: "Follow-Up", requiresFollowUp: true },
  { type: "price_discussion_pending", label: "Price Discussion Pending", category: "follow_up", group: "Follow-Up", requiresFollowUp: true },
  // Not Contactable
  { type: "number_busy", label: "Number Busy", category: "not_contactable", group: "Not Contactable", requiresFollowUp: true },
  { type: "no_response", label: "No Response / Ringing", category: "not_contactable", group: "Not Contactable", requiresFollowUp: true },
  { type: "switched_off", label: "Switched Off", category: "not_contactable", group: "Not Contactable", requiresFollowUp: true },
  { type: "invalid_number", label: "Invalid Number", category: "not_contactable", group: "Not Contactable", requiresFollowUp: false },
  { type: "call_dropped", label: "Call Dropped", category: "not_contactable", group: "Not Contactable", requiresFollowUp: true },
  { type: "wrong_number", label: "Wrong Number", category: "not_contactable", group: "Not Contactable", requiresFollowUp: false },
  // Not Interested
  { type: "already_has_loan", label: "Already Has Loan", category: "not_interested", group: "Not Interested", requiresFollowUp: false },
  { type: "does_not_need", label: "Does Not Need", category: "not_interested", group: "Not Interested", requiresFollowUp: false },
  { type: "rate_too_high", label: "Rate Too High", category: "not_interested", group: "Not Interested", requiresFollowUp: false },
  { type: "will_decide_later", label: "Will Decide Later", category: "not_interested", group: "Not Interested", requiresFollowUp: true },
  { type: "chose_competitor", label: "Chose Competitor", category: "not_interested", group: "Not Interested", requiresFollowUp: false },
  // Negative
  { type: "language_barrier", label: "Language Barrier", category: "negative", group: "Negative", requiresFollowUp: false },
  { type: "hung_up", label: "Hung Up", category: "negative", group: "Negative", requiresFollowUp: false },
  // BRE Ineligible
  { type: "credit_score_low", label: "Credit Score Low", category: "bre_ineligible", group: "BRE Ineligible", requiresFollowUp: false },
  { type: "income_below", label: "Income Below Threshold", category: "bre_ineligible", group: "BRE Ineligible", requiresFollowUp: false },
  { type: "age_outside", label: "Age Outside Range", category: "bre_ineligible", group: "BRE Ineligible", requiresFollowUp: false },
  { type: "pin_not_serviceable", label: "PIN Not Serviceable", category: "bre_ineligible", group: "BRE Ineligible", requiresFollowUp: false },
  { type: "too_many_loans", label: "Too Many Active Loans", category: "bre_ineligible", group: "BRE Ineligible", requiresFollowUp: false },
  { type: "high_dpd", label: "High DPD", category: "bre_ineligible", group: "BRE Ineligible", requiresFollowUp: false },
  { type: "recent_writeoff", label: "Recent Write-Off", category: "bre_ineligible", group: "BRE Ineligible", requiresFollowUp: false },
  // Compliance
  { type: "dnd_registered", label: "DND Registered", category: "compliance", group: "Compliance", requiresFollowUp: false },
  // Documents Pending
  { type: "pan_not_available", label: "PAN Not Available", category: "documents_pending", group: "Documents Pending", requiresFollowUp: true },
  { type: "income_proof_not_ready", label: "Income Proof Not Ready", category: "documents_pending", group: "Documents Pending", requiresFollowUp: true },
  { type: "address_proof_pending", label: "Address Proof Pending", category: "documents_pending", group: "Documents Pending", requiresFollowUp: true },
  { type: "bank_statement_not_available", label: "Bank Statement Not Available", category: "documents_pending", group: "Documents Pending", requiresFollowUp: true },
  { type: "photo_id_missing", label: "Photo ID Missing", category: "documents_pending", group: "Documents Pending", requiresFollowUp: true },
  // Outcome
  { type: "stb_qualified", label: "STB Qualified", category: "outcome", group: "Outcome", requiresFollowUp: true },
  { type: "duplicate", label: "Duplicate Lead", category: "outcome", group: "Outcome", requiresFollowUp: false },
  // Closed
  { type: "closed_sanctioned_elsewhere", label: "Sanctioned Elsewhere", category: "closed", group: "Closed", requiresFollowUp: false },
  { type: "closed_changed_mind", label: "Changed Mind", category: "closed", group: "Closed", requiresFollowUp: false },
  { type: "closed_unreachable", label: "Permanently Unreachable", category: "closed", group: "Closed", requiresFollowUp: false },
  // Legacy
  { type: "connected_interested", label: "Connected - Interested", category: "connected", group: "Connected", requiresFollowUp: true },
  { type: "connected_not_interested", label: "Connected - Not Interested", category: "connected", group: "Connected", requiresFollowUp: false },
  { type: "connected_callback", label: "Callback Requested", category: "connected", group: "Connected", requiresFollowUp: true },
  { type: "not_contactable", label: "Not Contactable", category: "not_connected", group: "Not Connected", requiresFollowUp: true },
  { type: "ringing_no_answer", label: "Ringing - No Answer", category: "not_connected", group: "Not Connected", requiresFollowUp: true },
  { type: "busy", label: "Busy", category: "not_connected", group: "Not Connected", requiresFollowUp: true },
  { type: "dnc", label: "DNC", category: "not_connected", group: "Not Connected", requiresFollowUp: false },
  { type: "documents_pending", label: "Documents Pending", category: "outcome", group: "Documents", requiresFollowUp: true },
  { type: "bre_eligible", label: "BRE - Eligible", category: "outcome", group: "BRE", requiresFollowUp: true },
  { type: "bre_ineligible", label: "BRE - Ineligible", category: "outcome", group: "BRE", requiresFollowUp: false },
  { type: "stb_initiated", label: "STB Initiated", category: "outcome", group: "STB", requiresFollowUp: true },
  { type: "stb_approved", label: "STB Approved", category: "outcome", group: "STB", requiresFollowUp: true },
  { type: "stb_declined", label: "STB Declined", category: "outcome", group: "STB", requiresFollowUp: false },
  { type: "disbursed", label: "Disbursed", category: "outcome", group: "Outcome", requiresFollowUp: false },
];

export const dispositionGroups = (): { group: string; items: DispositionConfig[] }[] => {
  const groups: { group: string; items: DispositionConfig[] }[] = [];
  const primaryGroups = ["Follow-Up", "Not Contactable", "Not Interested", "Negative", "Compliance", "Documents Pending", "Outcome", "Closed"];
  for (const g of primaryGroups) {
    const items = dispositionConfigs.filter(d => d.group === g);
    if (items.length) groups.push({ group: g, items });
  }
  return groups;
};

const names = ["Rajesh Khanna","Sunita Devi","Mohd Irfan","Lakshmi Narayan","Vikram Chauhan","Nisha Agarwal","Suresh Babu","Fatima Begum","Arjun Rao","Kavita Mishra","Dinesh Thakur","Rekha Pandey","Sanjay Dubey","Asha Kumari","Manoj Tiwari","Geeta Sinha","Ramprasad Yadav","Zainab Khan","Harish Chandra","Padma Lakshmi","Gopal Krishna","Savitri Devi","Naresh Agarwal","Mumtaz Patel","Vijay Shankar","Usha Rani","Prakash Joshi","Salma Sheikh","Ashok Mehta","Kamla Devi","Bharat Bhushan","Parveen Akhtar","Sunil Sharma","Annapurna Iyer","Ramesh Chand","Indira Soni","Arun Kapoor","Sarita Gupta","Mukesh Ambani","Lata Deshmukh","Raghav Mehra","Shobha Rajan","Nilesh Puri","Rina Chakraborty","Satish Kale","Uma Mahesh","Jagdish Prasad","Rubina Sayyed","Kishore Bhat","Malti Sharma"];

function maskMobile(m: string) { return "XXXXXX" + m.slice(-4); }
function maskPan(p: string) { return p.slice(0, 4) + "XXXX" + p.slice(-2); }

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const stages: LeadStage[] = ["new","contacted","interested","bank_selected","stb_submitted","approved","declined","disbursed","closed_lost"];
const products: ProductType[] = ["personal_loan","home_loan","business_loan","credit_card","loan_against_property"];
const empTypes: EmploymentType[] = ["salaried","self_employed","business_owner"];
const priorities: Priority[] = ["hot","warm","cold"];
export const defaultLeadSources = ["Website","Google Ads","Facebook","Referral","Partner","Walk-in","IVR","WhatsApp","Email Campaign"];
const leadSources = defaultLeadSources;
const cities = ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad","Jaipur","Lucknow"];
const pinCodes: Record<string, string[]> = {
  "Mumbai": ["400001","400050","400070"],
  "Delhi": ["110001","110045","110085"],
  "Bangalore": ["560001","560034","560078"],
  "Hyderabad": ["500001","500032","500081"],
  "Chennai": ["600001","600020","600096"],
  "Pune": ["411001","411014","411038"],
  "Kolkata": ["700001","700019","700064"],
  "Ahmedabad": ["380001","380015","380059"],
  "Jaipur": ["302001","302012","302033"],
  "Lucknow": ["226001","226010","226025"],
};
const stateMap: Record<string, string> = {
  "Mumbai": "Maharashtra", "Pune": "Maharashtra", "Delhi": "Delhi",
  "Bangalore": "Karnataka", "Hyderabad": "Telangana", "Chennai": "Tamil Nadu",
  "Kolkata": "West Bengal", "Ahmedabad": "Gujarat", "Jaipur": "Rajasthan", "Lucknow": "Uttar Pradesh",
};
const companies = ["TCS","Infosys","Wipro","HCL Tech","Self","Reliance","Tata Motors","Bajaj Auto","Own Business","Freelancer"];
const newDispositions: DispositionType[] = ["hot_follow_up","warm_follow_up","cold_follow_up","document_follow_up","callback_requested","number_busy","no_response","switched_off","already_has_loan","does_not_need","stb_qualified","pan_not_available","income_proof_not_ready"];

function generatePAN() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({length:5},()=>letters[randomInt(0,25)]).join("") + randomInt(1000,9999) + letters[randomInt(0,25)];
}

function daysAgo(d: number) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

function generateLeads(): Lead[] {
  return names.map((name, i) => {
    const income = randomInt(15000, 200000);
    const obligations = randomInt(0, income * 0.4);
    const foir = Math.round((obligations / income) * 100);
    const stage = stages[Math.min(Math.floor(i / 6), stages.length - 1)];
    const disp = newDispositions[i % newDispositions.length];
    const agentIdx = (i % 8) + 1;
    const teamId = agentIdx <= 5 ? "team-1" : "team-2";
    const mobile = `98${randomInt(10000000, 99999999)}`;
    const pan = generatePAN();
    const allocDays = randomInt(1, 60);
    const lastActivityDays = randomInt(0, Math.min(allocDays, 14));
    const creditScore = randomInt(550, 850);
    const city = randomFrom(cities);
    const source = randomFrom(leadSources);

    const callLogs = Array.from({ length: randomInt(1, 5) }, (_, ci) => ({
      id: `call-${i}-${ci}`,
      timestamp: daysAgo(randomInt(0, allocDays)),
      outcome: (Math.random() > 0.3 ? "connected" : "not_connected") as "connected" | "not_connected",
      duration: Math.random() > 0.3 ? randomInt(30, 600) : 0,
      disposition: disp,
      notes: ["Discussed loan options", "Customer busy, will call back", "Interested in PL", "Documents requested", "Not reachable"][ci % 5],
      agentId: `agent-${agentIdx}`,
      agentName: agents[agentIdx - 1].name,
      nextAction: (["follow_up", "stb", "close", "none"] as const)[ci % 4],
      followUpDate: ci % 4 === 0 ? daysAgo(-randomInt(1, 7)) : null,
    }));

    const followUps = Array.from({ length: randomInt(0, 3) }, (_, fi) => ({
      id: `fu-${i}-${fi}`,
      scheduledAt: daysAgo(-randomInt(-2, 5)),
      type: (["call", "document_collection", "stb_follow_up"] as const)[fi % 3],
      status: (["pending", "completed", "missed"] as const)[fi % 3],
      notes: "Follow up on documentation",
      subType: fi === 0 ? "hot_follow_up" : undefined,
    }));

    const existingLoans = Array.from({ length: randomInt(0, 3) }, (_, li) => ({
      id: `loan-${i}-${li}`,
      bankName: randomFrom(["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak"]),
      loanType: randomFrom(["Personal Loan", "Home Loan", "Car Loan", "Credit Card"]),
      outstandingAmount: randomInt(50000, 2000000),
      emi: randomInt(3000, 50000),
      tenure: randomInt(6, 60),
    }));

    const selectedBanks = ["bank_selected", "stb_submitted", "approved", "disbursed"].includes(stage)
      ? lendingPartners.filter(lp => lp.status === "active").slice(0, randomInt(1, 3)).map(lp => ({
          partnerId: lp.id,
          partnerName: lp.name,
          productType: randomFrom(lp.products),
          selectedAt: daysAgo(randomInt(1, 20)),
          selectedBy: `agent-${agentIdx}`,
        }))
      : [];

    const stbSubmissions = ["stb_submitted", "approved", "disbursed"].includes(stage) ? [{
      id: `stb-${i}-1`,
      partnerId: "lp-1",
      partnerName: "HDFC Bank",
      submittedAt: daysAgo(randomInt(1, 15)),
      status: (stage === "approved" ? "approved" : stage === "disbursed" ? "disbursed" : "submitted") as "submitted" | "approved" | "disbursed",
      approvedAmount: stage === "approved" || stage === "disbursed" ? randomInt(100000, 1500000) : null,
      sanctionAmount: stage === "approved" || stage === "disbursed" ? randomInt(100000, 1500000) : null,
      disbursedAmount: stage === "disbursed" ? randomInt(100000, 1500000) : null,
      disbursementDate: stage === "disbursed" ? daysAgo(randomInt(1, 5)) : null,
      remarks: "Application processed",
      integrationType: "api" as const,
    }] : [];

    const noteTexts = ["Initial contact made", "Customer interested in PL ₹5L", "Documents collection pending", "Bureau pulled - score 720", "Submitted to HDFC"];
    const leadNotes = Array.from({ length: randomInt(0, 3) }, (_, ni) => ({
      id: `note-${i}-${ni}`,
      text: noteTexts[ni % noteTexts.length],
      createdAt: daysAgo(randomInt(0, allocDays)),
      agentId: `agent-${agentIdx}`,
      agentName: agents[agentIdx - 1].name,
    }));

    return {
      id: `lead-${i + 1}`,
      name,
      mobile,
      email: `${name.split(" ")[0].toLowerCase()}@email.com`,
      pan: maskPan(pan),
      dob: `${1970 + randomInt(0, 35)}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
      city,
      state: stateMap[city] || "Maharashtra",
      pinCode: randomFrom(pinCodes[city] || ["400001"]),
      companyName: randomFrom(companies),
      employmentType: randomFrom(empTypes),
      monthlyIncome: income,
      existingObligations: obligations,
      foir,
      productType: randomFrom(products),
      loanAmount: randomInt(50000, 5000000),
      stage,
      disposition: disp,
      priority: "cold" as Priority, // will be recalculated by engine
      source,
      leadSource: source,
      dndStatus: Math.random() > 0.85 ? "dnd_registered" : "clean",
      assignedAgentId: `agent-${agentIdx}`,
      assignedTeamId: teamId,
      creditScore,
      existingLoans,
      selectedBanks,
      stbSubmissions,
      callLogs,
      followUps,
      notes: leadNotes,
      createdAt: daysAgo(allocDays + randomInt(0, 10)),
      lastActivityAt: daysAgo(lastActivityDays),
      allocatedAt: daysAgo(allocDays),
      consentStatus: ["stb_submitted", "approved", "disbursed"].includes(stage) ? "received" : "not_sent",
      retryCount: ["number_busy", "no_response", "switched_off"].includes(disp) ? randomInt(1, 6) : 0,
      expiresAt: daysAgo(-(90 - allocDays)),
    };
  });
}

const rawLeads = generateLeads();
// Apply priority engine to all leads
export const leads: Lead[] = rawLeads.map(lead => ({
  ...lead,
  priority: calculatePriority(lead, defaultPriorityConfig),
}));

export const getLeadsForAgent = (agentId: string) => leads.filter(l => l.assignedAgentId === agentId);
export const getLeadsForTeam = (teamId: string) => leads.filter(l => l.assignedTeamId === teamId);
export const getAgentsForTeam = (teamId: string) => agents.filter(a => a.teamId === teamId);
export const getDispositionLabel = (d: DispositionType) => dispositionConfigs.find(c => c.type === d)?.label ?? d.replace(/_/g, " ");
export const getStageLabel = (s: LeadStage) => ({
  new: "New", contacted: "Contacted", interested: "Interested", bank_selected: "Bank Selected",
  stb_submitted: "STB Submitted", approved: "Approved", declined: "Declined",
  disbursed: "Disbursed", closed_lost: "Closed Lost",
}[s]);
export const getProductLabel = (p: ProductType) => ({
  personal_loan: "Personal Loan", home_loan: "Home Loan", business_loan: "Business Loan",
  credit_card: "Credit Card", loan_against_property: "Loan Against Property",
}[p]);

// Mock Notifications (includes manager-specific team events)
export const mockNotifications: Notification[] = [
  { id: "n-1", type: "follow_up_due", title: "Follow-Up Due", message: "Follow-up with Rajesh Khanna is due in 30 minutes", timestamp: daysAgo(0), read: false, leadId: "lead-1" },
  { id: "n-2", type: "follow_up_missed", title: "Missed Follow-Up", message: "You missed a follow-up with Sunita Devi", timestamp: daysAgo(0), read: false, leadId: "lead-2" },
  { id: "n-3", type: "lead_expiry", title: "Lead Expiring Soon", message: "Lead Mohd Irfan expires in 2 days", timestamp: daysAgo(0), read: false, leadId: "lead-3" },
  { id: "n-4", type: "consent_received", title: "Consent Received", message: "Consent SMS confirmed for Lakshmi Narayan", timestamp: daysAgo(0), read: true, leadId: "lead-4" },
  { id: "n-5", type: "new_allocation", title: "New Lead Allocated", message: "3 new leads have been assigned to you", timestamp: daysAgo(0), read: true },
  { id: "n-6", type: "stb_status_update", title: "STB Update", message: "HDFC Bank approved loan for Vikram Chauhan", timestamp: daysAgo(1), read: true, leadId: "lead-5" },
  { id: "n-7", type: "lead_reassigned", title: "Lead Reassigned", message: "Lead Nisha Agarwal reassigned to you from Sneha Gupta", timestamp: daysAgo(1), read: true, leadId: "lead-6" },
  { id: "n-8", type: "follow_up_due", title: "Follow-Up Due", message: "Document collection follow-up with Arjun Rao", timestamp: daysAgo(0), read: false, leadId: "lead-9" },
  // Manager-specific notifications
  { id: "n-9", type: "agent_missed_fu", title: "Agent Missed Follow-Up", message: "Amit Verma missed a follow-up with Rekha Pandey", timestamp: daysAgo(0), read: false, leadId: "lead-12" },
  { id: "n-10", type: "nc_escalation", title: "5+ NC Escalation", message: "Suresh Babu has 5+ not contactable attempts — requires manager review", timestamp: daysAgo(0), read: false, leadId: "lead-7" },
  { id: "n-11", type: "agent_not_logged_in", title: "Agent Not Logged In", message: "Karan Singh has not logged in today", timestamp: daysAgo(0), read: false },
  { id: "n-12", type: "stb_initiated_by_agent", title: "STB Initiated", message: "Sneha Gupta initiated STB for Vikram Chauhan to HDFC Bank", timestamp: daysAgo(0), read: false, leadId: "lead-5" },
  { id: "n-13", type: "lead_expiry", title: "Team Lead Expiring", message: "3 team leads expiring within 48 hours", timestamp: daysAgo(0), read: false },
  { id: "n-14", type: "stb_status_update", title: "STB Approved", message: "ICICI Bank approved loan for Fatima Begum — agent: Rahul Jain", timestamp: daysAgo(0), read: true, leadId: "lead-8" },
  // Group-level notifications
  { id: "n-15", type: "agent_not_logged_in", title: "Agent Not Logged In", message: "Agent Ravi Kumar (Beta Force) has not logged in today", timestamp: daysAgo(0), read: false },
  { id: "n-16", type: "nc_escalation", title: "Team Missed F/U Threshold", message: "Alpha Squad has exceeded 10 missed follow-ups this week", timestamp: daysAgo(0), read: false },
  { id: "n-17", type: "stb_status_update", title: "Group STB Update", message: "Bajaj Finserv declined loan for Manoj Tiwari — Manager: Vikram Mehta, Agent: Meera Patel", timestamp: daysAgo(0), read: false, leadId: "lead-15" },
  { id: "n-18", type: "lead_reassigned", title: "Override Confirmation", message: "You overrode a Closed/Lost disposition on lead Arjun Rao — lead moved to Contacted", timestamp: daysAgo(1), read: true, leadId: "lead-9" },
  // Cluster Head notifications
  { id: "n-19", type: "agent_not_logged_in", title: "Manager Not Logged In", message: "Manager Anjali Kapoor has not logged in today", timestamp: daysAgo(0), read: false },
  { id: "n-20", type: "nc_escalation", title: "DND Risk Alert", message: "3 DND-registered leads contacted without consent in South Zone", timestamp: daysAgo(0), read: false },
  { id: "n-21", type: "new_allocation", title: "Unallocated Pool Alert", message: "22 leads from Partner source remain unallocated for 48 hours", timestamp: daysAgo(0), read: false },
  { id: "n-22", type: "stb_status_update", title: "Stale STB Pool", message: "5 STB submissions pending >7 days across organisation", timestamp: daysAgo(0), read: false },
  { id: "n-23", type: "lead_reassigned", title: "Config Change Logged", message: "Allocation mode changed from Manual to Round Robin by CH Admin", timestamp: daysAgo(0), read: true },
  { id: "n-24", type: "lead_reassigned", title: "Staff Deactivated", message: "Agent Karan Singh deactivated. 12 leads need reassignment.", timestamp: daysAgo(1), read: true },
];

// Performance mock data
export const performanceData = [
  { month: "Nov 2025", allocated: 22, contacted: 18, contactRate: 82, stbCount: 8, stbRate: 36, approved: 5, disbursedCount: 3, disbursedAmount: 1500000, followUpCompliance: 88 },
  { month: "Dec 2025", allocated: 25, contacted: 21, contactRate: 84, stbCount: 10, stbRate: 40, approved: 6, disbursedCount: 4, disbursedAmount: 2200000, followUpCompliance: 91 },
  { month: "Jan 2026", allocated: 20, contacted: 17, contactRate: 85, stbCount: 7, stbRate: 35, approved: 4, disbursedCount: 3, disbursedAmount: 1800000, followUpCompliance: 85 },
  { month: "Feb 2026", allocated: 28, contacted: 24, contactRate: 86, stbCount: 12, stbRate: 43, approved: 7, disbursedCount: 5, disbursedAmount: 2800000, followUpCompliance: 92 },
  { month: "Mar 2026", allocated: 30, contacted: 26, contactRate: 87, stbCount: 14, stbRate: 47, approved: 9, disbursedCount: 6, disbursedAmount: 3500000, followUpCompliance: 94 },
  { month: "Apr 2026", allocated: 18, contacted: 15, contactRate: 83, stbCount: 6, stbRate: 33, approved: 3, disbursedCount: 2, disbursedAmount: 1200000, followUpCompliance: 90 },
];
