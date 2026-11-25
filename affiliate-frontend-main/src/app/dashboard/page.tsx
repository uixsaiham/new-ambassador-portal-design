"use client";

import ReferralModal from "@/components/ReferralModal";
import AppIcon from "@/components/AppIcon";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AmbassadorMilestones from "@/components/AmbassadorMilestones";
import DashboardOverview from "@/components/DashboardOverview";
import LatestReferrals from "@/components/LatestReferrals";
import { type TierConfig } from "@/lib/tier";
import { usePortalLanguage, formatMoney } from "@/context/PortalLanguage";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  counsellor_id?: string | null;
  counsellor_name?: string | null;
  role: string;
}

interface Activity {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  created_at: string;
}

interface Referral {
  education_interest?: string | null;
  id: string;
  lead_name: string;
  status: string;
  rejection_reason?: string | null;
  application_notes?: string | null;
  // Refer & Earn: exact CRM lead status + the counsellor's reason for the last
  // change (mirrored verbatim from the CRM Affiliate-Leads tab).
  crm_lead_status?: string | null;
  status_reason?: string | null;
  lead_reward_paid: boolean;
  enrolment_reward_paid: boolean;
  // Two-installment enrolment reward (৳250 each): status + dates so the dashboard
  // shows each installment as Paid or Awaiting with its estimated window.
  enrolled_at?: string | null;
  enrolment_installment_1_paid?: boolean;
  enrolment_installment_2_paid?: boolean;
  enrolment_installment_1_paid_at?: string | null;
  enrolment_installment_2_paid_at?: string | null;
  // Refer & Earn: EXACT CRM application stage/status (mirrored verbatim). We show
  // the real stage as a tile; application_status_label is the 5-state rollup kept
  // for the summary pill counts.
  application_stage?: string | null;
  application_status?: string | null;
  application_status_label?: string;
  created_at: string;
  updated_at?: string | null;
}

interface Stats {
  total_earned: number;
  wallet_balance: number;
  total_leads: number;
  total_enrolments: number;
  tier: string;
  leads_to_next_tier: number;
  referral_code: string;
  recent_activity: Activity[];
  tier_configs: TierConfig[];
}


export default function AmbassadorDashboardPage() {
  const { language } = usePortalLanguage();
  const bn = language === "bn";
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [leadMsg, setLeadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userData, statsData, referralsData] = await Promise.all([
          api.get<UserProfile>("/auth/me"),
          api.get<Stats>("/ambassador/stats"),
          api.get<Referral[]>("/ambassador/referrals"),
        ]);
        setProfile(userData);
        setStats(statsData);
        setReferrals(referralsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load your workspace.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // The ambassador's shareable link points at THIS site's public referral landing
  // (/r/{code}) — the page with the OG preview + capture form that feeds the CRM.
  const referralLink = stats
    ? `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/r/${stats.referral_code}`
    : "";

  // Wait for clipboard success before showing the confirmation.
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { setLeadMsg({ type: "error", text: "Could not copy the link. Select and copy it manually." }); }
  };

  const refreshReferrals = async () => {
    try {
      const [list, latest] = await Promise.all([api.get<Referral[]>("/ambassador/referrals"), api.get<Stats>("/ambassador/stats")]);
      setReferrals(list);
      setStats(latest);
    } catch {
      setLeadMsg({ type: "error", text: "Your referral was saved, but the list could not refresh. Reload to see the latest status." });
    }
  };

  if (loading) return <div className="overview-skeleton" aria-busy="true"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /><p>{bn ? "ড্যাশবোর্ড লোড হচ্ছে…" : "Loading your overview…"}</p></div>;
  if (!stats) return <div className="portal-empty" role="alert"><h1>{bn ? "তথ্য লোড করা যায়নি" : "Your overview couldn’t load"}</h1><p>{error}</p><button className="portal-button" onClick={() => window.location.reload()}>{bn ? "আবার চেষ্টা করুন" : "Try again"}</button></div>;
  const money = (value: number) => formatMoney(value, language, "BDT");
  const number = (value: number) => new Intl.NumberFormat(bn ? "bn-BD" : "en-US").format(value);
  return (
    <div className="overview-page">
      <DashboardOverview stats={stats} referrals={referrals} name={profile?.full_name || "Ambassador"} referralLink={referralLink} copied={copied} onCopy={copyLink} onAdd={() => setShowLeadForm(true)} />
      {leadMsg && <div className={`portal-feedback ${leadMsg.type}`} role={leadMsg.type === "error" ? "alert" : "status"}>{leadMsg.text}<button aria-label="Dismiss message" onClick={() => setLeadMsg(null)}><AppIcon name="xmark" /></button></div>}
      <ReferralModal open={showLeadForm} onClose={() => setShowLeadForm(false)} onSaved={async () => { setLeadMsg({type:"success",text:"Referral submitted successfully."}); await refreshReferrals(); }} />

      {/* Referral Tracking — live lead pipeline synced from the L2E CRM */}
      <LatestReferrals referrals={referrals} onAdd={() => setShowLeadForm(true)} />

      <div className="mt-8"><AmbassadorMilestones /></div>

      {/* The phone + counsellor prompt that used to live here has moved into
          PolicyConsentGate, so a new ambassador completes onboarding in ONE step
          instead of three stacked popups. See that component for the rationale. */}
    </div>
  );
}

