"use client";

import AppSelect from "@/components/AppSelect";
import AppIcon from "@/components/AppIcon";
import { formatMoney } from "@/lib/currency";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import MultiSelect from "@/components/MultiSelect";
import Pagination from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

interface AdminAmbassador {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  tier: string;
  counsellor_id: string | null;
  counsellor_name: string | null;
  referral_code: string;
  wallet_balance: number;
  total_earned: number;
  total_leads: number;
  qualified_leads: number;
  not_qualified_leads: number;
  enrolled_leads: number;
  has_bank_details: boolean;
  bank_details: {
    holder_name?: string;
    sort_code?: string;
    account_number?: string;
    iban?: string;
    address?: { line1?: string; line2?: string; city?: string; postcode?: string; country?: string };
  } | null;
  created_at: string | null;
}

interface ReassignCandidate {
  counsellor_id: string;
  counsellor_name: string | null;
  active_lead_count: number;
}
interface CounsellorLeadRow {
  referral_id: string;
  lead_name: string;
  status: string;
  crm_lead_status: string | null;
  ambassador_name: string | null;
  application_stage: string | null;
  application_status: string | null;
  application_status_label: string | null;
}
interface ReassignResult {
  reassigned: number;
  skipped: number;
  missing: number;
  ambassadors_repointed: number;
  to_counsellor_name: string | null;
  batch_id: string | null;
}
interface CounsellorChangeLogRow {
  id: string;
  batch_id: string;
  lead_name: string | null;
  ambassador_name: string | null;
  from_counsellor_id: string | null;
  from_counsellor_name: string | null;
  to_counsellor_id: string | null;
  to_counsellor_name: string | null;
  status_at_handoff: string | null;
  crm_status_at_handoff: string | null;
  application_stage_at_handoff: string | null;
  application_status_at_handoff: string | null;
  admin_email: string | null;
  created_at: string;
}

const TIERS = ["standard", "bronze", "silver", "gold", "platinum"];

