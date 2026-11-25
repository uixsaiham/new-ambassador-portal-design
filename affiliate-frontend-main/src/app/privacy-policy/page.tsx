"use client";

import AppIcon from "@/components/AppIcon";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import PrivacyPolicyContent from "@/components/legal/PrivacyPolicyContent";

export default function PrivacyPolicyPage() {
  // Logged-in ambassadors should return to their dashboard, not the public landing page.
  const { user } = useAuth();
  const homeHref = user ? "/dashboard" : "/";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <title>Privacy Policy - BHE Uni</title>
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
              Official Policy Document
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mt-3">
              Privacy Policy
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600 text-xs mt-3">
              <p><strong>Policy Owner:</strong> Boost Education Service Ltd t/a BHE UNI</p>
              <p><strong>Compliance:</strong> GDPR / UK Data Protection Laws</p>
            </div>
          </div>

          <PrivacyPolicyContent />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white/70">
        <p>© {new Date().getFullYear()} BHE Uni. All rights reserved.</p>
      </footer>
    </div>
  );
}

