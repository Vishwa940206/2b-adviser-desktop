import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Uses the service role key (server-only, never exposed to the browser)
// so it bypasses RLS — safe because we validate adviser_id exists first.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      adviser_id, full_name, email, phone, dob, employment,
      address, annual_income, loan_amount, property_value, intent, credit_notes,
    } = body as Record<string, string>;

    if (!adviser_id || !full_name) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Verify the adviser exists before accepting the submission
    const { data: adviser } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("id", adviser_id)
      .maybeSingle();

    if (!adviser) {
      return NextResponse.json({ error: "Invalid adviser." }, { status: 400 });
    }

    const { error } = await adminSupabase.from("b2b_applications").insert({
      adviser_id,
      status: "submitted",
      applicant_full_name: full_name,
      applicant_email: email || null,
      applicant_phone: phone || null,
      applicant_dob: dob || null,
      applicant_address: address || null,
      employment: employment || null,
      annual_income: annual_income ? Number(annual_income) : null,
      loan_amount: loan_amount ? Number(loan_amount) : null,
      property_value: property_value ? Number(property_value) : null,
      intent: intent || null,
      credit_notes: credit_notes || null,
      raw_payload: body,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
