"use client";

import { useEffect, useRef, useState } from "react";
import AppIcon from "./AppIcon";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import "./google-phone-dialog.css";

export interface GoogleSignupIdentity { email: string; full_name?: string; verification_token: string }

export default function GooglePhoneDialog({ identity, testMode, onClose }: { identity: GoogleSignupIdentity; testMode: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const { signInWithToken } = useAuth();
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const phoneReady = /^[+\d\s()-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 8 && phone.replace(/\D/g, "").length <= 15;
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => { const modal = dialog.current; modal?.showModal(); return () => modal?.close(); }, []);
  useEffect(() => { (sentTo ? codeInput : phoneInput).current?.focus(); }, [sentTo]);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);

  const sendCode = async () => {
    setError(""); setBusy(true);
    try {
      const result = await api.post<{phone:string}>("/auth/google/phone/send", { verification_token:identity.verification_token, phone });
      setSentTo(result.phone); setCode(""); setCooldown(60);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not send the SMS code."); }
    finally { setBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sentTo) { await sendCode(); return; }
    setError(""); setBusy(true);
    try {
      const result = await api.post<{access_token:string}>("/auth/google/complete", { verification_token:identity.verification_token, otp:code, policy_accepted:accepted });
      setVerified(true);
      await new Promise(resolve => setTimeout(resolve, 450));
      await signInWithToken(result.access_token);
    } catch (error) { setVerified(false); setError(error instanceof Error ? error.message : "Could not verify your code."); setBusy(false); }
  };

  return <dialog ref={dialog} className={`google-phone-dialog${verified ? " is-verified" : ""}`} aria-labelledby="google-phone-title" aria-describedby="google-phone-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <button type="button" className="google-phone-close" aria-label="Cancel Google signup" onClick={onClose} disabled={busy}>×</button>
    <h2 id="google-phone-title">{verified ? "You’re ready to go." : sentTo ? "Check your phone." : "Your portal is almost ready."}</h2>
    <p id="google-phone-description">{verified ? "Your number is verified. Taking you to your ambassador portal…" : sentTo ? `Enter the 6-digit code sent to ${sentTo}.` : "Google has taken care of your details. Just verify your mobile number to get started."}</p>
    <div className="google-phone-identity"><span aria-hidden="true">{(identity.full_name || identity.email).charAt(0).toUpperCase()}</span><div><strong>{identity.full_name || "Google account"}</strong><small>{identity.email}</small></div><b><AppIcon name="circle-check" aria-hidden="true" style={{ fontSize: 13 }} />Google verified</b></div>
    <form onSubmit={submit} aria-busy={busy}>
      <div key={sentTo ? "code" : "phone"} className="google-phone-step">
      {error && <p className="google-phone-error" role="alert">{error}</p>}
      {!sentTo ? <><label htmlFor="google-phone">Mobile number</label><input ref={phoneInput} id="google-phone" type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="01712 345678" inputMode="tel" aria-describedby="google-phone-hint" disabled={busy}/><small id="google-phone-hint" className="google-phone-hint">Bangladesh (+880), or include your country code.</small></> : <><label htmlFor="google-phone-code">Verification code</label><input ref={codeInput} id="google-phone-code" className="google-phone-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g,""))} placeholder="000000" disabled={busy}/><div className="google-phone-resend"><button type="button" disabled={busy || cooldown > 0} onClick={sendCode}>{cooldown ? `Resend in ${cooldown}s` : "Resend code"}</button><button type="button" disabled={busy} onClick={() => { setSentTo(""); setCode(""); setError(""); }}>Change number</button></div></>}
      {testMode && <p className="google-phone-test"><span aria-hidden="true">◉</span> Demo mode <span>·</span> Use <strong>123456</strong> to try verification.</p>}
      </div>
      {sentTo ? <p className="google-phone-accepted"><span aria-hidden="true">✓</span> Rewards Terms & Privacy Policy accepted</p> : <label className="google-phone-consent"><input type="checkbox" required checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy}/><span>I agree to the <a href="/rewards-terms-and-conditions" target="_blank" rel="noopener noreferrer">Rewards Terms</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span></label>}
      <button type="submit" className="google-phone-submit" disabled={busy || !accepted || (!sentTo ? !phoneReady || cooldown > 0 : code.length !== 6)}>{busy && !verified && <span className="google-phone-spinner" aria-hidden="true"/>}<span aria-live="polite">{verified ? "Opening your portal…" : busy ? sentTo ? "Verifying your number…" : "Sending your code…" : sentTo ? "Verify & enter portal" : "Send verification code"}</span>{!busy && <AppIcon name="arrow-right" aria-hidden="true" style={{ fontSize: 16 }} />}</button>
      <p className="google-phone-footnote">{sentTo ? "Your code expires in 10 minutes." : "We’ll text you a code to confirm this number belongs to you."}</p>
    </form>
  </dialog>;
}
