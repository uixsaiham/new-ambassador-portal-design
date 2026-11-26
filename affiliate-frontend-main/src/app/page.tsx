import AppIcon from "@/components/AppIcon";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

const features = [
  { icon: "share-nodes", title: "An introduction that matters.", text: "Refer someone interested in university. Submit their details with permission, or share your personal referral link." },
  { icon: "chart-line", title: "Every referral. Every next step.", text: "Keep your referrals together and follow their progress as our team supports their university journey." },
  { icon: "wallet", title: "A little more to look forward to.", text: "See your earnings, check reward status and manage payout requests from your ambassador dashboard." },
];

const tiers = [
  { name: "Bronze", leads: "10", bonus: "৳25", mark: "medal", description: "Make your first mark.", perks: ["Digital certificate", "Bronze ambassador badge", "Exclusive training access"] },
  { name: "Silver", leads: "25", bonus: "৳100", mark: "award", description: "Build your momentum.", perks: ["Silver certificate", "Branded hoodie", "Priority support"] },
  { name: "Gold", leads: "50", bonus: "৳250", mark: "trophy", description: "Stand out from the crowd.", perks: ["Gold certificate", "Social media feature", "VIP event invitations"] },
  { name: "Platinum", leads: "100", bonus: "৳500", mark: "crown", description: "Make an exceptional impact.", perks: ["Platinum excellence award", "Hall of Fame induction", "Annual awards ceremony"] },
];

