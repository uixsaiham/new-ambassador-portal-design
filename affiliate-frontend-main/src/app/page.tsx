import styles from "./home.module.css";
import StickyNav from "@/components/landing/StickyNav";
import ReferralHero from "@/components/landing/ReferralHero";
import refresh from "@/components/landing/referral-refresh.module.css";
import ProductMockup from "@/components/landing/ProductMockup";
import ReferralJourney from "@/components/landing/ReferralJourney";
import Rewards from "@/components/landing/Rewards";
import Milestones from "@/components/landing/Milestones";
import Features from "@/components/landing/Features";
import Payouts from "@/components/landing/Payouts";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";
import LandingFaq from "@/components/landing/LandingFaq";

export default function HomePage() {
  return <div className={styles.home}>
    <a className={styles.skip} href="#main">Skip to content</a>
    <StickyNav />
    <div className={styles.hero}>
      <main id="main"><ReferralHero /></main>
    </div>
    <section id="how-it-works"><ReferralJourney /></section>
    <section id="rewards"><Rewards /></section>
    <div className={refresh.dashboardStage}><div className={refresh.heading}><h2>A little look inside<br /><em>your ambassador space.</em></h2><p>Every referral, every milestone, every reward. All in one place.</p></div><ProductMockup /></div>
    <section id="milestones"><Milestones /></section>
    <section id="features"><Features /></section>
    <section id="payouts"><Payouts /></section>
    <section id="faq"><LandingFaq /></section>
    <FinalCta />
    <footer><Footer /></footer>
  </div>;
}
