import HeroConnection from "./HeroConnection";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import s from "./referral-refresh.module.css";

export default function ReferralHero() {
  return <div className={s.heroLayout}>
    <div className={s.heroWords}>
      <h1>A little introduction.<br />A <em>big next chapter.</em></h1>
      <p>Help a friend take their first step towards studying abroad. Earn rewards for every verified lead and successful enrolment.</p>
      <div className={s.heroAmounts}><span><b>৳300</b> per verified lead</span><i>+</i><span><b>৳25,000</b> per enrolment</span></div>
      <div className={s.heroActions}><Link href="/signup" className={s.primary}>Become an ambassador <AppIcon name="arrow-right" /></Link><a href="#how-it-works" className={s.textLink}>See how it works <AppIcon name="arrow-down-wide-short" /></a></div>
      <div className={s.trustRow}>{["Free to join", "No sales targets", "bKash or bank"].map(x => <span key={x}><AppIcon name="circle-check" />{x}</span>)}</div>
    </div>
    <HeroConnection />
  </div>;
}
