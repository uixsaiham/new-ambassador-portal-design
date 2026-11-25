"use client";

import AppIcon from "@/components/AppIcon";
import { formatMoney } from "@/lib/currency";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import MultiSelect from "@/components/MultiSelect";
import Pagination from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

// Reuses the admin /leads payload — every referral already carries the raw CRM
// application_stage / application_status. This tab focuses on leads that have an
// application, showing the EXACT L2E CRM status verbatim (no rollup).
interface AdminLead {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string | null;
  education_interest: string | null;
  status: string;
  source: string | null;
  external_lead_id: string | null;
  application_stage: string | null;
  application_status: string | null;
  application_notes: string | null;
  application_university: string | null;
  application_course: string | null;
  application_intake: string | null;
  application_campus: string | null;
  application_branch: string | null;
  application_status_label: string;
  created_at: string | null;
  updated_at: string | null;
  referrer_id: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  counsellor_id: string | null;
  counsellor_name: string | null;
  enrolment_reward_paid: boolean;
  enrolment_reward_denied: boolean;
  enrolment_awaiting_reward: boolean;
  enrolment_reward_amount: number;
  // Two-installment enrolment reward (each ~৳250), approved one at a time.
  enrolment_installment_1_paid: boolean;
  enrolment_installment_2_paid: boolean;
  enrolment_installment_amount: number;
}

// Light keyword tint only — the chip TEXT is always the raw CRM value.
const chipCls = (stage: string | null, status: string | null) => {
  const s = `${stage ?? ""} ${status ?? ""}`.toLowerCase();
  if (/cancel|reject|withdraw|declin/.test(s)) return "font-semibold text-red-600 bg-red-500/20 border-red-500/40";
  if (/enrol/.test(s)) return "font-semibold text-emerald-600 bg-emerald-500/20 border-emerald-500/40";
  return "font-semibold text-indigo-600 bg-indigo-500/20 border-indigo-500/40";
};

const fmtBDT = (v: number) => formatMoney(v);

