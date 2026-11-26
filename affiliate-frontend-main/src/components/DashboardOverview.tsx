"use client";

import AppIcon from "@/components/AppIcon";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { useRef } from "react";
import { api } from "@/lib/api";
import { getTierProgress, type TierConfig } from "@/lib/tier";
import { formatMoney, usePortalLanguage } from "@/context/PortalLanguage";
import { getReferralStage } from "@/components/LatestReferrals";

type Referral = Parameters<typeof getReferralStage>[0];
type Stats = {
  total_earned: number;
  wallet_balance: number;
  total_leads: number;
  total_enrolments: number;
  tier: string;
  leads_to_next_tier: number;
  tier_configs: TierConfig[];
};
type Payout = { amount: number; status: string };

export default function DashboardOverview({ stats, referrals, name, referralLink, copied, onCopy, onAdd }: {
  stats: Stats; referrals: Referral[]; name: string; referralLink: string; copied: boolean; onCopy: () => Promise<void>; onAdd: () => void;
}) {
  const { language } = usePortalLanguage();
  const bn = language === "bn";
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [payoutError, setPayoutError] = useState(false);
  const qrDialog = useRef<HTMLDialogElement>(null);
  const [qrImage, setQrImage] = useState("");
  const showQr = async () => {
    try {
      setQrImage(await QRCode.toDataURL(referralLink, { width: 280, margin: 2, color: { dark: "#283270", light: "#ffffff" } }));
      qrDialog.current?.showModal();
    } catch { setSharingError("Couldn’t create a QR code. Try copying your link."); }
  };
  const [sharingError, setSharingError] = useState("");
  const [now] = useState(() => new Date());
  const loadPayouts = () => {
    setPayoutError(false);
    api.get<Payout[]>("/ambassador/payouts").then(setPayouts).catch(() => setPayoutError(true));
  };
  useEffect(() => { loadPayouts(); }, []);
  const money = (amount: number) => formatMoney(amount, language);
  const number = (amount: number) => new Intl.NumberFormat(bn ? "bn-BD" : "en-US").format(amount);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(now));
  const greeting = bn ? (hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ অপরাহ্ণ" : "শুভ সন্ধ্যা") : (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  const pending = payouts?.filter(p => ["pending", "approved", "processing"].includes(p.status)).reduce((sum, p) => sum + Number(p.amount), 0);
  const paid = payouts?.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const nudge = referrals.find(r => { const step = getReferralStage(r, false).step; return step > 0 && step < 5 && r.lead_email; });
  const nudgeName = nudge?.lead_name.split(" ")[0];
  const progress = getTierProgress(stats.tier, stats.leads_to_next_tier, stats.tier_configs);
  const stages = (bn ? ["যোগাযোগ", "যোগ্য", "আবেদন", "অফার", "ভর্তি"] : ["Enquired", "Qualified", "Applied", "Offer", "Enrolled"]).map((label, index) => ({ label, count: referrals.filter(r => getReferralStage(r, false).step === index + 1).length }));
  const rejected = referrals.filter(r => getReferralStage(r, false).step === 0).length;
  const totalActive = stages.reduce((total, item) => total + item.count, 0);
  const balance = Number(stats.wallet_balance || 0).toFixed(2).split(".");
  const share = async () => {
    try {
      setSharingError("");
      if (navigator.share) await navigator.share({ title: "BHE Uni · Your next step", url: referralLink });
      else await onCopy();
    } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setSharingError(bn ? "লিংক শেয়ার করা যায়নি। কপি করে চেষ্টা করুন।" : "Couldn’t share this link. Try copying it instead."); }
  };

  return <>
    <div className="overview-heading reference-heading"><div><h1>{greeting}, {name.split(" ")[0]}.</h1><p>{bn ? "বন্ধুর তথ্য যোগ করুন। তাদের নতুন যাত্রার শুরু হোক আপনার হাত ধরে।" : "Add a friend’s details. Help their next chapter begin."}</p></div><div className="overview-primary-actions"><button type="button" className="overview-add-referral" onClick={onAdd}><AppIcon name="user-plus"/><span>{bn ? "রেফারেল যোগ করুন" : "Add referral"}</span><AppIcon name="arrow-up-right-from-square"/></button></div></div>
    <section className="navy-referral-band" aria-label={bn ? "আপনার রেফারেল লিংক" : "Your referral link"}><span className="referral-share-icon"><AppIcon className="fa-solid fa-share-nodes" aria-hidden="true" /></span><div className="referral-band-link"><p>{bn ? "আপনার লিংক। তাদের প্রথম পদক্ষেপ।" : "YOUR LINK. THEIR FIRST STEP."}</p><a href={referralLink} target="_blank" rel="noreferrer">{referralLink.replace(/^https?:\/\//, "")}</a></div><div className="referral-link-context"><span className="referral-connections-icon"><AppIcon name="user-group"/></span><div><strong>{number(referrals.length)} <span>{bn ? "পরিচয়" : "connections"}</span></strong><p>{bn ? "প্রতিটি পরিচয়ে নতুন সম্ভাবনা।" : "New possibilities with every share."}</p></div></div><div className="referral-band-actions"><button onClick={onCopy} className="navy-copy-button" aria-live="polite"><AppIcon className={`fa-regular ${copied ? "fa-circle-check" : "fa-copy"}`} aria-hidden="true" />{copied ? (bn ? "কপি হয়েছে" : "Copied") : (bn ? "কপি করুন" : "Copy link")}</button><button className="navy-share-button" title={bn ? "কিউআর কোড" : "Show QR code"} onClick={showQr} aria-label={bn ? "কিউআর কোড দেখুন" : "Show referral QR code"}><AppIcon name="qrcode" style={{ fontSize: 18 }} /></button><button className="navy-share-button" title={bn ? "লিংক শেয়ার করুন" : "Share your link"} onClick={share} aria-label={bn ? "লিংক শেয়ার করুন" : "Share referral link"}><AppIcon className="fa-solid fa-share-nodes" aria-hidden="true" /></button></div>{sharingError && <p className="share-error" role="alert">{sharingError}</p>}</section>
    <div className="reference-balance-grid"><section className="balance-feature" aria-labelledby="balance-feature-title"><div className="balance-feature-main balance-feature-combined"><div className="balance-primary"><div className="balance-label"><h2 id="balance-feature-title"><span />{bn ? "উত্তোলনযোগ্য" : "AVAILABLE TO WITHDRAW"}</h2><span className="balance-wallet"><AppIcon className="fa-solid fa-wallet" aria-hidden="true" /></span></div><p className="balance-big">{money(Number(balance[0]))}<span>.{bn ? new Intl.NumberFormat("bn-BD", { minimumIntegerDigits: 2 }).format(Number(balance[1])) : balance[1]}</span></p><div className="balance-feature-bottom"><p>{bn ? "আপনার ওয়ালেটে" : "Ready in your wallet"}</p><Link href="/dashboard/wallet/request" className="request-payout">{bn ? "পেআউট অনুরোধ করুন" : "Request payout"}<span aria-hidden="true"><AppIcon name="arrow-up-right-from-square" /></span></Link></div></div><section className="balance-journey" aria-label={bn ? "আপনার অর্জন" : "Your journey at a glance"}><dl>
      <div className="journey-earnings"><dt>{bn ? "মোট আয়" : "Total earnings"}</dt><dd>{money(stats.total_earned)}<p>{bn ? "এ পর্যন্ত অর্জিত" : "Earned throughout your journey"}</p></dd></div>
      <div><dt>{bn ? "মোট রেফারেল" : "People referred"}</dt><dd>{number(stats.total_leads)}<p>{bn ? "আপনার মাধ্যমে পরিচিত" : "Connections you’ve made"}</p></dd></div>
      <div><dt>{bn ? "ভর্তি সম্পন্ন" : "Successful enrolments"}</dt><dd>{number(stats.total_enrolments)}<p>{bn ? "নতুন যাত্রা শুরু" : "New chapters started"}</p></dd></div>
    </dl></section></div><div className="balance-payout-summary">{payoutError ? <p role="status">{bn ? "পেআউটের সারাংশ লোড হয়নি।" : "Payout summary unavailable."}<button onClick={loadPayouts}>{bn ? "আবার চেষ্টা" : "Retry"}</button></p> : <><span><i className="payout-dot pending" />{bn ? "পর্যালোচনায়" : "In review"}{payouts ? <strong>{money(pending || 0)}</strong> : <span className="inline-skeleton" aria-label="Loading pending payouts" />}</span><span><i className="payout-dot paid" />{bn ? "পরিশোধিত" : "Paid out"}{payouts ? <strong>{money(paid || 0)}</strong> : <span className="inline-skeleton" aria-label="Loading paid payouts" />}<AppIcon className="fa-solid fa-check-double" aria-hidden="true" /></span></>}</div></section>
    <aside className="dashboard-nudge nudge-refresh" aria-labelledby="nudge-title">
      <div className="nudge-eyebrow"><span>{bn ? "একটু উৎসাহ দিন" : "A LITTLE ENCOURAGEMENT"}</span><div className="nudge-art" aria-hidden="true"><span className="nudge-art-halo"/><span className="nudge-art-message"><AppIcon name="comment-dots"/></span><span className="nudge-art-spark"><AppIcon name="star"/></span></div></div>

      <h2 id="nudge-title">{bn ? <>একটি বার্তা।<br/>নতুন এক সম্ভাবনা।</> : <>A small message.<br/>A big next step.</>}</h2>
      <p>{nudge ? (bn ? `${nudgeName}-কে একটু উৎসাহ দিন। আপনার একটি বার্তাই তার পরবর্তী পদক্ষেপ সহজ করতে পারে।` : `A little encouragement could be just what ${nudgeName} needs to keep moving forward.`) : (bn ? "একজন বন্ধুর সাথে আপনার লিংক শেয়ার করুন। নতুন যাত্রা শুরু হোক একটি পরিচয় থেকে।" : "Share your link with a friend. Their next chapter could start with you.")}</p>
      {nudge && <div className="nudge-person"><span className="nudge-person-avatar">{nudge.lead_name.trim().split(/\s+/).map(part => part[0]).slice(0,2).join("")}</span><div><strong>{nudge.lead_name}</strong><span>{getReferralStage(nudge,bn).label}</span></div><span className="nudge-person-dot" aria-hidden="true"/></div>}
      {nudge ? <a className="nudge-action" href={`mailto:${encodeURIComponent(nudge.lead_email!)}?subject=${encodeURIComponent("A friendly check-in")}&body=${encodeURIComponent(`Hi ${nudgeName},\n\nJust checking in on your university journey. Let your BHE Uni advisor know if you need help taking the next step.`)}`}><span>{bn ? `${nudgeName}-কে মনে করিয়ে দিন` : `Remind ${nudgeName}`}</span><AppIcon name="arrow-up-right-from-square"/></a> : <button className="nudge-action" onClick={onCopy}><span>{copied ? (bn ? "কপি হয়েছে" : "Link copied") : (bn ? "আমার লিংক শেয়ার করুন" : "Share my referral link")}</span><AppIcon name="arrow-up-right-from-square"/></button>}
    </aside></div>

    <dialog ref={qrDialog} className="referral-qr-dialog" aria-labelledby="referral-qr-title" onClick={event => { if (event.target === event.currentTarget) qrDialog.current?.close(); }}>
      <header className="referral-qr-heading"><p>BHE UNI AMBASSADORS</p><h2 id="referral-qr-title">{bn ? "এক স্ক্যানে নতুন সম্ভাবনা।" : "One scan. A world of possibility."}</h2><button className="qr-close" onClick={() => qrDialog.current?.close()} aria-label={bn ? "বন্ধ করুন" : "Close QR code"}><AppIcon className="fa-solid fa-xmark" aria-hidden="true" /></button></header>
      <div className="referral-qr-body">{qrImage && <div className="referral-qr-image"><img src={qrImage} width={280} height={280} alt={bn ? "রেফারেল লিংকের কিউআর কোড" : "Referral link QR code"} /></div>}
        <a className="referral-qr-link" href={referralLink} target="_blank" rel="noreferrer">{referralLink.replace(/^https?:\/\//, "")}</a>
        <p>{bn ? "বন্ধুদের স্ক্যান করে তাদের সম্ভাবনা খুঁজে নিতে দিন।" : "Let your friends scan to explore their options."}</p>
        <a className="referral-qr-download" href={qrImage} download="ambassador-referral-qr.png"><AppIcon className="fa-solid fa-download" aria-hidden="true"/>{bn ? "কিউআর কোড ডাউনলোড" : "Download QR code"}</a>
      </div>
    </dialog>
    <div className="pipeline-tier-grid"><section className="dashboard-pipeline" aria-labelledby="pipeline-heading"><div className="pipeline-heading"><h2 id="pipeline-heading">{bn ? "প্রতিটি পরিচয় মূল্যবান" : "Every connection counts"}</h2><a href="#wreferrals">{number(referrals.length)} {bn ? "রেফারেল" : "referrals"}<span aria-hidden="true"><AppIcon name="chevron-right" /></span></a></div>{totalActive ? <div className="pipeline-distribution" role="img" aria-label={stages.map(s => `${s.label}: ${s.count}`).join(", ")}>{stages.filter(s => s.count > 0).map(s => <span key={s.label} className={`pipeline-segment pipeline-color-${stages.indexOf(s)}`} style={{ flex: s.count }} />)}</div> : <div className="pipeline-distribution pipeline-is-empty"><span /></div>}<div className="pipeline-legend">{stages.map((item, index) => <span key={item.label}><i className={`pipeline-color-${index}`} />{item.label}<strong>{number(item.count)}</strong></span>)}</div>{rejected > 0 && <p className="pipeline-excluded">{number(rejected)} {bn ? "রেফারেল বর্তমানে অগ্রসর হচ্ছে না" : "referrals not currently progressing"}</p>}</section><aside className="dashboard-tier"><div className="tier-caption"><span aria-hidden="true"><AppIcon name="medal" /></span><p>{stats.tier} {bn ? "অ্যাম্বাসেডর" : "AMBASSADOR"}</p></div><h2>{bn ? <>আপনি গড়ছেন<br />নতুন সম্ভাবনা।</> : <>You’re building<br />something good.</>}</h2><p className="tier-progress-label">{progress.nextTier ? <><strong>{number(Math.max(0, progress.current))} {bn ? "এর মধ্যে" : "of"} {number(progress.target)}</strong> {bn ? "যোগ্য রেফারেল" : "qualified referrals"}</> : (bn ? "সর্বোচ্চ স্তর অর্জিত" : "Highest milestone reached")}</p><div className="tier-progress-track" role="progressbar" aria-label={bn ? "পরবর্তী স্তরের অগ্রগতি" : "Progress to next tier"} aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress.percent}%` }} /></div><div className="tier-next"><span>{bn ? "পরবর্তী স্তর:" : "Next up:"} <strong>{progress.nextTier || (bn ? "সম্পন্ন" : "Complete")}</strong></span>{progress.nextTier && <span>{number(Math.max(0, stats.leads_to_next_tier))} {bn ? "বাকি" : "to go"} <AppIcon name="gem" /></span>}</div></aside></div>
  </>;
}
