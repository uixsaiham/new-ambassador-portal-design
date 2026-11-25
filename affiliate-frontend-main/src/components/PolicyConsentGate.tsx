"use client";

import AppSelect from "@/components/AppSelect";
import AppIcon from "@/components/AppIcon";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isValidPhone } from "@/lib/phone";

// Blocking onboarding step. Rendered in place of the whole dashboard while
// user.policy.needs_acceptance is true. There is deliberately NO close, decline,
// Escape or backdrop-dismiss: the only way past it is to complete it. Acceptance
// is recorded server-side (version, content hash, IP, user-agent) via
// POST /auth/accept-policy, then refreshUser() re-fetches /auth/me; once the
// backend reports needs_acceptance=false the dashboard renders.
//
// PRESENTATION: deliberately compact, and the documents are LINKED rather than
// inlined. An earlier version rendered both full documents in a tabbed scrolling
// panel; the team found that far too heavy for a first-run experience. Linking
// matches the pattern already used at every other consent point in the product
// (the email signup form, the refer-a-lead form, the public capture form), and
// the server still picks the versions and writes the hashed, IP-stamped consent
// rows, so the admin proof export is unaffected.
//
// SINGLE STEP: phone and counsellor are collected here too, so a Google sign-up
// sees ONE popup rather than three (this gate, a phone modal, then the promo
// poster). They render only when the account has no phone yet, so an ambassador
// re-gated by a version bump sees the consent line alone.
//
// This MUST stay mounted from the dashboard LAYOUT, not a page. The old phone
// modal was page-level and keyed off `!profile.phone`, so moving consent there
// would silently stop version re-gating for every existing ambassador (they all
// have numbers) and turn an unescapable gate into one you can walk past by
// changing route.

const TERMS_HREF = "/rewards-terms-and-conditions";
const PRIVACY_HREF = "/privacy-policy";

export default function PolicyConsentGate() {
  const { user, refreshUser } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ask for phone + counsellor only when the account has none (i.e. a Google
  // sign-up). An ambassador re-gated by a version bump already has a number.
  const needsDetails = !user?.phone;
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [counsellors, setCounsellors] = useState<{ id: string; name: string }[]>([]);
  const [counsellorId, setCounsellorId] = useState("");

  useEffect(() => {
    if (!needsDetails) return;
    api
      .get<{ id: string; name: string }[]>("/auth/counsellors")
      .then(setCounsellors)
      .catch(() => setCounsellors([])); // best-effort; the select simply hides
  }, [needsDetails]);

  const canSubmit = accepted && (!needsDetails || isValidPhone(phone)) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (needsDetails && !isValidPhone(phone)) {
      setPhoneError("Please enter a valid phone number (not an email address).");
      return;
    }
    setPhoneError("");
    setSubmitting(true);
    setError(null);
    try {
      // Save the profile details FIRST, so a failure cannot leave the account
      // consented-but-incomplete. NOTE: PUT /auth/settings returns a UserResponse
      // whose `policy` is null, so its result is deliberately NOT pushed into auth
      // state; refreshUser() below is the single source of truth for the gate.
      if (needsDetails) {
        const chosen = counsellors.find((c) => c.id === counsellorId);
        await api.put("/auth/settings", {
          phone: phone.trim(),
          counsellor_id: chosen ? chosen.id : null,
          counsellor_name: chosen ? chosen.name : null,
        });
      }
      await api.post("/auth/accept-policy");
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We could not save your details. Please try again."
      );
      setSubmitting(false);
    }
  };

  const linkCls = "font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2";

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-gate-title"
    >
      <div className="bg-white text-slate-900 w-full max-w-md rounded-[8px] shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-[8px] flex items-center justify-center">
              <img src="/logo.png" alt="BHE UNI Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-orange-500 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 px-3 py-1 rounded-full">
              Action Required
            </span>
          </div>

          <div>
            <h1 id="policy-gate-title" className="text-xl font-bold tracking-tight">
              {needsDetails ? "Finish setting up your account" : "One quick confirmation"}
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              {needsDetails
                ? "Just one step and you're in. You only need to do this once."
                : "Please confirm you accept our updated documents to continue."}
            </p>
          </div>

          {needsDetails && (
            <div className="space-y-3">
              <div>
                <label htmlFor="gate-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone number <span className="text-orange-500">*</span>
                </label>
                <input
                  id="gate-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError("");
                  }}
                  placeholder="07123456789"
                  className="w-full rounded-[8px] border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                />
                {phoneError ? (
                  <span className="mt-1 block text-xs text-red-600">{phoneError}</span>
                ) : (
                  <span className="mt-1 block text-xs text-slate-500">
                    We use this to reach you about referrals and rewards.
                  </span>
                )}
              </div>

              {counsellors.length > 0 && (
                <div>
                  <label htmlFor="gate-counsellor" className="block text-xs font-semibold text-slate-700 mb-1">
                    Your BHE Uni counsellor{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <AppSelect
                    id="gate-counsellor"
                    value={counsellorId}
                    onChange={(e) => setCounsellorId(e.target.value)}
                    className="w-full rounded-[8px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  >
                    <option value="">None of the above</option>
                    {counsellors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </AppSelect>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 flex items-start gap-2">
              <AppIcon className="fa-solid fa-triangle-exclamation mt-0.5"></AppIcon> {error}
            </p>
          )}

          <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
            />
            <span className="text-sm text-slate-700 leading-relaxed">
              {/* Mandatory marker, matching the signup form's consent line. */}
              <span className="text-red-500 font-bold">*</span> I have read and accept the{" "}
              <a href={TERMS_HREF} target="_blank" rel="noopener noreferrer" className={linkCls}>
                Rewards Terms &amp; Conditions
              </a>{" "}
              and the{" "}
              <a href={PRIVACY_HREF} target="_blank" rel="noopener noreferrer" className={linkCls}>
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-[8px] transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> Saving…
              </>
            ) : (
              <>
                <AppIcon className="fa-solid fa-check"></AppIcon>{" "}
                {needsDetails ? "Save and continue" : "Accept and continue"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
