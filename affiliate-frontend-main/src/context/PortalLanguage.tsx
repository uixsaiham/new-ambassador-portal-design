"use client";
import { createContext, useContext, useEffect, useState } from "react";
export type Language = "en" | "bn";
const Context = createContext<{ language: Language; setLanguage: (v: Language) => void }>({ language: "en", setLanguage: () => {} });
export function PortalLanguageProvider({ children }: { children: React.ReactNode }) {
 const [language, setLanguage] = useState<Language>("en");
 useEffect(() => { if (localStorage.getItem("portal-language") === "bn") setLanguage("bn"); }, []);
 return <Context.Provider value={{ language, setLanguage: v => { setLanguage(v); localStorage.setItem("portal-language", v); } }}><div lang={language} translate="no" className="notranslate">{children}</div></Context.Provider>;
}
export const usePortalLanguage = () => useContext(Context);
export { formatMoney } from "@/lib/currency";
