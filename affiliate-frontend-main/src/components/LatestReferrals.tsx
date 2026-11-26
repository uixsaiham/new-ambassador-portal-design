"use client";

import AppIcon from "@/components/AppIcon";
import { useEffect, useRef, useState } from "react";
import { formatMoney, usePortalLanguage } from "@/context/PortalLanguage";

type Referral = {
  id: string;
  lead_name: string;
  education_interest?: string | null;
  lead_phone?: string | null;
  lead_email?: string | null;
  application_university?: string | null;
  application_course?: string | null;
  status: string;
  application_stage?: string | null;
  application_status?: string | null;
  application_status_label?: string | null;
  crm_lead_status?: string | null;
  status_reason?: string | null;
  rejection_reason?: string | null;
  application_notes?: string | null;
  lead_reward_paid: boolean;
  enrolment_reward_paid: boolean;
  enrolment_installment_1_paid?: boolean;
  enrolment_installment_2_paid?: boolean;
  created_at: string;
  updated_at?: string | null;
};

export function getReferralStage(referral: Referral, bn: boolean) {
  const status = [referral.application_status, referral.application_stage, referral.application_status_label, referral.crm_lead_status, referral.status].filter(value => value && value.toLowerCase() !== "not started").join(" ").toLowerCase();
  if (/(reject|refus|cancel|withdraw|declin)/.test(status)) return { label: bn ? "অযোগ্য" : "Not qualified", tone: "declined", step: 0 };
  if (/(enrol|commenced|arrived|graduat)/.test(status)) return { label: bn ? "ভর্তি হয়েছে" : "Enrolled", tone: "enrolled", step: 5 };
  if (/offer/.test(status)) return { label: bn ? "অফার" : "Offer", tone: "offer", step: 4 };
  if (/(appl|submit.*application)/.test(status)) return { label: bn ? "আবেদন হয়েছে" : "Applied", tone: "applied", step: 3 };
  if (/(qualified|validated)/.test(status)) return { label: bn ? "যোগ্য" : "Qualified", tone: "potential", step: 2 };
  if (/(potential|progress)/.test(status)) return { label: bn ? "যোগ্য" : "Qualified", tone: "potential", step: 2 };
  return { label: bn ? "যোগাযোগ হয়েছে" : "Enquired", tone: "potential", step: 1 };
}

function relativeTime(value: string, bn: boolean, now: number) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  const relative = new Intl.RelativeTimeFormat(bn ? "bn" : "en", { numeric: "auto" });
  if (seconds < 60) return bn ? "এইমাত্র" : "Just now";
  if (seconds < 3600) return relative.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return relative.format(-Math.floor(seconds / 3600), "hour");
  if (seconds < 604800) return relative.format(-Math.floor(seconds / 86400), "day");
  return date.toLocaleDateString(bn ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: date.getFullYear() !== new Date(now).getFullYear() ? "numeric" : undefined });
}

// Paid flags are the API's source of truth; pending rewards are not shown as earned.
export function earned(referral: Referral) {
  const enrolment = referral.enrolment_reward_paid ? 500 : (Number(!!referral.enrolment_installment_1_paid) + Number(!!referral.enrolment_installment_2_paid)) * 250;
  return enrolment + (referral.lead_reward_paid ? 10 : 0);
}

