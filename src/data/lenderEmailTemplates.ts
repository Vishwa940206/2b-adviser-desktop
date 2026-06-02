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

const overrides: Partial<Record<string, Partial<LenderEmailTemplate>>> = {
  halifax: { to: "newbusiness@halifax.example" },
  natwest: { to: "intermediary.applications@natwest.example" },
  barclays: { to: "applications@barclays-broker.example" },
  nationwide: { to: "intermediary@nationwide.example" },
  santander: { to: "broker.applications@santander.example" },
  kensington: {
    to: "newcase@kensingtonmortgages.example",
    subject:
      "Specialist case — {{applicant_name}} — £{{loan_amount}} — {{intent}}",
  },
  kent_reliance: { to: "btl.applications@kentreliance.example" },
  the_mortgage_works: { to: "applications@themortgageworks.example" },
  metro_bank: { to: "intermediary.cases@metrobank.example" },
  skipton: { to: "applications@skipton.example" },
};

const LENDER_NAMES: Record<string, string> = {
  halifax: "Halifax",
  natwest: "NatWest",
  barclays: "Barclays",
  nationwide: "Nationwide",
  santander: "Santander",
  kensington: "Kensington Mortgages",
  kent_reliance: "Kent Reliance",
  the_mortgage_works: "The Mortgage Works",
  metro_bank: "Metro Bank",
  skipton: "Skipton Building Society",
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
