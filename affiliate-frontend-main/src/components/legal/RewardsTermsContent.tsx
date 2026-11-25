import AppIcon from "@/components/AppIcon";
import React from "react";

// Chrome-free RewardsTermsContent body. Rendered by BOTH the standalone legal page
// AND the accept-terms modal, so the legal text can never drift between them.
export default function RewardsTermsContent() {
  return (
          <div className="border-t border-slate-200 pt-6 space-y-8 text-sm text-slate-700 leading-relaxed">
            {/* 1. Purpose */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-bullseye text-orange-500 text-sm"></AppIcon>
                1. Purpose
              </h2>
              <p>
                This terms and conditions document outlines the rules, eligibility requirements, referral procedures, GDPR obligations, reward payments, and compliance standards applicable to participants in the BHE Uni Ambassador, Referral &amp; Rewards Programme.
              </p>
              <p>
                The purpose of the programme is to encourage genuine referrals and support prospective students seeking access to higher education opportunities within the United Kingdom.
              </p>
            </section>

            {/* 2. Ambassador Programme Overview */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-trophy text-orange-500 text-sm"></AppIcon>
                2. Ambassador Programme Overview
              </h2>
              <p>Participants may earn rewards through the following levels:</p>
              <div className="grid md:grid-cols-3 gap-4 mt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-5 space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Level 1</span>
                  <h4 className="text-slate-900 font-bold text-sm">Lead Referral Rewards</h4>
                  <p className="text-xs text-slate-600">
                    <strong>Reward:</strong> ৳10 per qualified lead. No maximum limit applies, subject to compliance checks and fraud prevention measures.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-5 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Level 2</span>
                  <h4 className="text-slate-900 font-bold text-sm">Enrolment Rewards</h4>
                  <p className="text-xs text-slate-600">
                    <strong>Reward:</strong> ৳500 for eligible UK Home Student enrolments. Rewards are payable only following successful enrolment verification and compliance approval.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-5 space-y-2">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Level 3</span>
                  <h4 className="text-slate-900 font-bold text-sm">Milestone Bonuses</h4>
                  <p className="text-xs text-slate-600">
                    <strong>Reward:</strong> One-off cash bonuses of ৳25 to ৳500 for reaching validated-lead milestones (Bronze to Platinum). Additional to standard rewards &mdash; see Section 10.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Eligible Student Categories */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-users text-orange-500 text-sm"></AppIcon>
                3. Eligible Student Categories
              </h2>
              <p>For UK Home Fee and Student Finance eligibility, referred individuals may include:</p>
              <div className="overflow-hidden rounded-[8px] border border-slate-200">
                <table className="w-full text-sm text-slate-600">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="divide-x divide-slate-200">
                      <td className="px-4 py-2.5 align-top">British Citizens</td>
                      <td className="px-4 py-2.5 align-top">Irish Citizens</td>
                    </tr>
                    <tr className="divide-x divide-slate-200">
                      <td className="px-4 py-2.5 align-top">EU Citizens with eligible immigration status</td>
                      <td className="px-4 py-2.5 align-top">Settled Status Holders</td>
                    </tr>
                    <tr className="divide-x divide-slate-200">
                      <td className="px-4 py-2.5 align-top">Pre-Settled Status Holders (subject to current Student Finance regulations)</td>
                      <td className="px-4 py-2.5 align-top">Indefinite Leave to Remain (ILR) Holders</td>
                    </tr>
                    <tr className="divide-x divide-slate-200">
                      <td className="px-4 py-2.5 align-top">Refugees</td>
                      <td className="px-4 py-2.5 align-top">Humanitarian Protection Holders</td>
                    </tr>
                    <tr className="divide-x divide-slate-200">
                      <td className="px-4 py-2.5 align-top">Ukraine Scheme individuals (subject to funding regulations)</td>
                      <td className="px-4 py-2.5 align-top">Other categories recognised by Student Finance England or relevant funding authorities</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600 italic mt-2">
                Eligibility is determined solely by the relevant university, college, and funding authority. BHE Uni does not guarantee admission, funding eligibility, or student finance approval.
              </p>
            </section>

            {/* 4. Qualified Lead Requirements */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-circle-check text-orange-500 text-sm"></AppIcon>
                4. Qualified Lead Requirements
              </h2>
              <p>A lead will only be considered valid where:</p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>The individual has provided consent to be contacted by BHE Uni</li>
                <li>Full and accurate contact details have been supplied</li>
                <li>The individual has expressed a genuine interest in higher education opportunities</li>
                <li>The lead has not previously been registered within BHE Uni systems</li>
                <li>The lead has not been submitted by another ambassador or referral source</li>
                <li>The lead satisfies minimum programme eligibility requirements</li>
              </ul>
              <p className="text-xs text-slate-600 italic">BHE Uni reserves the right to determine whether a lead is valid.</p>
            </section>

            {/* 5. Duplicate Lead */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-clone text-orange-500 text-sm"></AppIcon>
                5. Duplicate Lead
              </h2>
              <p>Duplicate referrals are not eligible for rewards.</p>
              <p>The CRM system records:</p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>Name</li>
                <li>Email Address</li>
                <li>Mobile Number</li>
                <li>Submission Date and Time</li>
              </ul>
              <p>The first valid submission recorded within the CRM system shall be recognised as the official referral source.</p>
              <p>Any subsequent submissions relating to the same individual shall be rejected.</p>
              <p>Where disputes arise, BHE Uni reserves the right to determine referral ownership at its sole discretion.</p>
            </section>

            {/* 6. Fraud Prevention & Acceptable Conduct */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-shield-halved text-orange-500 text-sm"></AppIcon>
                6. Fraud Prevention &amp; Acceptable Conduct
              </h2>
              <p>The following activities are strictly prohibited:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-4 text-slate-600 grid md:grid-cols-2 gap-1">
                <li>Submitting fake or fabricated leads</li>
                <li>Self-referrals</li>
                <li>Creating duplicate accounts</li>
                <li>Using false or misleading information</li>
                <li>Manipulating referral data</li>
                <li>Claiming rewards dishonestly</li>
                <li>Purchasing leads</li>
                <li>Sending unsolicited bulk messages or spam communications</li>
                <li>Collecting personal information without consent</li>
                <li>Using automated tools to generate referrals</li>
              </ul>
              <p>BHE Uni reserves the right to:</p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>Suspend or terminate participant accounts</li>
                <li>Cancel pending rewards</li>
                <li>Recover rewards paid in error</li>
                <li>Remove participants from the programme</li>
                <li>Pursue legal action where appropriate</li>
              </ul>
            </section>

            {/* 7. GDPR & Data Protection Compliance */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-lock text-orange-500 text-sm"></AppIcon>
                7. GDPR &amp; Data Protection Compliance
              </h2>
              <p>All participants must comply with UK GDPR, the Data Protection Act 2018, and all applicable privacy legislation.</p>
              <div className="bg-orange-500/5 border border-orange-200 rounded-[8px] p-4 space-y-2">
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Consent Declaration</span>
                <p className="text-sm text-slate-700">Before submitting any referral, participants must confirm:</p>
                <p className="text-sm text-slate-800 italic">
                  &ldquo;I confirm that I have obtained the referred individual&apos;s explicit consent to share their personal information with BHE Uni for educational guidance, university admissions support, and related communications.&rdquo;
                </p>
                <p className="text-xs text-slate-600 italic">BHE Uni reserves the right to request evidence of consent where necessary.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">Personal Data Collected</h4>
                  <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                    <li>Full Name</li>
                    <li>Email Address</li>
                    <li>Telephone Number</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">Purpose of Processing</h4>
                  <p className="text-sm text-slate-600">Personal data may be used for:</p>
                  <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                    <li>Educational advice</li>
                    <li>University applications</li>
                    <li>Admissions support</li>
                    <li>Recruitment communications</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                <strong className="text-slate-900">Data Storage:</strong> Personal information will be securely stored within BHE Uni systems and processed in accordance with applicable privacy laws.
              </p>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-slate-900">Rights of Individuals</p>
                <p className="text-sm text-slate-600">Individuals have the right to:</p>
                <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                  <li>Access their personal data</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of personal data</li>
                  <li>Restrict processing where applicable</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </div>
            </section>

            {/* 8. Reward Payment Terms and Conditions */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-coins text-orange-500 text-sm"></AppIcon>
                8. Reward Payment Terms and Conditions
              </h2>

              <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-5 space-y-3">
                <h4 className="text-slate-900 font-bold text-sm">Lead Referral Rewards</h4>
                <p className="text-sm text-slate-700">Payment will be issued following:</p>
                <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                  <li>Lead validation</li>
                  <li>Completion of compliance checks</li>
                  <li>Confirmation that the lead is eligible for UK home fee</li>
                  <li>Confirmation that the lead has a genuine interest in studying</li>
                  <li>Confirmation that the lead meets Student Finance England eligibility requirements</li>
                </ul>
                <p className="text-sm font-bold text-slate-900 pt-1">Payment Terms and conditions</p>
                <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                  <li>A minimum reward balance of ৳50 is required for payment by bank transfer to the Ambassador&apos;s bank account.</li>
                  <li>Where the reward balance is less than ৳50, the reward may be issued as a BHE Uni digital voucher/gift card instead.</li>
                </ul>
                <p className="text-sm text-emerald-600">
                  <strong>Expected Payment Timeframe:</strong> Payments will normally be processed within 3&ndash;5 working days once all validation and compliance checks have been completed.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-5 space-y-3">
                <h4 className="text-slate-900 font-bold text-sm">Enrolment Rewards</h4>
                <p className="text-sm text-slate-700">
                  Enrolment Rewards are payable only in respect of enrolments onto higher education courses at BHE Uni partner institutions. Enrolment onto any course offered by Digital Marketing School (&apos;DMS&apos;) does not qualify for an Enrolment Reward. Where a referred individual who has enrolled with DMS subsequently enrols onto a higher education course through a BHE Uni partner institution, the Enrolment Reward may become payable in respect of that higher education enrolment only, subject to all other conditions in this Section.
                </p>
                <p className="text-sm text-slate-700">Rewards become payable only when:</p>
                <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                  <li>The student has successfully enrolled</li>
                  <li>University enrolment has been verified</li>
                  <li>Student finance England funding has been approved and received by the university partner</li>
                  <li>The university partner has paid BHE Uni for the referral</li>
                  <li>No refund or chargeback risk applies</li>
                  <li>The student remains actively enrolled as confirmed by the institution</li>
                  <li>Has not been withdrawn, cancelled, deferred, or rejected</li>
                  <li>Remains eligible under the institutional agreement for commission payment</li>
                </ul>
                <p className="text-sm text-slate-700"><strong>Expected Payment Timeframe:</strong></p>
                <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                  <li>Payment will be issued only once BHE Uni has received payment from the university partner, following all the above confirmations.</li>
                </ul>
                <p className="text-sm text-slate-700">The reward will be paid in 2 instalments as follows:</p>
                <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                  <li>First instalment will be paid in 4&ndash;6 months after enrolment</li>
                  <li>Second Instalment will be paid in 9&ndash;12 months after enrolment</li>
                </ul>
                <p className="text-sm text-slate-600">
                  The ambassador should make a claim from our ambassador portal and previous referral agents should send an invoice through <a href="https://invoice.bheuni.io" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">invoice.bheuni.io</a> link to claim the invoice or send an invoice directly to our referral representative.
                </p>
              </div>
            </section>

            {/* 9. Payment Methods */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-money-bill-wave text-orange-500 text-sm"></AppIcon>
                9. Payment Methods
              </h2>
              <p>BHE Uni may issue rewards through:</p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>BHE Uni Digital Gift Cards</li>
                <li>Bank Transfer</li>
                <li>Other approved reward methods</li>
              </ul>
              <p className="text-xs text-slate-600 italic">BHE Uni reserves the right to determine available payment methods.</p>
            </section>

            {/* 10. Milestone Bonuses (added by BHE Uni) */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-medal text-orange-500 text-sm"></AppIcon>
                10. Milestone Bonuses
              </h2>
              <p>
                In addition to the standard rewards above, Ambassadors unlock one-off <strong>milestone bonuses</strong> as they reach set numbers of validated leads. Progression is measured by validated leads recorded in the BHE Uni system:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                <div className="bg-slate-50 border border-amber-300 rounded-[8px] p-5 flex flex-col">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Bronze</span>
                  <p className="text-slate-900 font-bold text-sm mt-1">10 validated leads</p>
                  <ul className="text-xs text-slate-600 space-y-1 mt-3 flex-grow">
                    <li>Digital Certificate</li>
                    <li>Bronze Badge</li>
                    <li>Exclusive Training Access</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-amber-600 font-bold text-xl">৳25</span>
                    <span className="text-[10px] text-slate-500 ml-1">cash bonus</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-300 rounded-[8px] p-5 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Silver</span>
                  <p className="text-slate-900 font-bold text-sm mt-1">25 validated leads</p>
                  <ul className="text-xs text-slate-600 space-y-1 mt-3 flex-grow">
                    <li>Silver Certificate</li>
                    <li>Branded Hoodie</li>
                    <li>Priority Support</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-slate-800 font-bold text-xl">৳100</span>
                    <span className="text-[10px] text-slate-500 ml-1">cash bonus</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-yellow-300 rounded-[8px] p-5 flex flex-col">
                  <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Gold</span>
                  <p className="text-slate-900 font-bold text-sm mt-1">50 validated leads</p>
                  <ul className="text-xs text-slate-600 space-y-1 mt-3 flex-grow">
                    <li>Gold Certificate</li>
                    <li>Social Media Feature</li>
                    <li>VIP Event Invites</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-yellow-600 font-bold text-xl">৳250</span>
                    <span className="text-[10px] text-slate-500 ml-1">cash bonus</span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-teal-300 rounded-[8px] p-5 flex flex-col">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Platinum</span>
                  <p className="text-slate-900 font-bold text-sm mt-1">100 validated leads</p>
                  <ul className="text-xs text-slate-600 space-y-1 mt-3 flex-grow">
                    <li>Platinum Excellence Award</li>
                    <li>Hall of Fame Induction</li>
                    <li>Annual Awards Ceremony</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-teal-600 font-bold text-xl">৳500</span>
                    <span className="text-[10px] text-slate-500 ml-1">cash bonus</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-5 space-y-2.5 mt-2">
                <p className="text-sm font-bold text-slate-900">Milestone Bonus Terms</p>
                <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 pl-5">
                  <li>Milestone bonuses are additional rewards and do not replace or reduce the standard ৳10 reward payable for each qualified lead.</li>
                  <li>Each milestone is rewarded separately. An Ambassador who reaches multiple milestones will receive the bonus for each milestone achieved.</li>
                  <li>Only validated and eligible leads that meet the Qualified Lead Requirements will count towards milestone progression.</li>
                  <li>Duplicate, invalid, fraudulent, or rejected leads will not count towards a milestone.</li>
                  <li>The applicable milestone bonus becomes payable once the required number of validated leads has been reached and the relevant compliance checks have been completed.</li>
                  <li>An Ambassador&apos;s progress and tier will be calculated based on validated leads recorded in the BHE Uni system.</li>
                  <li>BHE Uni reserves the right to verify lead eligibility before awarding any milestone bonus.</li>
                </ul>
              </div>
            </section>

            {/* 11. Tax Responsibility */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-receipt text-orange-500 text-sm"></AppIcon>
                11. Tax Responsibility
              </h2>
              <p>Participants are solely responsible for declaring any taxable income arising from rewards received.</p>
              <p>BHE Uni accepts no responsibility for personal tax liabilities.</p>
            </section>

            {/* 12. Audit Rights */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-clipboard-check text-orange-500 text-sm"></AppIcon>
                12. Audit Rights
              </h2>
              <p>To ensure programme integrity and compliance, BHE Uni reserves the right to:</p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>Audit referral submissions</li>
                <li>Request evidence of consent</li>
                <li>Verify lead authenticity</li>
                <li>Investigate suspected fraud or misuse</li>
              </ul>
              <p>Failure by an ambassador to cooperate with an audit or investigation may result in suspension from the Ambassador &amp; Rewards Programme and/or withholding or cancellation of reward payments.</p>
            </section>

            {/* 13. Complaints Procedure */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-envelope text-orange-500 text-sm"></AppIcon>
                13. Complaints Procedure
              </h2>
              <p>Complaints relating to referrals, rewards, eligibility, or programme administration should be sent to:</p>
              <p>Email: <a href="mailto:ask@bheuni.io" className="text-orange-600 hover:underline">ask@bheuni.io</a></p>
              <p>BHE Uni aims to acknowledge complaints within 5 working days and respond within 20 working days, where reasonably possible.</p>
            </section>

            {/* 14. Programme Amendments */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-pen-to-square text-orange-500 text-sm"></AppIcon>
                14. Programme Amendments
              </h2>
              <p>BHE Uni reserves the right to:</p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>Modify reward amounts</li>
                <li>Amend programme rules</li>
                <li>Suspend or terminate the programme</li>
                <li>Reject referrals that do not satisfy compliance requirements</li>
              </ul>
              <p>Material changes will be published on the BHE Uni website, app, or referral portal and will take effect from the stated effective date.</p>
            </section>

            {/* 15. Final Decision */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-gavel text-orange-500 text-sm"></AppIcon>
                15. Final Decision
              </h2>
              <p>All decisions relating to:</p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>Lead validity</li>
                <li>Duplicate submissions</li>
                <li>Reward eligibility</li>
                <li>Compliance matters</li>
                <li>Fraud investigations</li>
              </ul>
              <p>shall be made by BHE Uni.</p>
              <p>BHE Uni&apos;s decision shall be final.</p>
            </section>

            {/* 16. Governing Law */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-scale-balanced text-orange-500 text-sm"></AppIcon>
                16. Governing Law
              </h2>
              <p>This policy shall be governed by and interpreted in accordance with the laws of England and Wales.</p>
              <p>Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
            </section>

            {/* Contact Information */}
            <section className="space-y-3 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-address-card text-orange-500 text-sm"></AppIcon>
                Contact Information
              </h2>
              <p className="font-semibold text-slate-900">BHE Uni</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Telephone: <a href="tel:02033189380" className="text-orange-600 hover:underline">02033189380</a></li>
                <li>Email: <a href="mailto:ask@bheuni.io" className="text-orange-600 hover:underline">ask@bheuni.io</a></li>
                <li>Website: <a href="https://www.bheuni.io" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">www.bheuni.io</a> &middot; <a href="https://www.bheuni.uk" target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">www.bheuni.uk</a></li>
              </ul>
              <p className="text-sm text-slate-600">Programme Support: Ambassador &amp; Rewards Team</p>
            </section>
          </div>
  );
}
