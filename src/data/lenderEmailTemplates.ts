/**
 * Per-lender email templates. Mirrors the mobile app's copy of this file —
 * keep in sync when either side changes. Once we promote OpenAI calls to
 * Supabase Edge Functions, both apps will read this from a server endpoint
 * instead of bundling it.
 */

export interface LenderEmailTemplate {
  lenderId: string;
  to: string;
  cc?: string[];
  subject: string;
  body: string;
}

const DEFAULT_BODY = `Dear {{lender_name}} New Business Team,

Please find below a new mortgage application from a client of mine for your consideration.

— Applicant —
Name:           {{applicant_name}}
Date of birth:  {{applicant_dob}}
Address:        {{applicant_address}}
Email:          {{applicant_email}}
Phone:          {{applicant_phone}}
Employment:     {{employment}}

— Loan request —
Loan amount:    £{{loan_amount}}
Property value: £{{property_value}}
LTV:            {{ltv}}%
Annual income:  £{{annual_income}}
Intent:         {{intent}}

— Notes —
{{credit_notes}}

Supporting documents are attached to this email or available in our shared portal.
Please reply directly to this thread with any underwriting questions.

Kind regards,
{{adviser_name}}
2B Adviser OS`;

const DEFAULT_SUBJECT =
  "New mortgage application — {{applicant_name}} — £{{loan_amount}}";

const SPECIALIST_SUBJECT =
  "Specialist case — {{applicant_name}} — £{{loan_amount}} — {{intent}}";
const BTL_SUBJECT =
  "BTL application — {{applicant_name}} — £{{loan_amount}} — {{intent}}";

const overrides: Partial<Record<string, Partial<LenderEmailTemplate>>> = {
  hsbc: { to: "intermediary.mortgages@hsbc.example" },
  lloyds: { to: "broker.applications@lloydsbank.example" },
  halifax: { to: "newbusiness@halifax.example" },
  natwest: { to: "intermediary.applications@natwest.example" },
  barclays: { to: "applications@barclays-broker.example" },
  santander: { to: "broker.applications@santander.example" },
  tsb: { to: "intermediary@tsb.example" },
  nationwide: { to: "intermediary@nationwide.example" },
  skipton: { to: "applications@skipton.example" },
  coventry: { to: "intermediary@coventrybuildingsociety.example" },
  leeds: { to: "intermediary@leedsbuildingsociety.example" },
  yorkshire: { to: "intermediary@ybs.example" },
  principality: { to: "intermediary@principality.example" },
  virgin_money: { to: "intermediary@virginmoney.example" },
  metro_bank: { to: "intermediary.cases@metrobank.example" },
  aldermore: { to: "newbusiness@aldermore.example" },
  accord: { to: "newbusiness@accordmortgages.example" },
  platform: { to: "intermediary@platformhomeloans.example" },
  bm_solutions: { to: "newbusiness@bmsolutions.example", subject: BTL_SUBJECT },
  the_mortgage_works: { to: "applications@themortgageworks.example", subject: BTL_SUBJECT },
  kensington: { to: "newcase@kensingtonmortgages.example", subject: SPECIALIST_SUBJECT },
  precise: { to: "newbusiness@precisemortgages.example", subject: SPECIALIST_SUBJECT },
  foundation: { to: "newcase@foundationhomeloans.example", subject: SPECIALIST_SUBJECT },
  pepper_money: { to: "newbusiness@peppermoney.example", subject: SPECIALIST_SUBJECT },
  bluestone: { to: "newbusiness@bluestonemortgages.example", subject: SPECIALIST_SUBJECT },
  kent_reliance: { to: "btl.applications@kentreliance.example", subject: BTL_SUBJECT },
  paragon: { to: "newbusiness@paragonbank.example", subject: BTL_SUBJECT },
  fleet: { to: "newbusiness@fleetmortgages.example", subject: BTL_SUBJECT },
  landbay: { to: "newbusiness@landbay.example", subject: BTL_SUBJECT },
  keystone: { to: "newbusiness@keystoneproperty.example", subject: BTL_SUBJECT },
};

const LENDER_NAMES: Record<string, string> = {
  hsbc: "HSBC",
  lloyds: "Lloyds Bank",
  halifax: "Halifax",
  natwest: "NatWest",
  barclays: "Barclays",
  santander: "Santander",
  tsb: "TSB",
  nationwide: "Nationwide",
  skipton: "Skipton Building Society",
  coventry: "Coventry Building Society",
  leeds: "Leeds Building Society",
  yorkshire: "Yorkshire Building Society",
  principality: "Principality Building Society",
  virgin_money: "Virgin Money",
  metro_bank: "Metro Bank",
  aldermore: "Aldermore",
  accord: "Accord Mortgages",
  platform: "Platform (Co-op)",
  bm_solutions: "BM Solutions",
  the_mortgage_works: "The Mortgage Works",
  kensington: "Kensington Mortgages",
  precise: "Precise Mortgages",
  foundation: "Foundation Home Loans",
  pepper_money: "Pepper Money",
  bluestone: "Bluestone Mortgages",
  kent_reliance: "Kent Reliance",
  paragon: "Paragon Bank",
  fleet: "Fleet Mortgages",
  landbay: "Landbay",
  keystone: "Keystone Property Finance",
};

export function getLenderEmailTemplate(lenderId: string): LenderEmailTemplate {
  const override = overrides[lenderId] ?? {};
  return {
    lenderId,
    to: override.to ?? `applications@${lenderId}.example`,
    cc: override.cc,
    subject: override.subject ?? DEFAULT_SUBJECT,
    body: override.body ?? DEFAULT_BODY,
  };
}

export function lenderDisplayName(lenderId: string): string {
  return LENDER_NAMES[lenderId] ?? lenderId;
}

export function fillTemplate(
  template: string,
  data: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = data[key];
    if (v == null || v === "") return "—";
    return String(v);
  });
}
