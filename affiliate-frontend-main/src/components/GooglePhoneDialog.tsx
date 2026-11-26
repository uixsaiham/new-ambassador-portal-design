"use client";

import { useEffect, useRef, useState } from "react";
import PhoneNumberInput from "./PhoneNumberInput";
import VerificationCodeInput from "./VerificationCodeInput";
import AppIcon from "./AppIcon";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import "./google-phone-dialog.css";

export interface GoogleSignupIdentity { email: string; full_name?: string; verification_token: string }

export default function GooglePhoneDialog({ identity, testMode, onClose }: { identity: GoogleSignupIdentity; testMode: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef(false);
  const sessionToken = useRef<string | null>(null);
  const { signInWithToken } = useAuth();
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const phoneReady = phone.startsWith("+880") ? /^\+8801[3-9]\d{8}$/.test(phone) : /^\+[1-9]\d{7,14}$/.test(phone);

  useEffect(() => { const modal = dialog.current; modal?.showModal(); return () => modal?.close(); }, []);
  useEffect(() => {
    if (verified) successHeading.current?.focus();
    else if (!busy) (sentTo ? codeInput : phoneInput).current?.focus();
  }, [sentTo, busy, verified]);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);

  const openPortal = async (token: string) => {
    setError(""); setBusy(true);
    try { await signInWithToken(token); }
    catch (error) {
      setError(error instanceof Error ? error.message : "Your number is verified, but we couldn’t open the portal. Please try again.");
      setBusy(false); inFlight.current = false;
    }
  };

  const sendCode = async () => {
    if (inFlight.current || !phoneReady || !accepted) return;
    inFlight.current = true;
    setError(""); setBusy(true); setSending(true);
    try {
      const result = await api.post<{phone:string}>("/auth/google/phone/send", { verification_token:identity.verification_token, phone });
      setSentTo(result.phone); setCode(""); setCooldown(60);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not send the SMS code."); }
    finally { setBusy(false); setSending(false); inFlight.current = false; }
  };

  const verifyCode = async (digits: string) => {
    if (inFlight.current || !sentTo || !accepted || digits.length !== 6) return;
    inFlight.current = true;
    setError(""); setBusy(true);
    try {
      const [result] = await Promise.all([
        api.post<{access_token:string}>("/auth/google/complete", { verification_token:identity.verification_token, otp:digits, policy_accepted:accepted }),
        new Promise(resolve => setTimeout(resolve, 450)),
      ]);
      sessionToken.current = result.access_token;
      setVerified(true);
      await new Promise(resolve => setTimeout(resolve, 900));
      await openPortal(result.access_token);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not verify your code.");
      setBusy(false); inFlight.current = false;
    }
  };

  const updateCode = (digits: string) => {
    setCode(digits); setError("");
    if (digits.length === 6) void verifyCode(digits);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sentTo) await sendCode();
    else await verifyCode(code);
  };

  return <dialog ref={dialog} className={`google-phone-dialog${verified ? " google-phone-success" : sentTo ? " google-phone-verification" : ""}`} aria-labelledby="google-phone-title" aria-describedby="google-phone-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    {verified ? <div className="google-success-content">
      <span className="google-success-check" aria-hidden="true"><AppIcon name="check" /></span>
      <h2 ref={successHeading} tabIndex={-1} id="google-phone-title">You’re ready to go.</h2>
      <p id="google-phone-description" role="status">Your number is verified. Taking you to your ambassador portal…</p>
      {error ? <><p className="google-phone-error" role="alert">{error}</p><button type="button" className="google-phone-submit" disabled={busy} onClick={() => { if (sessionToken.current) void openPortal(sessionToken.current); }}>Open portal <AppIcon name="arrow-right" /></button></> : <div className="google-success-progress" role="progressbar" aria-label="Opening your ambassador portal"><span /></div>}
    </div> : <>
      <button type="button" className="google-phone-close" aria-label="Cancel Google signup" onClick={onClose} disabled={busy}><AppIcon name="xmark" /></button>
      <h2 id="google-phone-title">{sentTo ? "Check your phone." : "Your portal is almost ready."}</h2>
      <p id="google-phone-description">{sentTo ? <>We sent a 6-digit code to <strong>{sentTo}.</strong></> : "Google has taken care of your details. Just verify your mobile number to get started."}</p>
      {!sentTo && <div className="google-phone-identity"><span aria-hidden="true">{(identity.full_name || identity.email).charAt(0).toUpperCase()}</span><div><strong>{identity.full_name || "Google account"}</strong><small>{identity.email}</small></div><b><AppIcon name="circle-check" style={{ fontSize: 13 }} />Google verified</b></div>}
      <form onSubmit={submit} aria-busy={busy}>
        {error && <p className="google-phone-error" role="alert">{error}</p>}
        <div key={sentTo ? "code" : "phone"} className="google-phone-step">
          {!sentTo ? <><label htmlFor="google-phone">Mobile number</label><PhoneNumberInput inputRef={phoneInput} id="google-phone" required value={phone} onChange={setPhone} aria-describedby="google-phone-hint" disabled={busy}/><small id="google-phone-hint" className="google-phone-hint">Enter your number without the leading zero.</small></> : <>
            <VerificationCodeInput id="google-phone-code" inputRef={codeInput} value={code} onChange={updateCode} disabled={busy} />
            <div className="google-phone-resend"><button type="button" disabled={busy || cooldown > 0} onClick={sendCode}><AppIcon name="clock" />{cooldown ? `Resend in ${cooldown}s` : "Resend code"}</button><button type="button" disabled={busy} onClick={() => { setSentTo(""); setCode(""); setError(""); }}><AppIcon name="pen-to-square" />Change number</button></div>
          </>}
          {testMode && <p className="google-phone-test"><AppIcon name="circle-info"/> Demo mode <span>·</span> Use <strong>123456</strong> to try verification.</p>}
        </div>
        {sentTo ? <p className="google-phone-accepted"><AppIcon name="circle-check" /> Rewards Terms &amp; Privacy Policy accepted</p> : <label className="google-phone-consent"><input type="checkbox" required checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy}/><span>I agree to the <a href="/rewards-terms-and-conditions" target="_blank" rel="noopener noreferrer">Rewards Terms</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span></label>}
        <button type="submit" className="google-phone-submit" disabled={busy || !accepted || (!sentTo ? !phoneReady || cooldown > 0 : code.length !== 6)}>{busy ? <span className="google-phone-spinner" aria-hidden="true"/> : null}<span aria-live="polite">{busy ? sending ? "Sending your code…" : "Verifying…" : sentTo ? "Verify & enter portal" : "Send verification code"}</span>{!busy && <AppIcon name="arrow-right" style={{ fontSize: 16 }} />}</button>
        {!sentTo && <p className="google-phone-footnote">We’ll text you a code to confirm this number belongs to you.</p>}
      </form>
    </>}
  </dialog>;
}
