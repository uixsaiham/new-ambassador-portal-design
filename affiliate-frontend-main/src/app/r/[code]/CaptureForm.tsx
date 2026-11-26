"use client";

import AppSelect from "@/components/AppSelect";
import AppIcon from "@/components/AppIcon";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

const COURSES = ["Business", "Computing / IT", "Education", "Engineering", "Health & Social Care", "Law", "Nursing", "Psychology", "Other"];
const CAMPUSES = ["Birmingham", "Bolton", "Cardiff", "Leeds", "London", "Manchester", "Newcastle", "Nottingham", "Sheffield", "Swansea", "Other"];
const ENGLISH = ["1 to 3", "3 to 6", "7", "8", "9", "10"];
const FINANCE = ["Yes", "No"];
const RESIDENTIAL = ["British", "EU / Pre-settled", "EU / Settled", "Humanitarian Protection", "ILR", "Leave to Remain", "Refugee", "Ukraine Permission Extension", "Other"];
const QUALIFICATION = ["GCSE", "A-levels", "Level 2/3", "Secondary", "12th Class from back home", "BA/BSc Degree", "No Qualification", "Others"];

interface FormState {
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  course_interested: string;
  preferred_campus: string;
  english_confidence: string;
  student_finance: string;
  residential_status: string;
  last_qualification: string;
}

const EMPTY: FormState = {
  lead_name: "",
  lead_email: "",
  lead_phone: "",
  course_interested: "",
  preferred_campus: "",
  english_confidence: "",
  student_finance: "",
  residential_status: "",
  last_qualification: "",
};

export default function CaptureForm({ code, invalid, defaultCounsellorId = "" }: { code: string; invalid: boolean; defaultCounsellorId?: string }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Counsellor dropdown — defaults to the referring ambassador's profile counsellor
  // (passed from the server; empty if their profile has none), editable by the visitor.
  const [counsellors, setCounsellors] = useState<{ id: string; name: string }[]>([]);
  const [counsellorId, setCounsellorId] = useState(defaultCounsellorId || "");
  useEffect(() => {
    api.get<{ id: string; name: string }[]>("/auth/counsellors")
      .then(setCounsellors)
      .catch(() => setCounsellors([]));
  }, []);

  if (invalid) {
    return (
      <div className="admin-card !p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto mb-4 text-2xl">
          <AppIcon className="fa-solid fa-link-slash"></AppIcon>
        </div>
        <h2 className="text-lg font-bold text-white mb-1">This referral link isn&apos;t valid</h2>
        <p className="text-slate-400 text-sm">
          The link may be mistyped or expired. Please ask your friend for their current BHE Uni link.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="admin-card !p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
          <AppIcon className="fa-solid fa-check"></AppIcon>
        </div>
        <h2 className="text-xl font-black text-white mb-2">You&apos;re all set! 🎉</h2>
        <p className="text-slate-400 text-sm">
          Thanks — your details are with us. A BHE Uni admissions advisor will be in touch shortly to
          guide you on your UK study journey.
        </p>
      </div>
    );
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.lead_name.trim()) return setError("Please enter your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.lead_email)) return setError("Please enter a valid email.");
    if (!form.lead_phone.trim()) return setError("Please enter your phone number.");
    if (!consent) return setError("Please tick the consent box so we can contact you.");

    setSubmitting(true);
    try {
      const chosenCounsellor = counsellors.find((c) => c.id === counsellorId);
      await api.post(`/public/referral/${encodeURIComponent(code)}/capture`, {
        ...form,
        counsellor_id: counsellorId || null,
        counsellor_name: chosenCounsellor ? chosenCounsellor.name : null,
        lead_consent: consent,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full bg-slate-800/60 border border-white/10 rounded-[8px] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-300 mb-1.5";

  // Submit stays disabled until every mandatory field + the consent box are done.
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.lead_email);
  const canSubmit = !!form.lead_name.trim() && emailOk && !!form.lead_phone.trim() && consent;

  return (
    <form onSubmit={submit} className="admin-card !p-6 space-y-4">
      <div>
        <label className={labelCls}>Full name *</label>
        <input className={inputCls} value={form.lead_name} onChange={set("lead_name")} placeholder="e.g. John Smith" autoComplete="name" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Email *</label>
          <input className={inputCls} type="email" value={form.lead_email} onChange={set("lead_email")} placeholder="john@email.com" autoComplete="email" />
        </div>
        <div>
          <label className={labelCls}>Phone number *</label>
          <input className={inputCls} type="tel" value={form.lead_phone} onChange={set("lead_phone")} placeholder="01712 345678" autoComplete="tel" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Which course are you interested in?" value={form.course_interested} onChange={set("course_interested")} options={COURSES} cls={inputCls} labelCls={labelCls} />
        <Select label="Preferred campus in England" value={form.preferred_campus} onChange={set("preferred_campus")} options={CAMPUSES} cls={inputCls} labelCls={labelCls} />
        <Select label="Confidence in English (1–10)" value={form.english_confidence} onChange={set("english_confidence")} options={ENGLISH} cls={inputCls} labelCls={labelCls} />
        <Select label="Received student finance before?" value={form.student_finance} onChange={set("student_finance")} options={FINANCE} cls={inputCls} labelCls={labelCls} />
        <Select label="Residential status in the UK" value={form.residential_status} onChange={set("residential_status")} options={RESIDENTIAL} cls={inputCls} labelCls={labelCls} />
        <Select label="Last qualification" value={form.last_qualification} onChange={set("last_qualification")} options={QUALIFICATION} cls={inputCls} labelCls={labelCls} />
      </div>

      <div>
        <label className={labelCls}>Counsellor</label>
        <AppSelect className={inputCls} value={counsellorId} onChange={(e) => setCounsellorId(e.target.value)}>
          <option value="">None</option>
          {counsellors.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </AppSelect>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-orange-500"
        />
        <span className="text-xs text-slate-400 leading-relaxed">
          <span className="text-red-500 font-bold">*</span>{" "}
          I consent to BHE Uni contacting me about UK university applications and to my details being
          processed in line with the{" "}
          <a href="/privacy-policy" target="_blank" className="text-orange-400 font-semibold hover:underline">Privacy Policy</a>.
        </span>
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-[8px] py-3 text-sm transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> Submitting...</>
        ) : (
          <>Submit my details <AppIcon className="fa-solid fa-arrow-right"></AppIcon></>
        )}
      </button>
    </form>
  );
}

function Select({
  label, value, onChange, options, cls, labelCls,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  cls: string;
  labelCls: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <AppSelect className={cls} value={value} onChange={onChange}>
        <option value="">Select an option</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </AppSelect>
    </div>
  );
}
