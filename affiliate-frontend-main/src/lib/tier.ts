// Shared tier/milestone logic used by both the dashboard and the header account
// menu, so the thresholds and progress maths live in exactly one place.

export interface TierConfig {
  tier: string;
  leads_required: number;
  bonus_amount: number | string;
}

export const TIER_ORDER = ["standard", "bronze", "silver", "gold", "platinum"];

export function getTierProgress(tier: string, leadsToNext: number, tierConfigs?: TierConfig[]) {
  if (tier === "platinum") {
    return { percent: 100, current: 100, target: 100, label: "Max tier reached! 🏆", nextTier: null as string | null };
  }
  const thresholds: Record<string, number> = { standard: 0, bronze: 10, silver: 25, gold: 50, platinum: 100 };
  if (tierConfigs) {
    tierConfigs.forEach((tc) => {
      thresholds[tc.tier] = Number(tc.leads_required);
    });
  }
  const nextTiers: Record<string, string> = { standard: "bronze", bronze: "silver", silver: "gold", gold: "platinum" };
  const nextTierKey = nextTiers[tier] ?? "bronze";
  const nextThreshold = thresholds[nextTierKey] ?? 10;
  const currentThreshold = thresholds[tier] ?? 0;
  const validLeads = nextThreshold - leadsToNext;
  const range = nextThreshold - currentThreshold;
  const progress = Math.max(0, Math.min(100, ((validLeads - currentThreshold) / range) * 100));

  return {
    percent: Math.round(progress),
    current: validLeads,
    target: nextThreshold,
    label: `${leadsToNext} valid leads to ${nextTierKey.toUpperCase()}`,
    nextTier: nextTierKey as string | null,
  };
}
