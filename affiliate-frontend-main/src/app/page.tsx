import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

const features = [
  { icon: "↗", title: "Share a little. Open a door.", text: "Refer someone interested in university. Submit their details with permission, or share your personal referral link." },
  { icon: "◎", title: "Follow every next step.", text: "Keep your referrals together and follow their progress as our team supports their university journey." },
  { icon: "£", title: "Your rewards, in one place.", text: "See your earnings, check reward status and manage payout requests from your ambassador dashboard." },
];

const tiers = [
  { name: "Bronze", leads: "10", mark: "◇", description: "Make your first mark.", perks: ["Digital certificate", "Bronze ambassador badge", "Exclusive training access"] },
  { name: "Silver", leads: "25", mark: "✧", description: "Build your momentum.", perks: ["Silver certificate", "Branded hoodie", "Priority support"] },
  { name: "Gold", leads: "50", mark: "✦", description: "Stand out from the crowd.", perks: ["Gold certificate", "Social media feature", "VIP event invitations"] },
  { name: "Platinum", leads: "100", mark: "♢", description: "Make an exceptional impact.", perks: ["Platinum excellence award", "Hall of Fame induction", "Annual awards ceremony"] },
];

function PortalMockup() {
  return <div className={styles.showcase}>
    <div className={styles.floatingReward}><span>✓</span><div><strong>A connection worth celebrating</strong><small>Track every reward in your wallet</small></div></div>
    <div className={styles.browser}>
      <div className={styles.browserBar}><div><i /><i /><i /></div><span>ambassador.bheuni.uk / dashboard</span><span>↗</span></div>
      <div className={styles.mockApp}>
        <aside className={styles.mockSidebar}><Image src="/logo.png" alt="" width={75} height={30} /><span className={styles.mockNavActive}>▦ <b>Overview</b></span><span>♧ <b>My referrals</b></span><span>▤ <b>My wallet</b></span><span>◇ <b>Milestones</b></span><div className={styles.sidebarBottom}>BHE<br /><small>AMBASSADOR</small></div></aside>
        <div className={styles.mockMain}>
          <div className={styles.mockHeader}><span>YOUR AMBASSADOR SPACE</span><span className={styles.mockAvatar}>JD</span></div>
          <div className={styles.mockGreeting}><div><h3>Welcome back, Jamie <span>✧</span></h3><p>Every connection is a new possibility.</p></div><span className={styles.tierPill}>✦ Gold ambassador</span></div>
          <div className={styles.mockBanner}><div><small>GOOD CONNECTIONS GO FURTHER</small><h4>Your next referral.<br />Their next chapter.</h4><span>Refer a student ↗</span></div><div className={styles.bannerOrb}>↗</div></div>
          <div className={styles.mockStats}><div><small>Total referrals <span>↗</span></small><strong>54</strong><em>+8 this month</em></div><div><small>Total earned <span>▤</span></small><strong>£1,540</strong><em>Keep making connections</em></div><div><small>Current milestone <span>✦</span></small><strong>Gold</strong><em>Next stop: Platinum</em></div></div>
          <div className={styles.mockPanels}><div className={styles.chartPanel}><div><strong>Your referral activity</strong><small>Last 6 months ⌄</small></div><div className={styles.chart}><svg viewBox="0 0 320 95" role="img" aria-label="Illustrative referral activity increasing over six months"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fa823e" stopOpacity=".3"/><stop offset="100%" stopColor="#fa823e" stopOpacity="0"/></linearGradient></defs><path d="M0 76 C25 76 30 52 56 60 S95 72 119 48 S155 70 180 40 S216 47 238 26 S280 33 320 8 L320 95 L0 95Z" fill="url(#chart-fill)"/><path d="M0 76 C25 76 30 52 56 60 S95 72 119 48 S155 70 180 40 S216 47 238 26 S280 33 320 8" stroke="#f47b39" strokeWidth="3" fill="none"/></svg></div><div className={styles.chartLabels}>{["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(m => <span key={m}>{m}</span>)}</div></div><div className={styles.milestonePanel}><span>✦</span><strong>Looking good, Gold.</strong><p>Your connections are making a difference.</p><div><i /></div><small>54 / 100 to Platinum</small></div></div>
          <div className={styles.mockReferrals}><strong>Recent referrals</strong><span>View all →</span><div><span className={styles.personAvatar}>AL</span><b>Alex Lewis<small>University referral</small></b><em>Qualified</em></div><div><span className={styles.personAvatar}>SK</span><b>Sam Khan<small>University referral</small></b><em>In progress</em></div></div>
        </div>
      </div>
    </div>
    <div className={styles.mockCaption}><span>◉</span> A look inside your portal <i /> Illustrative dashboard · sample data</div>
  </div>;
}