const tierBadge = (tier: string) => {
  switch (tier) {
    case "platinum": return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    case "gold": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "silver": return "bg-slate-400/20 text-slate-300 border-slate-400/30";
    case "bronze": return "bg-amber-600/20 text-amber-500 border-amber-600/30";
    default: return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
};

export default function AdminAmbassadorsPage() {
  const [rows, setRows] = useState<AdminAmbassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [counsellorFilter, setCounsellorFilter] = useState<string[]>([]);
  const [bankFilter, setBankFilter] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  // Which ambassador's bank details are open in the reveal modal (null = closed).
  const [bankModal, setBankModal] = useState<AdminAmbassador | null>(null);
  // Full (unmasked) bank details fetched on demand via the audited reveal endpoint.
  const [revealed, setRevealed] = useState<AdminAmbassador["bank_details"]>(null);
  const [revealing, setRevealing] = useState(false);
  // CRM counsellors an admin can route an ambassador to (same list used at signup).
  const [counsellors, setCounsellors] = useState<{ id: string; name: string }[]>([]);
  // --- Bulk "reassign a departing counsellor's leads" modal ---
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignCandidates, setReassignCandidates] = useState<ReassignCandidate[]>([]);
  const [reassignFrom, setReassignFrom] = useState("");
  const [reassignTo, setReassignTo] = useState("");
  const [reassignLeads, setReassignLeads] = useState<CounsellorLeadRow[]>([]);
  const [reassignSel, setReassignSel] = useState<Set<string>>(new Set());
  const [reassignRepoint, setReassignRepoint] = useState(true);
  const [reassignLoadingLeads, setReassignLoadingLeads] = useState(false);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [reassignResult, setReassignResult] = useState<ReassignResult | null>(null);
  // --- Counsellor change log (handoff history) modal ---
  const [logOpen, setLogOpen] = useState(false);
  const [logRows, setLogRows] = useState<CounsellorChangeLogRow[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  // Column sort. Default = newest first (Joined desc). Click a numeric header to sort by it.
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "created_at", dir: "desc" });

  // Reset any revealed number whenever the bank modal opens/closes or switches ambassador.
  useEffect(() => { setRevealed(null); setRevealing(false); }, [bankModal]);
  const revealBank = async () => {
    if (!bankModal) return;
    setRevealing(true);
    try {
      const res = await api.get<{ bank_details: AdminAmbassador["bank_details"] }>(
        `/admin/ambassadors/${bankModal.id}/bank-details`
      );
      setRevealed(res.bank_details);
    } catch {
      alert("Could not reveal bank details.");
    } finally {
      setRevealing(false);
    }
  };

  const fetchData = async () => {
    try {
      const data = await api.get<AdminAmbassador[]>("/admin/ambassadors");
      // Newest sign-ups first (by join date/time).
      data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setRows(data);
    } catch (err) {
      console.error("Failed to load ambassadors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    api.get<{ id: string; name: string }[]>("/auth/counsellors")
      .then(setCounsellors)
      .catch(() => setCounsellors([]));
  }, []);

  const counsellorOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      const key = r.counsellor_id || "__none__";
      map.set(key, r.counsellor_name || (r.counsellor_id ? r.counsellor_id : "Unassigned"));
    });
    return Array.from(map.entries());
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tierFilter.length > 0 && !tierFilter.includes(r.tier)) return false;
      if (counsellorFilter.length > 0 && !counsellorFilter.includes(r.counsellor_id || "__none__")) return false;
      if (bankFilter.length > 0 && !bankFilter.includes(r.has_bank_details ? "yes" : "no")) return false;
      if (activityFilter.length > 0) {
        const matchesActivity = activityFilter.some((a) =>
          a === "qualified" ? r.qualified_leads > 0 :
          a === "enrolled" ? r.enrolled_leads > 0 :
          a === "none" ? r.total_leads === 0 : false
        );
        if (!matchesActivity) return false;
      }
      if (q) {
        const hay = [r.full_name, r.email, r.phone, r.counsellor_name, r.referral_code].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, tierFilter, counsellorFilter, bankFilter, activityFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      const av = key === "created_at" ? new Date(a.created_at || 0).getTime() : Number(a[key as keyof AdminAmbassador] ?? 0);
      const bv = key === "created_at" ? new Date(b.created_at || 0).getTime() : Number(b[key as keyof AdminAmbassador] ?? 0);
      return dir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [filtered, sort]);

  const { page, setPage, pageCount, pageItems, pageSize, total } = usePagination(sorted);
  useEffect(() => { setPage(1); }, [search, tierFilter, counsellorFilter, bankFilter, activityFilter, sort, setPage]);

  const formatCurrency = (val: number) =>
    formatMoney(val);

  // Backend timestamps are UTC but sent WITHOUT a timezone marker. Mark them as
  // UTC so the browser renders in the viewer's local time (UK = BST/GMT), instead
  // of misreading the raw UTC value as local (which showed an hour behind).
  const fmtDateTime = (iso: string | null) => {
    if (!iso) return "-";
    const hasTz = /[zZ]|[+-]\d\d:?\d\d$/.test(iso);
    return new Date(hasTz ? iso : iso + "Z").toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  // Click a header to sort by it; clicking again flips direction. A new column
  // starts descending (highest / newest first — "who gave the most").
  const sortBy = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));
  const sortIcon = (key: string) =>
    sort.key === key ? (sort.dir === "desc" ? "fa-arrow-down-wide-short" : "fa-arrow-up-short-wide") : "fa-sort";
  const SortTh = ({ k, label, className }: { k: string; label: string; className: string }) => (
    <th className={className}>
      <button
        onClick={() => sortBy(k)}
        title={`Sort by ${label}`}
        className="group inline-flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
      >
        {label}
        <AppIcon className={`fa-solid ${sortIcon(k)} text-[9px] ${sort.key === k ? "text-orange-400" : "text-slate-500 group-hover:text-orange-400"}`}></AppIcon>
      </button>
    </th>
  );

  const handleTierChange = async (id: string, tier: string) => {
    setSavingId(id);
    try {
      await api.put(`/admin/users/${id}/tier`, { tier, note: "Set from admin ambassadors table" });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update tier.");
    } finally {
      setSavingId(null);
    }
  };

  // Route an ambassador to a CRM counsellor (or re-route to a different one). Sets
  // their default counsellor for FUTURE referrals and retroactively routes any of
  // their still-UNASSIGNED CRM leads to it. Leads already assigned to a counsellor
  // are left untouched — the CRM never overwrites an existing assignment.
  const handleAssignCounsellor = async (
    id: string,
    counsellorId: string,
    currentId?: string | null,
  ) => {
    // Blank ("Unassigned — assign…") or an unchanged pick is a no-op — you can't
    // clear a counsellor from here (that would strand the ambassador's future leads).
    if (!counsellorId || counsellorId === currentId) return;
    const chosen = counsellors.find((c) => c.id === counsellorId);
    // Re-routing an already-assigned ambassador is consequential, so spell out that
    // only future/unassigned leads move — nobody should expect a wholesale reassign.
    if (currentId) {
      const ok = window.confirm(
        `Route this ambassador's future leads to ${chosen?.name ?? "the selected counsellor"}?\n\n` +
          `Leads already assigned in the CRM stay with their current counsellor; only new and still-unassigned leads are re-routed.`,
      );
      if (!ok) return;
    }
    setSavingId(id);
    try {
      await api.put(`/admin/ambassadors/${id}/counsellor`, {
        counsellor_id: counsellorId,
        counsellor_name: chosen?.name ?? null,
      });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign counsellor.");
    } finally {
      setSavingId(null);
    }
  };

  // Open the bulk-reassign modal and load the counsellors who currently hold
  // active referral leads (the "leaving counsellor" options, with counts).
  const openReassign = async () => {
    setReassignOpen(true);
    setReassignFrom(""); setReassignTo(""); setReassignLeads([]);
    setReassignSel(new Set()); setReassignRepoint(true); setReassignResult(null);
    try {
      setReassignCandidates(await api.get<ReassignCandidate[]>("/admin/counsellors/reassign-candidates"));
    } catch {
      setReassignCandidates([]);
    }
  };

  // Picking the leaving counsellor loads their active referral leads (all pre-ticked).
  const onReassignFromChange = async (fromId: string) => {
    setReassignFrom(fromId);
    setReassignLeads([]); setReassignSel(new Set()); setReassignResult(null);
    if (reassignTo === fromId) setReassignTo("");
    if (!fromId) return;
    setReassignLoadingLeads(true);
    try {
      const leads = await api.get<CounsellorLeadRow[]>(`/admin/counsellors/${encodeURIComponent(fromId)}/referral-leads`);
      setReassignLeads(leads);
      setReassignSel(new Set(leads.map((l) => l.referral_id)));
    } catch {
      setReassignLeads([]);
    } finally {
      setReassignLoadingLeads(false);
    }
  };

  const toggleReassignLead = (id: string) =>
    setReassignSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const doReassign = async () => {
    if (!reassignFrom || !reassignTo || reassignSel.size === 0) return;
    const toName = counsellors.find((c) => c.id === reassignTo)?.name ?? "the selected counsellor";
    const appCount = reassignLeads.filter(
      (l) => reassignSel.has(l.referral_id) && !!l.application_status_label && l.application_status_label !== "Not started",
    ).length;
    const ok = window.confirm(
      `Move ${reassignSel.size} lead(s)${appCount > 0 ? ` (including ${appCount} with a live application)` : ""} to ${toName}?\n\n` +
        `This overwrites the counsellor on those CRM leads, and any application on a lead moves with it. Any lead already moved to someone else is skipped automatically.` +
        (reassignRepoint ? `\n\nAmbassadors routed to the leaving counsellor will also be re-pointed to ${toName} for future leads.` : ""),
    );
    if (!ok) return;
    setReassignBusy(true); setReassignResult(null);
    try {
      const res = await api.post<ReassignResult>("/admin/counsellors/reassign-leads", {
        from_counsellor_id: reassignFrom,
        to_counsellor_id: reassignTo,
        referral_ids: Array.from(reassignSel),
        repoint_ambassadors: reassignRepoint,
      });
      setReassignResult(res);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reassign leads.");
    } finally {
      setReassignBusy(false);
    }
  };

  // Open the handoff history: every lead that was bulk-reassigned, with a frozen
  // snapshot of who moved it, from/to counsellor, and the status at that moment.
  const openChangeLog = async () => {
    setLogOpen(true); setLogFilter(""); setLogLoading(true);
    try {
      setLogRows(await api.get<CounsellorChangeLogRow[]>("/admin/counsellor-changes"));
    } catch {
      setLogRows([]);
    } finally {
      setLogLoading(false);
    }
  };

  // Distinct counsellors seen in the log (as leaver or replacement) → filter dropdown.
  const logCounsellorMap = new Map<string, string>();
  logRows.forEach((r) => {
    if (r.from_counsellor_id) logCounsellorMap.set(r.from_counsellor_id, r.from_counsellor_name || r.from_counsellor_id);
    if (r.to_counsellor_id) logCounsellorMap.set(r.to_counsellor_id, r.to_counsellor_name || r.to_counsellor_id);
  });
  const logCounsellors = Array.from(logCounsellorMap.entries()).map(([id, name]) => ({ id, name }));
  const filteredLog = logFilter
    ? logRows.filter((r) => r.from_counsellor_id === logFilter || r.to_counsellor_id === logFilter)
    : logRows;
  // How many of the currently-selected leads carry a live application (moves with them).
  const selectedAppCount = reassignLeads.filter(
    (l) => reassignSel.has(l.referral_id) && !!l.application_status_label && l.application_status_label !== "Not started",
  ).length;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Ambassadors</h1>
          <p className="text-slate-400 text-sm">Every ambassador with live lead counts, earnings, routed counsellor and payout readiness.</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={openChangeLog}
            title="History of every bulk counsellor handoff, with the status at the time"
            className="inline-flex items-center gap-2 rounded-[8px] border border-slate-600 text-slate-200 hover:bg-slate-700/50 font-semibold text-sm px-4 py-2.5 transition-colors"
          >
            <AppIcon className="fa-solid fa-clock-rotate-left text-xs"></AppIcon>
            Change log
          </button>
          <button
            onClick={openReassign}
            title="When a counsellor leaves, move their active + enrolled referral leads to a replacement"
            className="inline-flex items-center gap-2 rounded-[8px] bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm px-4 py-2.5 transition-colors"
          >
            <AppIcon className="fa-solid fa-right-left text-xs"></AppIcon>
            Reassign a counsellor&apos;s leads
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input
          type="text"
          placeholder="Search name, email, code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input flex-1 min-w-[200px]"
        />
        <MultiSelect
          options={TIERS.map((t) => [t, t.charAt(0).toUpperCase() + t.slice(1)] as [string, string])}
          selected={tierFilter}
          onChange={setTierFilter}
          allLabel="All tiers"
          noun="tier"
          className="flex-1 min-w-[140px]"
        />
        <MultiSelect
          options={counsellorOptions}
          selected={counsellorFilter}
          onChange={setCounsellorFilter}
          allLabel="All counsellors"
          noun="counsellor"
          className="flex-1 min-w-[140px]"
        />
        <MultiSelect
          options={[["yes", "Bank added"], ["no", "No bank details"]]}
          selected={bankFilter}
          onChange={setBankFilter}
          allLabel="All bank status"
          noun="bank status"
          className="flex-1 min-w-[140px]"
        />
        <MultiSelect
          options={[["qualified", "Has qualified leads"], ["enrolled", "Has enrolled leads"], ["none", "No leads yet"]]}
          selected={activityFilter}
          onChange={setActivityFilter}
          allLabel="All activity"
          noun="activity filter"
          className="flex-1 min-w-[140px]"
        />
      </div>

      <p className="text-xs text-slate-500 mb-3 font-semibold">
        Showing {filtered.length} of {rows.length} ambassadors
        <span className="ml-2 font-normal text-slate-600">
          <AppIcon className="fa-solid fa-arrow-down-wide-short text-[10px] mr-1"></AppIcon>click a numeric column to sort
        </span>
      </p>

      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4">Ambassador</th>
                <th className="p-4 hidden md:table-cell">Counsellor</th>
                <SortTh k="total_leads" label="Leads" className="p-4 text-center" />
                <SortTh k="qualified_leads" label="Qualified" className="p-4 text-center" />
                <SortTh k="not_qualified_leads" label="Not Qualified" className="p-4 text-center" />
                <SortTh k="enrolled_leads" label="Enrolled" className="p-4 text-center" />
                <SortTh k="total_earned" label="Earned" className="p-4 hidden sm:table-cell text-right" />
                <SortTh k="wallet_balance" label="Wallet" className="p-4 hidden lg:table-cell text-right" />
                <th className="p-4">Tier</th>
                <SortTh k="created_at" label="Joined" className="p-4 hidden lg:table-cell text-right whitespace-nowrap" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center"><AppIcon className="fa-solid fa-circle-notch animate-spin text-orange-500"></AppIcon></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-slate-500 text-sm">No ambassadors match your filters.</td></tr>
              ) : (
                pageItems.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white">{r.full_name}</p>
                        {r.has_bank_details ? (
                          <button
                            type="button"
                            onClick={() => setBankModal(r)}
                            title="View bank details"
                            className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
                          >
                            <AppIcon className="fa-solid fa-building-columns text-[10px]"></AppIcon>
                          </button>
                        ) : (
                          <AppIcon className="fa-solid fa-triangle-exclamation text-amber-500 text-[10px]" title="No bank details; cannot be paid out"></AppIcon>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{r.email}</p>
                      {r.phone ? (
                        <p className="text-[10px] text-slate-500">{r.phone}</p>
                      ) : (
                        <p className="text-[10px] text-amber-500/70 italic">No phone number</p>
                      )}
                      <p className="text-[10px] text-slate-500 font-mono">{r.referral_code}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {/* Editable at any time: admins can route an unassigned ambassador or
                          re-route an assigned one. The current counsellor is pre-selected;
                          changing it re-routes future leads (see handleAssignCounsellor). */}
                      <AppSelect
                        value={r.counsellor_id || ""}
                        disabled={savingId === r.id || counsellors.length === 0}
                        onChange={(e) => handleAssignCounsellor(r.id, e.target.value, r.counsellor_id)}
                        className="admin-input !py-1 !px-2 text-xs disabled:opacity-60 max-w-[180px]"
                        title="Route this ambassador's future leads to a counsellor"
                      >
                        <option value="">Unassigned (assign…)</option>
                        {/* Keep the current counsellor visible even if they're no longer in
                            the active-UK list, so the cell never renders blank. */}
                        {r.counsellor_id && !counsellors.some((c) => c.id === r.counsellor_id) && (
                          <option value={r.counsellor_id}>{r.counsellor_name || r.counsellor_id}</option>
                        )}
                        {counsellors.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </AppSelect>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-white">{r.total_leads}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-blue-400">{r.qualified_leads}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-rose-400">{r.not_qualified_leads}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-emerald-400">{r.enrolled_leads}</span>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-right font-bold text-emerald-400">{formatCurrency(r.total_earned)}</td>
                    <td className="p-4 hidden lg:table-cell text-right text-slate-300">{formatCurrency(r.wallet_balance)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`status-badge text-[9px] border ${tierBadge(r.tier)}`}>{r.tier}</span>
                        <AppSelect
                          value={r.tier}
                          disabled={savingId === r.id}
                          onChange={(e) => handleTierChange(r.id, e.target.value)}
                          className="admin-input !py-1 !px-2 text-xs disabled:opacity-60"
                          title="Override tier"
                        >
                          {TIERS.map((t) => (
                            <option key={t} value={t} className="capitalize">{t}</option>
                          ))}
                        </AppSelect>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-right text-xs text-slate-400 whitespace-nowrap">
                      {fmtDateTime(r.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />

      {bankModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setBankModal(null)}
        >
          <div className="admin-card max-w-sm w-full !p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AppIcon className="fa-solid fa-building-columns text-emerald-400"></AppIcon> Bank details
              </h3>
              <button onClick={() => setBankModal(null)} className="text-slate-400 hover:text-white" aria-label="Close">
                <AppIcon className="fa-solid fa-xmark"></AppIcon>
              </button>
            </div>
            <p className="text-sm text-slate-300 font-semibold mb-4">{bankModal.full_name}</p>
            {bankModal.bank_details ? (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Account holder</span>
                  <span className="text-white font-medium text-right">{(revealed ?? bankModal.bank_details).holder_name || "-"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Sort code</span>
                  <span className="text-white font-mono">{(revealed ?? bankModal.bank_details).sort_code || "-"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Account number</span>
                  <span className="text-white font-mono">{(revealed ?? bankModal.bank_details).account_number || "-"}</span>
                </div>
                {bankModal.bank_details.address?.line1 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Address</span>
                    <span className="text-white text-right">
                      {[
                        bankModal.bank_details.address.line1,
                        bankModal.bank_details.address.line2,
                        bankModal.bank_details.address.city,
                        bankModal.bank_details.address.postcode,
                        bankModal.bank_details.address.country,
                      ].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {bankModal.bank_details.iban && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">IBAN</span>
                    <span className="text-white font-mono text-right break-all">{(revealed ?? bankModal.bank_details).iban}</span>
                  </div>
                )}
                <button
                  onClick={revealBank}
                  disabled={!!revealed || revealing}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-[8px] border border-slate-600 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/50 disabled:opacity-60"
                >
                  <AppIcon className={`fa-solid ${revealed ? "fa-eye-slash" : "fa-eye"}`}></AppIcon>
                  {revealing ? "Revealing…" : revealed ? "Revealed (this view is logged)" : "Reveal full details"}
                </button>
                {!revealed && (
                  <p className="text-[11px] text-slate-500 text-center">Masked for security. Revealing is recorded in the audit log.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No bank details on file.</p>
            )}
          </div>
        </div>
      )}

      {reassignOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !reassignBusy && setReassignOpen(false)}
        >
          <div className="admin-card max-w-lg w-full !p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AppIcon className="fa-solid fa-right-left text-orange-400"></AppIcon> Reassign a counsellor&apos;s leads
              </h3>
              <button onClick={() => setReassignOpen(false)} disabled={reassignBusy} className="text-slate-400 hover:text-white disabled:opacity-50" aria-label="Close">
                <AppIcon className="fa-solid fa-xmark"></AppIcon>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Moves a departing counsellor&apos;s referral leads (new, in&nbsp;progress <em>and</em> enrolled) to a replacement. <span className="text-slate-200">Any live application moves with its lead</span>, because in L2E the application&apos;s counsellor <em>is</em> the lead&apos;s. Only rejected/dead leads are left alone. Every move is recorded in the change log.</p>

            {reassignResult ? (
              <div className="space-y-3">
                <div className="rounded-[8px] border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                  <p className="font-bold text-emerald-300 flex items-center gap-2"><AppIcon className="fa-solid fa-circle-check"></AppIcon> Done</p>
                  <ul className="mt-2 space-y-1 text-emerald-100/90">
                    <li>{reassignResult.reassigned} lead(s) moved to {reassignResult.to_counsellor_name || "the new counsellor"}</li>
                    {reassignResult.skipped > 0 && <li className="text-amber-300">{reassignResult.skipped} skipped (already on someone else)</li>}
                    {reassignResult.missing > 0 && <li className="text-slate-300">{reassignResult.missing} not found in the CRM</li>}
                    {reassignResult.ambassadors_repointed > 0 && <li>{reassignResult.ambassadors_repointed} ambassador(s) re-pointed for future leads</li>}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setReassignOpen(false); openChangeLog(); }} className="flex-1 rounded-[8px] border border-slate-600 text-slate-200 hover:bg-slate-700/50 font-semibold text-sm py-2.5">View change log</button>
                  <button onClick={() => setReassignOpen(false)} className="flex-1 rounded-[8px] bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm py-2.5">Close</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Leaving counsellor</label>
                  <AppSelect
                    value={reassignFrom}
                    onChange={(e) => onReassignFromChange(e.target.value)}
                    disabled={reassignBusy}
                    className="admin-input w-full text-sm"
                  >
                    <option value="">Select the counsellor who&apos;s leaving…</option>
                    {reassignCandidates.map((c) => (
                      <option key={c.counsellor_id} value={c.counsellor_id}>
                        {(c.counsellor_name || c.counsellor_id)} ({c.active_lead_count} lead{c.active_lead_count === 1 ? "" : "s"})
                      </option>
                    ))}
                  </AppSelect>
                  {reassignCandidates.length === 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">No counsellors currently hold reassignable referral leads.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New counsellor</label>
                  <AppSelect
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    disabled={reassignBusy || !reassignFrom}
                    className="admin-input w-full text-sm disabled:opacity-60"
                  >
                    <option value="">Select the replacement…</option>
                    {counsellors.filter((c) => c.id !== reassignFrom).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </AppSelect>
                </div>

                {reassignFrom && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Leads to move{reassignLeads.length > 0 ? ` (${reassignSel.size}/${reassignLeads.length})` : ""}
                      </label>
                      {reassignLeads.length > 0 && (
                        <div className="flex gap-3 text-[11px]">
                          <button onClick={() => setReassignSel(new Set(reassignLeads.map((l) => l.referral_id)))} className="text-orange-400 hover:text-orange-300">Select all</button>
                          <button onClick={() => setReassignSel(new Set())} className="text-slate-400 hover:text-slate-300">None</button>
                        </div>
                      )}
                    </div>
                    <div className="rounded-[8px] border border-white/10 max-h-52 overflow-y-auto divide-y divide-white/5">
                      {reassignLoadingLeads ? (
                        <p className="p-4 text-center text-slate-500 text-sm"><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon></p>
                      ) : reassignLeads.length === 0 ? (
                        <p className="p-4 text-center text-slate-500 text-xs">No reassignable referral leads for this counsellor.</p>
                      ) : (
                        reassignLeads.map((l) => {
                          const hasApp = !!l.application_status_label && l.application_status_label !== "Not started";
                          return (
                          <label key={l.referral_id} className="flex items-center gap-3 p-2.5 hover:bg-white/5 cursor-pointer">
                            <input type="checkbox" checked={reassignSel.has(l.referral_id)} onChange={() => toggleReassignLead(l.referral_id)} className="accent-orange-500" />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm text-white truncate">{l.lead_name}</span>
                              <span className="block text-[11px] text-slate-500 truncate">
                                {l.crm_lead_status || l.status}{l.ambassador_name ? ` · ${l.ambassador_name}` : ""}
                              </span>
                            </span>
                            {hasApp && (
                              <span
                                title="This referral has a live application that moves with the lead"
                                className="shrink-0 inline-flex items-center gap-1 rounded-[8px] bg-sky-500/15 text-sky-300 border border-sky-500/25 px-1.5 py-0.5 text-[10px] font-medium"
                              >
                                <AppIcon className="fa-solid fa-file-lines text-[9px]"></AppIcon>
                                {l.application_status_label}
                              </span>
                            )}
                          </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={reassignRepoint} onChange={(e) => setReassignRepoint(e.target.checked)} className="mt-0.5 accent-orange-500" />
                  <span>Also re-point ambassadors routed to the leaving counsellor, so their <em>future</em> referrals go to the replacement.</span>
                </label>

                {reassignSel.size > 0 && (
                  <p className="text-[11px] rounded-[8px] bg-sky-500/10 border border-sky-500/20 text-sky-200 px-3 py-2 flex items-start gap-2">
                    <AppIcon className="fa-solid fa-circle-info mt-0.5"></AppIcon>
                    <span>
                      Moving <span className="font-semibold">{reassignSel.size} lead{reassignSel.size === 1 ? "" : "s"}</span> to the new counsellor
                      {selectedAppCount > 0 ? (
                        <>, including <span className="font-semibold">{selectedAppCount} live application{selectedAppCount === 1 ? "" : "s"}</span> that move with their lead.</>
                      ) : (
                        <>.</>
                      )}
                    </span>
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setReassignOpen(false)} disabled={reassignBusy} className="flex-1 rounded-[8px] border border-slate-600 text-slate-200 font-semibold text-sm py-2.5 hover:bg-slate-700/50 disabled:opacity-60">Cancel</button>
                  <button
                    onClick={doReassign}
                    disabled={reassignBusy || !reassignFrom || !reassignTo || reassignSel.size === 0}
                    className="flex-1 rounded-[8px] bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm py-2.5 disabled:opacity-50"
                  >
                    {reassignBusy ? "Moving…" : `Reassign ${reassignSel.size} lead${reassignSel.size === 1 ? "" : "s"}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {logOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setLogOpen(false)}
        >
          <div className="admin-card max-w-2xl w-full !p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white flex items-center gap-2">
                <AppIcon className="fa-solid fa-clock-rotate-left text-orange-400"></AppIcon> Counsellor change log
              </h3>
              <button onClick={() => setLogOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close">
                <AppIcon className="fa-solid fa-xmark"></AppIcon>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Every bulk counsellor handoff, newest first. Each line is frozen at the moment of the move. The status shown is what the lead was when it changed hands.</p>

            {logCounsellors.length > 0 && (
              <div className="mb-3">
                <AppSelect value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className="admin-input w-full text-sm">
                  <option value="">All counsellors</option>
                  {logCounsellors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </AppSelect>
              </div>
            )}

            {logLoading ? (
              <p className="p-6 text-center text-slate-500 text-sm"><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon></p>
            ) : filteredLog.length === 0 ? (
              <p className="p-6 text-center text-slate-500 text-sm">No counsellor changes recorded yet.</p>
            ) : (
              <div className="rounded-[8px] border border-white/10 divide-y divide-white/5">
                {filteredLog.map((r) => (
                  <div key={r.id} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-white truncate">{r.lead_name || "-"}</span>
                      <span className="text-[11px] text-slate-500 shrink-0">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-slate-400">{r.from_counsellor_name || r.from_counsellor_id || "-"}</span>
                      <AppIcon className="fa-solid fa-arrow-right text-[9px] text-orange-400"></AppIcon>
                      <span className="text-emerald-300 font-medium">{r.to_counsellor_name || r.to_counsellor_id || "-"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                      <span className="inline-flex items-center rounded-[8px] bg-slate-700/40 px-1.5 py-0.5 text-slate-300">{r.crm_status_at_handoff || r.status_at_handoff || "-"}</span>
                      {(r.application_stage_at_handoff || r.application_status_at_handoff) && (
                        <span className="inline-flex items-center gap-1 rounded-[8px] bg-sky-500/15 text-sky-300 border border-sky-500/25 px-1.5 py-0.5">
                          <AppIcon className="fa-solid fa-file-lines text-[9px]"></AppIcon>
                          App: {[r.application_stage_at_handoff, r.application_status_at_handoff].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {r.ambassador_name && <span>· {r.ambassador_name}</span>}
                      {r.admin_email && <span>· by {r.admin_email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setLogOpen(false)} className="mt-4 w-full rounded-[8px] bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm py-2.5">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
