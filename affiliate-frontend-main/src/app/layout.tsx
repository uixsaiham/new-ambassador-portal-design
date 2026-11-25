import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Bengali } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali" });

export const metadata: Metadata = {
  title: "Ambassador Portal - BHE Uni",
  description: "BHE Uni Ambassador & Rewards Programme Affiliate Platform",
  other: { google: "notranslate" },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-google-client-id.apps.googleusercontent.com";

  // The portal supplies its own translations. Prevent automatic translators
  // from replacing React-owned text nodes during language changes.
  return (
    <html lang="en" translate="no" className="h-full notranslate" suppressHydrationWarning>

      <body suppressHydrationWarning className={`${jakarta.variable} ${bengali.variable} min-h-full flex flex-col bg-slate-900 text-slate-200`}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>{children}</AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
