import { Lead, Agent, Team, LendingPartner, DispositionConfig, type DispositionType, type LeadStage, type ProductType, type EmploymentType, type Priority } from "@/types/lms";

// Teams
export const teams: Team[] = [
  { id: "team-1", name: "Alpha Squad", tlId: "agent-9", tlName: "Priya Sharma", agentCount: 5 },
  { id: "team-2", name: "Beta Force", tlId: "agent-10", tlName: "Ravi Kumar", agentCount: 5 },
];

// Agents
export const agents: Agent[] = [
  { id: "agent-1", name: "Amit Verma", email: "amit@lms.com", phone: "9876543210", teamId: "team-1", teamName: "Alpha Squad", tlId: "agent-9", tlName: "Priya Sharma", status: "active", joinedAt: "2024-01-15", leadsAssigned: 120, leadsConverted: 28 },
  { id: "agent-2", name: "Sneha Gupta", email: "sneha@lms.com", phone: "9876543211", teamId: "team-1", teamName: "Alpha Squad", tlId: "agent-9", tlName: "Priya Sharma", status: "active", joinedAt: "2024-02-01", leadsAssigned: 95, leadsConverted: 22 },
  { id: "agent-3", name: "Rahul Jain", email: "rahul@lms.com", phone: "9876543212", teamId: "team-1", teamName: "Alpha Squad", tlId: "agent-9", tlName: "Priya Sharma", status: "active", joinedAt: "2024-03-10", leadsAssigned: 80, leadsConverted: 15 },
  { id: "agent-4", name: "Meera Patel", email: "meera@lms.com", phone: "9876543213", teamId: "team-1", teamName: "Alpha Squad", tlId: "agent-9", tlName: "Priya Sharma", status: "active", joinedAt: "2024-01-20", leadsAssigned: 110, leadsConverted: 30 },
  { id: "agent-5", name: "Karan Singh", email: "karan@lms.com", phone: "9876543214", teamId: "team-1", teamName: "Alpha Squad", tlId: "agent-9", tlName: "Priya Sharma", status: "inactive", joinedAt: "2024-04-05", leadsAssigned: 45, leadsConverted: 8 },
  { id: "agent-6", name: "Pooja Reddy", email: "pooja@lms.com", phone: "9876543215", teamId: "team-2", teamName: "Beta Force", tlId: "agent-10", tlName: "Ravi Kumar", status: "active", joinedAt: "2024-02-15", leadsAssigned: 100, leadsConverted: 25 },
  { id: "agent-7", name: "Deepak Nair", email: "deepak@lms.com", phone: "9876543216", teamId: "team-2", teamName: "Beta Force", tlId: "agent-10", tlName: "Ravi Kumar", status: "active", joinedAt: "2024-03-01", leadsAssigned: 88, leadsConverted: 20 },
  { id: "agent-8", name: "Anita Desai", email: "anita@lms.com", phone: "9876543217", teamId: "team-2", teamName: "Beta Force", tlId: "agent-10", tlName: "Ravi Kumar", status: "active", joinedAt: "2024-01-10", leadsAssigned: 130, leadsConverted: 35 },
  { id: "agent-9", name: "Priya Sharma", email: "priya@lms.com", phone: "9876543218", teamId: "team-1", teamName: "Alpha Squad", tlId: "", tlName: "", status: "active", joinedAt: "2023-06-01", leadsAssigned: 0, leadsConverted: 0 },
  { id: "agent-10", name: "Ravi Kumar", email: "ravi@lms.com", phone: "9876543219", teamId: "team-2", teamName: "Beta Force", tlId: "", tlName: "", status: "active", joinedAt: "2023-07-15", leadsAssigned: 0, leadsConverted: 0 },
];

// Lending Partners
export const lendingPartners: LendingPartner[] = [
  { id: "lp-1", name: "HDFC Bank", products: ["personal_loan", "home_loan"], integrationType: "api", minCreditScore: 700, maxFoir: 55, minIncome: 25000, status: "active" },
  { id: "lp-2", name: "ICICI Bank", products: ["personal_loan", "credit_card"], integrationType: "api", minCreditScore: 680, maxFoir: 60, minIncome: 20000, status: "active" },
  { id: "lp-3", name: "Bajaj Finserv", products: ["personal_loan", "business_loan"], integrationType: "portal", minCreditScore: 650, maxFoir: 65, minIncome: 18000, status: "active" },
  { id: "lp-4", name: "Tata Capital", products: ["personal_loan", "loan_against_property"], integrationType: "email", minCreditScore: 720, maxFoir: 50, minIncome: 30000, status: "active" },
  { id: "lp-5", name: "Axis Bank", products: ["home_loan", "personal_loan", "credit_card"], integrationType: "api", minCreditScore: 690, maxFoir: 58, minIncome: 22000, status: "inactive" },
];

