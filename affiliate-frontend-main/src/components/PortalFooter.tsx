import Link from "next/link";

// Global footer with the policy links. Kept theme-neutral (works on the dark
// portal and the light public pages). Rendered on the dashboard, login and the
// public referral landing so the policies are always one click away.
export default function PortalFooter() {
  const year = 2026;
  return (
    <footer className="mt-10 border-t border-white/10 py-6 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
        <p>© {year} BHE Uni — Boost Education Service Ltd. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link href="/rewards-terms-and-conditions" className="hover:text-orange-500 transition-colors font-semibold">
            Rewards Terms and Conditions
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/privacy-policy" className="hover:text-orange-500 transition-colors font-semibold">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
