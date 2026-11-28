"use client";
import { useRef, useState } from "react";
import AppIcon from "@/components/AppIcon";
import Image from "next/image";
import Link from "next/link";
import s from "./mobile-showcase.module.css";

const views = [
  {name:"Home",icon:"mobile-screen",title:"Your next move, always with you.",text:"See your balance, share your referral link or QR code, and spot friends who need a little nudge.",short:"Your day, at a glance",image:"/app/screens/home.png",height:6212},
  {name:"Referrals",icon:"user-group",title:"Keep every friend moving forward.",text:"Track applications by stage, see missing documents, and find the referrals that need your attention.",short:"Every referral, in your pocket",image:"/app/screens/referrals.png",height:4760},
  {name:"Wallet",icon:"wallet",title:"Every reward. Right at your fingertips.",text:"Follow your earnings, check payout activity, and request your money to bKash or your bank.",short:"Rewards that go with you",image:"/app/screens/wallet.png",height:4552},
];

export default function MobileShowcase(){
 const [active,setActive]=useState(0);const scrollRef=useRef<HTMLDivElement>(null);const screen=views[active];
 function select(index:number){setActive(index);scrollRef.current?.scrollTo({top:0,behavior:"instant"});}
 return <div className={s.showcase}>
  <div className={s.copy}><h3>Your ambassador life.<br /><em>In your pocket.</em></h3><p>Big plans don’t wait until you’re at your desk. Take your connections, progress and rewards with you in the BHE Uni Ambassador app.</p>
   <div className={s.featureList} role="group" aria-label="Explore mobile app features">{views.map((view,index)=><button type="button" key={view.name} className={`${s.feature} ${active===index?s.active:""}`} aria-pressed={active===index} aria-controls="mobile-design-preview" onClick={()=>select(index)}><span className={s.featureIcon}><AppIcon name={view.icon}/></span><span><strong>{view.title}</strong><span>{view.text}</span></span><AppIcon name="arrow-right"/></button>)}</div>
   <div className={s.storeLinks}>
    <a href="https://apps.apple.com/gb/app/bhe-uni-ambassador/id6827007812" target="_blank" rel="noopener noreferrer" aria-label="Download BHE Uni Ambassador on the App Store"><Image src="/app/app-store-badge.svg" alt="Download on the App Store" width={132} height={44} unoptimized className={s.appleBadge}/></a>
    <a href="https://play.google.com/store/apps/details?id=com.bheuni.ambassadorapp" target="_blank" rel="noopener noreferrer" aria-label="Get BHE Uni Ambassador on Google Play" className={s.googleStoreLink}><Image src="/app/google-play-badge.png" alt="Get it on Google Play" width={646} height={250} unoptimized className={s.googleBadge}/></a>
   </div>
  </div>
  <div className={s.phoneScene}><div className={s.orbit} aria-hidden="true"/><div className={s.phone} id="mobile-design-preview" aria-label={`${views[active].name} mobile app design preview with sample data`}>
    <div className={s.deviceScreen}>
      <div className={s.statusBar} aria-hidden="true"><Image src={screen.image} alt="" width={1560} height={screen.height} unoptimized className={s.screenImage}/></div>
      <div className={s.viewport} ref={scrollRef} tabIndex={0} aria-label={`Scroll the ${screen.name} app screen`}>
        <div className={s.screenArtwork} style={{height:(screen.height / 4 - 54 - 120) * (270 / 390)}}><Image src={screen.image} alt={`${screen.name} app screen showing sample ambassador data`} width={1560} height={screen.height} unoptimized className={s.screenImage}/></div>
      </div>
      <nav className={s.phoneNav} aria-label="Mobile app preview navigation">
        <button type="button" onClick={()=>select(0)} aria-pressed={active===0} className={active===0?s.selectedTab:""}><Image src="/landing/mobile/77ac01dd-b942-41d3-8721-a74302d24779.svg" alt="" width={19} height={19} unoptimized/><span>Home</span></button>
        <button type="button" onClick={()=>select(1)} aria-pressed={active===1} className={active===1?s.selectedTab:""}><Image src="/landing/mobile/274771a3-95e9-4a99-a455-4861563017ec.svg" alt="" width={19} height={19} unoptimized/><span>Referrals</span></button>
        <Link href="/signup" className={s.referTab} aria-label="Sign up to refer a friend"><span className={s.referButton}><AppIcon name="plus"/></span><span>Refer</span></Link>
        <button type="button" onClick={()=>select(2)} aria-pressed={active===2} className={active===2?s.selectedTab:""}><Image src="/landing/mobile/3edcd4fe-dfc8-41bb-9cd7-ad9549cc4d8c.svg" alt="" width={19} height={19} unoptimized/><span>Wallet</span></button>
        <Link href="/login" aria-label="Sign in to your profile"><Image src="/landing/mobile/b324d050-5fa5-493f-bef0-8e68ad5389db.svg" alt="" width={19} height={19} unoptimized/><span>Profile</span></Link>
      </nav>
      <span className={s.homeIndicator} aria-hidden="true"/>
    </div>
   </div><p className={s.previewCaption}>{views[active].short}<span>Interactive design preview · sample data</span></p>
  </div>
 </div>;
}
