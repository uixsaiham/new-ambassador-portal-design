"use client";

import GooglePhoneDialog, { type GoogleSignupIdentity } from "./GooglePhoneDialog";
import GoogleProcessingDialog from "./GoogleProcessingDialog";
import PhoneNumberInput from "./PhoneNumberInput";
import AppIcon from "@/components/AppIcon";
import Link from "next/link";
import "./auth-portal.css";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { api } from "@/lib/api";

type Mode = "login" | "register" | "verify" | "profile" | "forgot" | "reset";

export default function AuthPortal({ initialMode = "login" }: { initialMode?: Mode }) {
  const { login, loginWithGoogle, signInWithToken } = useAuth();
  const router = useRouter();

  const [googleProcessing, setGoogleProcessing] = useState(false);
  const [googleSignup, setGoogleSignup] = useState<GoogleSignupIdentity | null>(null);
  const [signupTestMode, setSignupTestMode] = useState(false);
  useEffect(() => { api.get<{test_mode: boolean}>("/auth/signup-mode").then(result => setSignupTestMode(result.test_mode)).catch(() => {}); }, []);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Counsellor the ambassador chooses to route their leads to. "" = None of the above.
  const [counsellors, setCounsellors] = useState<{ id: string; name: string }[]>([]);
  const [counsellorId, setCounsellorId] = useState("");
  const [counsellorOpen, setCounsellorOpen] = useState(false);
  const [counsellorSearch, setCounsellorSearch] = useState("");
  const counsellorBox = useRef<HTMLDivElement>(null);
  const counsellorTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!counsellorOpen) return;
    const close = (event: PointerEvent) => { if (!counsellorBox.current?.contains(event.target as Node)) setCounsellorOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [counsellorOpen]);
  useEffect(() => {
    api.get<{ id: string; name: string }[]>("/auth/counsellors")
      .then(setCounsellors)
      .catch(() => setCounsellors([]));
  }, []);

  // Email registration and password reset both use a 6-digit code.
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds(resendSeconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  // The Google button takes a pixel width (it ignores %), so measure the card
  // and pass a fitting width, otherwise the fixed 376px overflows narrow phones.
  const googleBoxRef = useRef<HTMLDivElement>(null);
  const [googleWidth, setGoogleWidth] = useState(320);
  useEffect(() => {
    const el = googleBoxRef.current;
    if (!el) return;
    const update = () => setGoogleWidth(Math.min(400, Math.max(240, Math.floor(el.offsetWidth))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Bounced here after a session ended (expired token or password change).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("expired")) {
      setNotice("Your session has ended. Please log in again.");
    }
  }, []);

  const resetMessages = () => { setError(null); setSuccess(null); setNotice(null); };
  // login / register live at their own URLs (/login, /signup); forgot & reset are
  // sub-steps of sign-in and stay on the current path.
  const goto = (m: Mode) => {
    resetMessages();
    setOtp(["", "", "", "", "", ""]);
    setVerificationToken(null);
    setMode(m);
    if (m === "login") router.push(`/login${window.location.search}`);
    else if (m === "register") router.push(`/signup${window.location.search}`);
  };

  const hasGoogleClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Register: keep the submit button disabled until every mandatory field + the
  // consent box are complete (counsellor is optional). Mirrors the disabled-until-
  // valid behaviour on the refer-a-lead and public capture forms.
  const registerEmailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const canRegister =
    !!firstName.trim() && !!phone.trim() &&
    registerEmailValid && password.length >= 8 && policyAccepted;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await api.post("/auth/register/initiate", {
        email, full_name: firstName.trim(),
      });
      setVerificationToken(null);
      setOtp(["", "", "", "", "", ""]);
      setResendSeconds(60);
      setMode("verify");
      setSuccess(signupTestMode ? "Test code ready. Enter 123456 to continue." : "Verification code sent from no-reply@bheuni.io. Please check your inbox or spam folder.");
    } catch (err: any) {
      setError(err.message || "Could not send your verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (otp.join("").length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      let proof = verificationToken;
      if (!proof) {
        const result = await api.post<{ verification_token: string }>("/auth/register/verify", { email, otp: otp.join("") });
        proof = result.verification_token;
        setVerificationToken(proof);
      }
      setMode("profile");
      setSuccess(null);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!verificationToken) { setMode("register"); setError("Please verify your email again."); return; }
    if (!canRegister) { setError("Complete all required fields, create a password of at least 8 characters, and accept the programme terms."); return; }
    setLoading(true);
    try {
      const chosen = counsellors.find((c) => String(c.id) === counsellorId);
      await api.post("/auth/register/simple", {
        verification_token: verificationToken,
        first_name: firstName.trim().split(/\s+/)[0],
        last_name: firstName.trim().split(/\s+/).slice(1).join(" "),
        email: email.trim(),
        phone,
        password,
        counsellor_id: chosen ? chosen.id : null,
        counsellor_name: chosen ? chosen.name : null,
        policy_accepted: policyAccepted,
      });
      // Account created, sign straight in (routes to the dashboard).
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Could not create your account. Please try again.");
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setResendSeconds(60);
      setSuccess(signupTestMode ? "Test mode: if this account exists, use 123456 to reset your password. No email is sent." : `If ${email} is registered, we've sent a 6-digit reset code. Can't find it? Please check your spam/junk folder.`);
      setOtp(["", "", "", "", "", ""]);
      setPassword("");
      setMode("reset");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const otpCode = otp.join("");
    if (otpCode.length < 6) { setError("Please enter the complete 6-digit code."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp: otpCode, password });
      // Password changed, log in with the new one.
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid or expired code. Please try again.");
      setLoading(false);
    }
  };

  // ── Copy per mode ─────────────────────────────────────────────────────────
  const stepConfig: Record<Mode, { title: string; subtitle: string }> = {
    login: {
      title: "Welcome back.",
      subtitle: "Your connections. Your impact. Your rewards.",
    },
    register: {
      title: "Good things start here.",
      subtitle: "Join a community opening doors for their friends.",
    },
    profile: {
      title: "Good things start here.",
      subtitle: "Join a community opening doors for their friends.",
    },
    verify: {
      title: "Good things start here.",
      subtitle: `Enter the 6-digit code sent to ${email}. It expires in 10 minutes.`,
    },
    forgot: {
      title: "Reset your password",
      subtitle: "Enter your email and we'll send you a 6-digit reset code.",
    },
    reset: {
      title: "Enter your reset code",
      subtitle: `We sent a 6-digit code to ${email || "your email"}. Enter it and choose a new password. Don't see it? Check your spam/junk folder.`,
    },
  };
  const current = stepConfig[mode];

  const submitHandler =
    mode === "login" ? handleLogin
    : mode === "register" ? handleRegister
    : mode === "profile" ? handleCompleteProfile
    : mode === "verify" ? handleVerifyRegistration
    : mode === "forgot" ? handleForgot
    : handleReset;

  const submitLabel =
    mode === "login" ? "Sign In"
    : mode === "register" ? "Continue"
    : mode === "verify" ? "Continue"
    : mode === "profile" ? "Create account"
    : mode === "forgot" ? "Send reset code"
    : "Reset password";

  // Password strength
  const getStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    if (pwd.length < 8) return { level: 1, label: "Too short", color: "bg-red-500" };
    if (pwd.length < 12) return { level: 2, label: "Moderate", color: "bg-yellow-500" };
    if (pwd.length < 16) return { level: 3, label: "Strong", color: "bg-blue-500" };
    return { level: 4, label: "Very strong", color: "bg-emerald-500" };
  };
  const strength = getStrength(password);

  const inputCls = "w-full bg-slate-950/60 border border-slate-800 text-white rounded-[8px] py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className={`auth-portal auth-mode-${mode}`}>
      <aside className="auth-story">
        <Link href="/" className="auth-brand" aria-label="BHE Uni home"><img src="/logo-white.png" alt="BHE Uni" width={164} height={68}/><span>Ambassador programme</span></Link>
        <div className="auth-story-content"><AppIcon name="graduation-cap" className="auth-story-icon" /><h1>A connection <br/>can change <br/>a life.</h1><p>Help your friends find their next chapter.<br/>Build a little something for yours.</p></div>
        <p className="auth-story-footer">A BHE UNI community · Made for Bangladesh</p>
      </aside>
      {googleProcessing && <GoogleProcessingDialog demo={!hasGoogleClientId} />}
      {googleSignup && !googleProcessing && <GooglePhoneDialog identity={googleSignup} testMode={signupTestMode} onClose={() => setGoogleSignup(null)} />}
      <main className="auth-form-side"><div className="auth-form-container">
        <header className="auth-form-heading"><h2>{current.title}</h2><p>{current.subtitle}</p></header>
        {(mode === "register" || mode === "verify" || mode === "profile") && <ol className="auth-steps" aria-label="Registration progress">{["Phone", "Verify", "Profile"].map((label, index) => { const currentStep = mode === "register" ? 0 : mode === "verify" ? 1 : 2; return <li key={label} className={index <= currentStep ? "is-active" : ""} aria-current={index === currentStep ? "step" : undefined}><span>{index < currentStep ? <AppIcon className="fa-solid fa-check" aria-hidden="true"/> : index + 1}</span>{label}{index < 2 && <AppIcon className="fa-solid fa-chevron-right" aria-hidden="true"/>}</li>; })}</ol>}
        <div className="auth-form-card">
          {signupTestMode && (mode === "forgot" || mode === "reset") && <p className="auth-code-note">Test preview: no email is sent. Use reset code <strong>123456</strong> and choose a new password.</p>}
          {(mode === "register" || mode === "verify" || mode === "profile") && <p className="auth-code-note">{signupTestMode ? <>Test preview: no email is sent. Use code <strong>123456</strong> to explore. Use dummy details and a test password.</> : "We’ll send a 6-digit verification code to your email address."}</p>}
          {/* Google verifies identity; new ambassadors complete their profile before sign-in. */}
          {(mode === "login" || mode === "register") && (
            <div className="mb-5">
              <div ref={googleBoxRef} className="flex justify-center w-full">
                {hasGoogleClientId ? (
                  <GoogleLogin
                    auto_select={false}
                    useOneTap={false}
                    onSuccess={async (credentialResponse) => {
                      if (credentialResponse.credential) {
                        resetMessages();
                        setLoading(true);
                        setGoogleProcessing(true);
                        try {
                          const [result] = await Promise.all([
                            api.post<{needs_profile:boolean;access_token?:string;email?:string;full_name?:string;verification_token?:string}>("/auth/google/prepare", {credential:credentialResponse.credential, intent:mode === "register" ? "signup" : "signin"}),
                            new Promise(resolve => setTimeout(resolve, 650)),
                          ]);
                          if (result.needs_profile && result.email && result.verification_token) {
                            setGoogleSignup({email: result.email, full_name: result.full_name, verification_token:result.verification_token});
                            setLoading(false);
                          } else if (mode === "register") throw new Error("This Google account is already registered. Sign in or choose a different Google account to sign up.");
                          else if (result.access_token) await signInWithToken(result.access_token);
                          else await loginWithGoogle(credentialResponse.credential);
                        } catch (err: any) {
                          setError(err.message || "Google authentication failed.");
                        } finally { setGoogleProcessing(false); setLoading(false); }
                      }
                    }}
                    onError={() => setError("Google authentication failed.")}
                    theme="outline"
                    shape="rectangular"
                    size="large"
                    width={String(googleWidth)}
                    text="continue_with"
                    logo_alignment="center"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={loading || !signupTestMode}
                    title={signupTestMode ? "Try Google onboarding with a dummy account" : "Google sign-in requires a configured Google OAuth client ID"}
                    onClick={async () => {
                      resetMessages(); setLoading(true); setGoogleProcessing(true);
                      try {
                        let demoId = localStorage.getItem("bhe_google_demo_id");
                        if (!demoId || !/^[a-f0-9]{32}$/.test(demoId)) {
                          demoId = crypto.randomUUID().replaceAll("-", "");
                          localStorage.setItem("bhe_google_demo_id", demoId);
                        }
                        const [result] = await Promise.all([
                          api.post<GoogleSignupIdentity & {needs_profile:boolean;access_token?:string;demo_id?:string}>("/auth/google/demo", {demo_id:demoId, intent:mode === "register" ? "signup" : "signin"}),
                          new Promise(resolve => setTimeout(resolve, 650)),
                        ]);
                        if (result.demo_id) localStorage.setItem("bhe_google_demo_id", result.demo_id);
                        if (result.access_token) await signInWithToken(result.access_token);
                        else setGoogleSignup(result);
                      } catch (error) { setError(error instanceof Error ? error.message : "Could not start the demo."); }
                      finally { setGoogleProcessing(false); setLoading(false); }
                    }}
                    className="auth-google-button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.6a12.2 12.2 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"/><path fill="#EA4335" d="M24 12c3 0 5.6 1 7.7 3l5.8-5.8A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"/></svg>
                    Continue with Google
                  </button>
                )}
              </div>
              <div className="my-5 flex items-center gap-3">
                <hr className="flex-1 border-slate-700/50" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">or create an account</span>
                <hr className="flex-1 border-slate-700/50" />
              </div>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-5">
            {notice && !error && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-[8px] text-xs flex items-center gap-2.5">
                <AppIcon className="fa-solid fa-circle-info text-sm shrink-0"></AppIcon>
                <span className="leading-tight">{notice}</span>
              </div>
            )}
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-[8px] text-xs flex items-center gap-2.5">
                <AppIcon className="fa-solid fa-circle-exclamation text-sm shrink-0"></AppIcon>
                <span className="leading-tight">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-[8px] text-xs flex items-center gap-2.5">
                <AppIcon className="fa-solid fa-circle-check text-sm shrink-0"></AppIcon>
                <span className="leading-tight">{success}</span>
              </div>
            )}

            {/* ── REGISTER: First + Last ── */}
            {mode === "register" && (
              <>
                  <div>
                    <label className={labelCls} htmlFor="auth-counsellor">Your BHE Uni counsellor <span className="text-slate-500">(optional)</span></label>
                    <div className="relative auth-counsellor" ref={counsellorBox} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setCounsellorOpen(false); }} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setCounsellorOpen(false); counsellorTrigger.current?.focus(); } }}>
                      <button ref={counsellorTrigger} id="auth-counsellor" type="button" className="auth-counsellor-trigger" aria-expanded={counsellorOpen} aria-controls="auth-counsellor-options" onClick={() => { setCounsellorOpen(!counsellorOpen); setCounsellorSearch(""); }}><AppIcon name="user" className="auth-counsellor-user-icon" style={{ fontSize: 18 }} /><span>{counsellors.find(c => String(c.id) === counsellorId)?.name || "None / choose later"}</span><AppIcon className={`fa-solid fa-chevron-${counsellorOpen ? "up" : "down"}`} aria-hidden="true"/></button>
                      {counsellorOpen && <div className="auth-counsellor-menu" id="auth-counsellor-options">
                        <input autoFocus type="search" aria-label="Search counsellors" placeholder="Search counsellors…" value={counsellorSearch} onChange={event => setCounsellorSearch(event.target.value)}/>
                        <div className="auth-counsellor-options"><button type="button" aria-pressed={!counsellorId} onClick={() => { setCounsellorId(""); setCounsellorOpen(false); counsellorTrigger.current?.focus(); }}>None / choose later</button>
                          {counsellors.filter(c => c.name.toLowerCase().includes(counsellorSearch.toLowerCase())).map(c => <button key={c.id} type="button" aria-pressed={counsellorId === String(c.id)} onClick={() => { setCounsellorId(String(c.id)); setCounsellorOpen(false); counsellorTrigger.current?.focus(); }}><span>{c.name}</span>{counsellorId === String(c.id) && <AppIcon className="fa-solid fa-check" aria-hidden="true"/>}</button>)}
                          {!counsellors.some(c => c.name.toLowerCase().includes(counsellorSearch.toLowerCase())) && <p>No counsellors found.</p>}
                        </div>
                      </div>}
                    </div>
                  </div>
                <div>
                  <label className={labelCls} htmlFor="signup-phone">Mobile number <span className="text-red-500">*</span></label>
                  <PhoneNumberInput id="signup-phone" required value={phone} onChange={setPhone}/>

                </div>
              </>
            )}

            {mode === "profile" && <>
              <div><label className={labelCls} htmlFor="signup-full-name">Full name <span className="text-red-500">*</span></label><input id="signup-full-name" type="text" required placeholder="Nusrat Jahan" autoComplete="name" className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)}/></div>
              {email.trim() && <div><label className={labelCls} htmlFor="signup-verified-email">Email address <span className="text-red-500">*</span></label><input id="signup-verified-email" type="email" readOnly className={inputCls} value={email}/></div>}
            </>}

            {/* ── Email (login / register / forgot) ── */}
            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <div>
                <label className={labelCls}>{mode === "login" ? "Email or mobile number" : "Email address"} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <AppIcon className="fa-regular fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></AppIcon>
                  <input type={mode === "login" ? "text" : "email"} required placeholder={mode === "login" ? "Email or mobile number" : "alex.m@university.com"} className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Reset: 6-digit code ── */}
            {(mode === "reset" || mode === "verify") && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider text-center">{mode === "verify" ? "Verification code" : "Reset code"}</label>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required aria-label="Your 6-digit code" placeholder="123456" className={inputCls.replace("pl-10", "pl-3")} value={otp.join("")} onChange={event => { const value = event.target.value.replace(/\D/g, "").slice(0,6); setOtp(Array.from({length:6},(_,index) => value[index] || "")); }}/>

                <p className="text-center text-xs text-slate-500 mt-4">
                  Didn&apos;t get it?{" "}
                  <button type="button" disabled={loading || resendSeconds > 0} onClick={(event) => mode === "verify" ? handleRegister(event) : handleForgot(event)} className="text-orange-400 hover:text-orange-300 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed">{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}</button>
                </p>
                {mode === "verify" && (
                  <button type="button" disabled={loading} onClick={() => goto("register")} className="block mx-auto mt-3 text-xs text-orange-400 hover:underline">Back</button>
                )}
              </div>
            )}

            {/* ── Password (login / register / reset) ── */}
            {(mode === "login" || mode === "profile" || mode === "reset") && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {mode === "login" ? "Password" : mode === "reset" ? "New password" : "Create password"} <span className="text-red-500">*</span>
                  </label>
                  {mode === "login" ? (
                    <button type="button" onClick={() => goto("forgot")} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">Forgot?</button>
                  ) : (
                    <span className="text-xs text-slate-600">Min. 8 characters</span>
                  )}
                </div>
                <div className="relative">
                  <AppIcon className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></AppIcon>
                  <input
                    type={showPassword ? "text" : "password"} required placeholder="••••••••" minLength={mode === "login" ? undefined : 8}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-[8px] py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                    <AppIcon className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></AppIcon>
                  </button>
                </div>
                {(mode === "profile" || mode === "reset") && (
                  <>
                    <div className="mt-2.5 flex gap-1">
                      {[1, 2, 3, 4].map((lvl) => (
                        <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-300 ${password.length > 0 && lvl <= strength.level ? strength.color : "bg-slate-800"}`} />
                      ))}
                    </div>
                    {strength.label && <p className="text-xs text-slate-500 mt-1">{strength.label}</p>}
                  </>
                )}
              </div>
            )}

            {/* Policy acceptance (register only) */}
            {mode === "profile" && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-orange-500"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-red-500 font-bold">*</span>{" "}
                  I agree to the{" "}
                  <a href="/rewards-terms-and-conditions" target="_blank" className="text-orange-400 font-semibold hover:underline">Rewards Terms and Conditions</a>{" "}
                  and{" "}
                  <a href="/privacy-policy" target="_blank" className="text-orange-400 font-semibold hover:underline">Privacy Policy</a>.
                </span>
              </label>
            )}

            {/* Marketing SMS notice (register only) - informational, soft opt-in; no
                checkbox. Tells ambassadors they may receive programme SMS and how to
                opt out, at the point we collect their number. */}
            {mode === "profile" && (
              <p className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-relaxed">
                <AppIcon className="fa-solid fa-comment-dots mt-0.5 flex-shrink-0"></AppIcon>
                <span>We may occasionally text you about the ambassador programme. Reply STOP anytime to opt out.</span>
              </p>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading || (mode === "register" && !(phone.trim() && registerEmailValid)) || (mode === "profile" && !canRegister)}
              className="auth-submit"
            >
              {loading ? (
                <><AppIcon className="fa-solid fa-spinner animate-spin"></AppIcon><span>Processing...</span></>
              ) : (
                <><span>{submitLabel}</span><AppIcon className="fa-solid fa-arrow-right text-xs"></AppIcon></>
              )}
            </button>

            {mode === "profile" && <button type="button" disabled={loading} onClick={() => goto("register")} className="auth-registration-back"><AppIcon className="fa-solid fa-arrow-left" aria-hidden="true"/> Back</button>}
            {/* Footer toggle */}
            <p className="text-center text-sm text-slate-400 mt-6 pt-2 leading-relaxed">
              {mode === "login" ? (
                <>New around here?{" "}
                  <button type="button" onClick={() => goto("register")} className="text-orange-400 hover:text-orange-300 font-bold hover:underline transition-all">Join the community</button>
                </>
              ) : (mode === "register" || mode === "verify" || mode === "profile") ? (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => goto("login")} className="text-orange-400 hover:text-orange-300 font-bold hover:underline transition-all">Sign in</button>
                </>
              ) : (
                <button type="button" onClick={() => goto("login")} className="text-orange-400 hover:text-orange-300 font-medium hover:underline transition-all">
                  <AppIcon className="fa-solid fa-arrow-left text-[10px] mr-1"></AppIcon>Back to Sign In
                </button>
              )}
            </p>
          </form>

          <p className="text-center text-[11px] text-slate-500 mt-5">
            <a href="/rewards-terms-and-conditions" target="_blank" className="hover:text-orange-400 font-semibold">Rewards Terms and Conditions</a>
            <span className="mx-2">·</span>
            <a href="/privacy-policy" target="_blank" className="hover:text-orange-400 font-semibold">Privacy Policy</a>
          </p>
        </div>
      </div></main>
    </div>
  );
}
