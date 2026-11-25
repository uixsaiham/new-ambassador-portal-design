"use client";

import AppIcon from "@/components/AppIcon";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import RewardsTermsContent from "@/components/legal/RewardsTermsContent";

// iPhone gift promotion Closing Date (1 Feb 2027 00:00 UK/GMT). Kept in step with
// PROMO_END_MS in IPhoneGiftPromo.tsx so the "Current promotion" callout below
// auto-hides at the same moment as the dashboard banner + modal.
const PROMO_END_MS = Date.parse("2027-02-01T00:00:00Z");

export default function AffiliatePolicyPage() {
  // Logged-in ambassadors should return to their dashboard, not the public landing page.
  const { user } = useAuth();
  const homeHref = user ? "/dashboard" : "/";

  // Only show the promo callout during the Promotion Period. Decided after mount
  // (not during render) to avoid a hydration mismatch on the date check.
  const [showPromo, setShowPromo] = useState(false);
  useEffect(() => {
    setShowPromo(Date.now() < PROMO_END_MS);
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <title>Rewards Terms and Conditions - BHE Uni</title>
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
              Official Terms &amp; Conditions
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
              BHE Uni Ambassador, Referral &amp; Rewards Terms and Conditions
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600 text-xs mt-3">
              <p><strong>Effective Date:</strong> 01 July 2026</p>
              <p><strong>Policy Owner:</strong> BHE Uni (Boost Education Service Ltd)</p>
              <p><strong>Version:</strong> 01</p>
            </div>
          </div>

          {/* Current promotion callout. Kept OUTSIDE <RewardsTermsContent/> (the
              archived/versioned body behind the accept-terms gate) so it never
              changes that document's hash. The gift promo has its own terms, and
              this callout auto-hides once the Promotion Period has ended. */}
          {showPromo && (
            <Link
              href="/promotions/iphone-gift-terms"
              className="flex items-center gap-3 rounded-[8px] border border-orange-200 bg-orange-50 px-4 py-3.5 hover:bg-orange-100/70 transition-colors"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-orange-500/15 text-orange-600">
                <AppIcon className="fa-solid fa-gift"></AppIcon>
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-orange-600">Current promotion</span>
                <span className="block text-sm font-semibold text-slate-900">iPhone 18 Pro Max Gift - read the terms</span>
              </span>
              <AppIcon className="fa-solid fa-arrow-right ml-auto text-orange-500 text-sm"></AppIcon>
            </Link>
          )}

          <RewardsTermsContent />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-slate-50">
        <p>© {new Date().getFullYear()} BHE Uni. All rights reserved.</p>
      </footer>
    </div>
  );
}
