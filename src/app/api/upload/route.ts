import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const adminSupabase = getAdmin();
  if (!adminSupabase) {
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  const applicationId = req.nextUrl.searchParams.get("applicationId");
  if (!applicationId) {
    return NextResponse.json({ error: "Missing applicationId." }, { status: 400 });
  }

  const { data: app } = await adminSupabase
    .from("b2b_applications")
    .select("id, applicant_full_name, employment, adviser_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (!app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", app.adviser_id)
    .maybeSingle();

  const { data: docs } = await adminSupabase
    .from("application_documents")
    .select("id, original_filename, mime_type, size_bytes, status, uploaded_at")
    .eq("application_id", applicationId)
    .order("uploaded_at", { ascending: false });

  return NextResponse.json({
    applicant_full_name: app.applicant_full_name,
    employment: app.employment,
    adviser_name: profile?.full_name ?? "Your Adviser",
    documents: docs ?? [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const adminSupabase = getAdmin();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;

    if (!file || !applicationId) {
      return NextResponse.json({ error: "Missing file or application ID." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10 MB." }, { status: 400 });
    }

    const { data: app } = await adminSupabase
      .from("b2b_applications")
      .select("id")
      .eq("id", applicationId)
      .maybeSingle();

    if (!app) {
      return NextResponse.json({ error: "Invalid application." }, { status: 400 });
    }

    // Sanitise filename and build storage path
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${applicationId}/${Date.now()}_${safeName}`;
    const bytes = await file.arrayBuffer();

    const { error: storageError } = await adminSupabase.storage
      .from("application-uploads")
      .upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    const { data: doc, error: dbError } = await adminSupabase
      .from("application_documents")
      .insert({
        application_id: applicationId,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type || null,
        size_bytes: file.size || null,
        status: "uploaded",
        uploaded_at: new Date().toISOString(),
      })
      .select("id, original_filename, mime_type, size_bytes, status, uploaded_at")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, document: doc });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
