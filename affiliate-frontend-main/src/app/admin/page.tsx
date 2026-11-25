"use client";

import AppIcon from "@/components/AppIcon";
import { formatMoney } from "@/lib/currency";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Activity {
  type: string;
  title: string;
  description: string;
  time: string;
  referral_id?: string;
  source?: string;
  status?: string;
  lead_reward_paid?: boolean;
  awaiting_reward?: boolean;
  reward_amount?: number;
  enrolment_reward_paid?: boolean;
  enrolment_awaiting_reward?: boolean;
  enrolment_reward_amount?: number;
  enrolment_installment_1_paid?: boolean;
  enrolment_installment_2_paid?: boolean;
  enrolment_installment_amount?: number;
}

interface Ambassador {
  full_name: string;
  email: string;
  total_earned: number;
  tier: string;
  wallet_balance: number;
}

interface AdminStats {
  total_referrals: number;
  referrals_this_week: number;
  payouts_this_month: number;
  new_ambassadors?: number;
  total_ambassadors?: number;
  total_qualified?: number;
  total_not_qualified?: number;
  total_enrolled?: number;
  total_applications?: number;
  pending_rewards_count?: number;
  pending_rewards_amount?: number;
  pending_enrolment_rewards_count?: number;
  pending_enrolment_rewards_amount?: number;
  pending_payouts_count?: number;
  pending_payouts_amount?: number;
  wallet_liability?: number;
  recent_activity: Activity[];
  top_ambassadors: Ambassador[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.get<AdminStats>("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load admin dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Live monitor — silently re-pull every 30s (no spinner flash on polls).
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  // Manual reward approval — credits the ambassador for a qualified lead that
  // flowed in from the CRM. Refreshes the feed so the item flips to "Paid".
  const handlePayReward = async (referralId: string) => {
    setPayingId(referralId);
    try {
      await api.post(`/admin/referrals/${referralId}/pay-lead-reward`, {});
      await fetchStats();
    } catch (err) {
      console.error("Failed to pay lead reward", err);
      alert(err instanceof Error ? err.message : "Failed to pay reward.");
    } finally {
      setPayingId(null);
    }
  };

  // Manual denial — reject the qualified lead so no reward is paid.
  const handleDenyReward = async (referralId: string) => {
    if (!window.confirm("Deny this lead reward? The ambassador will not be paid for this referral.")) return;
    setDenyingId(referralId);
    try {
      await api.post(`/admin/referrals/${referralId}/deny-lead-reward`, {});
      await fetchStats();
    } catch (err) {
      console.error("Failed to deny lead reward", err);
      alert(err instanceof Error ? err.message : "Failed to deny reward.");
    } finally {
      setDenyingId(null);
    }
  };

  // Enrolment reward — approve the NEXT ৳250 installment straight from the feed.
  const handlePayEnrolmentInstallment = async (referralId: string, n: 1 | 2, amount: number) => {
    if (!window.confirm(`Approve installment ${n} of 2 (${formatMoney(amount)})? This credits the ambassador's wallet now.`)) return;
    setPayingId(referralId);
    try {
      await api.post(`/admin/referrals/${referralId}/pay-enrolment-installment/${n}`, {});
      await fetchStats();
    } catch (err) {
      console.error("Failed to pay enrolment installment", err);
      alert(err instanceof Error ? err.message : "Failed to pay enrolment installment.");
    } finally {
      setPayingId(null);
    }
  };

  const handleDenyEnrolment = async (referralId: string) => {
    if (!window.confirm("Deny this enrolment reward? The ambassador will not be paid the ৳500 (their lead stays enrolled).")) return;
    setDenyingId(referralId);
    try {
      await api.post(`/admin/referrals/${referralId}/deny-enrolment-reward`, {});
      await fetchStats();
    } catch (err) {
      console.error("Failed to deny enrolment reward", err);
      alert(err instanceof Error ? err.message : "Failed to deny enrolment reward.");
    } finally {
      setDenyingId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return formatMoney(val);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "referral":
        return { icon: "fa-graduation-cap", bg: "bg-emerald-500/20 text-emerald-400" };
      case "payout":
        return { icon: "fa-money-bill-transfer", bg: "bg-orange-500/20 text-orange-400" };
      default:
        return { icon: "fa-bell", bg: "bg-blue-500/20 text-blue-400" };
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      case "gold":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "silver":
        return "bg-slate-400/20 text-slate-300 border border-slate-400/30";
      default:
        return "bg-amber-600/20 text-amber-500 border border-amber-600/30";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <AppIcon className="fa-solid fa-circle-notch animate-spin text-2xl text-orange-500"></AppIcon>
      </div>
    );
  }

  if (!stats) return <p className="text-red-400">Failed to load administrator statistics.</p>;

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard Overview</h1>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/[0.12] border border-emerald-500/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
          </span>
        </div>
        <p className="text-slate-400">Welcome back, Administrator. Auto-refreshes every 30s.</p>
      </header>

      {/* KPI Cards — all live from /admin/stats */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-5 mb-6">
        <div className="admin-card !p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-400 text-xs sm:text-sm tracking-wide">Total Leads</h3>
            <div className="card-icon bg-blue-500/15 text-blue-400"><AppIcon className="fa-solid fa-user-graduate"></AppIcon></div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">{stats.total_referrals}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            <AppIcon className="fa-solid fa-arrow-trend-up mr-1"></AppIcon>+{stats.referrals_this_week} this week
          </p>
        </div>

        <div className="admin-card !p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-400 text-xs sm:text-sm tracking-wide">Ambassadors</h3>
            <div className="card-icon bg-orange-500/15 text-orange-400"><AppIcon className="fa-solid fa-users"></AppIcon></div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">{stats.total_ambassadors ?? "—"}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">+{stats.new_ambassadors ?? 0} this week</p>
        </div>

        <div className="admin-card !p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-400 text-xs sm:text-sm tracking-wide">Qualified</h3>
            <div className="card-icon bg-emerald-500/15 text-emerald-400"><AppIcon className="fa-solid fa-circle-check"></AppIcon></div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">{stats.total_qualified ?? "—"}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Reached qualified stage</p>
        </div>

        <div className="admin-card !p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-400 text-xs sm:text-sm tracking-wide">Not Qualified</h3>
            <div className="card-icon bg-rose-500/15 text-rose-400"><AppIcon className="fa-solid fa-circle-xmark"></AppIcon></div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">{stats.total_not_qualified ?? 0}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Marked not qualified</p>
        </div>

        <div className="admin-card !p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-400 text-xs sm:text-sm tracking-wide">Applications</h3>
            <div className="card-icon bg-sky-500/15 text-sky-400"><AppIcon className="fa-solid fa-file-lines"></AppIcon></div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">{stats.total_applications ?? 0}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Submitted an application</p>
        </div>

        <div className="admin-card !p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-400 text-xs sm:text-sm tracking-wide">Enrolled</h3>
            <div className="card-icon bg-teal-500/15 text-teal-400"><AppIcon className="fa-solid fa-graduation-cap"></AppIcon></div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">{stats.total_enrolled ?? 0}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Students enrolled</p>
        </div>

        <div className="admin-card !p-5">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-400 text-xs sm:text-sm tracking-wide">Wallet Liability</h3>
            <div className="card-icon bg-purple-500/15 text-purple-400"><AppIcon className="fa-solid fa-scale-balanced"></AppIcon></div>
          </div>
          <p className="text-3xl font-black text-white mt-4 tracking-tight">{formatCurrency(stats.wallet_liability ?? 0)}</p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Owed to ambassadors</p>
        </div>
      </div>

      {/* Action queues — what needs the admin's attention right now */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
        <Link href="/admin/leads?reward=pending" className="admin-card !p-5 hover:border-orange-500/30 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400">Lead rewards to approve</p>
            <p className="text-2xl font-black text-white mt-1">
              {stats.pending_rewards_count ?? 0}
              <span className="text-sm font-bold text-orange-400 ml-2">{formatCurrency(stats.pending_rewards_amount ?? 0)}</span>
            </p>
          </div>
          <AppIcon className="fa-solid fa-arrow-right text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all"></AppIcon>
        </Link>

        <Link href="/admin/applications?reward=pending" className="admin-card !p-5 hover:border-orange-500/30 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400">Enrolled rewards to approve</p>
            <p className="text-2xl font-black text-white mt-1">
              {stats.pending_enrolment_rewards_count ?? 0}
              <span className="text-sm font-bold text-orange-400 ml-2">{formatCurrency(stats.pending_enrolment_rewards_amount ?? 0)}</span>
            </p>
          </div>
          <AppIcon className="fa-solid fa-arrow-right text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all"></AppIcon>
        </Link>

        <Link href="/admin/payouts?status=pending" className="admin-card !p-5 hover:border-orange-500/30 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400">Payouts pending</p>
            <p className="text-2xl font-black text-white mt-1">
              {stats.pending_payouts_count ?? 0}
              <span className="text-sm font-bold text-orange-400 ml-2">{formatCurrency(stats.pending_payouts_amount ?? 0)}</span>
            </p>
          </div>
          <AppIcon className="fa-solid fa-arrow-right text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all"></AppIcon>
        </Link>

        <div className="admin-card !p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Paid this month</p>
            <p className="text-2xl font-black text-white mt-1">{formatCurrency(stats.payouts_this_month)}</p>
          </div>
          <div className="card-icon bg-emerald-500/15 text-emerald-400"><AppIcon className="fa-solid fa-wallet"></AppIcon></div>
        </div>
      </div>

      {/* Grid: Activity and Top performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity — the live inflow of referred leads from the CRM */}
        <div className="lg:col-span-2 admin-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white">Recent Activity</h3>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lead inflow</span>
          </div>
          <div className="space-y-2.5">
            {stats.recent_activity.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent program activity found.</p>
            ) : (
              stats.recent_activity.map((activity, idx) => {
                const meta = getActivityIcon(activity.type);
                const isPaying = payingId === activity.referral_id;
                const isDenying = denyingId === activity.referral_id;
                const isDenied = activity.source === "crm" && activity.status === "rejected" && !activity.lead_reward_paid;
                return (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-[8px] bg-white/5 hover:bg-white/[0.07] transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <AppIcon className={`fa-solid ${meta.icon}`}></AppIcon>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{activity.title}</p>
                      <p className="text-xs text-slate-400 truncate">{activity.description}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2.5 shrink-0">
                      {activity.enrolment_awaiting_reward && activity.referral_id ? (
                        <>
                          <button
                            onClick={() => handlePayEnrolmentInstallment(
                              activity.referral_id!,
                              activity.enrolment_installment_1_paid ? 2 : 1,
                              activity.enrolment_installment_amount ?? 0
                            )}
                            disabled={isPaying || isDenying}
                            className="admin-btn bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {isPaying ? (
                              <><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> Approving...</>
                            ) : (
                              <><AppIcon className="fa-solid fa-graduation-cap"></AppIcon> Approve {activity.enrolment_installment_1_paid ? "2nd" : "1st"} {formatCurrency(activity.enrolment_installment_amount ?? 0)}</>
                            )}
                          </button>
                          {!activity.enrolment_installment_1_paid && (
                            <button
                              onClick={() => handleDenyEnrolment(activity.referral_id!)}
                              disabled={isPaying || isDenying}
                              className="admin-btn bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-400 disabled:opacity-60 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                            >
                              {isDenying ? (
                                <><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon></>
                              ) : (
                                <><AppIcon className="fa-solid fa-xmark"></AppIcon> Deny</>
                              )}
                            </button>
                          )}
                        </>
                      ) : activity.awaiting_reward && activity.referral_id ? (
                        <>
                          <button
                            onClick={() => handlePayReward(activity.referral_id!)}
                            disabled={isPaying || isDenying}
                            className="admin-btn bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {isPaying ? (
                              <><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> Approving...</>
                            ) : (
                              <><AppIcon className="fa-solid fa-check"></AppIcon> Approve {formatCurrency(activity.reward_amount ?? 0)}</>
                            )}
                          </button>
                          <button
                            onClick={() => handleDenyReward(activity.referral_id!)}
                            disabled={isPaying || isDenying}
                            className="admin-btn bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-400 disabled:opacity-60 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {isDenying ? (
                              <><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon></>
                            ) : (
                              <><AppIcon className="fa-solid fa-xmark"></AppIcon> Deny</>
                            )}
                          </button>
                        </>
                      ) : activity.enrolment_reward_paid ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                          <AppIcon className="fa-solid fa-graduation-cap mr-1"></AppIcon>{formatCurrency(activity.enrolment_reward_amount ?? 0)} Paid
                        </span>
                      ) : activity.lead_reward_paid ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                          <AppIcon className="fa-solid fa-check mr-1"></AppIcon>Paid
                        </span>
                      ) : isDenied ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">
                          <AppIcon className="fa-solid fa-xmark mr-1"></AppIcon>Denied
                        </span>
                      ) : null}
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {activity.time ? new Date(activity.time).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Ambassadors */}
        <div className="admin-card">
          <h3 className="font-bold text-white mb-6">Top Ambassadors</h3>
          <div className="space-y-4">
            {stats.top_ambassadors.length === 0 ? (
              <p className="text-slate-500 text-sm">No ambassadors registered yet.</p>
            ) : (
              stats.top_ambassadors.map((amb, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs">
                    {amb.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{amb.full_name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(amb.total_earned)} earned</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${getTierBadge(amb.tier)}`}>
                    {amb.tier}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
