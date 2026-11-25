import AppIcon from "@/components/AppIcon";
import Link from "next/link";
import { ReactNode } from "react";

// Document-style shell for the policy pages. Deliberately light/high-contrast
// (legal copy reads best as a plain document) regardless of the portal theme.
export default function PolicyShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-black text-slate-900 tracking-tight">
            BHE <span className="text-orange-500">UNI</span>
          </span>
          <Link href="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-orange-500 transition-colors">
            <AppIcon className="fa-solid fa-arrow-left mr-1"></AppIcon> Back to portal
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mb-8">{subtitle}</p>}
        <div className="policy-body space-y-5 text-[15px] leading-relaxed text-slate-700">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6">
        <div className="max-w-3xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© 2026 BHE Uni — Boost Education Service Ltd.</p>
          <nav className="flex items-center gap-3">
            <Link href="/rewards-terms-and-conditions" className="hover:text-orange-500 font-semibold">Rewards Terms and Conditions</Link>
            <span>·</span>
            <Link href="/privacy-policy" className="hover:text-orange-500 font-semibold">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
