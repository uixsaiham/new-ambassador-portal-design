"use client";
import { useState } from "react";
import Image from "next/image";
import AppIcon from "@/components/AppIcon";
import s from "./hero-connection.module.css";
const stages = [
  {name:"Introduce",icon:"share-nodes",title:"It starts with your connection.",text:"Share your personal link with a friend thinking about studying abroad.",amount:"Your link",detail:"Their first step"},
  {name:"Get verified",icon:"circle-check",title:"A little introduction goes further.",text:"Our counsellors verify your friend’s interest and guide their next steps.",amount:"৳300",detail:"per verified lead"},
  {name:"Celebrate",icon:"graduation-cap",title:"Their future. Your well-earned reward.",text:"When your friend successfully enrols, your enrolment reward unlocks.",amount:"৳25,000",detail:"per successful enrolment"},
];
export default function HeroConnection(){
 const [active,setActive]=useState(0);const stage=stages[active];
 return <div className={s.canvas}>
   <div className={s.art}>
     <svg className={s.path} viewBox="0 0 520 380" fill="none" aria-hidden="true"><path d="M46 115C3 235 130 351 307 326C471 303 540 149 439 54C357-22 227 30 196 66" stroke="#c5bfda" strokeWidth="1.5" strokeDasharray="5 7"/><path d="M48 255C96 344 194 369 279 350" stroke="#f26925" strokeWidth="2"/><path d="m269 343 12 7-10 7" stroke="#f26925" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
     <div className={s.students}><Image src="/landing/ambassador-celebration.png" alt="Two university students smiling and celebrating their success together" fill preload sizes="(max-width:760px) 85vw, 370px" /></div>
     <button type="button" className={`${s.orbitNode} ${s.shareNode} ${active===0?s.selectedNode:""}`} aria-label="Explore introducing a friend" aria-pressed={active===0} onClick={()=>setActive(0)}><AppIcon name="share-nodes"/></button>
     <button type="button" className={`${s.orbitNode} ${s.verifyNode} ${active===1?s.selectedNode:""}`} aria-label="Explore verified lead rewards" aria-pressed={active===1} onClick={()=>setActive(1)}><AppIcon name="circle-check"/></button>
     <button type="button" className={`${s.orbitNode} ${s.studyNode} ${active===2?s.selectedNode:""}`} aria-label="Explore enrolment rewards" aria-pressed={active===2} onClick={()=>setActive(2)}><AppIcon name="graduation-cap"/></button>
     <div className={s.result} aria-live="polite"><span className={s.resultMark} aria-hidden="true"><AppIcon name={stage.icon}/></span><div><strong>{stage.amount}</strong><span>{stage.detail}</span></div></div>
   </div>
   <div className={s.steps} role="group" aria-label="Explore the referral journey">{stages.map((item,index)=><button type="button" key={item.name} aria-pressed={active===index} className={active===index?s.active:""} onClick={()=>setActive(index)}><span>0{index+1}</span>{item.name}<AppIcon name="arrow-right"/></button>)}</div>
   <div className={s.description} aria-live="polite"><strong>{stage.title}</strong><p>{stage.text}</p></div>
 </div>;
}
