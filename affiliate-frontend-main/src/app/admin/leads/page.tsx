"use client";

import AppIcon from "@/components/AppIcon";
import { formatMoney } from "@/lib/currency";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import MultiSelect from "@/components/MultiSelect";
import Pagination from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

interface AdminLead {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string | null;
  education_interest: string | null;
  status: string;
  rejection_reason: string | null;
  // Refer & Earn: exact CRM lead status + the counsellor's reason for the last change.
  crm_lead_status: string | null;
  status_reason: string | null;
  lead_reward_paid: boolean;
  enrolment_reward_paid: boolean;
  source: string | null;
  external_lead_id: string | null;
  application_stage: string | null;
  application_status: string | null;
  application_status_label: string;
  created_at: string | null;
  updated_at: string | null;
  referrer_id: string;
  referrer_name: string | null;
  referrer_email: string | null;
  counsellor_id: string | null;
  counsellor_name: string | null;
  awaiting_reward: boolean;
  reward_amount: number;
}

// Raw CRM status → friendly label + badge colours.
const STATUS_META: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  validated: { label: "Qualified", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  application_submitted: { label: "Application", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  offer_made: { label: "Offer Made", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  enrolled_home: { label: "Enrolled (Home)", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  enrolled_international: { label: "Enrolled (Intl)", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "Not qualified", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const statusMeta = (s: string) => STATUS_META[s] ?? { label: s.replace(/_/g, " "), cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" };

// Refer & Earn: exact CRM lead status → label + badge colours (all 8 statuses).
const CRM_STATUS_META: Record<string, { label: string; cls: string }> = {
  "New": { label: "New", cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  "In Progress": { label: "In Progress", cls: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  "International": { label: "International", cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  "Qualified": { label: "Qualified", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "Future Intake": { label: "Future Intake", cls: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  "No Response": { label: "No Response", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "No Answer": { label: "No Answer", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "Incorrect Details": { label: "Incorrect Details", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "Not interested": { label: "Not interested", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  "Unreachable": { label: "Unreachable", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "Not qualified": { label: "Not qualified", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  "Enrolled": { label: "Enrolled", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};
// Prefer the EXACT CRM lead status (mirror) when present; else the reward-enum label.
const leadStatusMeta = (l: { crm_lead_status?: string | null; status: string }) => {
  if (l.crm_lead_status) {
    const label = l.crm_lead_status === "Rejected" ? "Not qualified" : l.crm_lead_status;
    return CRM_STATUS_META[label] ?? { label, cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" };
  }
  return statusMeta(l.status);
};

// The admin sees the EXACT L2E CRM application status verbatim (not the 4-state
// ambassador rollup). Light keyword tint only — the text is always the raw CRM
// value. Enrolled = green, cancelled/rejected/withdrawn = red, everything else
// the neutral indigo "in-flight" tint.
const appChipCls = (stage: string | null, status: string | null) => {
  const s = `${stage ?? ""} ${status ?? ""}`.toLowerCase();
  if (/cancel|reject|withdraw|declin/.test(s)) return "font-semibold text-red-600 bg-red-500/20 border-red-500/40";
  if (/enrol/.test(s)) return "font-semibold text-emerald-600 bg-emerald-500/20 border-emerald-500/40";
  return "font-semibold text-indigo-600 bg-indigo-500/20 border-indigo-500/40";
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [counsellorFilter, setCounsellorFilter] = useState<string[]>([]);
  const [referrerFilter, setReferrerFilter] = useState<string[]>([]);
  // Deep-link from the dashboard "Rewards to approve" tile (/admin/leads?reward=pending)
  // → show only leads awaiting a reward decision.
  const [rewardPending, setRewardPending] = useState(false);
  // The Updated On date column is sortable; default = most recently updated first.
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "updated_at", dir: "desc" });

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reward") === "pending") {
      setRewardPending(true);
    }
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await api.get<AdminLead[]>("/admin/leads");
      setLeads(data);
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const id = setInterval(fetchLeads, 30000);
    return () => clearInterval(id);
  }, []);

  const counsellorOptions = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach((l) => {
      const key = l.counsellor_id || "__none__";
      map.set(key, l.counsellor_name || (l.counsellor_id ? l.counsellor_id : "Unassigned"));
    });
    return Array.from(map.entries());
  }, [leads]);

  const referrerOptions = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach((l) => {
      const key = l.referrer_id || "__none__";
      map.set(key, l.referrer_name || l.referrer_email || "Unknown");
    });
    return Array.from(map.entries());
  }, [leads]);

  // Status filter options come from the leads themselves, using the SAME label the
  // table shows (the CRM lead status when present, else the reward-enum label),
  // rather than a hardcoded list of reward-enum values. This keeps the filter in
  // step with the badge the admin actually sees, and means a new CRM status (e.g.
  // "International") becomes filterable with no code change.
  const statusOptions = useMemo(() => {
    const labels = new Set<string>();
    leads.forEach((l) => labels.add(leadStatusMeta(l).label));
    return Array.from(labels).sort().map((s) => [s, s] as [string, string]);
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter.length > 0 && !statusFilter.includes(leadStatusMeta(l).label)) return false;
      if (referrerFilter.length > 0 && !referrerFilter.includes(l.referrer_id || "__none__")) return false;
      if (counsellorFilter.length > 0 && !counsellorFilter.includes(l.counsellor_id || "__none__")) return false;
      if (rewardPending && !l.awaiting_reward) return false;
      if (q) {
        const hay = [l.lead_name, l.lead_email, l.lead_phone, l.referrer_name, l.referrer_email, l.education_interest]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter, counsellorFilter, referrerFilter, rewardPending]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    const val = (l: AdminLead) => new Date((l[key as keyof AdminLead] as string) || 0).getTime();
    arr.sort((a, b) => (dir === "asc" ? val(a) - val(b) : val(b) - val(a)));
    return arr;
  }, [filtered, sort]);

  const { page, setPage, pageCount, pageItems, pageSize, total } = usePagination(sorted);
  useEffect(() => { setPage(1); }, [search, statusFilter, counsellorFilter, referrerFilter, rewardPending, sort, setPage]);

  const formatCurrency = (val: number) =>
    formatMoney(val);

  // Compact date + time for the "Updated on" column (e.g. "16 Jul 2026, 14:32").
  // Backend timestamps are UTC but sent without a tz marker → mark as UTC so the
  // browser renders in the viewer's local time (UK = BST/GMT), not an hour behind.
  const formatDateTime = (iso: string | null) => {
    if (!iso) return "—";
    const d = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z";
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/admin/referrals/${id}/pay-lead-reward`, {});
      await fetchLeads();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve reward.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeny = async (id: string) => {
    if (!window.confirm("Deny this lead reward? The ambassador will not be paid and the lead is marked Not qualified.")) return;
    setBusyId(id);
    try {
      await api.post(`/admin/referrals/${id}/deny-lead-reward`, {});
      await fetchLeads();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deny reward.");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    const headers = ["Lead", "Email", "Phone", "Interest", "Status", "Application Status (CRM)", "Referred By", "Referrer Email", "Counsellor", "Source", "Reward Paid", "Submitted"];
    const rows = filtered.map((l) => [
      l.lead_name,
      l.lead_email,
      l.lead_phone || "",
      l.education_interest || "",
      leadStatusMeta(l).label,
      l.application_status || "",
      l.referrer_name || "",
      l.referrer_email || "",
      l.counsellor_name || (l.counsellor_id ? l.counsellor_id : "Unassigned"),
      l.source || "",
      l.lead_reward_paid ? "Yes" : "No",
      l.created_at ? new Date(l.created_at).toLocaleDateString() : "",
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bhe-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Leads</h1>
          <p className="text-slate-400 text-sm">Every referred lead, who referred it, and its routed counsellor — live from the CRM.</p>
        </div>
        <button onClick={exportCsv} className="admin-btn bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-2">
          <AppIcon className="fa-solid fa-file-csv"></AppIcon> Export CSV
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search lead, email, phone, ambassador…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input flex-1 min-w-[200px]"
        />
        <MultiSelect
          options={statusOptions}
          selected={statusFilter}
          onChange={setStatusFilter}
          allLabel="All statuses"
          noun="status"
          className="flex-1 min-w-[150px]"
        />
        <MultiSelect
          options={counsellorOptions}
          selected={counsellorFilter}
          onChange={setCounsellorFilter}
          allLabel="All counsellors"
          noun="counsellor"
          className="flex-1 min-w-[150px]"
        />
        <MultiSelect
          options={referrerOptions}
          selected={referrerFilter}
          onChange={setReferrerFilter}
          allLabel="All Ambassadors"
          noun="ambassador"
          className="flex-1 min-w-[150px]"
        />
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <p className="text-xs text-slate-500 font-semibold">
          Showing {filtered.length} of {leads.length} leads
        </p>
        {rewardPending && (
          <button
            onClick={() => {
              setRewardPending(false);
              if (typeof window !== "undefined") window.history.replaceState(null, "", "/admin/leads");
            }}
            className="inline-flex items-center gap-2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-colors"
            title="Clear this filter"
          >
            <AppIcon className="fa-solid fa-hand-holding-dollar"></AppIcon>
            Rewards to approve only
            <AppIcon className="fa-solid fa-xmark"></AppIcon>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-5 py-5">Lead</th>
                <th className="px-5 py-5 hidden lg:table-cell">Interest</th>
                <th className="px-5 py-5">Ambassador</th>
                <th className="px-5 py-5 hidden md:table-cell">Counsellor</th>
                <th className="px-5 py-5">Status</th>
                <th className="px-5 py-5">Application Status</th>
                <SortTh k="created_at" label="Created On" className="px-5 py-5 hidden lg:table-cell whitespace-nowrap" />
                <SortTh k="updated_at" label="Updated On" className="px-5 py-5 hidden lg:table-cell whitespace-nowrap" />
                <th className="px-5 py-5 text-right">Reward</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center"><AppIcon className="fa-solid fa-circle-notch animate-spin text-orange-500"></AppIcon></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-500 text-sm">No leads match your filters.</td></tr>
              ) : (
                pageItems.map((l) => {
                  const meta = leadStatusMeta(l);
                  const busy = busyId === l.id;
                  return (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                      <td className="px-5 py-5">
                        <p className="font-bold text-white">{l.lead_name}</p>
                        <p className="text-xs text-slate-400">{l.lead_email}</p>
                        <p className="text-[10px] text-slate-500">{l.lead_phone || "No phone"}</p>
                      </td>
                      <td className="px-5 py-5 text-slate-300 hidden lg:table-cell">{l.education_interest || "—"}</td>
                      <td className="px-5 py-5">
                        <p className="text-slate-200 font-semibold">{l.referrer_name || "—"}</p>
                        <p className="text-[10px] text-slate-500">{l.referrer_email || ""}</p>
                      </td>
                      <td className="px-5 py-5 hidden md:table-cell">
                        {l.counsellor_id ? (
                          <span className="text-slate-300">{l.counsellor_name || l.counsellor_id}</span>
                        ) : (
                          <span className="text-slate-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        <span className={`status-badge text-[10px] border whitespace-nowrap ${meta.cls}`}>{meta.label}</span>
                        {(l.status_reason || (l.status === "rejected" && l.rejection_reason)) && (
                          <p className="text-[10px] text-slate-400/90 mt-1.5 max-w-[180px] leading-relaxed">{l.status_reason || l.rejection_reason}</p>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        {(l.application_status || l.application_stage) ? (
                          <div>
                            <span className={`status-badge text-[10px] border whitespace-nowrap ${appChipCls(l.application_stage, l.application_status)}`}>
                              {l.application_status || l.application_stage}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs italic">No application</span>
                        )}
                      </td>
                      <td className="px-5 py-5 hidden lg:table-cell text-slate-400 text-xs whitespace-nowrap">
                        {formatDateTime(l.created_at)}
                      </td>
                      <td className="px-5 py-5 hidden lg:table-cell text-slate-400 text-xs whitespace-nowrap">
                        {formatDateTime(l.updated_at)}
                      </td>
                      <td className="px-5 py-5 text-right whitespace-nowrap">
                        {l.lead_reward_paid ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <AppIcon className="fa-solid fa-check mr-1"></AppIcon>Paid
                          </span>
                        ) : l.awaiting_reward ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(l.id)}
                              disabled={busy}
                              className="admin-btn bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5"
                            >
                              {busy ? <AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> : <><AppIcon className="fa-solid fa-check"></AppIcon> {formatCurrency(l.reward_amount)}</>}
                            </button>
                            <button
                              onClick={() => handleDeny(l.id)}
                              disabled={busy}
                              className="admin-btn bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-300 hover:text-red-400 disabled:opacity-60 text-xs font-bold"
                            >
                              <AppIcon className="fa-solid fa-xmark"></AppIcon>
                            </button>
                          </div>
                        ) : l.status === "rejected" ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Denied</span>
                        ) : (
                          <span className="text-slate-600 text-xs">Awaiting</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
