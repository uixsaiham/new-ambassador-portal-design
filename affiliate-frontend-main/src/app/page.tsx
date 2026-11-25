"use client";

import AppSelect from "@/components/AppSelect";
import AppIcon from "@/components/AppIcon";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ReferralBanner from "@/components/ReferralBanner";

// Public Play Store listing for the ambassador Android app. Deliberately stored
// WITHOUT a utm_source: the link was supplied tagged as an EMEA media campaign,
// and reusing that tag here would fold organic landing-page installs into that
// campaign's attribution. Add a landing-page-specific tag if install tracking
// is ever wanted from this surface.
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.bheuni.ambassadorapp";

// Public App Store listing for the ambassador iOS app (bundle com.bheuni.ambassadorapp).
const APP_STORE_URL = "https://apps.apple.com/gb/app/bhe-uni-ambassador/id6827007812";

interface LeadAnalyzerCardProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  onOpenJoinModal: () => void;
}

const LeadAnalyzerCard = React.forwardRef<HTMLDivElement, LeadAnalyzerCardProps>(
  ({ id, className, style, onOpenJoinModal }, ref) => {
    const [hasConsent, setHasConsent] = useState(true);
    const [genuineInterest, setGenuineInterest] = useState(true);
    const [isNewLead, setIsNewLead] = useState(true);
    const [analyzeLoading, setAnalyzeLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [result, setResult] = useState<{
      status: "valid" | "invalid";
      reason?: string;
      leadReward: number;
      enrolmentReward: number;
    } | null>(null);

    const loadingMessages = [
      "Checking CRM duplicates...",
      "Verifying contact parameters...",
      "Auditing GDPR consent status...",
      "Calculating rewards eligibility..."
    ];

    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (analyzeLoading) {
        setLoadingStep(0);
        interval = setInterval(() => {
          setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
        }, 350);
      }
      return () => clearInterval(interval);
    }, [analyzeLoading]);

    const handleAnalyze = () => {
      setAnalyzeLoading(true);
      setResult(null);
      setTimeout(() => {
        setAnalyzeLoading(false);

        if (!hasConsent) {
          setResult({
            status: "invalid",
            reason: "Explicit student consent is required to process personal details.",
            leadReward: 0,
            enrolmentReward: 0,
          });
          return;
        }

        if (!genuineInterest) {
          setResult({
            status: "invalid",
            reason: "Student must express genuine interest in higher education programs.",
            leadReward: 0,
            enrolmentReward: 0,
          });
          return;
        }

        if (!isNewLead) {
          setResult({
            status: "invalid",
            reason: "Lead already registered in CRM database. Duplicate entries are excluded.",
            leadReward: 0,
            enrolmentReward: 0,
          });
          return;
        }

        setResult({
          status: "valid",
          leadReward: 10,
          enrolmentReward: 500,
        });
      }, 1500);
    };

    const handleReset = () => {
      setResult(null);
      setHasConsent(true);
      setGenuineInterest(true);
      setIsNewLead(true);
    };

    return (
      <div
        id={id}
        ref={ref}
        className={`${className} hover:border-orange-500/30 hover:shadow-[0_20px_50px_rgba(243,113,36,0.15)] transition-all duration-300`}
        style={style}
      >
        {!analyzeLoading && !result && (
          <div className="space-y-3 text-left pt-1">
            {/* Compliance Toggles */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Lead Eligibility Criteria
                </label>
              </div>

              {/* Consent Toggle */}
              <label className="flex items-center justify-between gap-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[8px] p-2.5 cursor-pointer transition-all duration-200 group">
                <span className="text-[11px] text-slate-200 font-semibold select-none">
                  Obtained explicit consent
                </span>
                <input
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${hasConsent
                  ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_8px_rgba(243,113,36,0.5)]"
                  : "border-white/20 text-transparent group-hover:border-white/40"
                  }`}>
                  <AppIcon className="fa-solid fa-check text-[8px]"></AppIcon>
                </div>
              </label>

              {/* Genuine Interest Toggle */}
              <label className="flex items-center justify-between gap-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[8px] p-2.5 cursor-pointer transition-all duration-200 group">
                <span className="text-[11px] text-slate-200 font-semibold select-none">
                  Genuine UK Higher Ed interest
                </span>
                <input
                  type="checkbox"
                  checked={genuineInterest}
                  onChange={(e) => setGenuineInterest(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${genuineInterest
                  ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_8px_rgba(243,113,36,0.5)]"
                  : "border-white/20 text-transparent group-hover:border-white/40"
                  }`}>
                  <AppIcon className="fa-solid fa-check text-[8px]"></AppIcon>
                </div>
              </label>

              {/* Is New Lead Toggle */}
              <label className="flex items-center justify-between gap-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[8px] p-2.5 cursor-pointer transition-all duration-200 group">
                <span className="text-[11px] text-slate-200 font-semibold select-none">
                  New lead (not registered)
                </span>
                <input
                  type="checkbox"
                  checked={isNewLead}
                  onChange={(e) => setIsNewLead(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${isNewLead
                  ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_8px_rgba(243,113,36,0.5)]"
                  : "border-white/20 text-transparent group-hover:border-white/40"
                  }`}>
                  <AppIcon className="fa-solid fa-check text-[8px]"></AppIcon>
                </div>
              </label>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              className="w-full py-2.5 rounded-[8px] bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2 animate-shine"
            >
              <AppIcon className="fa-solid fa-bolt text-[9px] animate-pulse"></AppIcon> Analyze Lead
            </button>
          </div>
        )}

        {/* Loading Animation State */}
        {analyzeLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="relative mb-5 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-orange-500/10 border-t-orange-500 animate-spin"></div>
              <AppIcon className="fa-solid fa-compass-drafting text-orange-400 absolute text-sm animate-pulse"></AppIcon>
            </div>
            <div className="space-y-1">
              <p className="text-white text-xs font-bold tracking-wide transition-all duration-300">
                {loadingMessages[loadingStep]}
              </p>
              <p className="text-slate-400 text-[9px] uppercase tracking-widest font-black animate-pulse">
                Running lead audit...
              </p>
            </div>
          </div>
        )}

        {/* Results View */}
        {!analyzeLoading && result && (
          <div className="text-center space-y-4">
            {result.status === "valid" ? (
              <>
                {/* Success Badge */}
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-2">
                  <AppIcon className="fa-solid fa-circle-check"></AppIcon>
                </div>
                <div>
                  <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-0.5">VALID REFERRAL</h4>
                  <p className="text-slate-400 text-[10px]">Lead is reward-eligible</p>
                </div>

                {/* Reward Grid */}
                <div className="bg-slate-950/50 border border-white/5 rounded-[8px] p-3.5 text-left space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Lead Referral Reward:</span>
                    <span className="text-white font-bold">৳{result.leadReward}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pb-2 border-b border-white/5">
                    <span className="text-slate-400">Enrolment Reward:</span>
                    <span className="text-white font-bold">৳{result.enrolmentReward}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-300 text-xs font-bold">Total Potential:</span>
                    <span className="text-orange-400 text-sm font-black">৳{result.leadReward + result.enrolmentReward}</span>
                  </div>
                </div>

                {/* Success Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={onOpenJoinModal}
                    className="w-full py-3 rounded-[8px] bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition hover:bg-orange-400 hover:shadow-orange-500/40 flex items-center justify-center gap-1.5"
                  >
                    Refer This Student Now <AppIcon className="fa-solid fa-arrow-right text-[9px]"></AppIcon>
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full py-2 rounded-[8px] border border-white/10 hover:bg-white/5 text-slate-300 text-[10px] font-bold transition"
                  >
                    Verify Another Lead
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Failure Badge */}
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center text-lg mb-2">
                  <AppIcon className="fa-solid fa-circle-exclamation"></AppIcon>
                </div>
                <div>
                  <h4 className="text-red-400 text-xs font-black uppercase tracking-widest mb-0.5">INELIGIBLE LEAD</h4>
                  <p className="text-slate-400 text-[10px]">Policy constraints violated</p>
                </div>

                {/* Error Explanation */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-[8px] p-3 text-left">
                  <p className="text-[10px] text-red-200/90 leading-relaxed font-semibold">
                    <AppIcon className="fa-solid fa-triangle-exclamation mr-1 text-red-400"></AppIcon> {result.reason}
                  </p>
                </div>

                {/* Failure Actions */}
                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="w-full py-3 rounded-[8px] bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
                  >
                    Re-evaluate Parameters
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);
LeadAnalyzerCard.displayName = "LeadAnalyzerCard";

export default function LandingPage() {
  const { login } = useAuth();
  const AMBASSADOR_URL = process.env.NEXT_PUBLIC_AMBASSADOR_URL || "https://ambassador.bheuni.uk";

  // Navigation & UI States
  const [isSticky, setIsSticky] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Registration Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Counter States
  const [earningLevelsCount, setEarningLevelsCount] = useState(0);
  const [maxRewardCount, setMaxRewardCount] = useState(0);
  const [tiersCount, setTiersCount] = useState(0);
  const [gdprCount, setGdprCount] = useState(0);

  // Progress Bar State
  const [progressWidth, setProgressWidth] = useState("0%");

  // 3D Card Tilt Refs
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heroFloatsRef = useRef<HTMLDivElement | null>(null);
  const heroBadgeRef = useRef<HTMLDivElement | null>(null);

  // Scroll listener for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for elements
  useEffect(() => {
    // Reveal animation
    const reveals = document.querySelectorAll(".reveal, .reveal-l, .reveal-r, .reveal-s");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            const target = e.target as any;
            if (target && target.style) {
              target.style.opacity = "1";
              target.style.transform = "none";
            }
          }
        });
      },
      { threshold: 0.05 }
    );
    reveals.forEach((el) => revealObserver.observe(el));

    // Progress bar animation
    const progBarParent = document.getElementById("prog-parent");
    if (progBarParent) {
      const progObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              setTimeout(() => setProgressWidth("100%"), 300);
            }
          });
        },
        { threshold: 0.4 }
      );
      progObserver.observe(progBarParent);
    }

    // Counter animations
    const statsSection = document.getElementById("stats-section");
    if (statsSection) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              animateCounters();
            }
          });
        },
        { threshold: 0.3 }
      );
      counterObserver.observe(statsSection);
    }

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  // Counters animation helper
  const animateCounters = () => {
    const duration = 1600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      setEarningLevelsCount(Math.round(2 * easeProgress));
      setMaxRewardCount(Math.round(500 * easeProgress));
      setTiersCount(Math.round(4 * easeProgress));
      setGdprCount(Math.round(100 * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  };

  // 3D Card Tilt Effects
  useEffect(() => {
    const isHoverable = !window.matchMedia("(hover:none)").matches;
    if (!isHoverable) return;

    // Glare and Tilt handler for cards
    cardRefs.current.forEach((card) => {
      if (!card) return;
      let glare = card.querySelector(".glare-element") as HTMLDivElement;
      if (!glare) {
        glare = document.createElement("div");
        glare.className = "glare-element";
        glare.style.cssText =
          "position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 0.4s;mix-blend-mode:overlay;z-index:10;border-radius:inherit;";
        card.appendChild(glare);
      }

      const onMouseMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const tiltX = (y - 0.5) * -16;
        const tiltY = (x - 0.5) * 16;
        card.style.transform = `translateY(-8px) scale(1.02) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        glare.style.opacity = "1";
        glare.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.95) 0%, transparent 65%)`;
      };

      const onMouseLeave = () => {
        card.style.transform = "";
        glare.style.opacity = "0";
      };

      card.addEventListener("mousemove", onMouseMove);
      card.addEventListener("mouseleave", onMouseLeave);

      return () => {
        card.removeEventListener("mousemove", onMouseMove);
        card.removeEventListener("mouseleave", onMouseLeave);
      };
    });

    // Hero Floats 3D effect
    const heroFloats = heroFloatsRef.current;
    const heroBadge = heroBadgeRef.current;
    if (heroFloats && heroBadge) {
      const onHeroMouseMove = (e: MouseEvent) => {
        const r = heroFloats.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        heroFloats.style.transform = `perspective(1500px) rotateX(${-y * 2}deg) rotateY(${x * 2}deg) scale(1.05)`;
        heroBadge.style.transform = `perspective(1500px) rotateX(${y * 8}deg) rotateY(${-x * 8}deg) scale(1.1)`;
      };

      const onHeroMouseLeave = () => {
        heroFloats.style.transform = "";
        heroBadge.style.transform = "";
      };

      heroFloats.addEventListener("mousemove", onHeroMouseMove);
      heroFloats.addEventListener("mouseleave", onHeroMouseLeave);
    }
  }, []);

  // Registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegMessage(null);
    try {
      await api.post("/auth/register", {
        email,
        full_name: `${firstName} ${lastName}`,
        password,
      });
      setRegMessage({
        type: "success",
        text: "Registration successful! You can now log in using the Sign In portal.",
      });
      // Clear fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setSource("");
      setTermsAccepted(false);

      // Auto switch or close modal after a short delay
      setTimeout(() => {
        setIsJoinOpen(false);
        setIsLoginOpen(true);
      }, 2000);
    } catch (err: any) {
      setRegMessage({
        type: "error",
        text: err.message || "Failed to register. Please check your credentials.",
      });
    } finally {
      setRegLoading(false);
    }
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      // AuthProvider redirects automatically to the right page based on role!
    } catch (err: any) {
      setLoginError(err.message || "Invalid email or password");
      setLoginLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-800 overflow-x-hidden min-h-screen">
      {/* ══════════ NAVBAR ══════════ */}
      <nav
        id="nav"
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-350 px-4 sm:px-6 py-3 ${isSticky
          ? "box-shadow:0 2px 24px rgba(38,58,127,.10) bg-white/97! border-slate-100"
          : "bg-white border-slate-50"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex-shrink-0 flex items-center">
            <Image
              src="/logo.png"
              alt="BHE UNI Logo"
              width={153}
              height={61}
              className="h-10 w-auto object-contain"
              priority
            />
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-500">
            <a href="#levels" className="hover:text-[var(--primary)] transition-colors">
              Rewards
            </a>
            <a href="#ambassador" className="hover:text-[var(--primary)] transition-colors">
              Tiers
            </a>
            <a href="#programme" className="hover:text-[var(--primary)] transition-colors">
              Programme
            </a>
            <a href="#app" className="hover:text-[var(--primary)] transition-colors">
              App
            </a>
            <a href="#compliance" className="hover:text-[var(--primary)] transition-colors">
              Compliance
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden md:flex text-slate-600 hover:text-[var(--primary)] font-bold text-sm px-4 py-2 transition-colors mr-1 items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="hidden md:flex btn-orange text-sm px-5 py-2.5 rounded-full font-bold cursor-pointer items-center justify-center"
            >
              Join Now <AppIcon name="arrow-right" />
            </Link>
            {/* Hamburger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden flex flex-col gap-[5px] items-center justify-center w-10 h-10 rounded-[8px] border border-slate-200"
              aria-label="Menu"
            >
              <span className="block w-5 h-0.5 bg-[var(--primary)] rounded-full"></span>
              <span className="block w-5 h-0.5 bg-[var(--primary)] rounded-full"></span>
              <span className="block w-5 h-0.5 bg-[var(--primary)] rounded-full"></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-[60] bg-black/30 md:hidden transition-opacity duration-300"
        ></div>
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-[70] flex flex-col md:hidden pt-5 px-6 bg-white border-l border-slate-100 shadow-2xl transition-transform duration-300 transform ${isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between mb-8">
          <Image
            src="/logo.png"
            alt="BHE UNI Logo"
            width={153}
            height={61}
            className="h-8 w-auto object-contain"
          />
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-9 h-9 rounded-[8px] border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          <a
            href="#levels"
            onClick={() => setIsDrawerOpen(false)}
            className="drawer-link py-3.5 px-4 rounded-[8px] text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-3 text-sm"
          >
            <AppIcon className="fa-solid fa-coins text-slate-400"></AppIcon> Reward Levels
          </a>
          <a
            href="#ambassador"
            onClick={() => setIsDrawerOpen(false)}
            className="drawer-link py-3.5 px-4 rounded-[8px] text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-3 text-sm"
          >
            <AppIcon className="fa-solid fa-medal text-slate-400"></AppIcon> Ambassador Tiers
          </a>
          <a
            href="#programme"
            onClick={() => setIsDrawerOpen(false)}
            className="drawer-link py-3.5 px-4 rounded-[8px] text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-3 text-sm"
          >
            <AppIcon className="fa-solid fa-gift text-slate-400"></AppIcon> Ambassador Programme
          </a>
          <a
            href="#app"
            onClick={() => setIsDrawerOpen(false)}
            className="drawer-link py-3.5 px-4 rounded-[8px] text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-3 text-sm"
          >
            <AppIcon className="fa-solid fa-mobile-screen text-slate-400"></AppIcon> Mobile App
          </a>
          <a
            href="#compliance"
            onClick={() => setIsDrawerOpen(false)}
            className="drawer-link py-3.5 px-4 rounded-[8px] text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-3 text-sm"
          >
            <AppIcon className="fa-solid fa-shield-halved text-slate-400"></AppIcon> Compliance
          </a>
        </nav>
        <div className="mt-auto pb-8 pt-4 flex flex-col gap-3">
          <Link
            href="/login"
            onClick={() => setIsDrawerOpen(false)}
            className="w-full py-3.5 rounded-[8px] text-sm font-bold text-center border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            onClick={() => setIsDrawerOpen(false)}
            className="btn-orange w-full py-4 rounded-[8px] text-sm font-bold text-center flex items-center justify-center"
          >
            Apply to Join <AppIcon name="arrow-right" />
          </Link>
        </div>
      </div>

      {/* ══════════ HERO SECTION ══════════ */}
      <section className="hero-section pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative Blobs */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-50 pointer-events-none"
          style={{
            background: "radial-gradient(circle,rgba(129,140,248,.25),transparent 70%)",
            animation: "blobMorph 10s ease-in-out infinite",
          }}
        ></div>
        <div
          className="absolute bottom-0 -left-16 w-64 h-64 rounded-full opacity-50 pointer-events-none"
          style={{
            background: "radial-gradient(circle,rgba(243,113,36,.25),transparent 70%)",
            animation: "blobMorph 8s ease-in-out infinite reverse",
          }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle,rgba(255,255,255,.15),transparent 60%)",
            animation: "blobMorph 12s ease-in-out infinite",
          }}
        ></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-8 items-center relative z-10">
          {/* Left Text */}
          <div className="text-center lg:text-left">
            <div style={{ animation: "fadeUp .6s .05s ease both" }}>
              <span
                className="pill mb-6 border border-white/20 shadow-lg text-white"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span className="dot-orange"></span>
                Affiliate &amp; Student Referral Scheme
              </span>
            </div>

            <h1
              className="font-black leading-[1.1] mb-5 sm:mb-6 text-white drop-shadow-2xl"
              style={{
                fontSize: "clamp(2rem, 7vw, 4.5rem)",
                animation: "fadeUp .65s .12s ease both",
              }}
            >
              Turn referrals <br className="hidden lg:block" />
              <span
                style={{
                  background: "linear-gradient(90deg,#ffd0b0 0%,var(--orange) 45%,#ffd0b0 60%,var(--orange) 80%,#ffd0b0 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmerO 3.5s linear infinite",
                }}
              >
                Into rewards
              </span>
            </h1>

            <p
              className="text-blue-50 leading-relaxed mb-7 sm:mb-10 max-w-lg mx-auto lg:mx-0 font-medium drop-shadow-lg text-sm sm:text-base"
              style={{
                animation: "fadeUp .65s .2s ease both",
                textShadow: "0 2px 10px rgba(0,0,0,0.6)",
              }}
            >
              Earn ৳10 for every qualified referral, and ৳500 when a friend enrols at BHE Uni.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-7 sm:mb-10"
              style={{ animation: "fadeUp .65s .28s ease both" }}
            >
              <Link
                href="/signup"
                className="btn-orange px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base rounded-full shadow-[0_0_20px_rgba(243,113,36,0.4)] text-center cursor-pointer flex items-center justify-center"
              >
                Start Earning Today <AppIcon name="arrow-right" />
              </Link>
              <a
                href="#levels"
                className="px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base rounded-full font-bold border-2 border-white/20 text-white hover:bg-white/10 hover:border-white transition-all text-center"
              >
                How It Works
              </a>
            </div>

            {/* Goal Pills */}
            <div
              className="flex flex-wrap gap-2 justify-center lg:justify-start"
              style={{ animation: "fadeUp .65s .36s ease both" }}
            >
              <span className="pill border border-white/20 bg-slate-900/50 text-blue-50 backdrop-blur-md shadow-lg">
                <AppIcon className="fa-solid fa-bullhorn text-blue-300 mr-1.5"></AppIcon> Referrals
              </span>
              <span className="pill border border-white/20 bg-slate-900/50 text-blue-50 backdrop-blur-md shadow-lg">
                <AppIcon className="fa-solid fa-graduation-cap text-yellow-400 mr-1.5"></AppIcon> Enrolment
              </span>
            </div>
          </div>

          {/* Right Floating Bento (Desktop Only) */}
          <div
            ref={heroFloatsRef}
            className="hero-floats hidden lg:block relative h-[560px] w-full"
            style={{ animation: "fadeUp .7s .15s ease both" }}
          >
            {/* Lead Analyzer Card */}
            <LeadAnalyzerCard
              id="hero-badge"
              ref={heroBadgeRef}
              className="absolute bottom-8 right-2 z-20 w-72 p-5 rounded-[8px] border border-white/20 float-b"
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              onOpenJoinModal={() => { window.location.href = "/signup"; }}
            />

            {/* Tier Badge */}
            <div
              className="absolute top-16 right-4 z-10 w-48 p-4 rounded-[8px] border border-orange-500/30 float-c"
              style={{
                background: "rgba(243, 113, 36, 0.15)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg shadow-lg shadow-orange-500/40">
                  <AppIcon className="fa-solid fa-trophy"></AppIcon>
                </div>
                <div>
                  <div className="text-orange-300 text-[10px] font-black uppercase tracking-wider">Current Tier</div>
                  <div className="text-white font-bold text-sm">Gold Status</div>
                </div>
              </div>
            </div>

          </div>

          {/* Mobile UI (Visible on Tablet/Mobile) */}
          <div
            className="lg:hidden w-full max-w-lg mx-auto"
            style={{ animation: "fadeUp .7s .4s ease both" }}
          >
            {/* Lead Analyzer Card */}
            <LeadAnalyzerCard
              className="rounded-[8px] p-5 border border-white/15 shadow-2xl relative overflow-hidden mb-4"
              style={{
                background: "rgba(15,23,42,0.75)",
                backdropFilter: "blur(24px)",
              }}
              onOpenJoinModal={() => { window.location.href = "/signup"; }}
            />

            {/* 3-Stat Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-left">
              <div
                className="rounded-[8px] p-3 sm:p-4 border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3"
                style={{
                  background: "rgba(15,23,42,0.65)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                  <AppIcon className="fa-solid fa-user-plus"></AppIcon>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-white font-black text-sm sm:text-base">৳10</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] font-medium">Per Lead</div>
                </div>
              </div>
              <div
                className="rounded-[8px] p-3 sm:p-4 border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3"
                style={{
                  background: "rgba(15,23,42,0.65)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                  <AppIcon className="fa-solid fa-graduation-cap"></AppIcon>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-white font-black text-sm sm:text-base">৳500</div>
                  <div className="text-slate-400 text-[9px] sm:text-[10px] font-medium">UK Enrol</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sep"></div>

      {/* ══════════ STATS SECTION ══════════ */}
      <section id="stats-section" className="bg-white-sec py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div
            ref={(el) => { cardRefs.current[0] = el; }}
            className="card rounded-[8px] p-5 sm:p-7 text-center reveal reveal-s"
          >
            <div className="big-num counter mb-1" style={{ color: "var(--primary)" }}>
              {earningLevelsCount}
            </div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium">Earning Levels</div>
          </div>
          <div
            ref={(el) => { cardRefs.current[1] = el; }}
            className="card rounded-[8px] p-5 sm:p-7 text-center reveal reveal-s d1"
          >
            <div className="big-num counter mb-1" style={{ color: "var(--orange)" }}>
              ৳{maxRewardCount}
            </div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium">Max Single Reward</div>
          </div>
          <div
            ref={(el) => { cardRefs.current[2] = el; }}
            className="card rounded-[8px] p-5 sm:p-7 text-center reveal reveal-s d2"
          >
            <div className="big-num counter mb-1" style={{ color: "var(--primary)" }}>
              {tiersCount}
            </div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium">Ambassador Tiers</div>
          </div>
          <div
            ref={(el) => { cardRefs.current[3] = el; }}
            className="card rounded-[8px] p-5 sm:p-7 text-center reveal reveal-s d3"
          >
            <div className="big-num counter mb-1" style={{ color: "var(--orange)" }}>
              {gdprCount}%
            </div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium">GDPR Compliant</div>
          </div>
        </div>
      </section>

      <div className="sep"></div>

      {/* ══════════ REWARD LEVELS ══════════ */}
      <section id="levels" className="bg-tint animated-grid py-16 sm:py-24 px-4 sm:px-6 overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 reveal">
            <span className="pill mb-4" style={{ background: "rgba(243,113,36,.1)", color: "var(--orange)" }}>
              Two Ways to Earn
            </span>
            <h2 className="font-black text-3xl sm:text-4xl md:text-5xl mb-3" style={{ color: "var(--primary)" }}>
              Reward <span className="shimmer-orange">Levels</span>
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">
              From a simple lead referral to high-paying enrolment rewards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 text-left max-w-4xl mx-auto">
            {/* Card 1: Refer a Lead */}
            <div
              ref={(el) => { cardRefs.current[4] = el; }}
              className="card rounded-[8px] overflow-hidden reveal d1"
            >
              <div className="accent-line" style={{ background: "linear-gradient(90deg,var(--primary),#5470c6)" }}></div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="icon-box" style={{ background: "#eef1fb", color: "var(--primary)" }}>
                    <AppIcon className="fa-solid fa-user-plus"></AppIcon>
                  </div>
                  <span className="pill" style={{ background: "#eef1fb", color: "var(--primary)" }}>
                    Tier 1
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2" style={{ color: "var(--primary)" }}>
                  Refer a Lead
                </h3>
                <div className="flex items-end gap-1.5 mb-3">
                  <span className="font-black leading-none" style={{ fontSize: "3.5rem", color: "var(--orange)" }}>
                    ৳10
                  </span>
                  <span className="text-slate-400 text-sm mb-2">/ qualified lead</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Submit a contact directly, or share your unique link and let anyone fill the form.
                </p>
                <div
                  className="rounded-[8px] px-4 py-3 text-sm font-semibold mb-5"
                  style={{
                    background: "#fff7f0",
                    color: "var(--orange)",
                    border: "1px solid rgba(243,113,36,.15)",
                  }}
                >
                  Verified by our expert counsellors
                </div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(243,113,36,.12)" }}
                    >
                      <AppIcon name="check" style={{ fontSize: 12, color: "#F37124" }} />
                    </span>
                    Unlimited lead submissions
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(243,113,36,.12)" }}
                    >
                      <AppIcon name="check" style={{ fontSize: 12, color: "#F37124" }} />
                    </span>
                    Real-time status updates
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Successful Enrolment */}
            <div
              ref={(el) => { cardRefs.current[5] = el; }}
              className="card rounded-[8px] overflow-hidden reveal d2 relative"
            >
              <div className="accent-line" style={{ background: "linear-gradient(90deg,var(--orange),#ff8a3a)" }}></div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="icon-box" style={{ background: "#fff7f0", color: "var(--orange)" }}>
                    <AppIcon className="fa-solid fa-graduation-cap"></AppIcon>
                  </div>
                  <span className="pill" style={{ background: "#fff7f0", color: "var(--orange)" }}>
                    Tier 2
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2" style={{ color: "var(--primary)" }}>
                  Successful Enrolment
                </h3>
                <div className="flex items-end gap-1.5 mb-3">
                  <span className="font-black leading-none" style={{ fontSize: "3.5rem", color: "var(--orange)" }}>
                    ৳500
                  </span>
                  <span className="text-slate-400 text-sm mb-2">/ enrolment</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  If your qualified lead enrols at a university through BHE Uni.
                </p>
                <div
                  className="rounded-[8px] px-4 py-3 text-sm font-semibold text-emerald-700 mb-5"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <AppIcon className="fa-solid fa-circle-check mr-1"></AppIcon> Paid after verified enrolment
                </div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(243,113,36,.12)" }}
                    >
                      <AppIcon name="check" style={{ fontSize: 12, color: "#F37124" }} />
                    </span>
                    UK Home Students (৳500)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sep"></div>

      {/* ══════════ AMBASSADOR TIERS ══════════ */}
      <section id="ambassador" className="bg-white-sec py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 reveal">
            <span className="pill mb-4" style={{ background: "rgba(243,113,36,.1)", color: "var(--orange)" }}>
              Grow Your Status
            </span>
            <h2 className="font-black text-3xl sm:text-4xl md:text-5xl mb-3" style={{ color: "var(--primary)" }}>
              Ambassador <span className="shimmer-orange">Levels</span>
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">
              Unlock higher tiers as you refer more students - bonuses and recognition at every level.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-12 text-left">
            {/* Bronze */}
            <div
              ref={(el) => { cardRefs.current[6] = el; }}
              className="rounded-[8px] overflow-hidden card reveal d1 group cursor-pointer"
            >
              <div className="tier-bronze p-5 sm:p-7 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  <AppIcon className="fa-solid fa-award"></AppIcon>
                </div>
                <div className="font-black text-lg sm:text-xl">Bronze</div>
                <div className="text-3xl sm:text-4xl font-black mt-1">10</div>
                <div className="text-xs sm:text-sm opacity-80">leads</div>
              </div>
              <div className="p-4 sm:p-5">
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#cd7f32" }}></AppIcon>Official ambassador badge
                  </li>
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#cd7f32" }}></AppIcon>Dashboard access
                  </li>
                </ul>
              </div>
            </div>

            {/* Silver */}
            <div
              ref={(el) => { cardRefs.current[7] = el; }}
              className="rounded-[8px] overflow-hidden card reveal d2 group cursor-pointer"
            >
              <div className="tier-silver p-5 sm:p-7 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  <AppIcon className="fa-solid fa-medal"></AppIcon>
                </div>
                <div className="font-black text-lg sm:text-xl">Silver</div>
                <div className="text-3xl sm:text-4xl font-black mt-1">25</div>
                <div className="text-xs sm:text-sm opacity-80">leads</div>
              </div>
              <div className="p-4 sm:p-5">
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#aaa" }}></AppIcon>All Bronze benefits
                  </li>
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#aaa" }}></AppIcon>Faster payout (e.g. 7 days instead of 14)
                  </li>
                </ul>
              </div>
            </div>

            {/* Gold */}
            <div
              ref={(el) => { cardRefs.current[8] = el; }}
              className="rounded-[8px] overflow-hidden reveal d3 group cursor-pointer"
              style={{
                boxShadow: "0 0 0 2px rgba(200,164,18,.45),0 8px 24px rgba(200,164,18,.12)",
              }}
            >
              <div className="tier-gold p-5 sm:p-7 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <span className="absolute top-2 right-2 text-[10px] sm:text-xs bg-white/25 font-black px-2 py-0.5 rounded-full">
                  Popular
                </span>
                <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  <AppIcon className="fa-solid fa-trophy"></AppIcon>
                </div>
                <div className="font-black text-lg sm:text-xl">Gold</div>
                <div className="text-3xl sm:text-4xl font-black mt-1">50</div>
                <div className="text-xs sm:text-sm opacity-80">leads</div>
              </div>
              <div className="bg-white p-4 sm:p-5">
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#c8a412" }}></AppIcon>All Silver benefits
                  </li>
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#c8a412" }}></AppIcon>Featured on leaderboard
                  </li>
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#c8a412" }}></AppIcon>+৳2 bonus per lead
                  </li>
                </ul>
              </div>
            </div>

            {/* Platinum */}
            <div
              ref={(el) => { cardRefs.current[9] = el; }}
              className="rounded-[8px] overflow-hidden card reveal d4 group cursor-pointer"
            >
              <div className="tier-plat p-5 sm:p-7 text-white text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                  style={{ background: "linear-gradient(135deg,var(--orange),transparent)" }}
                ></div>
                <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  <AppIcon className="fa-regular fa-gem"></AppIcon>
                </div>
                <div className="font-black text-lg sm:text-xl">Platinum</div>
                <div className="text-3xl sm:text-4xl font-black mt-1">100+</div>
                <div className="text-xs sm:text-sm opacity-80">leads</div>
              </div>
              <div className="p-4 sm:p-5">
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#8888b8" }}></AppIcon>All Gold benefits
                  </li>
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#8888b8" }}></AppIcon>Dedicated support contact
                  </li>
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#8888b8" }}></AppIcon>+৳5 bonus per lead
                  </li>
                  <li className="flex items-center gap-2">
                    <AppIcon className="fa-solid fa-check text-[10px]" style={{ color: "#8888b8" }}></AppIcon>VIP badge
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Journey Bar */}
          <div
            ref={(el) => { cardRefs.current[10] = el; }}
            className="card rounded-[8px] p-5 sm:p-8 reveal text-left"
          >
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-5">
              Your Journey to Platinum
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2.5">
              <span>Start</span>
              <span className="hidden sm:inline">10 leads</span>
              <span className="hidden sm:inline">25 leads</span>
              <span className="hidden sm:inline">50 leads</span>
              <span>100+ leads</span>
            </div>
            <div id="prog-parent" className="h-3 sm:h-4 rounded-full overflow-hidden bg-slate-100">
              <div
                className="prog-bar h-full rounded-full"
                id="prog"
                style={{
                  width: progressWidth,
                  background: "linear-gradient(90deg,#cd7f32,#c0c0c0 30%,#d4a017 60%,#8b8ba8)",
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-3 text-xs font-bold">
              <span style={{ color: "#cd7f32" }}>Bronze</span>
              <span className="hidden sm:inline" style={{ color: "#aaa" }}>
                Silver
              </span>
              <span className="hidden sm:inline" style={{ color: "#c8a412" }}>
                Gold
              </span>
              <span style={{ color: "#8888b8" }}>Platinum</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sep"></div>

      {/* ══════════ MOBILE APP SECTION ══════════ */}
      <section id="app" className="bg-tint animated-grid py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Phone Mockup */}
          <div className="flex justify-center order-2 lg:order-1 reveal-l">
            <div className="relative w-full max-w-[300px] sm:max-w-[340px] float-a">
              <Image
                src="/app/ambassador-app-home.png"
                alt="BHE Uni Ambassador app home screen showing tier, balance, refer and earn offer and referral progress"
                width={1182}
                height={1927}
                sizes="(min-width: 640px) 340px, 300px"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Right Text */}
          <div className="text-center lg:text-left order-1 lg:order-2 reveal-r">
            <span className="pill mb-4" style={{ background: "rgba(38,58,127,.1)", color: "var(--primary)" }}>
              Always Connected
            </span>
            <h2 className="font-black text-3xl sm:text-4xl md:text-5xl mb-5 sm:mb-6" style={{ color: "var(--primary)" }}>
              Ambassador Portal
            </h2>
            <p className="text-slate-500 text-base sm:text-lg mb-6 leading-relaxed">
              Monitor your referrals in real-time, register new leads in under 10 seconds, and track every payout milestone all within your personal hub. Use it in your browser, or download the app for iPhone or Android.
            </p>

            {/* App store CTAs */}
            <div className="mb-8 flex flex-col items-center lg:items-start gap-2">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download the BHE Uni Ambassador app on the App Store"
                className="inline-flex items-center gap-3 rounded-[8px] bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                <AppIcon className="fa-brands fa-apple text-3xl"></AppIcon>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                    Download on the
                  </span>
                  <span className="block text-base font-bold">App Store</span>
                </span>
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get the BHE Uni Ambassador app on Google Play"
                className="inline-flex items-center gap-3 rounded-[8px] bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                <AppIcon className="fa-brands fa-google-play text-2xl"></AppIcon>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                    Get it on
                  </span>
                  <span className="block text-base font-bold">Google Play</span>
                </span>
              </a>
              </div>
              <span className="text-xs text-slate-400">Available for iPhone and Android</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 text-left">
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center text-sm flex-shrink-0"
                  style={{ color: "var(--primary)", background: "#eef1fb" }}
                >
                  <AppIcon className="fa-solid fa-bolt"></AppIcon>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Rapid Lead Entry</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Maintain the emphasis on simplicity and GDPR compliance to reinforce professional trust and ease of use.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-[8px] bg-orange-50 text-orange-600 flex items-center justify-center text-sm flex-shrink-0"
                  style={{ color: "var(--orange)", background: "#fff7f0" }}
                >
                  <AppIcon className="fa-solid fa-wallet"></AppIcon>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Instant Earnings Access</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Withdraw your rewards to your bank account on your own schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sep"></div>

      {/* ══════════ AMBASSADOR PROGRAMME BANNER (matches bheuni.uk) ══════════ */}
      <ReferralBanner id="programme" />

      <div className="sep"></div>

      {/* ══════════ JOIN / APPLY SECTION ══════════ */}
      <section id="join" className="bg-tint animated-grid py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[.04] pointer-events-none"
          style={{
            background: "var(--orange)",
            animation: "blobMorph 10s ease-in-out infinite",
            transform: "translate(40%,-40%)",
          }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[.04] pointer-events-none"
          style={{
            background: "var(--primary)",
            animation: "blobMorph 8s ease-in-out infinite reverse",
            transform: "translate(-40%,40%)",
          }}
        ></div>

        <div className="max-w-2xl mx-auto relative z-10 reveal">
          <div className="text-center mb-8 sm:mb-12">
            <span className="pill mb-4 sm:mb-6" style={{ background: "rgba(243,113,36,.1)", color: "var(--orange)" }}>
              Ready to Start?
            </span>
            <h2 className="font-black text-3xl sm:text-4xl md:text-5xl mb-3" style={{ color: "var(--primary)" }}>
              Join <span className="shimmer-orange">BHE Uni</span>
              <br />
              Ambassador Programme
            </h2>
            <p className="text-slate-500 text-base sm:text-lg px-2">Your first referral could be just minutes away.</p>
          </div>

          <div
            className="bg-white rounded-[8px] sm:rounded-[8px] p-6 sm:p-8 md:p-10 border border-slate-100 text-center relative overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(38,58,127,.09)" }}
          >
            {/* Background decorative blobs */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.03] pointer-events-none"
              style={{ background: "var(--orange)" }}
            ></div>
            <div
              className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-[0.03] pointer-events-none"
              style={{ background: "var(--primary)" }}
            ></div>

            <div className="relative z-10 flex flex-col items-center">
              {/* Rocket Icon Container */}
              <div
                className="w-16 h-16 rounded-[8px] flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20"
                style={{ background: "linear-gradient(135deg, var(--orange) 0%, #e5631a 100%)" }}
              >
                <AppIcon className="fa-solid fa-rocket text-2xl animate-bounce"></AppIcon>
              </div>

              <h3 className="font-extrabold text-2xl sm:text-3xl mb-4" style={{ color: "var(--primary)" }}>
                Start Your Ambassador Journey
              </h3>

              <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
                Apply to become an ambassador, track referrals, and withdraw earnings. Set up your account on our secure ambassador portal today!
              </p>

              {/* Bullet Features list */}
              <div className="grid gap-4 w-full max-w-md mb-8 text-left">
                <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-orange-100 text-orange-600 flex-shrink-0">
                    <AppIcon className="fa-solid fa-user-plus text-sm"></AppIcon>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Quick Portal Registration</h4>
                    <p className="text-xs text-slate-500">Sign up and receive your unique tracking links in under 2 minutes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-blue-100 text-blue-600 flex-shrink-0">
                    <AppIcon className="fa-solid fa-chart-line text-sm"></AppIcon>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Real-Time Rewards Tracking</h4>
                    <p className="text-xs text-slate-500">Track and view commissions for every student referral and enrolment.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <AppIcon className="fa-solid fa-wallet text-sm"></AppIcon>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Direct Earnings Payout</h4>
                    <p className="text-xs text-slate-500">Withdraw your accrued rewards directly to your bank account securely when you reach ৳50.</p>
                  </div>
                </div>
              </div>

              {/* Redirect Button */}
              <Link
                href="/signup"
                className="btn-orange w-full max-w-md py-4 rounded-[8px] sm:rounded-[8px] text-sm sm:text-base font-bold flex items-center justify-center gap-2 group shadow-lg shadow-orange-500/20"
              >
                Go to Ambassador Portal
                <AppIcon className="fa-solid fa-arrow-right group-hover:translate-x-1.5 transition-transform duration-200"></AppIcon>
              </Link>

              <p className="text-xs text-slate-400 mt-4">
                You will be redirected to our official portal at <span className="font-semibold text-slate-500">ambassador.bheuni.uk</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ JOIN MODAL ══════════ */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300">
          <div
            onClick={() => setIsJoinOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
          ></div>
          <div className="modal-content relative w-full max-w-xl bg-white rounded-[8px] p-6 sm:p-10 shadow-2xl transform scale-100 transition-transform duration-300 mx-4 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left">
            <button
              onClick={() => setIsJoinOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors z-10"
            >
              <AppIcon className="fa-solid fa-xmark text-lg"></AppIcon>
            </button>

            <div className="text-center mb-8 relative z-0">
              <span className="pill mb-4" style={{ background: "rgba(243,113,36,.1)", color: "var(--orange)" }}>
                Ready to Start?
              </span>
              <h2 className="font-black text-3xl sm:text-4xl mb-3" style={{ color: "var(--primary)" }}>
                Join <span className="shimmer-orange">BHE Uni</span>
              </h2>
              <p className="text-slate-500 text-sm sm:text-base">Your first referral could be just minutes away.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {regMessage && (
                <div
                  className={`p-4 rounded-[8px] text-sm font-semibold border ${regMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                  {regMessage.text}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  className="f-input"
                  placeholder="First Name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  type="text"
                  className="f-input"
                  placeholder="Last Name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="email"
                  className="f-input"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  className="f-input"
                  placeholder="Choose Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="tel"
                  className="f-input"
                  placeholder="Phone Number"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <AppSelect
                  className="f-input text-slate-500"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="">How did you hear about us?</option>
                  <option value="student_friend">Current Student / Friend</option>
                  <option value="social_media">Social Media</option>
                  <option value="notice_board">University Notice Board</option>
                  <option value="email">Email</option>
                  <option value="other">Other</option>
                </AppSelect>
              </div>
              <label className="flex items-start gap-3 text-xs text-slate-500 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  className="mt-0.5 flex-shrink-0"
                  style={{ accentColor: "var(--primary)" }}
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>
                  I agree to the BHE Uni Ambassador Programme terms, GDPR data handling, and compliance requirements.
                </span>
              </label>
              <button
                type="submit"
                disabled={regLoading}
                className="btn-navy w-full py-4 sm:py-5 rounded-[8px] text-sm sm:text-base font-bold mt-4 shadow-lg shadow-blue-900/20 cursor-pointer"
              >
                {regLoading ? "Registering..." : <>{"Apply to Join the Programme "}<AppIcon name="arrow-right" /></>}
              </button>
              <p className="text-xs text-slate-400 mt-4 text-center">Applications reviewed within 3–5 working days.</p>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ LOGIN MODAL ══════════ */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300">
          <div
            onClick={() => setIsLoginOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
          ></div>
          <div className="modal-content relative w-full max-w-md bg-white rounded-[8px] p-6 sm:p-10 shadow-2xl transform scale-100 transition-transform duration-300 mx-4 text-left">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors z-10"
            >
              <AppIcon className="fa-solid fa-xmark text-lg"></AppIcon>
            </button>

            <div className="text-center mb-8 relative z-0">
              <div className="inline-block p-3 rounded-[8px] bg-blue-50 border border-blue-100 mb-4">
                <AppIcon className="fa-solid fa-user-shield text-2xl" style={{ color: "var(--primary)" }}></AppIcon>
              </div>
              <h2 className="font-black text-3xl sm:text-4xl mb-2" style={{ color: "var(--primary)" }}>
                Ambassador Login
              </h2>
              <p className="text-slate-500 text-sm sm:text-base">Access your dashboard to track earnings.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-xs font-semibold text-center">
                  {loginError}
                </div>
              )}
              <div>
                <input
                  type="email"
                  className="f-input font-medium"
                  placeholder="University Email Address"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="password"
                  className="f-input font-medium"
                  placeholder="Password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <div className="text-right">
                <a href="#" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="btn-navy w-full py-4 rounded-[8px] text-sm sm:text-base font-bold mt-2 shadow-lg shadow-blue-900/20 cursor-pointer"
              >
                {loginLoading ? "Signing In..." : "Sign In to Dashboard"}
              </button>
              <p className="text-xs text-slate-400 pt-2 text-center">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setRegMessage(null);
                    setIsLoginOpen(false);
                    setIsJoinOpen(true);
                  }}
                  className="font-bold text-orange-500 hover:underline"
                >
                  Register Now
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ FOOTER ══════════ */}
      <footer id="compliance" className="relative bg-[#0a0f1c] pt-16 pb-8 px-4 sm:px-6 overflow-hidden border-t border-slate-800 text-left">
        {/* BG Glows */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 pointer-events-none blur-[100px]"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        ></div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-16">
          <div className="lg:col-span-1 text-center md:text-left">
            <div className="mb-5 inline-block">
              <Image
                src="/logo-white.png"
                alt="BHE UNI Logo"
                width={153}
                height={61}
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Empowering students to earn through ethical referrals while helping others access higher education globally.
            </p>
            <div className="flex gap-3 justify-center md:justify-start">
              <a
                href="https://www.facebook.com/bheambassador"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <AppIcon className="fa-brands fa-facebook-f"></AppIcon>
              </a>
              <a
                href="https://twitter.com/bhe_uni"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <AppIcon className="fa-brands fa-x-twitter"></AppIcon>
              </a>
              <a
                href="https://www.linkedin.com/company/bheuniuk/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <AppIcon className="fa-brands fa-linkedin-in"></AppIcon>
              </a>
              <a
                href="https://www.instagram.com/bhe_uni/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <AppIcon className="fa-brands fa-instagram"></AppIcon>
              </a>
              <a
                href="https://www.youtube.com/@bheuni2"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <AppIcon className="fa-brands fa-youtube"></AppIcon>
              </a>
              <a
                href="https://www.tiktok.com/@bhe_uni"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <AppIcon className="fa-brands fa-tiktok"></AppIcon>
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-slate-100 font-bold mb-5 text-sm">Programme</h5>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <a href="#levels" className="hover:text-orange-400 transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-chevron-right text-[10px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> Reward Levels
                </a>
              </li>
              <li>
                <a href="#ambassador" className="hover:text-orange-400 transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-chevron-right text-[10px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> Ambassador Tiers
                </a>
              </li>
              <li>
                <a href="#programme" className="hover:text-orange-400 transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-chevron-right text-[10px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> Ambassador Programme
                </a>
              </li>
              <li>
                <a href="#app" className="hover:text-orange-400 transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-chevron-right text-[10px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> Mobile App
                </a>
              </li>
              <li>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-400 transition-colors inline-flex items-center gap-2"
                >
                  <AppIcon className="fa-brands fa-google-play text-[11px] opacity-70 w-5 text-center flex-shrink-0"></AppIcon> Get the Android App
                </a>
              </li>
              <li>
                <a href="#join" className="hover:text-orange-400 transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-chevron-right text-[10px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> Apply Now
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-slate-100 font-bold mb-5 text-sm">Legal &amp; Compliance</h5>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/gdpr-policy" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-shield-halved text-[12px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> GDPR Policy
                </Link>
              </li>
              <li>
                <Link href="/rewards-terms-and-conditions" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-handshake text-[12px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> Rewards Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <AppIcon className="fa-solid fa-user-lock text-[12px] opacity-50 w-5 text-center flex-shrink-0"></AppIcon> Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-slate-100 font-bold mb-5 text-sm">Contact Support</h5>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <AppIcon className="fa-solid fa-envelope mt-1 text-slate-500 w-5 text-center flex-shrink-0"></AppIcon>
                <a href="mailto:ask@bheuni.io" className="hover:text-orange-400 transition-colors">
                  ask@bheuni.io
                </a>
              </li>
              <li className="flex items-start gap-3">
                <AppIcon className="fa-solid fa-location-dot mt-1 text-slate-500 w-5 text-center flex-shrink-0"></AppIcon>
                <span>11 Beaufort Court, Admirals Way, Canary Wharf, London, E14 9XL</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All systems operational</span>
          </div>
          <div className="text-center md:text-left">
            &copy; 2026 BHE University. All rights reserved. <span className="hidden md:inline mx-2 text-slate-700">|</span> <br className="md:hidden" />
            Designed for BHE Uni Ambassador Programme
          </div>
        </div>
      </footer>
    </div>
  );
}