// Disposition Config
export const dispositionConfigs: DispositionConfig[] = [
  { type: "connected_interested", label: "Connected - Interested", category: "connected", requiresFollowUp: true },
  { type: "connected_not_interested", label: "Connected - Not Interested", category: "connected", requiresFollowUp: false },
  { type: "connected_callback", label: "Connected - Callback Requested", category: "connected", requiresFollowUp: true },
  { type: "not_contactable", label: "Not Contactable", category: "not_connected", requiresFollowUp: true },
  { type: "wrong_number", label: "Wrong Number", category: "not_connected", requiresFollowUp: false },
  { type: "switched_off", label: "Switched Off", category: "not_connected", requiresFollowUp: true },
  { type: "ringing_no_answer", label: "Ringing - No Answer", category: "not_connected", requiresFollowUp: true },
  { type: "busy", label: "Busy", category: "not_connected", requiresFollowUp: true },
  { type: "dnc", label: "DNC", category: "not_connected", requiresFollowUp: false },
  { type: "documents_pending", label: "Documents Pending", category: "outcome", requiresFollowUp: true },
  { type: "bre_eligible", label: "BRE - Eligible", category: "outcome", requiresFollowUp: true },
  { type: "bre_ineligible", label: "BRE - Ineligible", category: "outcome", requiresFollowUp: false },
  { type: "stb_initiated", label: "STB Initiated", category: "outcome", requiresFollowUp: true },
  { type: "stb_approved", label: "STB Approved", category: "outcome", requiresFollowUp: true },
  { type: "stb_declined", label: "STB Declined", category: "outcome", requiresFollowUp: false },
  { type: "disbursed", label: "Disbursed", category: "outcome", requiresFollowUp: false },
];

const names = ["Rajesh Khanna","Sunita Devi","Mohd Irfan","Lakshmi Narayan","Vikram Chauhan","Nisha Agarwal","Suresh Babu","Fatima Begum","Arjun Rao","Kavita Mishra","Dinesh Thakur","Rekha Pandey","Sanjay Dubey","Asha Kumari","Manoj Tiwari","Geeta Sinha","Ramprasad Yadav","Zainab Khan","Harish Chandra","Padma Lakshmi","Gopal Krishna","Savitri Devi","Naresh Agarwal","Mumtaz Patel","Vijay Shankar","Usha Rani","Prakash Joshi","Salma Sheikh","Ashok Mehta","Kamla Devi","Bharat Bhushan","Parveen Akhtar","Sunil Sharma","Annapurna Iyer","Ramesh Chand","Indira Soni","Arun Kapoor","Sarita Gupta","Mukesh Ambani","Lata Deshmukh","Raghav Mehra","Shobha Rajan","Nilesh Puri","Rina Chakraborty","Satish Kale","Uma Mahesh","Jagdish Prasad","Rubina Sayyed","Kishore Bhat","Malti Sharma"];

