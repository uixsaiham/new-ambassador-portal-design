"use client";

import { useState } from "react";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import s from "./referral-refresh.module.css";
const steps = [
  {title:"Make the introduction",icon:"share-nodes",text:"Share your personal referral link or QR code with a friend who is thinking about studying abroad.",label:"Your personal link",value:"bheuni.io/r/YOUR-CODE",benefit:"A simple share. A new possibility."},
  {title:"We take it from here",icon:"user-group",text:"Our counsellors contact your friend, understand their plans and verify their interest. Follow every step in your portal.",label:"When your lead is verified",value:"+ ৳300",benefit:"Your friend gets guidance. You get rewarded."},
  {title:"Celebrate their next chapter",icon:"graduation-cap",text:"When your friend successfully enrols at a BHE Uni partner university, your enrolment reward unlocks.",label:"Successful enrolment reward",value:"+ ৳25,000",benefit:"A big moment for them. A thank-you for you."},
];
export default function ReferralJourney() {
 const [active,setActive]=useState(0);
 return <div className={s.journey}>
   <div className={s.heading}><h2 className={s.journeyTitle}>Good for your friend. <em>Rewarding for you.</em></h2><p>They get support for their university journey. You get a thank-you for opening the door.</p></div>
   <div className={s.journeyGrid}><div className={s.stepList} role="group" aria-label="How referrals work">{steps.map((step,index)=><button key={step.title} type="button" id={`journey-tab-${index}`} aria-pressed={index===active} aria-controls="journey-panel" className={`${s.step} ${index===active?s.activeStep:""}`} onClick={()=>setActive(index)}><span className={s.stepNumber}>0{index+1}</span><span><strong>{step.title}</strong><span>{step.text}</span></span><AppIcon name="arrow-right" /></button>)}</div>
     <div className={s.journeyVisual} role="region" id="journey-panel" aria-labelledby={`journey-tab-${active}`}><span className={s.demoLabel}>HOW YOUR REFERRAL JOURNEY WORKS</span><div className={s.connection}><span>YOU</span><i /><span className={s.connectionIcon}><AppIcon name={steps[active].icon}/></span><i /><span>FRIEND</span></div><div className={s.journeyResult} key={active}><small>{steps[active].label}</small><strong>{steps[active].value}</strong><p>{steps[active].benefit}</p></div><div className={s.journeyProgress} aria-hidden="true">{steps.map((_,i)=><span key={i} className={i<=active?s.filled:""}/>)}</div><Link className={s.textLink} href="/signup">Get your own referral link <AppIcon name="arrow-right"/></Link></div>
   </div>
 </div>;
}
