"use client";

import ReferralModal from "@/components/ReferralModal";
import AppIcon from "@/components/AppIcon";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import LatestReferrals, { getReferralStage, earned } from "@/components/LatestReferrals";
import { formatMoney, usePortalLanguage } from "@/context/PortalLanguage";
import "./referrals.css";

interface Referral {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  education_interest: string;
  status: string;
  lead_reward_paid: boolean;
  enrolment_reward_paid: boolean;
  created_at: string;
}

export default function ReferralsPage() {
  const { language } = usePortalLanguage();
  const bn = language === "bn";
  const [showReferral, setShowReferral] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchReferrals = async () => {
    try {
      setFetchError(false);
      const data = await api.get<Referral[]>("/ambassador/referrals");
      setReferrals(data);
    } catch (err) {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const matched = referrals.filter(referral => {
    const step = getReferralStage(referral, bn).step;
    const matchesFilter = filter === "all" || (filter === "needs" && step === 1) || (filter === "progress" && step >= 2 && step <= 4) || (filter === "enrolled" && step === 5) || (filter === "ineligible" && step === 0);
    return matchesFilter && [referral.lead_name, referral.lead_email, referral.education_interest].some(value => value?.toLowerCase().includes(search.toLowerCase()));
  });
  return (
    <div className="referrals-page">
      <header className="referrals-page-heading"><div><h1>{bn ? "এগিয়ে চলেছে নতুন সম্ভাবনা।" : "Good things are moving."}</h1><p>{bn ? "প্রথম পরিচয় থেকে প্রথম দিন, প্রতিটি বন্ধুর যাত্রা দেখুন।" : "Follow every friend’s journey, from first hello to first day."}</p></div><button className="referrals-add" onClick={() => setShowReferral(true)}><span aria-hidden="true"><AppIcon name="plus" /></span>{bn ? "রেফারেল যোগ করুন" : "Add referral"}</button></header>
      <section className="referrals-summary" aria-label="Referral summary">
        {[{label:bn ? "মোট রেফারেল" : "Total referrals", value:referrals.length}, {label:bn ? "যাচাইকৃত সম্ভাবনা" : "Verified potential",value:referrals.filter(r => getReferralStage(r, bn).step >= 2).length}, {label:bn ? "ভর্তি হয়েছে" : "Enrolled",value:referrals.filter(r => getReferralStage(r, bn).step === 5).length}, {label:bn ? "জমা হওয়া পুরস্কার" : "Rewards credited",value:formatMoney(referrals.reduce((sum,r) => sum + earned(r),0),language)}].map((item,index) => <div key={item.label}><p>{item.label}</p><strong className={index === 3 ? "referrals-rewards" : ""}>{loading ? "—" : item.value}</strong></div>)}
      </section>
      {message && <p className={`referrals-message message-${message.type}`} role="status">{message.text}</p>}
      <div className="referrals-toolbar"><div className="referrals-filters" role="group" aria-label="Filter referrals">{[{key:"all",label:bn ? "সব" : "All"},{key:"needs",label:bn ? "আপনার অপেক্ষায়" : "Needs you"},{key:"progress",label:bn ? "চলমান" : "In progress"},{key:"enrolled",label:bn ? "ভর্তি হয়েছে" : "Enrolled"},{key:"ineligible",label:bn ? "অযোগ্য" : "Not eligible"}].map(tab => <button key={tab.key} aria-pressed={filter === tab.key} className={filter === tab.key ? "is-active" : ""} onClick={() => setFilter(tab.key)}>{tab.label}{tab.key === "all" && <span>{referrals.length}</span>}</button>)}</div><label className="referrals-search"><AppIcon className="fa-solid fa-magnifying-glass" aria-hidden="true"/><input aria-label="Search referrals" type="search" placeholder={bn ? "বন্ধুদের খুঁজুন…" : "Search your friends…"} value={search} onChange={e => setSearch(e.target.value)}/></label></div>
      {loading ? <p className="referrals-state" role="status">{bn ? "লোড হচ্ছে…" : "Loading your referrals…"}</p> : fetchError ? <div className="referrals-state" role="alert">Couldn’t load your referrals. <button onClick={fetchReferrals}>Try again</button></div> : matched.length === 0 && referrals.length > 0 ? <p className="referrals-state">{bn ? "কোনো রেফারেল পাওয়া যায়নি।" : "No referrals match your search or filter."}</p> : <LatestReferrals referrals={matched} fullPage onAdd={() => setShowReferral(true)}/>}
      <ReferralModal open={showReferral} onClose={() => setShowReferral(false)} onSaved={async () => { setMessage({type:"success",text:"Referral submitted successfully."}); await fetchReferrals(); }}/>

    </div>
  );
}
