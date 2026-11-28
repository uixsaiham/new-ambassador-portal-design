"use client";
import {useState} from "react";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import s from "./referral-refresh.module.css";
const money=(n:number)=>`৳${n.toLocaleString("en-BD")}`;
export default function RewardExplorer(){
 const [verified,setVerified]=useState(6);const [enrolled,setEnrolled]=useState(1);
 function changeVerified(value:number){setVerified(value);setEnrolled(Math.min(enrolled,value));}
 function changeEnrolled(value:number){setEnrolled(value);setVerified(Math.max(verified,value));}
 return <div className={s.rewardsWrap}>
  <div className={s.heading}><h2>Small introductions.<br /><em>Meaningful rewards.</em></h2><p>Earn at two milestones in the same friend’s journey.</p></div>
  <div className={s.rewardGrid}><article className={s.rewardCard} data-hover-card="true"><span className={s.cardTag}><AppIcon name="circle-check"/> VERIFIED LEAD</span><strong>৳300<span>/ friend</span></strong><p>When our counsellors verify your friend as a genuine potential student.</p><span className={s.rewardFoot}><AppIcon name="check"/> A thank-you for the introduction</span></article><article className={`${s.rewardCard} ${s.enrolCard}`} data-hover-card="true"><span className={s.cardTag}><AppIcon name="graduation-cap"/> SUCCESSFUL ENROLMENT</span><strong>৳25,000<span>/ enrolment</span></strong><p>When your referred friend enrols at a BHE Uni partner university.</p><span className={s.rewardFoot}><AppIcon name="check"/> On top of your verified lead reward</span></article></div>
  <div className={s.calculator}><div className={s.calculatorControls}><h3>What could your connections add up to?</h3><p>Move the sliders to explore an example.</p><label htmlFor="verified-referrals"><span>Verified friends</span><output htmlFor="verified-referrals">{verified}</output></label><input id="verified-referrals" type="range" min="0" max="30" value={verified} onChange={e=>changeVerified(Number(e.target.value))}/><label htmlFor="enrolled-referrals"><span>Of those, successfully enrolled</span><output htmlFor="enrolled-referrals">{enrolled}</output></label><input id="enrolled-referrals" type="range" min="0" max="30" value={enrolled} onChange={e=>changeEnrolled(Number(e.target.value))}/></div><div className={s.calculatorTotal}><span>YOUR ILLUSTRATIVE REWARD</span><output aria-live="polite" aria-atomic="true">{money(verified*300+enrolled*25000)}</output><p>{verified} × ৳300 <span>+</span> {enrolled} × ৳25,000</p><Link href="/signup" className={s.primary}>Start making connections <AppIcon name="arrow-right"/></Link><small>Example only. Rewards depend on verification and successful enrolment. <Link href="/rewards-terms-and-conditions">Programme terms apply.</Link></small></div></div>
 </div>;
}