function maskMobile(m: string) { return "XXXXXX" + m.slice(-4); }
function maskPan(p: string) { return p.slice(0, 4) + "XXXX" + p.slice(-2); }

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const stages: LeadStage[] = ["new","contacted","interested","bre_done","stb_submitted","approved","declined","disbursed","closed_lost"];
const products: ProductType[] = ["personal_loan","home_loan","business_loan","credit_card","loan_against_property"];
const empTypes: EmploymentType[] = ["salaried","self_employed","business_owner"];
const priorities: Priority[] = ["hot","warm","cold"];
const sources = ["Website","Google Ads","Facebook","Referral","Partner","Walk-in","IVR","WhatsApp"];
const cities = ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad","Jaipur","Lucknow"];
const dispositions: DispositionType[] = ["connected_interested","connected_not_interested","connected_callback","not_contactable","ringing_no_answer","documents_pending","bre_eligible","stb_initiated","stb_approved","stb_declined","disbursed"];

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
    const disp = dispositions[i % dispositions.length];
    const agentIdx = (i % 8) + 1;
    const teamId = agentIdx <= 5 ? "team-1" : "team-2";
    const mobile = `98${randomInt(10000000, 99999999)}`;
    const pan = generatePAN();
    const allocDays = randomInt(1, 60);
    const lastActivityDays = randomInt(0, Math.min(allocDays, 14));
    const creditScore = randomInt(550, 850);

    const callLogs = Array.from({ length: randomInt(1, 5) }, (_, ci) => ({
      id: `call-${i}-${ci}`,
      timestamp: daysAgo(randomInt(0, allocDays)),
      outcome: (Math.random() > 0.3 ? "connected" : "not_connected") as "connected" | "not_connected",
      duration: randomInt(30, 600),
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
    }));

    const breResult = ["bre_done", "stb_submitted", "approved", "disbursed"].includes(stage) ? {
      timestamp: daysAgo(randomInt(1, 20)),
      eligiblePartners: lendingPartners.filter(lp => creditScore >= lp.minCreditScore && foir <= lp.maxFoir && income >= lp.minIncome && lp.status === "active").map(lp => ({
        partnerId: lp.id, partnerName: lp.name, maxAmount: randomInt(100000, 2000000), minRate: randomInt(9, 16), tenure: randomInt(12, 60),
      })),
      ineligiblePartners: lendingPartners.filter(lp => creditScore < lp.minCreditScore || foir > lp.maxFoir || income < lp.minIncome).map(lp => ({
        partnerId: lp.id, partnerName: lp.name, reason: creditScore < lp.minCreditScore ? `Credit score ${creditScore} below minimum ${lp.minCreditScore}` : foir > lp.maxFoir ? `FOIR ${foir}% exceeds maximum ${lp.maxFoir}%` : `Income ₹${income.toLocaleString()} below minimum ₹${lp.minIncome.toLocaleString()}`,
      })),
    } : null;

    const stbSubmissions = ["stb_submitted", "approved", "disbursed"].includes(stage) ? [{
      id: `stb-${i}-1`,
      partnerId: "lp-1",
      partnerName: "HDFC Bank",
      submittedAt: daysAgo(randomInt(1, 15)),
      status: (stage === "approved" ? "approved" : stage === "disbursed" ? "disbursed" : "submitted") as "submitted" | "approved" | "disbursed",
      approvedAmount: stage === "approved" || stage === "disbursed" ? randomInt(100000, 1500000) : null,
      disbursedAmount: stage === "disbursed" ? randomInt(100000, 1500000) : null,
      remarks: "Application processed",
    }] : [];

    return {
      id: `lead-${i + 1}`,
      name,
      mobile: maskMobile(mobile),
      email: `${name.split(" ")[0].toLowerCase()}@email.com`,
      pan: maskPan(pan),
      dob: `${1970 + randomInt(0, 35)}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
      city: randomFrom(cities),
      state: "Maharashtra",
      employmentType: randomFrom(empTypes),
      monthlyIncome: income,
      existingObligations: obligations,
      foir,
      productType: randomFrom(products),
      loanAmount: randomInt(50000, 5000000),
      stage,
      disposition: disp,
      priority: randomFrom(priorities),
      source: randomFrom(sources),
      assignedAgentId: `agent-${agentIdx}`,
      assignedTeamId: teamId,
      creditScore,
      bureauStatus: creditScore ? "pulled" : "not_pulled",
      breResult,
      stbSubmissions,
      callLogs,
      followUps,
      notes: "",
      createdAt: daysAgo(allocDays + randomInt(0, 10)),
      lastActivityAt: daysAgo(lastActivityDays),
      allocatedAt: daysAgo(allocDays),
      consentStatus: ["stb_submitted", "approved", "disbursed"].includes(stage) ? "received" : "not_sent",
      retryCount: disp === "not_contactable" ? randomInt(1, 6) : 0,
    };
  });
}

export const leads: Lead[] = generateLeads();

export const getLeadsForAgent = (agentId: string) => leads.filter(l => l.assignedAgentId === agentId);
export const getLeadsForTeam = (teamId: string) => leads.filter(l => l.assignedTeamId === teamId);
export const getAgentsForTeam = (teamId: string) => agents.filter(a => a.teamId === teamId);
export const getDispositionLabel = (d: DispositionType) => dispositionConfigs.find(c => c.type === d)?.label ?? d;
export const getStageLabel = (s: LeadStage) => ({
  new: "New", contacted: "Contacted", interested: "Interested", bre_done: "BRE Done",
  stb_submitted: "STB Submitted", approved: "Approved", declined: "Declined",
  disbursed: "Disbursed", closed_lost: "Closed Lost",
}[s]);
export const getProductLabel = (p: ProductType) => ({
  personal_loan: "Personal Loan", home_loan: "Home Loan", business_loan: "Business Loan",
  credit_card: "Credit Card", loan_against_property: "Loan Against Property",
}[p]);
