export type CurrencyLanguage = "en" | "bn";

/** Programme amounts are denominated in BDT; no exchange-rate conversion. */
export function formatMoney(value: number, language: CurrencyLanguage = "en", _currency = "BDT") {
  return `৳${new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)}`;
}

export function takaDescription(text: string) {
  return text.replace(/\u00a3/g, "৳").replace(/\bGBP\b/g, "BDT");
}
