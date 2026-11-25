"use client";

import AppIcon from "@/components/AppIcon";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// Standalone terms page for the iPhone 18 Pro Max Gift promotion. Kept SEPARATE
// from the Rewards T&C (which is versioned/hashed behind the accept-terms gate), so
// publishing this promo does not force every ambassador to re-accept. Verbatim from
// BHE_UNI_iPhone_Gift_Terms.docx v1.0; the [number] placeholder is filled with the
// BHE Uni company registration number (08186502).
export default function IPhoneGiftTermsPage() {
  const { user } = useAuth();
  const homeHref = user ? "/dashboard" : "/";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <title>iPhone 18 Pro Max Gift - Terms and Conditions - BHE Uni</title>
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center">
            <img src="/logo.png" alt="BHE UNI Logo" className="h-8 w-auto object-contain" />
          </Link>
          <Link href={homeHref} className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-2 rounded-[8px] transition-all">
            <AppIcon className="fa-solid fa-arrow-left mr-2"></AppIcon>Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-grow py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-[8px] p-8 md:p-12 shadow-2xl space-y-8">
          <div>
            <span className="text-orange-500 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 px-3 py-1 rounded-full">
              Promotion Terms &amp; Conditions
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
              iPhone 18 Pro Max Gift
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600 text-xs mt-3">
              <p><strong>Version:</strong> 1.0</p>
              <p><strong>Effective from:</strong> 1st October 2026</p>
              <p><strong>Read alongside:</strong> the BHE UNI Ambassador and Rewards Policy</p>
            </div>
            <p className="text-slate-500 text-xs mt-2 italic">
              Where the two conflict for this promotion, these terms apply.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-8 text-sm text-slate-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">1. Promoter</h2>
              <p><strong>1.1</strong> The promoter is Boost Education Service Limited, trading as BHE UNI, of 11 Beaufort Court, Admirals Way, Canary Wharf, London E14 9XL, company number 08186502 (&ldquo;BHE UNI&rdquo;, &ldquo;we&rdquo;).</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">2. Who can take part</h2>
              <p><strong>2.1</strong> This promotion is open to ambassadors who hold an active, approved account on ambassador.bheuni.uk at any point during the Promotion Period, are aged 18 or over and are resident in the UK.</p>
              <p><strong>2.2</strong> It is not open to BHE UNI employees, contractors, counsellors, university partner staff, or members of their households.</p>
              <p><strong>2.3</strong> Ambassadors must follow the Ambassador and Rewards Policy throughout. An ambassador suspended or removed for a breach is no longer eligible.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">3. Promotion Period</h2>
              <p><strong>3.1</strong> Enrolments count if confirmed between 00:00 on 1 October 2026 and 23:59 UK time on 31 January 2027 (the &ldquo;Closing Date&rdquo;).</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">4. How to qualify</h2>
              <p><strong>4.1</strong> Reach 10 Successful Enrolments within the Promotion Period.</p>
              <p><strong>4.2</strong> A &ldquo;Successful Enrolment&rdquo; means a student who:</p>
              <ul className="list-none space-y-2 pl-5">
                <li><strong>(a)</strong> was referred by the ambassador through their own portal account, and the referral was the first record of that student in BHE UNI&rsquo;s system;</li>
                <li><strong>(b)</strong> was marked as a qualified lead by a BHE UNI counsellor;</li>
                <li><strong>(c)</strong> fully enrolled on a course at a BHE UNI partner university through BHE UNI, with a course start date on or before 31 January 2027; and</li>
                <li><strong>(d)</strong> remains enrolled and active at that university 6 weeks after their course start date, as confirmed by the university&rsquo;s enrolment report or written confirmation.</li>
              </ul>
              <p><strong>4.3</strong> Each student counts once, towards one ambassador only. Referrals cannot be transferred, shared or pooled between ambassadors.</p>
              <p><strong>4.4</strong> Self-referrals, referrals of students already in contact with BHE UNI, duplicate or fabricated records, and referrals obtained by misleading the student do not count.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">5. The reward</h2>
              <p><strong>5.1</strong> One Apple iPhone 18 Pro Max, 256GB, in a colour of the winner&rsquo;s choice, subject to stock.</p>
              <p><strong>5.2</strong> Each ambassador can win one iPhone, even if they get more than 10 enrolments. Every ambassador who reaches 10 enrolments will get one.</p>
              <p><strong>5.3</strong> The iPhone is in addition to, and does not replace, the &pound;10 per qualified lead and &pound;500 per enrolment rewards, which continue to be paid on their normal schedule.</p>
              <p><strong>5.4</strong> There is no cash alternative. If the model is unavailable, we will provide a device of equal or greater value, agreed with the winner.</p>
              <p><strong>5.5</strong> The reward is not transferable and cannot be exchanged or sold back to BHE UNI.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">6. Verification and delivery</h2>
              <p><strong>6.1</strong> We will verify all enrolments against university records by 31 March 2027. Enrolments still being verified at that date will be reviewed as soon as confirmation arrives, and no later than 30 June 2027.</p>
              <p><strong>6.2</strong> Winners are notified by email and in the portal within 10 days of verification. They must reply within 7 days to arrange collection or delivery. If a winner does not respond after 14 days and two reminders, the reward lapses.</p>
              <p><strong>6.3</strong> Collection is the standard option. Winners collect the iPhone in person, by appointment, from our office at 11 Beaufort Court, Admirals Way, Canary Wharf, London E14 9XL. Winners must bring valid photo ID matching the name on their ambassador account. We aim to have iPhones ready for collection by 30 April 2027.</p>
              <p><strong>6.4</strong> If a winner is unable to attend the office, they may instead give us a UK delivery address. We will send the iPhone by tracked, signed-for delivery at no cost to the winner, and aim to dispatch it within 14 days of receiving the address. We are not responsible for delays caused by an incorrect address or a missed delivery.</p>
              <p><strong>6.5</strong> If a counted student withdraws after verification, the reward is not reclaimed. If an enrolment is later found to be fraudulent, we may reclaim the device or its RRP value.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">7. Progress tracking</h2>
              <p><strong>7.1</strong> Ambassadors can see their progress in the portal. Portal counts show recorded enrolments and are provisional until verification under clause 4.2(d).</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">8. Tax</h2>
              <p><strong>8.1</strong> Rewards may count as taxable income. Ambassadors are responsible for declaring their total ambassador earnings, including the value of the iPhone, to HMRC where required. BHE UNI does not give tax advice.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">9. Our rights</h2>
              <p><strong>9.1</strong> We may suspend, amend or withdraw this promotion only for reasons outside our reasonable control, or where required by law. Any change will not reduce the reward for enrolments already confirmed, and will be announced by email and in the portal.</p>
              <p><strong>9.2</strong> Our decision on whether an enrolment counts is final, subject to clause 10.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">10. Questions and complaints</h2>
              <p><strong>10.1</strong> Contact <a href="mailto:ask@bheuni.io" className="text-orange-600 hover:underline">ask@bheuni.io</a>. We reply within 5 working days.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">11. Data</h2>
              <p><strong>11.1</strong> We use ambassador and student data to run this promotion under our privacy notice. With the winner&rsquo;s consent, we may publish their first name, city and a photo.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">12. General</h2>
              <p><strong>12.1</strong> These terms are governed by the laws of England and Wales.</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-slate-50">
        <p>&copy; {new Date().getFullYear()} BHE Uni. All rights reserved.</p>
      </footer>
    </div>
  );
}
