"use client";

import AppIcon from "@/components/AppIcon";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function GDPRPolicyPage() {
  // Logged-in ambassadors should return to their dashboard, not the public landing page.
  const { user } = useAuth();
  const homeHref = user ? "/dashboard" : "/";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <title>GDPR Policy - BHE Uni</title>
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center">
            <img src="/logo.png" alt="BHE UNI Logo" className="h-8 w-auto object-contain" />
          </Link>
          <Link href={homeHref} className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-2 rounded-[8px] transition-all">
            <AppIcon className="fa-solid fa-arrow-left mr-2"></AppIcon>Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-[8px] p-8 md:p-12 shadow-2xl space-y-8">
          <div>
            <span className="text-orange-500 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 px-3 py-1 rounded-full">
              Compliance Document
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
              GDPR Compliance Policy
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600 text-xs mt-3">
              <p><strong>Policy Owner:</strong> Boost Education Service Ltd t/a BHE UNI</p>
              <p><strong>Address:</strong> 11 Beaufort Court, Admirals Way, Canary Wharf, London, E14 9XL</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-8 text-sm text-slate-700 leading-relaxed">
            {/* Intro */}
            <section className="space-y-3">
              <p>
                This privacy policy ensures you that how Boost Education Service Limited handle your important personal data and explain the purpose of the use of your personal data and documents. BHE UNI Limited understands that your privacy is most important to you and you care about your personal data to use. We (BHE UNI) strongly ensures that your personal data will store securely, and it will be used only the purpose of your admission for the period of time.
              </p>
            </section>

            {/* 1. What does this Privacy Policy Cover? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-circle-info text-orange-500 text-sm"></AppIcon>
                1. What does this Privacy Policy Cover?
              </h2>
              <p>
                This Privacy Policy applies only to your use of Our Site. Our Site may contain links to other websites. Please note that we have no control over how your data is collected, stored, or used by other websites and we advise you to check the privacy policies of any such websites before providing any data to them.
              </p>
            </section>

            {/* 2. What is Personal Data? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-file-invoice text-orange-500 text-sm"></AppIcon>
                2. What is Personal Data?
              </h2>
              <p>
                Personal data is defined by the General Data Protection Regulation (EU Regulation 2016/679) (the “GDPR”) as ‘any information relating to an identifiable person who can be directly or indirectly identified in particular by reference to an identifier’. Personal data is, in simpler terms, any information about you that enables you to be identified. Personal data covers obvious information such as your name and contact details, but it also covers less obvious information such as identification numbers, electronic location data, and other online identifiers.
              </p>
            </section>

            {/* 3. What are your Rights? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-user-shield text-orange-500 text-sm"></AppIcon>
                3. What are your Rights?
              </h2>
              <p>
                Under the GDPR, you have the following rights, which We will always work to uphold:
              </p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>The right to be informed about our collection and use of your personal data. This Privacy Policy should tell you everything you need to know, but you can always contact us to find out more or to ask any questions using the details in Part 9.</li>
                <li>The right to access the personal data We hold about you (see Part 8).</li>
                <li>The right to have your personal data rectified if any of your personal data held by us is inaccurate or incomplete. Please contact us using the details in Part 9 to find out more.</li>
                <li>The right to be forgotten, i.e. the right to ask us to delete or otherwise dispose of any of your personal data that We have. Please contact us using the details in Part 9 to find out more.</li>
                <li>The right to restrict (i.e. prevent) the processing of your personal data.</li>
                <li>The right to object to us using your personal data for a particular purpose or purposes.</li>
                <li>The right to data portability. This means that, if you have provided personal data to us directly, We am using it with your consent or for the performance of a contract, and that data is processed using automated means, you can ask us for a copy of that personal data to re-use with another service or business in many cases.</li>
                <li>Rights relating to automated decision-making and profiling. We do not use your personal data in this way.</li>
              </ul>
              <p className="text-xs text-slate-600 mt-2">
                Further information about your rights can also be obtained from the Information Commissioner’s Office (ICO) or your local Citizens Advice Bureau. If you have any cause for complaint about our use of your personal data, you have the right to lodge a complaint with the Information Commissioner’s Office.
              </p>
            </section>

            {/* 4. What Data Do We Collect? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-folder-open text-orange-500 text-sm"></AppIcon>
                4. What Data Do We Collect?
              </h2>
              <p>
                Depending upon your use of our Site, we may collect some or all of the following personal and non-personal data:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-slate-600 grid md:grid-cols-2 gap-1">
                <li>Full Name</li>
                <li>Date of birth</li>
                <li>Gender</li>
                <li>Address</li>
                <li>Email address</li>
                <li>Telephone Number</li>
                <li>Job Title</li>
                <li>Profession</li>
                <li>Information about your preferences and interests</li>
              </ul>
            </section>

            {/* 5. How do we use your personal data? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-gears text-orange-500 text-sm"></AppIcon>
                5. How do we use your personal data?
              </h2>
              <p>
                Under the GDPR, We must always have a lawful basis for using personal data. This may be because the data is necessary for our performance of a contract with you, because you have consented to our use of your personal data, or because it is in our legitimate business interests to use it. Your personal data will OR may be used for one of the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-slate-600 grid md:grid-cols-2 gap-1">
                <li>Providing and managing your Account;</li>
                <li>Providing and managing your access to our Site;</li>
                <li>Personalising and tailoring your experience on our Site;</li>
                <li>Supplying our products AND services to you. Your personal details are required in order for us to enter into a contract with you;</li>
                <li>Personalising and tailoring our products AND services for you;</li>
                <li>Communicating with you. This may include responding to emails or calls from you;</li>
                <li>Supplying you with information by email AND/OR post that you have opted-in to (you may unsubscribe or opt-out at any time by clicking unsubscribe button in our email or contacting us via email);</li>
                <li>Analysing your use of our Site and gathering feedback to enable us to continually improve our Site and your user experience;</li>
                <li>With your permission and/or where permitted by law, We may also use your personal data for marketing purposes, which may include contacting you by email AND/OR telephone AND/OR text message AND/OR post with information, news, and offers on our products AND/OR services.</li>
              </ul>
              <p>
                We use the following automated systems for carrying out certain kinds of decision-making AND/OR profiling. If at any point you wish to query any action that We take on the basis of this or wish to request ‘human intervention’ (i.e. have someone review the action themselves, rather than relying only on the automated method), the GDPR gives you the right to do so. Please contact us to find out more using the details in Part 9.
              </p>
            </section>

            {/* 6. How long will we keep your Personal data and store? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-clock-rotate-left text-orange-500 text-sm"></AppIcon>
                6. How long will we keep your Personal data and store?
              </h2>
              <p>
                We will not keep your personal data for any longer than is necessary for the light of the reason(s) for which it was first collected. Your personal data will, therefore, be kept securely in our personal server and we use it with your concern.
              </p>
            </section>

            {/* 7. How and where do we Store or transfer your personal data? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-earth-americas text-orange-500 text-sm"></AppIcon>
                7. How and where do we Store or transfer your personal data?
              </h2>
              <p>
                We will only store or transfer your personal data in the UK or within the European Economic Area (the “EEA”). This means your personal data will be fully protected under the GDPR or equivalent standards by law.
              </p>
              <p>
                Where We transfer your data to a third party based in the US, this may be protected if they are part of the EU-US Privacy Shield. This requires that third party to provide data protection to standards similar to those in Europe. More information is available from the European Commission.
              </p>
            </section>

            {/* 8. Do we share your Personal Data? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-share-nodes text-orange-500 text-sm"></AppIcon>
                8. Do we share your Personal Data?
              </h2>
              <p>
                We will not share any of your personal data with any third parties for any purposes, subject to one important exception. In some limited circumstances, We may be legally required to share certain personal data, which might include yours, if we are involved in legal proceedings or complying with legal obligations, a court order, or the instructions of a government authority.
              </p>
              <p>
                We may share your personal data with other companies in our group for our marketing purposes. This includes subsidiaries AND/OR our holding company and its subsidiaries. We may sometimes contract with third parties to supply certain products AND/OR services (e.g. payment processing, delivery, and marketing). In some cases, those third parties may require access to some or all of your personal data that We hold. If any of your personal data is required by a third party, We will take steps to ensure that your personal data is handled safely, securely, and in accordance with your rights under the law.
              </p>
            </section>

            {/* 9. Contact us */}
            <section className="space-y-3 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-envelope text-orange-500 text-sm"></AppIcon>
                9. Contact us
              </h2>
              <p>
                If you have any questions or would like to exercise your rights under this policy, please contact BHE UNI:
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <AppIcon className="fa-solid fa-location-dot text-slate-500 text-xs"></AppIcon>
                  <span>11 Beaufort Court, Admirals Way, Canary Wharf, London, United Kingdom, E14 9XL</span>
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon className="fa-solid fa-envelope text-slate-500 text-xs"></AppIcon>
                  <a href="mailto:ask@bheuni.io" className="text-orange-600 hover:underline">ask@bheuni.io</a>
                </li>
                <li className="flex items-center gap-2">
                  <AppIcon className="fa-solid fa-phone text-slate-500 text-xs"></AppIcon>
                  <span>02033189380</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white/70">
        <p>© {new Date().getFullYear()} BHE Uni. All rights reserved.</p>
      </footer>
    </div>
  );
}

