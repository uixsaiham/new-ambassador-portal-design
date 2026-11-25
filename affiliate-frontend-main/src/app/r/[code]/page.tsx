import type { Metadata } from "next";
import CaptureForm from "./CaptureForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
// Public base URL of THIS site — used for absolute OG image/URL so WhatsApp/FB
// scrapers (which need absolute, publicly reachable URLs) render the card.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

interface ReferrerInfo {
  referral_code: string;
  referrer_name: string;
  counsellor_id?: string | null;
  counsellor_name?: string | null;
  valid: boolean;
}

async function getReferrer(code: string): Promise<ReferrerInfo | null> {
  try {
    const res = await fetch(`${API_URL}/public/referral/${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ReferrerInfo;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const referrer = await getReferrer(code);
  const name = referrer?.referrer_name;

  const title = name
    ? `${name} invited you to study in the UK with BHE Uni 🎓`
    : "Study in the UK with BHE Uni 🎓";
  const description =
    "Answer a few quick questions and a BHE Uni admissions advisor will guide you through your UK university journey. Takes under a minute.";
  const image = `${SITE_URL}/referral-og-banner.png`;
  const url = `${SITE_URL}/r/${code}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "BHE Uni",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: "BHE Uni — Refer & Earn" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const referrer = await getReferrer(code);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <div className="bg-white px-4 py-2.5 rounded-[8px] shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="BHE Uni" className="h-9 w-auto object-contain" />
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-extrabold tracking-widest uppercase text-orange-500 bg-orange-500/[0.12] px-3 py-1 rounded-full mb-4">
            Refer &amp; Earn
          </span>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
            {referrer?.referrer_name ? (
              <>
                <span className="text-orange-400">{referrer.referrer_name}</span> invited you to study in Higher Education 🎓
              </>
            ) : (
              <>Study in the UK with BHE Uni 🎓</>
            )}
          </h1>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Answer a few quick questions and our admissions advisor will call you with everything you
            need to know. Takes under a minute.
          </p>
        </div>

        {/* Form (client) */}
        <CaptureForm code={code} invalid={!referrer} defaultCounsellorId={referrer?.counsellor_id ?? ""} />

        <p className="text-center text-slate-500 text-xs mt-8 leading-relaxed">
          By submitting this form, you agree that BHE UNI may use your details to respond to your enquiry. Please see our{" "}
          <a href="/privacy-policy" target="_blank" className="text-orange-400 font-semibold hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
