"use client";

import {
  Bell,
  CheckCircle2,
  Globe,
  KeyRound,
  LogOut,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import type { Profile, SubscriptionTier } from "@/types/database";

const TIER_META: Record<SubscriptionTier, { label: string; color: string; features: string[] }> = {
  starter: {
    label: "Starter",
    color: "bg-slate-100 text-slate-700",
    features: ["Up to 20 clients", "Basic AI tools", "Email support"],
  },
  pro: {
    label: "Pro",
    color: "bg-violet-100 text-violet-700",
    features: ["Unlimited clients", "Full AI suite", "Priority support", "Lender Match"],
  },
  elite: {
    label: "Elite",
    color: "bg-amber-100 text-amber-700",
    features: ["Everything in Pro", "White-label widget", "Dedicated account manager", "API access"],
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg)]/60">
        <h2 className="font-semibold text-sm text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus:border-[var(--primary)] outline-none transition";

export default function ProfilePage() {
  const { email, fullName, id, signOut } = useUser();

  // Profile fields
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Notification toggles (local only for now)
  const [notifs, setNotifs] = useState({ email: true, newLead: true, caseUpdate: false });

  useEffect(() => {
    if (!id) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
        setProfileLoading(false);
      });
  }, [id]);

  const saveProfile = async () => {
    if (!id) return;
    setProfileSaving(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        website_slug: profile.website_slug,
      })
      .eq("id", id);
    setProfileSaving(false);
    setProfileMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Profile saved." });
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordMsg({ ok: false, text: error.message });
    } else {
      setPasswordMsg({ ok: true, text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  const tier = (profile.subscription_tier ?? "starter") as SubscriptionTier;
  const tierMeta = TIER_META[tier];
  const initials = (fullName ?? email ?? "AD")
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and preferences" />

      <div className="p-6 max-w-2xl space-y-6">

        {/* Profile header card */}
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white text-xl font-bold flex items-center justify-center shadow-lg shadow-[var(--primary)]/30 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-lg truncate">{fullName ?? profile.full_name ?? "Adviser"}</div>
            <div className="text-sm text-[var(--text-secondary)] truncate">{email ?? "—"}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tierMeta.color}`}>
                {tierMeta.label}
              </span>
              {profile.role && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">
                  {profile.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit profile */}
        <Section title="Edit Profile">
          {profileLoading ? (
            <div className="text-sm text-[var(--text-secondary)]">Loading…</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name">
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      className={`${inputCls} pl-9`}
                      value={profile.full_name ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="Jane Smith"
                    />
                  </div>
                </Field>
                <Field label="Phone">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      className={`${inputCls} pl-9`}
                      value={profile.phone ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+44 7700 900000"
                    />
                  </div>
                </Field>
              </div>

              <Field label="Bio">
                <textarea
                  className={`${inputCls} resize-none h-20`}
                  value={profile.bio ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="A short bio shown to clients on your widget…"
                />
              </Field>

              <Field label="Widget URL Slug">
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    className={`${inputCls} pl-9`}
                    value={profile.website_slug ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, website_slug: e.target.value }))}
                    placeholder="jane-smith"
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Your embed widget will be available at <span className="font-mono">mortgagegpt.io/w/{profile.website_slug || "your-slug"}</span>
                </p>
              </Field>

              {profileMsg && (
                <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${profileMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  <CheckCircle2 size={14} />
                  {profileMsg.text}
                </div>
              )}

              <button
                onClick={saveProfile}
                disabled={profileSaving}
                className="flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50 transition"
              >
                <Save size={14} />
                {profileSaving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          )}
        </Section>

        {/* Change password */}
        <Section title="Change Password">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="New Password">
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="password"
                    className={`${inputCls} pl-9`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                </div>
              </Field>
              <Field label="Confirm New Password">
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="password"
                    className={`${inputCls} pl-9`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </Field>
            </div>

            {passwordMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${passwordMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                <CheckCircle2 size={14} />
                {passwordMsg.text}
              </div>
            )}

            <button
              onClick={savePassword}
              disabled={passwordSaving || !newPassword}
              className="flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50 transition"
            >
              <ShieldCheck size={14} />
              {passwordSaving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <div className="space-y-4">
            {[
              { key: "email", label: "Email digests", desc: "Weekly summary of your pipeline and tasks" },
              { key: "newLead", label: "New lead alerts", desc: "Notify me when a new lead comes through the widget" },
              { key: "caseUpdate", label: "Case updates", desc: "Notify me when a lender updates a case status" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Bell size={13} className="text-[var(--text-secondary)]" />
                    {label}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</div>
                </div>
                <button
                  onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifs[key as keyof typeof notifs] ? "bg-[var(--primary)]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifs[key as keyof typeof notifs] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Subscription */}
        <Section title="Subscription Plan">
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(TIER_META) as SubscriptionTier[]).map((t) => {
              const meta = TIER_META[t];
              const active = t === tier;
              return (
                <div
                  key={t}
                  className={`rounded-xl border-2 p-4 transition ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary-light)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                    {active && <CheckCircle2 size={14} className="text-[var(--primary)]" />}
                  </div>
                  <ul className="space-y-1 mt-2">
                    {meta.features.map((f) => (
                      <li key={f} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                        <span className="text-[var(--primary)] mt-0.5">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {!active && (
                    <button className="mt-3 w-full text-xs font-semibold rounded-lg border border-[var(--primary)] text-[var(--primary)] py-1.5 hover:bg-[var(--primary-light)] transition">
                      Upgrade
                    </button>
                  )}
                  {active && (
                    <div className="mt-3 text-xs font-semibold text-[var(--primary)] text-center">
                      Current plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Sign out */}
        <Section title="Account">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Sign out</div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                You will be returned to the login screen.
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-full bg-red-50 text-red-700 px-5 py-2.5 text-sm font-semibold hover:bg-red-100 transition"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </Section>

      </div>
    </>
  );
}