// Compact date + time for the "Updated on" column (e.g. "16 Jul 2026, 14:32").
// Backend timestamps are UTC but sent without a tz marker → mark as UTC so the
// browser renders in local time (UK = BST/GMT), not an hour behind.
const fmtDateTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function AdminApplicationsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [universityFilter, setUniversityFilter] = useState<string[]>([]);
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [intakeFilter, setIntakeFilter] = useState<string[]>([]);
  const [campusFilter, setCampusFilter] = useState<string[]>([]);
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [ambassadorFilter, setAmbassadorFilter] = useState<string[]>([]);
  const [counsellorFilter, setCounsellorFilter] = useState<string[]>([]);
  // Deep-link from the dashboard "Enrolled rewards to approve" tile
  // (/admin/applications?reward=pending) → show only applications awaiting a ৳500
  // enrolment-reward decision.
  const [rewardPending, setRewardPending] = useState(false);
  // Updated On / Started date columns are sortable; default = most recently updated first.
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "updated_at", dir: "desc" });

  const fetchLeads = async () => {
    try {
      const data = await api.get<AdminLead[]>("/admin/leads");
      setLeads(data);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const id = setInterval(fetchLeads, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reward") === "pending") {
      setRewardPending(true);
    }
  }, []);

  // Approve ONE installment (1 or 2) of the enrolment reward, as the university pays
  // BHE Uni in stages. Installment 1 must be approved before installment 2.
  const payInstallment = async (id: string, n: 1 | 2, amount: number) => {
    if (!window.confirm(
      `Approve installment ${n} of 2 (${fmtBDT(amount)})? This credits the ambassador's wallet now. ` +
      `Approve each installment as the university payment for this enrolment actually arrives.`
    )) return;
    setBusyId(id);
    try {
      await api.post(`/admin/referrals/${id}/pay-enrolment-installment/${n}`, {});
      await fetchLeads();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to approve installment ${n}.`);
    } finally {
      setBusyId(null);
    }
  };

  const denyEnrolment = async (id: string) => {
    if (!window.confirm("Deny this enrolment reward? The ambassador will not be paid the ৳500 (their lead stays enrolled).")) return;
    setBusyId(id);
    try {
      await api.post(`/admin/referrals/${id}/deny-enrolment-reward`, {});
      await fetchLeads();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deny enrolment reward.");
    } finally {
      setBusyId(null);
    }
  };

  // Only leads that actually have an application in the CRM.
  const applications = useMemo(
    () => leads.filter((l) => l.application_stage || l.application_status),
    [leads]
  );

  // Filter dropdowns are built from the REAL CRM values present — so whatever
  // values exist in L2E show up here exactly, no hardcoded lists.
  const distinct = (getter: (l: AdminLead) => string | null) =>
    (Array.from(new Set(applications.map(getter).filter(Boolean))) as string[]).sort();
  const statusOptions = useMemo(() => distinct((l) => l.application_status), [applications]);
  const universityOptions = useMemo(() => distinct((l) => l.application_university), [applications]);
  const courseOptions = useMemo(() => distinct((l) => l.application_course), [applications]);
  const intakeOptions = useMemo(() => distinct((l) => l.application_intake), [applications]);
  const campusOptions = useMemo(() => distinct((l) => l.application_campus), [applications]);
  const branchOptions = useMemo(() => distinct((l) => l.application_branch), [applications]);

  // Ambassador / counsellor keyed by id (name for display, "Unassigned" bucket).
  const idNameOptions = (idKey: "referrer_id" | "counsellor_id", nameKey: "referrer_name" | "counsellor_name") =>
    Array.from(
      applications
        .reduce((m, l) => {
          const key = (l[idKey] as string) || "__none__";
          m.set(key, (l[nameKey] as string) || (key === "__none__" ? "Unassigned" : key));
          return m;
        }, new Map<string, string>())
        .entries()
    );
  const ambassadorOptions = useMemo(() => idNameOptions("referrer_id", "referrer_name"), [applications]);
  const counsellorOptions = useMemo(() => idNameOptions("counsellor_id", "counsellor_name"), [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((l) => {
      if (statusFilter.length > 0 && !statusFilter.includes(l.application_status || "")) return false;
      if (universityFilter.length > 0 && !universityFilter.includes(l.application_university || "")) return false;
      if (courseFilter.length > 0 && !courseFilter.includes(l.application_course || "")) return false;
      if (intakeFilter.length > 0 && !intakeFilter.includes(l.application_intake || "")) return false;
      if (campusFilter.length > 0 && !campusFilter.includes(l.application_campus || "")) return false;
      if (branchFilter.length > 0 && !branchFilter.includes(l.application_branch || "")) return false;
      if (ambassadorFilter.length > 0 && !ambassadorFilter.includes(l.referrer_id || "__none__")) return false;
      if (counsellorFilter.length > 0 && !counsellorFilter.includes(l.counsellor_id || "__none__")) return false;
      if (rewardPending && !l.enrolment_awaiting_reward) return false;
      if (q) {
        const hay = `${l.lead_name} ${l.lead_email} ${l.referrer_name ?? ""} ${l.counsellor_name ?? ""} ${l.application_notes ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applications, search, statusFilter, universityFilter, courseFilter, intakeFilter, campusFilter, branchFilter, ambassadorFilter, counsellorFilter, rewardPending]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    const val = (l: AdminLead) => new Date((l[key as keyof AdminLead] as string) || 0).getTime();
    arr.sort((a, b) => (dir === "asc" ? val(a) - val(b) : val(b) - val(a)));
    return arr;
  }, [filtered, sort]);

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

  const { page, setPage, pageCount, pageItems, pageSize, total } = usePagination(sorted);
  useEffect(() => { setPage(1); }, [search, statusFilter, universityFilter, courseFilter, intakeFilter, campusFilter, branchFilter, ambassadorFilter, counsellorFilter, rewardPending, sort, setPage]);

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Application Status (CRM)", "University", "Course", "Intake", "Campus", "Branch", "Notes (CRM)", "Referred By", "Counsellor", "Started"];
    const rows = filtered.map((l) => [
      l.lead_name,
      l.lead_email,
      l.lead_phone || "",
      l.application_status || "",
      l.application_university || "",
      l.application_course || "",
      l.application_intake || "",
      l.application_campus || "",
      l.application_branch || "",
      l.application_notes || "",
      l.referrer_name || "",
      l.counsellor_name || (l.counsellor_id ? l.counsellor_id : "Unassigned"),
      l.created_at ? new Date(l.created_at).toLocaleDateString() : "",
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bhe-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Applications</h1>
          <p className="text-slate-400 text-sm">Every referred lead with a live application — showing the exact L2E CRM status &amp; latest note.</p>
        </div>
        <button onClick={exportCsv} className="admin-btn bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-2">
          <AppIcon className="fa-solid fa-file-csv"></AppIcon> Export CSV
        </button>
      </header>

      {/* Filters — search on top, dropdowns in a uniform grid so every pill is the
          same width/height regardless of how many there are. */}
      <div className="mb-5 space-y-2">
        <input
          type="text"
          placeholder="Search name, email, ambassador, counsellor, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input w-full"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <MultiSelect options={statusOptions.map((s) => [s, s] as [string, string])} selected={statusFilter} onChange={setStatusFilter} allLabel="All statuses" noun="status" />
          <MultiSelect options={universityOptions.map((s) => [s, s] as [string, string])} selected={universityFilter} onChange={setUniversityFilter} allLabel="All universities" noun="university" />
          <MultiSelect options={courseOptions.map((s) => [s, s] as [string, string])} selected={courseFilter} onChange={setCourseFilter} allLabel="All courses" noun="course" />
          <MultiSelect options={intakeOptions.map((s) => [s, s] as [string, string])} selected={intakeFilter} onChange={setIntakeFilter} allLabel="All intakes" noun="intake" />
          <MultiSelect options={campusOptions.map((s) => [s, s] as [string, string])} selected={campusFilter} onChange={setCampusFilter} allLabel="All campuses" noun="campus" />
          <MultiSelect options={branchOptions.map((s) => [s, s] as [string, string])} selected={branchFilter} onChange={setBranchFilter} allLabel="All branches" noun="branch" />
          <MultiSelect options={ambassadorOptions} selected={ambassadorFilter} onChange={setAmbassadorFilter} allLabel="All ambassadors" noun="ambassador" />
          <MultiSelect options={counsellorOptions} selected={counsellorFilter} onChange={setCounsellorFilter} allLabel="All counsellors" noun="counsellor" />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <p className="text-xs text-slate-500 font-semibold">
          Showing {filtered.length} of {applications.length} applications
        </p>
        {rewardPending && (
          <button
            onClick={() => {
              setRewardPending(false);
              if (typeof window !== "undefined") window.history.replaceState(null, "", "/admin/applications");
            }}
            className="inline-flex items-center gap-2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-colors"
            title="Clear this filter"
          >
            <AppIcon className="fa-solid fa-graduation-cap"></AppIcon>
            Enrolled rewards to approve only
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
                <th className="p-4 min-w-[150px]">Name</th>
                <th className="p-4 w-[86px] whitespace-nowrap">Status</th>
                <SortTh k="updated_at" label="Updated On" className="p-4 whitespace-nowrap" />
                <th className="p-4 min-w-[130px]">University</th>
                <th className="p-4 min-w-[150px]">Course</th>
                <th className="p-4 w-[110px] whitespace-nowrap">Intake</th>
                <th className="p-4 w-[100px]">Campus</th>
                <th className="p-4 min-w-[140px]">Branch</th>
                <th className="p-4 min-w-[160px]">Notes</th>
                <th className="p-4 hidden xl:table-cell min-w-[150px]">Ambassador</th>
                <th className="p-4 hidden lg:table-cell">Counsellor</th>
                <th className="p-4 whitespace-nowrap">Enrolment Reward</th>
                <SortTh k="created_at" label="Started" className="p-4 hidden xl:table-cell text-right whitespace-nowrap" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="p-8 text-center"><AppIcon className="fa-solid fa-circle-notch animate-spin text-orange-500"></AppIcon></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={13} className="p-8 text-center text-slate-500 text-sm">No applications match your filters.</td></tr>
              ) : (
                pageItems.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                    <td className="p-4">
                      <p className="font-bold text-white">{l.lead_name}</p>
                      <p className="text-xs text-slate-400">{l.lead_email}</p>
                      <p className="text-[10px] text-slate-500">{l.lead_phone || "No phone"}</p>
                    </td>
                    <td className="p-4">
                      <span className={`status-badge text-[10px] border whitespace-nowrap ${chipCls(l.application_stage, l.application_status)}`}>
                        {l.application_status || l.application_stage || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs whitespace-nowrap">{fmtDateTime(l.updated_at)}</td>
                    <td className="p-4 text-slate-300 text-xs">{l.application_university || "—"}</td>
                    <td className="p-4 text-slate-300 text-xs">{l.application_course || "—"}</td>
                    <td className="p-4 text-slate-300 text-xs whitespace-nowrap">{l.application_intake || "—"}</td>
                    <td className="p-4 text-slate-300 text-xs">{l.application_campus || "—"}</td>
                    <td className="p-4 text-slate-300 text-xs">{l.application_branch || "—"}</td>
                    <td className="p-4 min-w-[160px] max-w-[240px]">
                      {l.application_notes ? (
                        <p className="text-slate-300 text-xs whitespace-pre-wrap line-clamp-4" title={l.application_notes}>
                          {l.application_notes}
                        </p>
                      ) : (
                        <span className="text-slate-600 text-xs italic">No notes</span>
                      )}
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      <p className="text-slate-200 font-semibold">{l.referrer_name || "—"}</p>
                      <p className="text-[10px] text-slate-500">{l.referrer_email || ""}</p>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {l.counsellor_id ? (
                        <span className="text-slate-300">{l.counsellor_name || l.counsellor_id}</span>
                      ) : (
                        <span className="text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap align-top">
                      {l.enrolment_reward_paid ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                          <AppIcon className="fa-solid fa-check mr-1"></AppIcon>{fmtBDT(l.enrolment_reward_amount)} Paid (2/2)
                        </span>
                      ) : l.enrolment_awaiting_reward ? (
                        <div className="flex flex-col gap-1.5">
                          {/* Installment 1 */}
                          {l.enrolment_installment_1_paid ? (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              <AppIcon className="fa-solid fa-check mr-1"></AppIcon>1st {fmtBDT(l.enrolment_installment_amount)} paid
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => payInstallment(l.id, 1, l.enrolment_installment_amount)}
                                disabled={busyId === l.id}
                                className="admin-btn bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-[11px] font-bold flex items-center gap-1.5"
                              >
                                {busyId === l.id ? <AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> : <><AppIcon className="fa-solid fa-check"></AppIcon> Pay 1st {fmtBDT(l.enrolment_installment_amount)}</>}
                              </button>
                              <button
                                onClick={() => denyEnrolment(l.id)}
                                disabled={busyId === l.id}
                                title="Deny the enrolment reward"
                                className="admin-btn bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-500 disabled:opacity-60 text-[11px] font-bold"
                              >
                                <AppIcon className="fa-solid fa-xmark"></AppIcon>
                              </button>
                            </div>
                          )}
                          {/* Installment 2 */}
                          {l.enrolment_installment_2_paid ? (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              <AppIcon className="fa-solid fa-check mr-1"></AppIcon>2nd {fmtBDT(l.enrolment_installment_amount)} paid
                            </span>
                          ) : l.enrolment_installment_1_paid ? (
                            <button
                              onClick={() => payInstallment(l.id, 2, l.enrolment_installment_amount)}
                              disabled={busyId === l.id}
                              className="admin-btn bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-[11px] font-bold flex items-center gap-1.5 w-fit"
                            >
                              {busyId === l.id ? <AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> : <><AppIcon className="fa-solid fa-check"></AppIcon> Pay 2nd {fmtBDT(l.enrolment_installment_amount)}</>}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">2nd {fmtBDT(l.enrolment_installment_amount)} · after 1st</span>
                          )}
                        </div>
                      ) : l.enrolment_reward_denied ? (
                        <span className="text-[10px] font-semibold text-red-500">Denied</span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 hidden xl:table-cell text-right text-slate-400 text-xs whitespace-nowrap">
                      {l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
