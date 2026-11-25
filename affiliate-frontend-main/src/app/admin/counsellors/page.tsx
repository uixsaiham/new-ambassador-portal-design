"use client";

import AppIcon from "@/components/AppIcon";
import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import MultiSelect from "@/components/MultiSelect";
import Pagination from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

interface CounsellorRow {
  counsellor_id: string | null;
  counsellor_name: string;
  ambassador_count: number;
  total_leads: number;
  qualified_leads: number;
  not_qualified_leads: number;
  enrolled_leads: number;
}

export default function AdminCounsellorsPage() {
  const [rows, setRows] = useState<CounsellorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string[]>([]);
  // Column sort. Default = most leads first. Click a numeric header to sort by it.
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "total_leads", dir: "desc" });

  const fetchRows = async () => {
    try {
      setRows(await api.get<CounsellorRow[]>("/admin/counsellors-breakdown"));
    } catch (err) {
      console.error("Failed to load counsellor breakdown", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    const id = setInterval(fetchRows, 30000);
    return () => clearInterval(id);
  }, []);

  const conv = (r: CounsellorRow) => (r.total_leads > 0 ? Math.round((r.qualified_leads / r.total_leads) * 100) : 0);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (assignmentFilter.length > 0 && !assignmentFilter.includes(r.counsellor_id ? "assigned" : "unassigned")) return false;
      if (activityFilter.length > 0) {
        const matchesActivity = activityFilter.some((a) =>
          a === "qualified" ? r.qualified_leads > 0 :
          a === "enrolled" ? r.enrolled_leads > 0 :
          a === "leads" ? r.total_leads > 0 :
          a === "none" ? r.total_leads === 0 : false
        );
        if (!matchesActivity) return false;
      }
      if (q && !r.counsellor_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, assignmentFilter, activityFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    const val = (r: CounsellorRow) => (key === "rate" ? conv(r) : Number((r as unknown as Record<string, number>)[key] ?? 0));
    arr.sort((a, b) => (dir === "asc" ? val(a) - val(b) : val(b) - val(a)));
    return arr;
  }, [filtered, sort]);

  const { page, setPage, pageCount, pageItems, pageSize, total } = usePagination(sorted);
  useEffect(() => { setPage(1); }, [search, assignmentFilter, activityFilter, sort, setPage]);

  const totals = filtered.reduce(
    (acc, r) => {
      acc.leads += r.total_leads;
      acc.qualified += r.qualified_leads;
      acc.enrolled += r.enrolled_leads;
      return acc;
    },
    { leads: 0, qualified: 0, enrolled: 0 }
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Counsellors</h1>
        <p className="text-slate-400 text-sm">Which BHE Uni counsellor each ambassador routes leads to, and how those leads are converting.</p>
      </header>

      {/* Filters — single horizontal bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input
          type="text"
          placeholder="Search counsellor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input flex-1 min-w-[200px]"
        />
        <MultiSelect
          options={[["assigned", "Assigned only"], ["unassigned", "Unassigned only"]]}
          selected={assignmentFilter}
          onChange={setAssignmentFilter}
          allLabel="All counsellors"
          noun="type"
          className="flex-1 min-w-[150px]"
        />
        <MultiSelect
          options={[["leads", "Has leads"], ["qualified", "Has qualified"], ["enrolled", "Has enrolled"], ["none", "No leads yet"]]}
          selected={activityFilter}
          onChange={setActivityFilter}
          allLabel="All activity"
          noun="activity filter"
          className="flex-1 min-w-[150px]"
        />
      </div>

      {/* Totals strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-6">
        <div className="admin-card !p-5">
          <p className="text-xs font-semibold text-slate-400">Total Leads</p>
          <p className="text-3xl font-black text-white mt-2">{totals.leads}</p>
        </div>
        <div className="admin-card !p-5">
          <p className="text-xs font-semibold text-slate-400">Qualified</p>
          <p className="text-3xl font-black text-blue-400 mt-2">{totals.qualified}</p>
        </div>
        <div className="admin-card !p-5">
          <p className="text-xs font-semibold text-slate-400">Enrolled</p>
          <p className="text-3xl font-black text-emerald-400 mt-2">{totals.enrolled}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3 font-semibold">
        Showing {filtered.length} of {rows.length} counsellors
        <span className="ml-2 font-normal text-slate-600">
          <AppIcon className="fa-solid fa-arrow-down-wide-short text-[10px] mr-1"></AppIcon>click a numeric column to sort
        </span>
      </p>

      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4">Counsellor</th>
                <SortTh k="ambassador_count" label="Ambassadors" className="p-4 text-center" />
                <SortTh k="total_leads" label="Total Leads" className="p-4 text-center" />
                <SortTh k="qualified_leads" label="Qualified" className="p-4 text-center hidden sm:table-cell" />
                <SortTh k="not_qualified_leads" label="Not Qualified" className="p-4 text-center hidden sm:table-cell" />
                <SortTh k="enrolled_leads" label="Enrolled" className="p-4 text-center hidden sm:table-cell" />
                <SortTh k="rate" label="Qual. Rate" className="p-4 text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><AppIcon className="fa-solid fa-circle-notch animate-spin text-orange-500"></AppIcon></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500 text-sm">No counsellors match your filters.</td></tr>
              ) : (
                pageItems.map((r) => {
                  const isUnassigned = !r.counsellor_id;
                  return (
                    <tr key={r.counsellor_id || "__none__"} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isUnassigned ? "bg-slate-700/40 text-slate-500" : "bg-orange-500/15 text-orange-400"}`}>
                            {isUnassigned ? <AppIcon className="fa-solid fa-user-slash"></AppIcon> : <AppIcon className="fa-solid fa-user-tie"></AppIcon>}
                          </div>
                          <div>
                            <p className={`font-bold ${isUnassigned ? "text-slate-400 italic" : "text-white"}`}>{r.counsellor_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center text-slate-300 font-semibold">{r.ambassador_count}</td>
                      <td className="p-4 text-center font-bold text-white">{r.total_leads}</td>
                      <td className="p-4 text-center text-blue-400 font-semibold hidden sm:table-cell">{r.qualified_leads}</td>
                      <td className="p-4 text-center text-rose-400 font-semibold hidden sm:table-cell">{r.not_qualified_leads}</td>
                      <td className="p-4 text-center text-emerald-400 font-semibold hidden sm:table-cell">{r.enrolled_leads}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${conv(r)}%` }}></div>
                          </div>
                          <span className="font-bold text-white text-xs w-9 text-right">{conv(r)}%</span>
                        </div>
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
