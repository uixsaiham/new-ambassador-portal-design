export interface EarningsTransaction {
  type: string;
  amount: number;
  category: string;
  description?: string | null;
  created_at: string;
}

/** Six calendar months in Dhaka, including the current month; refunds are not earnings. */
export function monthlyEarnings(transactions: EarningsTransaction[], now: Date) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value) - 1;
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 5 + index, 15, 12));
    return { date, key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`, amount: 0 };
  });
  for (const transaction of transactions) {
    if (transaction.type !== "credit" || !["lead_reward", "enrolment_reward", "bonus_reward"].includes(transaction.category) || /refund/i.test(transaction.description || "")) continue;
    const raw = transaction.created_at;
    const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw.replace(" ", "T")}Z`);
    if (!Number.isFinite(date.getTime()) || date > now) continue;
    const keyParts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" }).formatToParts(date);
    const key = `${keyParts.find(part => part.type === "year")?.value}-${keyParts.find(part => part.type === "month")?.value}`;
    const target = months.find(item => item.key === key);
    if (target) target.amount += Math.round(Number(transaction.amount) * 100);
  }
  return months.map(item => ({ ...item, amount: item.amount / 100 }));
}
