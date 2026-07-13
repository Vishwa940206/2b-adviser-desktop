import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { notify } from "@/lib/notify";

function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function fmt(n: string | undefined | null): string {
  if (!n) return "—";
  const num = Number(n);
  return isNaN(num) ? n : `£${num.toLocaleString("en-GB")}`;
}

function humanCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildEmailHtml(body: Record<string, string>): string {
  const ltv =
    body.loan_amount && body.property_value && Number(body.property_value) > 0
      ? Math.round((Number(body.loan_amount) / Number(body.property_value)) * 100)
      : null;

  const rows: [string, string][] = [
    ["Name", body.full_name ?? "—"],
    ["Email", body.email ?? "—"],
    ["Phone", body.phone ?? "—"],
    ["Date of birth", body.dob ?? "—"],
    ["Employment", body.employment ? humanCase(body.employment) : "—"],
    ["Case type", body.case_type ? humanCase(body.case_type) : "—"],
    ["First-time buyer", body.is_first_time_buyer === "true" ? "Yes" : "No"],
    ["Property type", body.property_type ? humanCase(body.property_type) : "—"],
    ["Annual income", fmt(body.annual_income)],
    ["Loan amount", fmt(body.loan_amount)],
    ["Property value", fmt(body.property_value)],
    ...(ltv != null ? [["LTV", `${ltv}%`] as [string, string]] : []),
    ["Credit notes", body.credit_notes || "None disclosed"],
    ["Address", body.address ?? "—"],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:140px;vertical-align:top;border-bottom:1px solid #f3f4f6">${label}</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;border-bottom:1px solid #f3f4f6">${value}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">
  <div style="background:#1a1a2e;padding:24px 28px">
    <p style="margin:0;color:#d4a843;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">New mortgage enquiry</p>
    <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:700">${body.full_name ?? "A client"} has submitted an application</h1>
  </div>
  <div style="padding:24px 28px">
    <p style="margin:0 0 20px;color:#374151;font-size:14px">A new enquiry has arrived through your MortgageGPT client portal. Review the details below and open the dashboard to approve or action it.</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      ${tableRows}
    </table>
    <div style="margin-top:24px;text-align:center">
      <a href="${appUrl()}/applications" style="display:inline-block;background:#d4a843;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:700">View in Dashboard →</a>
    </div>
  </div>
  <div style="padding:16px 28px;border-top:1px solid #f3f4f6;background:#f9fafb">
    <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center">Sent by MortgageGPT · This is an automated notification</p>
  </div>
</div>
</body>
</html>`;
}

async function sendAdviserNotification(
  adviserEmail: string,
  body: Record<string, string>
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return; // optional — silently skip if not configured

  const clientName = body.full_name ?? "A client";
  const caseLabel = body.case_type ? humanCase(body.case_type) : "Mortgage enquiry";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: "MortgageGPT <onboarding@resend.dev>",
      to: [adviserEmail],
      subject: `New enquiry: ${clientName} — ${caseLabel}`,
      html: buildEmailHtml(body),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Server misconfiguration — SUPABASE_SERVICE_ROLE_KEY is not set." },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json() as Record<string, string>;

    const {
      adviser_id, full_name, email, phone, dob, employment,
      address, annual_income, loan_amount, property_value, intent, credit_notes,
    } = body;

    if (!adviser_id || !full_name) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Fetch adviser profile — grab email + name for the notification
    const { data: adviser } = await adminSupabase
      .from("profiles")
      .select("id, email, full_name")
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

    // Fire-and-forget — never block the client response on email delivery
    if (adviser.email) {
      sendAdviserNotification(adviser.email, body).catch(() => {});
    }

    notify(adminSupabase, {
      adviserId: adviser_id,
      type: "new_application",
      title: `New enquiry from ${full_name}`,
      body: body.case_type ? humanCase(body.case_type) : "Mortgage enquiry",
      link: "/applications",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
