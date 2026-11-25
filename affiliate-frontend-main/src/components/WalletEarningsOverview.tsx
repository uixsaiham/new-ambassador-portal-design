"use client";

import AppIcon from "@/components/AppIcon";
import Link from "next/link";
import { useState } from "react";
import { monthlyEarnings, type EarningsTransaction } from "@/lib/wallet-overview";
import { formatMoney, usePortalLanguage } from "@/context/PortalLanguage";

type Referral = {
  id: string; lead_name: string; status: string; application_status_label?: string;
  enrolled_at?: string | null; enrolment_reward_paid: boolean; enrolment_reward_denied?: boolean;
  enrolment_installment_1_paid?: boolean; enrolment_installment_2_paid?: boolean;
};
export default function WalletEarningsOverview({ transactions, referrals, enrolmentReward }: {
  transactions: EarningsTransaction[]; referrals: Referral[]; enrolmentReward: number;
}) {
  const { language } = usePortalLanguage();
  const bn = language === "bn";
  const [now] = useState(() => new Date());
  const money = (amount: number) => formatMoney(amount, language);
  const months = monthlyEarnings(transactions, now);
  const total = months.reduce((sum, month) => sum + month.amount, 0);
  const maximum = Math.max(...months.map(month => month.amount), 1);
  const monthName = (date: Date) => new Intl.DateTimeFormat(bn ? "bn-BD" : "en-GB", { month: "short", timeZone: "Asia/Dhaka" }).format(date);
  const period = `${monthName(months[0].date)}${months[0].date.getUTCFullYear() !== now.getUTCFullYear() ? ` ${months[0].date.getUTCFullYear()}` : ""} – ${monthName(months[5].date)} ${new Intl.DateTimeFormat(bn ? "bn-BD" : "en-GB", { year: "numeric", timeZone: "Asia/Dhaka" }).format(now)}`;
  const outstanding = referrals.filter(referral => !referral.enrolment_reward_denied && !referral.enrolment_reward_paid && !(referral.enrolment_installment_1_paid && referral.enrolment_installment_2_paid));
  const next = outstanding.find(referral => referral.enrolled_at || referral.status.startsWith("enrolled") || referral.application_status_label === "Enrolled")
    || outstanding.find(referral => !["rejected", "submitted"].includes(referral.status));
  const name = next?.lead_name.split(" ")[0];
  const remainingReward = next ? enrolmentReward * (1 - (Number(!!next.enrolment_installment_1_paid) + Number(!!next.enrolment_installment_2_paid)) / 2) : enrolmentReward;
  return <div className="wallet-earnings-grid">
    <section className="wallet-earnings-card" aria-labelledby="wallet-earnings-title"><div className="earnings-card-heading"><h2 id="wallet-earnings-title">{bn ? "ছোট পদক্ষেপে বড় অর্জন" : "Small steps add up"}</h2><span>{period}</span></div><p className="earnings-chart-eyebrow">{bn ? `${monthName(months[0].date)} থেকে অর্জিত` : `EARNED SINCE ${new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "Asia/Dhaka" }).format(months[0].date).toUpperCase()}`}</p><strong className="earnings-chart-total">{money(total)}</strong>
      <figure className={`wallet-earnings-chart ${total === 0 ? "earnings-chart-empty" : ""}`}><figcaption className="sr-only">{bn ? "মাসিক অর্জিত পুরস্কার" : "Monthly earned rewards"} · {period}</figcaption>{total === 0 && <p className="earnings-empty-label">{bn ? "আপনার পরবর্তী পুরস্কার এখানেই দেখা যাবে।" : "Your next rewards will grow here."}</p>}<ol>{months.map((month, index) => <li key={month.key}><span className="earnings-bar-track"><span className="earnings-bar-stack" style={{ height: month.amount > 0 ? `${(10 + month.amount / maximum * 90)}%` : "2px" }}><span className="earnings-bar-value">{money(month.amount)}</span><span aria-hidden="true" className={`earnings-bar ${index === 5 ? "is-current" : ""}`} /></span></span><span className="earnings-bar-month">{monthName(month.date)}</span></li>)}</ol></figure>
    </section>
    <aside className="wallet-reward-spotlight reward-achievement" aria-labelledby="next-reward-title">
      <div className="reward-achievement-art" aria-hidden="true"><span className="reward-orbit orbit-one"/><span className="reward-orbit orbit-two"/><span className="reward-spark spark-one"><AppIcon name="star"/></span><span className="reward-spark spark-two"><AppIcon name="star"/></span><span className="reward-confetti confetti-one"/><span className="reward-confetti confetti-two"/><div className="reward-trophy"><AppIcon name="trophy"/></div><span className="reward-art-medal"><AppIcon name="graduation-cap"/></span><span className="reward-podium"/></div>
      <div className="reward-achievement-content"><span className="reward-next-tag"><AppIcon name="bolt"/>{bn ? "আপনার পরবর্তী মাইলফলক" : "Your next milestone"}</span>
        <p className="reward-achievement-label">{bn ? "ভর্তির পুরস্কার" : "ENROLMENT REWARD"}</p>
        <strong className="reward-achievement-amount">{money(remainingReward)}</strong>
        <h2 id="next-reward-title">{bn ? <>একটি পরিচয়।<br/>বড় একটি অর্জন।</> : <>One connection.<br/>A brilliant achievement.</>}</h2>
        <p className="reward-achievement-description">{next ? (bn ? `${name}-এর পরবর্তী পদক্ষেপে পাশে থাকুন। সফল ভর্তি যাচাই ও অনুমোদনের পর এই পুরস্কার আপনার।` : `Cheer ${name} on to their next chapter. This reward follows a successful enrolment and finance approval.`) : (bn ? "একজন বন্ধুর নতুন যাত্রার অংশ হোন। সফল ভর্তি যাচাই ও অনুমোদনের পর পুরস্কার আপনার।" : "Help a friend start their next chapter. Earn this reward after their enrolment is verified and approved.")}</p>
      </div>
      <Link className="reward-achievement-cta" href={next ? `/dashboard/referrals?referral=${encodeURIComponent(next.id)}` : "/dashboard/referrals"}><span>{next ? (bn ? `${name}-এর যাত্রা দেখুন` : `Follow ${name}’s journey`) : (bn ? "আপনার রেফারেল দেখুন" : "Explore your referrals")}</span><AppIcon name="arrow-up-right-from-square"/></Link>
      <p className="reward-achievement-note"><AppIcon name="shield-halved"/>{bn ? "সফল ভর্তি ও অনুমোদন সাপেক্ষে" : "Awarded after verification & approval"}</p>
    </aside>
  </div>;
}