function PortalMockup() {
  const stages = ["Enquired", "Potential", "Applied", "Offer", "Enrolled"];
  const referrals = [
    { initials: "HF", name: "Heather Fitzpatrick", course: "University referral", stage: "Enquired", reward: "—" },
    { initials: "RI", name: "Raful Islam", course: "BBA · University of Dhaka", stage: "Applied", reward: "+৳10" },
    { initials: "TR", name: "Tasnia Rahman", course: "MSc Finance · North South University", stage: "Offer", reward: "+৳10" },
  ];

  return (
    <figure className={styles.showcase} aria-label="BHE Uni Ambassador dashboard preview with sample data">
      <div className={styles.browser}>
        <div className={styles.browserBar}><div><i /><i /><i /></div><span>ambassador.bheuni.uk / dashboard</span><AppIcon name="lock" /></div>
        <div className={styles.portalPreview}>
          <aside className={styles.previewSidebar}>
            <Image src="/logo-white.png" alt="BHE Uni" width={153} height={61} />
            <p>Ambassador programme</p>
            <small>YOUR WORKSPACE</small>
            <div className={styles.previewNavActive}><AppIcon name="chart-line" /><span>Overview</span></div>
            <div><AppIcon name="users" /><span>Referrals</span></div>
            <div><AppIcon name="wallet" /><span>Wallet &amp; payouts</span></div>
            <div><AppIcon name="sliders" /><span>Profile &amp; settings</span></div>
            <footer><strong>Open a door.<br />Make a difference.</strong><div><span className={styles.previewAvatar}>NJ</span><span>Nusrat Jahan<small>Standard Ambassador</small></span><AppIcon name="right-from-bracket" /></div></footer>
          </aside>
          <div className={styles.previewWorkspace}>
            <div className={styles.previewTopbar}><span><AppIcon name="chart-line" /> Workspace <AppIcon name="chevron-right" /><b>Overview</b></span><span><span className={styles.previewLanguage}>EN</span> বাংলা <AppIcon name="bell" /></span></div>
            <div className={styles.previewContent}>
              <div className={styles.previewGreeting}><div><h3>Good afternoon, Nusrat.</h3><p>Add a friend’s details. Help their next chapter begin.</p></div><span className={styles.previewAdd}><AppIcon name="user-plus" />Add referral<AppIcon name="arrow-up-right-from-square" /></span></div>
              <div className={styles.previewReferralLink}><span className={styles.previewShareIcon}><AppIcon name="share-nodes" /></span><div><small>YOUR LINK. THEIR FIRST STEP.</small><strong>ambassador.bheuni.uk/r/NUSR716</strong></div><div className={styles.previewConnections}><AppIcon name="users" /><span><b>13</b> connections<small>New possibilities with every share.</small></span></div><span className={styles.previewCopy}><AppIcon name="copy" />Copy link</span></div>
              <div className={styles.previewOverview}>
                <div className={styles.previewWallet}><div className={styles.previewWalletMain}><div><small className={styles.previewWalletLabel}>AVAILABLE TO WITHDRAW</small><strong className={styles.previewBalance}>৳0<span>.00</span></strong><p>Ready in your wallet</p><span className={styles.previewPayout}>Request payout <AppIcon name="arrow-up-right-from-square" /></span></div><div className={styles.previewTotals}><small>Total earnings</small><strong>৳3,600</strong><p>Earned throughout your journey</p><div><span><small>People referred</small><b>13</b></span><span><small>Successful enrolments</small><b>2</b></span></div></div></div><div className={styles.previewWalletFooter}><span><i />In review <b>৳2,600</b></span><span><i />Paid out <b>৳1,000</b><AppIcon name="check-double" /></span></div></div>
                <aside className={styles.previewEncouragement}><div><small>A LITTLE ENCOURAGEMENT</small><AppIcon name="comment-dots" /></div><h4>A small message.<br />A big next step.</h4><p>A little encouragement could be just what Raful needs to keep moving forward.</p><div className={styles.previewStudent}><span>RI</span><span><b>Raful Islam</b><small>Applied</small></span></div><span className={styles.previewRemind}>Remind Raful <AppIcon name="arrow-up-right-from-square" /></span></aside>
              </div>
              <div className={styles.previewJourney}><strong>Every connection counts</strong><span>13 referrals <AppIcon name="chevron-right" /></span><div className={styles.previewStageBar}>{stages.map((stage, index) => <i key={stage} style={{ flex: index === 0 ? 3 : 2 }} />)}</div><div className={styles.previewStageLabels}>{stages.map((stage, index) => <span key={stage}><i />{stage} <b>{index === 0 ? 3 : 2}</b></span>)}</div></div>
              <div className={styles.previewReferrals}><div className={styles.previewSectionTitle}><h4>Your latest referrals</h4><span><AppIcon name="plus" /> Add referral</span></div><div className={styles.previewTableHead}><span>STUDENT</span><span>STAGE</span><span>REWARD</span></div>{referrals.map((referral, index) => <div className={styles.previewTableRow} key={referral.name}><div><span className={styles.previewStudentAvatar}>{referral.initials}</span><span><b>{referral.name}</b><small>{referral.course}</small></span></div><span className={`${styles.previewStatus} ${styles[`previewStatus${index}`]}`}>{referral.stage}</span><strong>{referral.reward}</strong></div>)}</div>
              <div className={styles.previewMilestones}><h4>Ambassador milestones</h4><p>Small steps, bigger possibilities.</p><div>{tiers.map(tier => <div key={tier.name} className={styles[`preview${tier.name}`]}><AppIcon name={tier.mark} /><strong>{tier.name}</strong><small>{tier.leads} validated leads</small><span /><footer>Cash bonus <b>{tier.bonus}</b></footer></div>)}</div></div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className={styles.mockCaption}><span><AppIcon name="circle-check" /></span>Your ambassador workspace<i />Illustrative preview · sample data</figcaption>
    </figure>
  );
}

