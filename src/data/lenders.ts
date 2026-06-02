/**
 * Lender knowledge base used to seed the AI lender-match prompt.
 * Mirrors c:/Users/NRS/Desktop/2b-adviser-os/src/data/lenders.ts — keep in sync.
 */

export type EmploymentFit =
  | "employed"
  | "self_employed"
  | "contractor"
  | "retired"
  | "company_director";

export interface Lender {
  id: string;
  name: string;
  category: "high_street" | "specialist" | "challenger" | "building_society";
  maxLTV: number;
  minIncome: number;
  minCredit: "thin" | "fair" | "good" | "excellent";
  maxIncomeMultiple: number;
  employment: EmploymentFit[];
  specialties: string[];
  exclusions: string[];
  indicativeRate: number;
  processingDays: number;
  notes: string;
}

export const LENDERS: Lender[] = [
  {
    id: "halifax",
    name: "Halifax",
    category: "high_street",
    maxLTV: 95,
    minIncome: 22000,
    minCredit: "good",
    maxIncomeMultiple: 4.75,
    employment: ["employed", "company_director"],
    specialties: ["First-time buyers", "Standard residential", "New build (95% LTV)"],
    exclusions: ["Recent CCJ", "Day-rate contractors under 12 months history"],
    indicativeRate: 4.69,
    processingDays: 14,
    notes: "Reliable on vanilla cases. Affordability is income-multiple led.",
  },
  {
    id: "natwest",
    name: "NatWest",
    category: "high_street",
    maxLTV: 90,
    minIncome: 20000,
    minCredit: "good",
    maxIncomeMultiple: 5.0,
    employment: ["employed", "self_employed", "company_director"],
    specialties: ["Self-employed (1 yr accounts)", "Professional borrower", "Joint borrower sole proprietor"],
    exclusions: ["Active payday loans in last 12 months"],
    indicativeRate: 4.55,
    processingDays: 12,
    notes: "Strong on self-employed where 1 year SA302 + accountant cert is available.",
  },
  {
    id: "barclays",
    name: "Barclays",
    category: "high_street",
    maxLTV: 90,
    minIncome: 30000,
    minCredit: "good",
    maxIncomeMultiple: 5.5,
    employment: ["employed", "company_director", "contractor"],
    specialties: ["High earners", "Contractors (day rate × 5 × 46 weeks)", "Family Springboard"],
    exclusions: ["Defaults > £500 unsatisfied"],
    indicativeRate: 4.49,
    processingDays: 10,
    notes: "Competitive at higher LTI for £75k+ earners. Day-rate contractor friendly.",
  },
  {
    id: "nationwide",
    name: "Nationwide",
    category: "building_society",
    maxLTV: 95,
    minIncome: 22000,
    minCredit: "good",
    maxIncomeMultiple: 5.5,
    employment: ["employed", "self_employed"],
    specialties: ["Helping Hand (5.5x LTI for FTBs)", "Energy-efficient property bonus"],
    exclusions: ["Adverse credit in last 3 years"],
    indicativeRate: 4.62,
    processingDays: 15,
    notes: "Helping Hand product allows up to 5.5x income for first-time buyers.",
  },
  {
    id: "santander",
    name: "Santander",
    category: "high_street",
    maxLTV: 85,
    minIncome: 25000,
    minCredit: "good",
    maxIncomeMultiple: 5.0,
    employment: ["employed", "company_director"],
    specialties: ["Larger loans", "Interest-only with sufficient equity"],
    exclusions: ["Self-employed under 2 years"],
    indicativeRate: 4.58,
    processingDays: 14,
    notes: "Good for clean cases with strong income. Tighter on self-employed.",
  },
  {
    id: "kensington",
    name: "Kensington Mortgages",
    category: "specialist",
    maxLTV: 85,
    minIncome: 15000,
    minCredit: "fair",
    maxIncomeMultiple: 5.5,
    employment: ["employed", "self_employed", "contractor", "company_director"],
    specialties: ["Adverse credit", "Complex income", "Newly self-employed", "Flex Pro"],
    exclusions: ["Discharged bankruptcy under 3 years"],
    indicativeRate: 5.89,
    processingDays: 18,
    notes: "Specialist for non-standard cases. Flex Pro caters to recent CCJ / IVA-discharged.",
  },
  {
    id: "kent_reliance",
    name: "Kent Reliance",
    category: "specialist",
    maxLTV: 85,
    minIncome: 25000,
    minCredit: "fair",
    maxIncomeMultiple: 5.0,
    employment: ["employed", "self_employed", "company_director"],
    specialties: ["Buy-to-let", "Limited company BTL", "HMO / MUFB"],
    exclusions: ["First-time landlords on HMO"],
    indicativeRate: 5.49,
    processingDays: 20,
    notes: "Go-to for portfolio landlords and limited-company BTL structures.",
  },
  {
    id: "the_mortgage_works",
    name: "The Mortgage Works",
    category: "specialist",
    maxLTV: 80,
    minIncome: 25000,
    minCredit: "good",
    maxIncomeMultiple: 4.5,
    employment: ["employed", "self_employed", "company_director", "retired"],
    specialties: ["Buy-to-let", "Let-to-buy", "Top-slicing"],
    exclusions: ["Sub-£75k property values in some regions"],
    indicativeRate: 5.19,
    processingDays: 16,
    notes: "Nationwide's BTL arm. Strong rental calculation and top-slicing options.",
  },
  {
    id: "metro_bank",
    name: "Metro Bank",
    category: "challenger",
    maxLTV: 90,
    minIncome: 30000,
    minCredit: "good",
    maxIncomeMultiple: 5.0,
    employment: ["employed", "self_employed", "company_director", "contractor"],
    specialties: ["Manual underwriting", "Complex income", "Foreign nationals"],
    exclusions: ["Customers without UK credit footprint > 6 months"],
    indicativeRate: 4.79,
    processingDays: 17,
    notes: "Human underwriting — useful when computer-says-no on high-street lenders.",
  },
  {
    id: "skipton",
    name: "Skipton Building Society",
    category: "building_society",
    maxLTV: 100,
    minIncome: 18000,
    minCredit: "good",
    maxIncomeMultiple: 4.49,
    employment: ["employed"],
    specialties: ["Track Record (100% LTV for renters with 12mo rental history)", "First-time buyers"],
    exclusions: ["Non-renters", "Adverse credit"],
    indicativeRate: 5.49,
    processingDays: 18,
    notes: "Track Record mortgage offers 100% LTV to renters with clean credit.",
  },
];

export function lenderById(id: string): Lender | undefined {
  return LENDERS.find((l) => l.id === id);
}
