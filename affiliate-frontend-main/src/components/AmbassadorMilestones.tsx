"use client";

import AppIcon from "@/components/AppIcon";
import React, { useEffect, useState } from "react";
import "./ambassador-milestones.css";
import { api } from "@/lib/api";
import { TIER_ORDER, getTierProgress, type TierConfig } from "@/lib/tier";

interface MilestoneStats {
  tier: string;
  leads_to_next_tier: number;
  tier_configs: TierConfig[];
}

interface VisualTier {
  key: string;
  label: string;
  threshold: number;
  bg: string;
  text: string;
  border: string;
  glow: string;
  perks: string[];
  icon: string;
}

const TIERS: VisualTier[] = [
  {
    key: "bronze",
    label: "BRONZE",
    threshold: 10,
    bg: "bg-amber-600/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.05)]",
    perks: ["Official ambassador badge", "Dashboard access"],
    icon: "fa-medal",
  },
  {
    key: "silver",
    label: "SILVER",
    threshold: 25,
    bg: "bg-slate-400/10",
    text: "text-slate-300",
    border: "border-slate-400/20",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.05)]",
    perks: ["All Bronze benefits", "Faster payout (e.g. 7 days instead of 14)"],
    icon: "fa-medal",
  },
  {
    key: "gold",
    label: "GOLD",
    threshold: 50,
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    glow: "shadow-[0_0_25px_rgba(234,179,8,0.08)]",
    perks: ["All Silver benefits", "Featured on leaderboard", "+£2 bonus per lead"],
    icon: "fa-trophy",
  },
  {
    key: "platinum",
    label: "PLATINUM",
    threshold: 100,
    bg: "bg-cyan-400/10",
    text: "text-cyan-300",
    border: "border-cyan-400/20",
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.12)]",
    perks: ["All Gold benefits", "Dedicated support contact", "+£5 bonus per lead", "VIP badge"],
    icon: "fa-crown",
  },
];

export default function AmbassadorMilestones() {
  const [stats, setStats] = useState<MilestoneStats | null>(null);

  useEffect(() => {
    api.get<MilestoneStats>("/ambassador/stats").then(setStats).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="student-card border-white/5 bg-slate-950/20 flex items-center justify-center py-10">
        <AppIcon className="fa-solid fa-circle-notch animate-spin text-2xl text-orange-500"></AppIcon>
      </div>
    );
  }

  const tierProgress = getTierProgress(stats.tier, stats.leads_to_next_tier, stats.tier_configs);
  const currentTierIndex = TIER_ORDER.indexOf(stats.tier);

  const dynamicTiers = TIERS.map((t) => {
    const apiConfig = stats.tier_configs?.find((tc) => tc.tier === t.key);
    return {
      ...t,
      threshold: apiConfig ? Number(apiConfig.leads_required) : t.threshold,
    };
  });

  return (
    <section className="milestones-panel" aria-labelledby="milestones-title">
      <header className="milestones-heading">
        <div><p className="milestones-eyebrow">EVERY CONNECTION COUNTS</p><h2 id="milestones-title">Ambassador milestones</h2><p>Small steps, bigger possibilities. Discover what’s waiting at your next level.</p></div>
        <div className="milestones-count"><AppIcon className="fa-solid fa-arrow-trend-up" aria-hidden="true"/><div><strong>{tierProgress.current}</strong><span>lifetime validated leads</span></div></div>
      </header>
      <div className="milestones-grid">
        {dynamicTiers.map(tier => {
          const tierIdx = TIER_ORDER.indexOf(tier.key);
          const isAchieved = currentTierIndex >= tierIdx;
          const isNext = currentTierIndex === tierIdx - 1;
          const progress = Math.min(100, Math.max(0, tierProgress.current / Math.max(1, tier.threshold) * 100));
          return <article key={tier.key} className={`milestone-card milestone-${tier.key}${isNext ? " milestone-next" : ""}`}>
            <div className="milestone-card-top"><span className="milestone-icon"><AppIcon className={`fa-solid ${tier.icon}`} aria-hidden="true"/></span><span className={`milestone-status ${isAchieved ? "is-unlocked" : ""}`}><AppIcon className={`fa-solid ${isAchieved ? "fa-check" : isNext ? "fa-bolt" : "fa-lock"}`} aria-hidden="true"/>{isAchieved ? "Unlocked" : isNext ? "Up next" : "Ahead of you"}</span></div>
            <h3>{tier.label.toLowerCase()}</h3><p className="milestone-target"><strong>{tier.threshold}</strong> validated leads</p>
            <div className="milestone-progress" role="progressbar" aria-label={`${tier.label} milestone`} aria-valuenow={Math.min(tierProgress.current, tier.threshold)} aria-valuemin={0} aria-valuemax={tier.threshold}><span style={{width: `${progress}%`}}/></div>
            <p className="milestone-progress-label">{isAchieved ? "Milestone reached" : `${Math.max(0, tier.threshold - tierProgress.current)} more leads to unlock`}</p>
            <ul>{tier.perks.map(perk => <li key={perk}><AppIcon className="fa-solid fa-check" aria-hidden="true"/>{perk}</li>)}</ul>
          </article>;
        })}
      </div>
    </section>
  );
}