export default function HomePage() {
  return (
    <div className={styles.home}>
      <a className={styles.skip} href="#main">Skip to content</a>
      <header className={styles.header}>
        <Link href="/" aria-label="BHE Uni Ambassador home"><Image src="/logo-white.png" alt="BHE Uni" width={153} height={61} className={styles.logo} priority /></Link>
        <span className={styles.brand}>AMBASSADOR PORTAL</span>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#your-portal">Your portal</a><a href="#tiers">Ambassador tiers</a><Link href="/login">Sign in</Link><Link href="/signup" className={styles.navJoin}>Become an ambassador <AppIcon name="arrow-up-right-from-square"/></Link></nav>
      </header>

      <main id="main">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.liveDot}/> THE BHE UNI AMBASSADOR PROGRAMME</p>
            <h1>Big opportunities.<br /><em>Start with you.</em></h1>
            <p className={styles.intro}>You know someone with potential. We help them take the next step. Connect future students to BHE Uni and turn your introductions into rewards.</p>
            <div className={styles.actions}><Link className={styles.primary} href="/signup">Start your ambassador journey <AppIcon name="arrow-up-right-from-square"/></Link><a className={styles.secondary} href="#your-portal"><span className={styles.playIcon}><AppIcon name="chart-pie"/></span> Explore the portal</a></div>
            <div className={styles.heroTrust}><span><AppIcon name="check"/> Free to join</span><span><AppIcon name="check"/> Your own referral link</span><span><AppIcon name="check"/> One simple portal</span></div>
          </div>
          <PortalMockup />
        </section>

        <div className={styles.strip}><span>YOUR CONNECTIONS. THEIR NEXT CHAPTER.</span><p>Make an introduction. <strong>Make a difference.</strong></p><a href="#how-it-works" aria-label="Explore how it works"><AppIcon name="arrow-down-wide-short"/></a></div>

        <section id="your-portal" className={styles.features}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>BUILT AROUND YOUR JOURNEY</p><h2>Less admin.<br /><em>More possibilities.</em></h2></div>
          <div className={styles.featureGrid}>{features.map((feature, index) => <article key={feature.title}><div className={styles.featureTop}><span><AppIcon name={feature.icon}/></span><small>0{index + 1}</small></div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
        </section>

        <section id="tiers" className={styles.tiersSection}>
          <div className={styles.tiersHeading}><div><p className={styles.eyebrow}>A LITTLE AMBITION GOES A LONG WAY</p><h2>More connections.<br /><em>More to look forward to.</em></h2></div><p>From your first introduction to your next big milestone. Grow through four ambassador tiers and unlock recognition along the way.</p></div>
          <div className={styles.tierGrid}>{tiers.map((tier, index) => <article key={tier.name} className={`${styles.tierCard} ${styles[tier.name.toLowerCase()]}`}>
            {tier.name === "Gold" && <span className={styles.featuredTier}>AIM A LITTLE HIGHER</span>}
            <div className={styles.tierCardTop}><div className={styles.tierEmblem}><AppIcon name={tier.mark}/></div><span>LEVEL 0{index + 1}</span></div>
            <h3>{tier.name}</h3><p>{tier.description}</p><div className={styles.tierTarget}><strong>{tier.leads}<span>+</span></strong><span>validated leads</span></div><div className={styles.tierTrack}><i style={{width: `${25 * (index + 1)}%`}} /></div>
            <ul>{tier.perks.map(perk => <li key={perk}><span><AppIcon name="check"/></span>{perk}</li>)}</ul><div className={styles.tierBonus}><span>Milestone cash bonus</span><strong>{tier.bonus}</strong></div><Link href="/signup">{index === 0 ? "Start your journey" : `Aim for ${tier.name}`} <AppIcon name="arrow-up-right-from-square"/></Link>
          </article>)}</div><p className={styles.tierNote}>Milestones reflect the current portal programme. Eligibility and rewards terms apply.</p>
        </section>

        <section className={styles.appSection}><div className={styles.phoneScene}><div className={styles.phoneGlow}/><Image src="/app/ambassador-app-home.png" alt="BHE Uni Ambassador mobile app showing the dashboard, rewards and referral progress" width={320} height={680} className={styles.phoneImage}/><span className={styles.phoneTag}>YOUR PORTAL. IN YOUR POCKET. <AppIcon name="mobile-screen"/></span></div><div><p className={styles.eyebrow}>BIG POSSIBILITIES. SMALL SCREEN.</p><h2>Life moves.<br />Your portal comes with you.</h2><p>Share a referral between lectures. Check your progress on the way home. Keep your ambassador journey close, wherever the day takes you.</p><div className={styles.appBenefits}><span><AppIcon name="check"/> Refer on the go</span><span><AppIcon name="check"/> Keep track of rewards</span><span><AppIcon name="check"/> Follow your milestones</span></div><div className={styles.storeLinks}><a href="https://apps.apple.com/gb/app/bhe-uni-ambassador/id6827007812" target="_blank" rel="noopener noreferrer"><small>Download on the</small><strong><AppIcon name="apple"/> App Store</strong></a><a href="https://play.google.com/store/apps/details?id=com.bheuni.ambassadorapp" target="_blank" rel="noopener noreferrer"><small>GET IT ON</small><strong><AppIcon name="google-play"/> Google Play</strong></a></div></div></section>

        <section id="how-it-works" className={styles.stepsSection}>
          <div><p className={styles.eyebrow}>YOUR FIRST STEP STARTS HERE</p><h2>Three steps.<br />A world of opportunity.</h2><Link className={styles.primary} href="/signup">Create your account <AppIcon name="arrow-up-right-from-square"/></Link></div>
          <ol className={styles.steps}><li><span>01</span><div><h3>Join the community</h3><p>Create your ambassador account and get your personal referral link.</p></div></li><li><span>02</span><div><h3>Connect someone to BHE Uni</h3><p>Share your link or submit a referral with their consent. Our team takes it from there.</p></div></li><li><span>03</span><div><h3>Follow progress. Earn rewards.</h3><p>Track each referral in your dashboard and receive rewards when programme criteria are met.</p></div></li></ol>
        </section>

        <section className={styles.faqSection} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>A FEW THINGS YOU MIGHT BE WONDERING</p><h2 id="faq-title">Good questions.<br /><em>Clear answers.</em></h2><p>Need a hand? We’re here to help.</p><a href="mailto:ask@bheuni.io">Talk to our team <AppIcon name="arrow-up-right-from-square"/></a></div><div className={styles.faqList}>
          <details><summary>How do I become an ambassador?<AppIcon name="plus"/></summary><p>Create an account with Google or email. With Google, we take your name and email automatically, then ask you to verify your mobile number. Your portal is ready once signup is complete.</p></details>
          <details><summary>How do I refer someone?<AppIcon name="plus"/></summary><p>Share your personal referral link, or submit a referral from your dashboard. Always get the person’s permission before sharing their details.</p></details>
          <details><summary>When do I receive a reward?<AppIcon name="plus"/></summary><p>Rewards depend on a referral meeting the programme’s eligibility and verification requirements. Your wallet shows reward status, and you can request a payout when the withdrawal requirements are met. Read the <Link href="/rewards-terms-and-conditions">Rewards Terms</Link> for full details.</p></details>
          <details><summary>Can I use the portal on my phone?<AppIcon name="plus"/></summary><p>Yes. Use the portal in your mobile browser, or download the BHE Uni Ambassador app for iPhone or Android to manage your journey on the go.</p></details>
        </div></section>

        <section className={styles.cta}><div><p className={styles.eyebrow}>LET’S MOVE FORWARD, TOGETHER</p><h2>Your next chapter<br />starts with a connection.</h2></div><div><Link className={styles.primary} href="/signup">Join the ambassador programme <AppIcon name="arrow-up-right-from-square"/></Link><p>Have an account? <Link href="/login">Sign in to your portal <AppIcon name="arrow-right"/></Link></p></div></section>
      </main>
      <footer className={styles.footer}><div><Image src="/logo.png" alt="BHE Uni" width={153} height={61} className={styles.logo} /><p>Connecting people. Creating possibilities.</p></div><div><a href="mailto:ask@bheuni.io">Contact support <AppIcon name="arrow-up-right-from-square"/></a><Link href="/rewards-terms-and-conditions">Rewards terms</Link><Link href="/privacy-policy">Privacy policy</Link><Link href="/gdpr-policy">GDPR policy</Link></div><small>© {new Date().getFullYear()} BHE Uni. All rights reserved.</small></footer>
    </div>
  );
}