export default function LatestReferrals({ referrals, onAdd, fullPage = false }: { referrals: Referral[]; onAdd: () => void; fullPage?: boolean }) {
  const { language } = usePortalLanguage();
  const bn = language === "bn";
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Referral | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const dialog = useRef<HTMLDialogElement>(null);
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (openedFromLink.current) return;
    const id = new URLSearchParams(window.location.search).get("referral");
    const referral = referrals.find(item => item.id === id);
    if (referral) { openedFromLink.current = true; setSelected(referral); }
  }, [referrals]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    dialog.current?.querySelector(".referral-detail-body")?.scrollTo(0, 0);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [selected]);
  const sorted = [...referrals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visible = (showAll || fullPage) ? sorted : sorted.slice(0, 5);
  const money = (amount: number) => formatMoney(amount, language, "BDT");

  return <section id="wreferrals" className="latest-referrals" aria-label={fullPage ? (bn ? "রেফারেল" : "Referrals") : undefined} aria-labelledby={fullPage ? undefined : "latest-referrals-title"}>
    {!fullPage && <div className="latest-referrals-heading"><h2 id="latest-referrals-title">{showAll ? (bn ? "সব রেফারেল" : "All referrals") : (bn ? "আপনার সাম্প্রতিক রেফারেল" : "Your latest referrals")}</h2><button className="referral-add" onClick={onAdd}><span aria-hidden="true"><AppIcon name="plus" /></span>{bn ? "রেফারেল যোগ করুন" : "Add referral"}</button></div>}
    {referrals.length === 0 ? <div className="latest-empty"><AppIcon className="fa-regular fa-user" aria-hidden="true" /><h3>{bn ? "আপনার প্রথম রেফারেল দিয়ে শুরু করুন" : "A new beginning starts with you"}</h3><p>{bn ? "রেফারেল যোগ করুন অথবা আপনার লিংক শেয়ার করুন।" : "Add your first referral or share your personal link. Their progress will appear here."}</p></div> : <>
      <div className="latest-table-scroll"><table className="latest-table"><caption className="sr-only">{bn ? "রেফারেলের অগ্রগতি ও অর্জিত পুরস্কার" : "Latest referrals, their progress and earned rewards"}</caption><thead><tr><th scope="col">{bn ? "শিক্ষার্থী" : "Student"}</th><th scope="col"><span className="latest-stage-heading">{bn ? "পর্যায়" : "Stage"}</span></th><th scope="col">{bn ? "সর্বশেষ পরিবর্তন" : "Last update"}</th><th scope="col" className="latest-reward-heading">{bn ? "পুরস্কার" : "Reward"}</th><th scope="col"><span className="sr-only">{bn ? "বিস্তারিত" : "Details"}</span></th></tr></thead><tbody>{visible.map((referral, index) => {
        const current = getReferralStage(referral, bn); const amount = earned(referral); const updated = referral.updated_at || referral.created_at;
        return <tr key={referral.id} onClick={() => setSelected(referral)}><td><div className="latest-student"><span className={`latest-avatar avatar-${index % 4}`} aria-hidden="true">{referral.lead_name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase()}</span><div><button className="latest-name" onClick={e => { e.stopPropagation(); setSelected(referral); }} aria-label={`${bn ? "বিস্তারিত দেখুন" : "View details for"} ${referral.lead_name}`}>{referral.lead_name}</button><p>{referral.education_interest || (bn ? "কোর্স নির্ধারিত হয়নি" : "Course not specified")}</p></div></div></td><td><div className="latest-stage-wrap"><span className={`latest-stage stage-${current.tone}`}>{current.label}</span><div className={`latest-stage-steps steps-${current.tone}`} role="img" aria-label={`${current.label} · ${current.step}/5`}>{Array.from({ length: 5 }, (_, step) => <span key={step} className={step < current.step ? "complete" : ""} />)}</div></div></td><td><time dateTime={updated} title={new Date(updated).toLocaleString(bn ? "bn-BD" : "en-GB")}>{relativeTime(updated, bn, now)}</time></td><td className="latest-reward">{amount > 0 ? `+${money(amount)}` : <span className="latest-no-reward">—</span>}</td><td className="latest-chevron"><span aria-hidden="true"><AppIcon name="chevron-right" /></span></td></tr>;
      })}</tbody></table></div>
      {!fullPage && <button className="latest-view-all" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? (bn ? "সাম্প্রতিক রেফারেল দেখুন" : "Show latest referrals") : (bn ? "সব রেফারেল দেখুন" : "View all referrals")}<span aria-hidden="true">{showAll ? <AppIcon name="chevron-up" /> : <AppIcon name="chevron-right" />}</span></button>}
    </>}
    <dialog ref={dialog} className="referral-detail-dialog" onClose={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} aria-labelledby="referral-detail-title">{selected && <div className="referral-detail-content">
      <header className="journey-header"><div className="referral-detail-header"><p>{bn ? "ভার্সিটি অ্যাম্বাসেডর" : "VARSITY AMBASSADORS"}</p><button autoFocus aria-label={bn ? "বন্ধ করুন" : "Close referral details"} onClick={() => dialog.current?.close()}><AppIcon name="xmark" /></button></div><h2 id="referral-detail-title">{selected.lead_name}</h2><p className="detail-course">{[selected.application_course || selected.education_interest, selected.application_university].filter(Boolean).join(" · ") || (bn ? "কোর্স নির্ধারিত হয়নি" : "Course not specified")}</p></header>
      <div className="referral-detail-body">
        <div className="journey-student"><span className="journey-avatar" aria-hidden="true">{selected.lead_name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase()}</span><div><h3>{selected.lead_name}</h3><p>{selected.lead_phone || (bn ? "ফোন নম্বর দেওয়া হয়নি" : "Phone not provided")}</p><span className={`latest-stage stage-${getReferralStage(selected, bn).tone}`}>{getReferralStage(selected, bn).label}</span></div></div>
        <h3 className="journey-title">{bn ? "একটি সম্ভাবনাময় যাত্রা" : "A journey worth following"}</h3>
        {getReferralStage(selected, bn).step === 0 && <p className="journey-declined" role="status">{selected.rejection_reason || selected.status_reason || (bn ? "এই রেফারেলের অগ্রগতি বন্ধ রয়েছে।" : "This referral is not currently progressing.")}</p>}
        <ol className={`journey-timeline ${getReferralStage(selected, bn).step === 0 ? "journey-stopped" : ""}`} aria-label={bn ? "রেফারেলের অগ্রগতি" : "Referral journey"}>{(bn ? ["যোগাযোগ হয়েছে", "যোগ্য", "আবেদন হয়েছে", "অফার", "ভর্তি হয়েছে"] : ["Enquired", "Qualified", "Applied", "Offer", "Enrolled"]).map((label, index) => {
          const current = getReferralStage(selected, bn).step;
          const completed = current > index + 1 || current === 5;
          const active = current === index + 1;
          return <li key={label} className={`${completed ? "is-complete" : ""} ${active ? "is-current" : ""}`} aria-current={active ? "step" : undefined}><span className="journey-step" aria-hidden="true">{completed ? <AppIcon className="fa-solid fa-check" /> : new Intl.NumberFormat(bn ? "bn-BD" : "en").format(index + 1)}</span><div><strong>{label}</strong><p>{completed ? (bn ? "ধাপ সম্পন্ন" : "Stage completed") : active ? (bn ? "বর্তমান পর্যায়" : "Current stage") : (bn ? "পরবর্তী ধাপ" : "Next step")}</p></div></li>;
        })}</ol>
        <div className="journey-advisor-note"><AppIcon className={`fa-regular ${getReferralStage(selected, bn).step === 5 ? "fa-circle-check" : "fa-clock"}`} aria-hidden="true" /><p>{getReferralStage(selected, bn).step === 5 ? (bn ? "ভর্তি সম্পন্ন হয়েছে। পুরস্কারের সর্বশেষ অবস্থা নিচে দেখুন।" : "Enrolment complete. You can follow your reward status below.") : getReferralStage(selected, bn).step === 0 ? (bn ? "বিস্তারিত জানতে আপনার অ্যাডভাইজরের সাথে যোগাযোগ করুন।" : "Contact your advisor if you have questions about this referral.") : (bn ? "আপনার অ্যাডভাইজর পরবর্তী ধাপে সহায়তা করছেন। সর্বশেষ তথ্য এখানে দেখুন।" : "Your advisor is guiding the next step. Follow the latest updates here.")}</p></div>
        {(selected.status_reason || selected.application_notes) && <div className="journey-notes"><h4>{bn ? "সর্বশেষ নোট" : "Latest notes"}</h4>{selected.status_reason && <p>{selected.status_reason}</p>}{selected.application_notes && <p>{selected.application_notes}</p>}</div>}
        <dl className="journey-rewards"><div><dt>{bn ? "যোগ্য রেফারেলের পুরস্কার" : "Qualified referral reward"}</dt><dd>{money(10)}</dd></div><div><dt>{bn ? "ভর্তির পুরস্কার" : "Enrolment reward"}</dt><dd>{money(500)}</dd></div><div className="journey-credited"><dt>{bn ? "ইতিমধ্যে জমা হয়েছে" : "Already credited"}</dt><dd>{money(earned(selected))}</dd></div></dl>
        <a className="journey-reminder" href={`mailto:${encodeURIComponent(selected.lead_email || "ask@bheuni.io")}?subject=${encodeURIComponent(bn ? "আপনার বিশ্ববিদ্যালয়ের আবেদন সম্পর্কে" : "A friendly check-in about your university journey")}&body=${encodeURIComponent(bn ? `হ্যালো ${selected.lead_name},\n\nআপনার বিশ্ববিদ্যালয়ের আবেদনের অগ্রগতি কেমন? কোনো সহায়তা প্রয়োজন হলে আপনার BHE Uni অ্যাডভাইজরকে জানাতে পারেন।` : `Hi ${selected.lead_name},\n\nJust checking in on your university journey. If you need help with the next step, your BHE Uni advisor is here to support you.\n\nAll the best!`)}`}>{bn ? "একটি বন্ধুত্বপূর্ণ রিমাইন্ডার দিন" : "Send a friendly reminder"}<AppIcon className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a>
        <p className="journey-privacy"><AppIcon className="fa-regular fa-envelope" aria-hidden="true" />{bn ? "আপনার ইমেইল অ্যাপে খসড়া খুলবে। পাঠানোর আগে পর্যালোচনা করুন।" : "Opens a draft in your email app for you to review and send."}</p>
      </div>
    </div>}</dialog>
  </section>;
}
