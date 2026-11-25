"use client";

import AppIcon from "@/components/AppIcon";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface TierConfig {
  tier: string;
  leads_required: number;
  bonus_amount: number;
  updated_at: string;
}

interface Draft {
  leads_required: string;
  bonus_amount: string;
}

const tierMeta = (tier: string) => {
  switch (tier) {
    case "platinum": return { cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", icon: "fa-crown" };
    case "gold": return { cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: "fa-trophy" };
    case "silver": return { cls: "bg-slate-400/20 text-slate-300 border-slate-400/30", icon: "fa-medal" };
    default: return { cls: "bg-amber-600/20 text-amber-500 border-amber-600/30", icon: "fa-medal" };
  }
};

export default function AdminTiersPage() {
  const [configs, setConfigs] = useState<TierConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchConfigs = async () => {
    try {
      const data = await api.get<TierConfig[]>("/admin/tier-configs");
      data.sort((a, b) => a.leads_required - b.leads_required);
      setConfigs(data);
      setDrafts(
        Object.fromEntries(
          data.map((c) => [c.tier, { leads_required: String(c.leads_required), bonus_amount: String(c.bonus_amount) }])
        )
      );
    } catch (err) {
      console.error("Failed to load tier configs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const setDraft = (tier: string, field: keyof Draft, value: string) => {
    setDrafts((d) => ({ ...d, [tier]: { ...d[tier], [field]: value } }));
  };

  const isDirty = (c: TierConfig) => {
    const d = drafts[c.tier];
    return d && (Number(d.leads_required) !== c.leads_required || Number(d.bonus_amount) !== c.bonus_amount);
  };

  const save = async (tier: string) => {
    const d = drafts[tier];
    const leads = Number(d.leads_required);
    const bonus = Number(d.bonus_amount);
    if (!Number.isFinite(leads) || leads <= 0) {
      setMessage({ type: "error", text: "Leads required must be a positive number." });
      return;
    }
    if (!Number.isFinite(bonus) || bonus < 0) {
      setMessage({ type: "error", text: "Bonus amount must be zero or more." });
      return;
    }
    setSavingTier(tier);
    setMessage(null);
    try {
      await api.put(`/admin/tier-configs/${tier}`, { leads_required: leads, bonus_amount: bonus });
      setMessage({ type: "success", text: `${tier[0].toUpperCase() + tier.slice(1)} tier updated. Ambassador tiers recalculated.` });
      await fetchConfigs();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update tier." });
    } finally {
      setSavingTier(null);
    }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Tier Settings</h1>
        <p className="text-slate-400 text-sm">Set the validated-lead threshold and cash bonus for each milestone. Saving recalculates every ambassador&apos;s tier automatically.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-[8px] text-sm mb-6 border ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><AppIcon className="fa-solid fa-circle-notch animate-spin text-orange-500 text-2xl"></AppIcon></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {configs.map((c) => {
            const meta = tierMeta(c.tier);
            const d = drafts[c.tier];
            const dirty = isDirty(c);
            return (
              <div key={c.tier} className="admin-card">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-[8px] flex items-center justify-center border ${meta.cls}`}>
                    <AppIcon className={`fa-solid ${meta.icon}`}></AppIcon>
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase tracking-wide">{c.tier}</h3>
                    <p className="text-[10px] text-slate-500">Updated {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Validated leads required</label>
                    <input
                      type="number"
                      min={1}
                      value={d?.leads_required ?? ""}
                      onChange={(e) => setDraft(c.tier, "leads_required", e.target.value)}
                      className="admin-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Cash bonus (৳)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={d?.bonus_amount ?? ""}
                      onChange={(e) => setDraft(c.tier, "bonus_amount", e.target.value)}
                      className="admin-input w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={() => save(c.tier)}
                  disabled={!dirty || savingTier === c.tier}
                  className="admin-btn bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold mt-5 flex items-center gap-2"
                >
                  {savingTier === c.tier ? (
                    <><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> Saving…</>
                  ) : (
                    <><AppIcon className="fa-solid fa-floppy-disk"></AppIcon> Save changes</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
