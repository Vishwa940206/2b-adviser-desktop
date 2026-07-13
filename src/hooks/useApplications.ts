"use client";

import { useCallback, useEffect, useState } from "react";

import { notify } from "@/lib/notify";
import { supabase } from "@/lib/supabase";
import type {
  ApplicationDocument,
  ApplicationStatus,
  B2BApplication,
} from "@/types/database";

import { useUser } from "./useUser";

export function useApplications(status?: ApplicationStatus | "all") {
  const { id: adviserId, loading: authLoading } = useUser();
  const [data, setData] = useState<B2BApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!adviserId) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    let q = supabase
      .from("b2b_applications")
      .select("*")
      .eq("adviser_id", adviserId)
      .order("submitted_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    const { data: rows, error: err } = await q;
    if (err) setError(err.message);
    else setData((rows ?? []) as B2BApplication[]);
    setLoading(false);
  }, [status, adviserId, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useApplication(id: string | null) {
  const { id: adviserId, loading: authLoading } = useUser();
  const [data, setData] = useState<B2BApplication | null>(null);
  const [docs, setDocs] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id || authLoading || !adviserId) {
      if (!id) setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [{ data: app, error: e1 }, { data: dRows, error: e2 }] = await Promise.all([
      supabase.from("b2b_applications").select("*").eq("id", id).maybeSingle(),
      supabase.from("application_documents").select("*").eq("application_id", id).order("uploaded_at", { ascending: false }),
    ]);
    if (e1) setError(e1.message);
    else setData((app as B2BApplication) ?? null);
    if (!e2) setDocs((dRows ?? []) as ApplicationDocument[]);
    setLoading(false);
  }, [id, adviserId, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, docs, loading, error, refresh };
}

export async function approveApplication(app: B2BApplication): Promise<{ clientId: string }> {
  let clientId = app.client_id;
  if (!clientId) {
    const { data: client, error: cErr } = await supabase
      .from("clients")
      .insert({
        adviser_id: app.adviser_id,
        full_name: app.applicant_full_name,
        email: app.applicant_email,
        phone: app.applicant_phone,
        dob: app.applicant_dob,
        address: app.applicant_address,
        status: "active" as const,
      })
      .select("id")
      .single();
    if (cErr) throw cErr;
    clientId = client.id;
  }
  const { error } = await supabase
    .from("b2b_applications")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      client_id: clientId,
    })
    .eq("id", app.id);
  if (error) throw error;

  notify(supabase, {
    adviserId: app.adviser_id,
    type: "application_status",
    title: `${app.applicant_full_name}'s application was approved`,
    link: `/applications/${app.id}`,
  });

  return { clientId: clientId! };
}

export async function rejectApplication(id: string, notes?: string): Promise<void> {
  const { data: app, error } = await supabase
    .from("b2b_applications")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      reviewer_notes: notes ?? null,
    })
    .eq("id", id)
    .select("adviser_id, applicant_full_name")
    .single();
  if (error) throw error;

  notify(supabase, {
    adviserId: app.adviser_id,
    type: "application_status",
    title: `${app.applicant_full_name}'s application was rejected`,
    link: `/applications/${id}`,
  });
}

export async function signedUrlForDocument(storagePath: string, expiresIn = 300): Promise<string> {
  const { data, error } = await supabase.storage
    .from("application-uploads")
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
