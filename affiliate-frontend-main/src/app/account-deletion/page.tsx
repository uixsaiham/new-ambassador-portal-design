import Link from "next/link";

export const metadata = { title: "Account deletion - BHE UNI Ambassador" };

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-[8px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <Link href="/" className="text-blue-800 font-semibold">BHE UNI Ambassador</Link>
        <h1 className="text-3xl font-bold">Request account deletion</h1>
        <p>You can request deletion of your BHE UNI Ambassador account and the personal data associated with it without signing in.</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>Email <a className="text-blue-800 underline" href="mailto:ask@bheuni.io?subject=BHE%20UNI%20Ambassador%20account%20deletion">ask@bheuni.io</a> from the email address registered with your account.</li>
          <li>Use the subject <strong>BHE UNI Ambassador account deletion</strong> and state that you want your account and associated personal data deleted.</li>
          <li>Our support team will verify your identity, process your request and confirm the outcome. If you cannot access your registered email address, contact the same support email for help with verification.</li>
        </ol>
        <h2 className="text-xl font-semibold">What happens to your data</h2>
        <p>Your account, profile and associated personal data will be deleted or anonymised. Records necessary to satisfy legal, accounting or reporting requirements may be retained only for as long as those requirements require, as described in our privacy policy.</p>
        <p>Deleting your account removes your access to the ambassador programme. Support can explain how any outstanding referral or payout records are handled before completing your request.</p>
        <Link className="text-blue-800 underline" href="/privacy-policy">Read our privacy policy</Link>
      </div>
    </main>
  );
}