export default function HomePage() {
  return (
    <div className={styles.home}>
      <a className={styles.skip} href="#main">Skip to content</a>
      <header className={styles.header}>
        <Link href="/" aria-label="BHE Uni Ambassador home"><Image src="/logo.png" alt="BHE Uni" width={153} height={61} className={styles.logo} priority /></Link>
        <span className={styles.brand}>AMBASSADOR PORTAL</span>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#your-portal">Your portal</a><a href="#tiers">Ambassador tiers</a><Link href="/login">Sign in <span aria-hidden="true">↗</span></Link></nav>
      </header>

      <main id="main">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> THE BHE UNI AMBASSADOR COMMUNITY <span className={styles.newBadge}>Your next chapter ↗</span></p>
            <h1>Your connections.<br />Their future. <em>Your rewards.</em></h1>
            <p className={styles.intro}>Turn a simple introduction into something bigger. Refer future students, follow their journey and earn rewards — all from your own ambassador portal.</p>
            <div className={styles.actions}><Link className={styles.primary} href="/signup">Start your ambassador journey <span aria-hidden="true">↗</span></Link><a className={styles.secondary} href="#your-portal"><span className={styles.playIcon}>▦</span> Explore the portal</a></div>
            <div className={styles.heroTrust}><span>✓ Free to join</span><span>✓ Your own referral link</span><span>✓ Rewards that grow with you</span></div>
          </div>
          <PortalMockup />
        </section>

        <div className={styles.strip}><span>YOUR CONNECTIONS. THEIR NEXT CHAPTER.</span><p>Make an introduction. <strong>Make a difference.</strong></p><a href="#how-it-works" aria-label="Explore how it works">↓</a></div>

        <section id="your-portal" className={styles.features}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>BUILT AROUND YOUR JOURNEY</p><h2>Everything you need.<br />One ambassador portal.</h2></div>
          <div className={styles.featureGrid}>{features.map((feature, index) => <article key={feature.title}><div className={styles.featureTop}><span>{feature.icon}</span><small>0{index + 1}</small></div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
        </section>

        <section id="tiers" className={styles.tiersSection}>
          <div className={styles.tiersHeading}><div><p className={styles.eyebrow}>A LITTLE AMBITION GOES A LONG WAY</p><h2>More connections.<br /><em>More to look forward to.</em></h2></div><p>From your first introduction to your next big milestone. Grow through four ambassador tiers and unlock recognition along the way.</p></div>
          <div className={styles.tierGrid}>{tiers.map((tier, index) => <article key={tier.name} className={`${styles.tierCard} ${styles[tier.name.toLowerCase()]}`}>
            {tier.name === "Gold" && <span className={styles.featuredTier}>THE NEXT BIG MILESTONE</span>}
            <div className={styles.tierCardTop}><div className={styles.tierEmblem}>{tier.mark}</div><span>LEVEL 0{index + 1}</span></div>
            <h3>{tier.name}</h3><p>{tier.description}</p><div className={styles.tierTarget}><strong>{tier.leads}<span>+</span></strong><span>validated leads</span></div><div className={styles.tierTrack}><i style={{width: `${25 * (index + 1)}%`}} /></div>
            <ul>{tier.perks.map(perk => <li key={perk}><span>✓</span>{perk}</li>)}</ul><Link href="/signup">{index === 0 ? "Start your journey" : `Aim for ${tier.name}`} <span>↗</span></Link>
          </article>)}</div><p className={styles.tierNote}>Milestones reflect the current portal programme. Eligibility and rewards terms apply.</p>
        </section>

        <section className={styles.appSection}><div className={styles.phoneScene}><div className={styles.phoneGlow}/><Image src="/app/ambassador-app-home.png" alt="BHE Uni Ambassador mobile app showing the dashboard, rewards and referral progress" width={320} height={680} className={styles.phoneImage}/><span className={styles.phoneTag}>YOUR PORTAL. IN YOUR POCKET. ↗</span></div><div><p className={styles.eyebrow}>BIG POSSIBILITIES. SMALL SCREEN.</p><h2>Life moves.<br />Your portal comes with you.</h2><p>Share a referral between lectures. Check your progress on the way home. Keep your ambassador journey close, wherever the day takes you.</p><div className={styles.appBenefits}><span>✓ Refer on the go</span><span>✓ Keep track of rewards</span><span>✓ Follow your milestones</span></div><div className={styles.storeLinks}><a href="https://apps.apple.com/gb/app/bhe-uni-ambassador/id6827007812" target="_blank" rel="noopener noreferrer"><small>Download on the</small><strong>App Store ↗</strong></a><a href="https://play.google.com/store/apps/details?id=com.bheuni.ambassadorapp" target="_blank" rel="noopener noreferrer"><small>GET IT ON</small><strong>Google Play ↗</strong></a></div></div></section>

        <section id="how-it-works" className={styles.stepsSection}>
          <div><p className={styles.eyebrow}>YOUR FIRST STEP STARTS HERE</p><h2>Three steps.<br />A world of opportunity.</h2><Link className={styles.primary} href="/signup">Create your account <span aria-hidden="true">↗</span></Link></div>
          <ol className={styles.steps}><li><span>01</span><div><h3>Join the community</h3><p>Create your ambassador account and get your personal referral link.</p></div></li><li><span>02</span><div><h3>Connect someone to BHE Uni</h3><p>Share your link or submit a referral with their consent. Our team takes it from there.</p></div></li><li><span>03</span><div><h3>Follow progress. Earn rewards.</h3><p>Track each referral in your dashboard and receive rewards when programme criteria are met.</p></div></li></ol>
        </section>

        <section className={styles.cta}><div><p className={styles.eyebrow}>LET’S MOVE FORWARD, TOGETHER</p><h2>Your next chapter<br />starts with a connection.</h2></div><div><Link className={styles.primary} href="/signup">Join the ambassador programme <span aria-hidden="true">↗</span></Link><p>Have an account? <Link href="/login">Sign in to your portal →</Link></p></div></section>
      </main>
      <footer className={styles.footer}><div><Image src="/logo.png" alt="BHE Uni" width={153} height={61} className={styles.logo} /><p>Connecting people. Creating possibilities.</p></div><div><a href="mailto:ask@bheuni.io">Contact support ↗</a><Link href="/rewards-terms-and-conditions">Rewards terms</Link><Link href="/privacy-policy">Privacy policy</Link><Link href="/gdpr-policy">GDPR policy</Link></div><small>© {new Date().getFullYear()} BHE Uni. All rights reserved.</small></footer>
    </div>
  );
}
