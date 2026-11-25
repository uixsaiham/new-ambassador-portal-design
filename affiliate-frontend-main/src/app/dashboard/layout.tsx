"use client";
import PortalShell from "@/components/PortalShell";
import { PortalLanguageProvider } from "@/context/PortalLanguage";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 return <PortalLanguageProvider><PortalShell>{children}</PortalShell></PortalLanguageProvider>;
}
