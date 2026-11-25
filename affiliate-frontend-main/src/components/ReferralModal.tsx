"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { isValidPhone } from "@/lib/phone";
import { useAuth } from "@/context/AuthContext";
import { usePortalLanguage } from "@/context/PortalLanguage";
import AppIcon from "./AppIcon";
import AppSelect from "./AppSelect";
import "./referral-modal.css";

export default function ReferralModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const { user } = useAuth();
  const { language } = usePortalLanguage();
  const bn = language === "bn";
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [consent, setConsent] = useState(false);
  const [counsellor, setCounsellor] = useState("");
  const [options, setOptions] = useState<{id:string;name:string}[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    setError("");
    setCounsellor(user?.counsellor_id || "");
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    api.get<{id:string;name:string}[]>("/auth/counsellors").then(setOptions).catch(() => setError("Counsellors could not load. You can still submit without assigning one."));
    return () => { document.body.style.overflow = overflow; };
  }, [open, user?.counsellor_id]);
  const ready = name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && phone.trim() && consent;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !ready) return;
    if (!isValidPhone(phone)) { setError("Please enter a valid mobile number."); return; }
    setBusy(true); setError("");
    try {
      await api.post("/ambassador/referrals", { lead_name:name.trim(),lead_email:email.trim(),lead_phone:phone.trim(),education_interest:course.trim() || undefined,referrer_consent:consent,counsellor_id:counsellor || null,counsellor_name:options.find(option => option.id === counsellor)?.name || null });
    } catch (error) { setError(error instanceof Error ? error.message : "Could not submit this referral. Please try again."); setBusy(false); return; }
    setName("");setEmail("");setPhone("");setCourse("");setConsent(false);setBusy(false);
    onClose(); await onSaved();
  };
  return <dialog ref={dialog} className="refer-modal" aria-labelledby="refer-modal-title" onClose={onClose} onCancel={event => { if (busy) event.preventDefault(); }} onClick={event => { if(event.target === event.currentTarget && !busy) onClose(); }}>
    <header className="refer-modal-header"><span className="refer-modal-emblem"><AppIcon name="user-plus"/></span><div><h2 id="refer-modal-title">{bn ? "একটি নতুন সম্ভাবনার পরিচয় দিন" : "A connection worth making."}</h2><p>{bn ? "একজন বন্ধুর নতুন যাত্রা শুরু হোক আপনার হাত ধরে।" : "Introduce a friend. Help their next chapter begin."}</p></div><button type="button" aria-label="Close referral form" disabled={busy} onClick={onClose}><AppIcon name="xmark"/></button></header>
    <form onSubmit={submit}>
      {error && <p className="refer-modal-error" role="alert">{error}</p>}
      <fieldset disabled={busy} className="refer-modal-fields">
        <label className="refer-name" htmlFor="refer-full-name">{bn ? "পুরো নাম" : "Full name"}<span>*</span><input id="refer-full-name" autoFocus required autoComplete="name" placeholder="Nusrat Jahan" value={name} onChange={e => setName(e.target.value)}/></label>
        <label htmlFor="refer-email">{bn ? "ইমেইল" : "Email address"}<span>*</span><input id="refer-email" type="email" required autoComplete="email" placeholder="nusrat@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label>
        <label htmlFor="refer-phone">{bn ? "মোবাইল নম্বর" : "Phone number"}<span>*</span><input id="refer-phone" type="tel" required autoComplete="tel" placeholder="01712 345678" value={phone} onChange={e => setPhone(e.target.value)}/></label>
        <label htmlFor="refer-course">{bn ? "কোর্স / শিক্ষার আগ্রহ" : "Course / education interest"}<input id="refer-course" placeholder="e.g. BBA, BSc Computer Science" value={course} onChange={e => setCourse(e.target.value)}/></label>
        <label htmlFor="refer-counsellor">{bn ? "কাউন্সেলর" : "Counsellor"}<AppSelect id="refer-counsellor" value={counsellor} onChange={e => setCounsellor(e.target.value)}><option value="">None of the above</option>{options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</AppSelect></label>
      </fieldset>
      <label className="refer-modal-consent"><input type="checkbox" required disabled={busy} checked={consent} onChange={e => setConsent(e.target.checked)}/><span>I confirm that I have obtained the referred individual’s explicit consent to share their personal information with BHE Uni for educational guidance, university admissions support, and related communications. I agree to the <a href="/rewards-terms-and-conditions" target="_blank" rel="noreferrer">Rewards Terms and Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>
      <footer className="refer-modal-footer"><span><AppIcon name="shield-halved"/>{bn ? "আপনার পরিচয়। তাদের পরবর্তী পদক্ষেপ।" : "Your introduction. Their next step."}</span><div><button type="button" className="refer-cancel" disabled={busy} onClick={onClose}>{bn ? "ফিরে যান" : "Cancel"}</button><button type="submit" className="refer-submit" disabled={busy || !ready}>{busy ? <><AppIcon name="spinner" className="animate-spin"/>Submitting…</> : <>{bn ? "রেফারেল জমা দিন" : "Submit referral"}<AppIcon name="arrow-up-right-from-square"/></>}</button></div></footer>
    </form>
  </dialog>;
}
