"use client";

import AppSelect from "@/components/AppSelect";
import AppIcon from "@/components/AppIcon";
import { formatMoney } from "@/lib/currency";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { api, downloadFile } from "@/lib/api";
import "./payouts.css";
import Pagination from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

interface Payout {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  bank_details: { holder_name?: string; sort_code?: string; account_number?: string; bank_name?: string; branch?: string; routing_number?: string; account_type?: string; provider_name?: string; note?: string } | null;
  gift_card_email: string | null;
  status_note?: string | null;
  provider_ref: string | null;
  processed_at: string | null;
  created_at: string;
}

interface AmbassadorLite {
  id: string;
  full_name: string;
  email: string;
}

const statusBadge = (s: string) => {
  switch (s) {
    case "paid": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "failed":
    case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "processing": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  }
};

export default function AdminPayoutsPage() {
  const [action, setAction] = useState<{ payout: Payout; status: "processing" | "paid" | "cancelled" | "failed" } | null>(null);
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [pageError, setPageError] = useState("");
  const actionDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!action) return;
    actionDialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [action]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [ambassadors, setAmbassadors] = useState<Record<string, AmbassadorLite>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [invBusyId, setInvBusyId] = useState<string | null>(null);
  const [zipBusy, setZipBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  // Optional date range (paid date) for the bulk invoice download, so an accountant
  // can pull a single period (e.g. a tax quarter). Empty = all paid payouts.
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Deep-link from the dashboard "Payouts pending" tile (/admin/payouts?status=pending)
  // → pre-select that status filter.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = new URLSearchParams(window.location.search).get("status");
    if (s && ["pending", "processing", "paid", "failed", "cancelled"].includes(s)) setStatusFilter(s);
  }, []);

  const fetchData = async () => {
    try {
      const [pts, ambs] = await Promise.all([
        api.get<Payout[]>("/admin/payouts"),
        api.get<AmbassadorLite[]>("/admin/ambassadors").catch(() => [] as AmbassadorLite[]),
      ]);
      // Newest first
      pts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPayouts(pts);
      const map: Record<string, AmbassadorLite> = {};
      ambs.forEach((a) => { map[a.id] = a; });
      setAmbassadors(map);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Could not load payout requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(
    () => (statusFilter === "all" ? payouts : payouts.filter((p) => p.status === statusFilter)),
    [payouts, statusFilter]
  );

  const { page, setPage, pageCount, pageItems, pageSize, total } = usePagination(filtered);
  useEffect(() => { setPage(1); }, [statusFilter, setPage]);

  const pendingTotal = useMemo(
    () => payouts.filter((p) => ["pending", "processing"].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0),
    [payouts]
  );

  const formatCurrency = (val: number) =>
    formatMoney(val);

  // Backend timestamps are UTC but arrive without a tz marker (e.g. "2026-08-06 15:47:52"),
  // so new Date() would treat them as local and render an hour behind in BST. Append "Z"
  // when there's no explicit timezone so they parse as UTC and display in local UK time.
  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const s = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso.replace(" ", "T")}Z`;
    const d = new Date(s);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
  };

  const updateStatus = (id: string, status: "processing" | "paid" | "cancelled" | "failed") => {
    const payout = payouts.find(p => p.id === id);
    if (!payout) return;
    setReference(""); setReason(""); setPageError(""); setAction({ payout, status });
  };
  const confirmAction = async (event: React.FormEvent) => {
    event.preventDefault(); if (!action || busyId) return;
    if (action.status === "paid" && !reference.trim()) { setPageError("Enter the transaction reference for the payment you sent."); return; }
    if (["failed", "cancelled"].includes(action.status) && !reason.trim()) { setPageError("Add a short reason so the ambassador understands what happened."); return; }
    setBusyId(action.payout.id); setPageError("");
    try {
      await api.put(`/admin/payouts/${action.payout.id}/status`, { status: action.status, payment_reference: reference.trim() || undefined, status_note: reason.trim() || undefined });
      actionDialog.current?.close(); setAction(null); await fetchData();
    } catch(error) { setPageError(error instanceof Error ? error.message : "Could not update this payout."); }
    finally { setBusyId(null); }
  };

  // Remittance-advice PDF for a single paid payout.
  const downloadInvoice = async (p: Payout) => {
    setInvBusyId(p.id);
    try {
      await downloadFile(`/admin/payouts/${p.id}/invoice`, `remittance-${p.id}.pdf`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to download the remittance advice.");
    } finally {
      setInvBusyId(null);
    }
  };

  // Zip of remittance-advice PDFs for paid payouts, optionally limited to the
  // selected paid-date range (server-side filter via since/until).
  const downloadAllInvoices = async () => {
    setZipBusy(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("since", fromDate);
      if (toDate) params.set("until", toDate);
      const qs = params.toString();
      const suffix = fromDate || toDate ? `-${fromDate || "start"}_to_${toDate || "today"}` : "";
      await downloadFile(`/admin/payouts/invoices.zip${qs ? `?${qs}` : ""}`, `bhe-remittances${suffix}.zip`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to download the invoices zip.");
    } finally {
      setZipBusy(false);
    }
  };

  // The paid date used for range filtering (matches the backend: processed_at, else
  // created_at). Backend timestamps are UTC without a tz marker, so append "Z".
  const paidDateOf = (p: Payout): Date | null => {
    const iso = p.processed_at || p.created_at;
    if (!iso) return null;
    const s = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso.replace(" ", "T")}Z`;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Count of paid payouts within the selected range (inclusive), for the button label.
  const paidInRange = useMemo(() => {
    return payouts.filter((p) => {
      if (p.status !== "paid") return false;
      const d = paidDateOf(p);
      if (!d) return true;
      if (fromDate && d < new Date(`${fromDate}T00:00:00Z`)) return false;
      if (toDate && d > new Date(`${toDate}T23:59:59Z`)) return false;
      return true;
    }).length;
  }, [payouts, fromDate, toDate]);

  const nameFor = (uid: string) => ambassadors[uid]?.full_name || uid;
  const emailFor = (uid: string) => ambassadors[uid]?.email || "";

  return (
    <div className="finance-payouts">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Payout requests</h1>
          <p className="text-slate-400 text-sm">Review each request, follow the payment, and keep every reward moving.</p>
        </div>
        <div className="admin-card !p-4 !py-3">
          <p className="text-[11px] font-semibold text-slate-400">Awaiting settlement</p>
          <p className="text-xl font-black text-amber-400">{formatCurrency(pendingTotal)}</p>
        </div>
      </header>

      {pageError && !action && <div className="finance-error" role="alert">{pageError}<button onClick={() => { setPageError(""); fetchData(); }}>Retry</button></div>}
      <div className="finance-toolbar flex flex-wrap gap-2 mb-5 items-center justify-between">
        <div className="finance-status-tabs flex gap-2">
          {["all", "pending", "processing", "paid", "failed", "cancelled"].map((s) => (
            <button
              key={s}
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold capitalize transition-colors border ${
                statusFilter === s ? "bg-orange-600 text-white border-orange-500" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <span className="hidden sm:inline">From</span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="admin-input !py-1.5 !px-2.5 !text-xs"
              />
            </label>
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <span className="hidden sm:inline">To</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="admin-input !py-1.5 !px-2.5 !text-xs"
              />
            </label>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                title="Clear date range"
                className="text-[11px] font-semibold text-slate-400 hover:text-white px-1"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={downloadAllInvoices}
            disabled={zipBusy || paidInRange === 0}
            title={fromDate || toDate
              ? "Download a zip of remittance-advice PDFs for paid payouts in the selected date range"
              : "Download a zip of remittance-advice PDFs for every paid payout (pick a From/To range to limit it)"}
            className="admin-btn bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1.5"
          >
            {zipBusy ? (
              <><AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon> Preparing…</>
            ) : (
              <><AppIcon className="fa-solid fa-file-zipper"></AppIcon> {fromDate || toDate ? "Download invoices" : "Download all invoices"} ({paidInRange})</>
            )}
          </button>
        </div>
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4">Ambassador</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 hidden md:table-cell">Method / Details</th>
                <th className="p-4 hidden sm:table-cell">Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><AppIcon className="fa-solid fa-circle-notch animate-spin text-orange-500"></AppIcon></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No payouts in this view.</td></tr>
              ) : (
                pageItems.map((p) => {
                  const busy = busyId === p.id;
                  const isGift = p.payment_method === "gift_card";
                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                      <td className="p-4">
                        <p className="font-bold text-white">{nameFor(p.user_id)}</p>
                        <p className="text-[10px] text-slate-500">{emailFor(p.user_id)}</p>
                      </td>
                      <td className="p-4 text-right font-black text-white whitespace-nowrap">{formatCurrency(Number(p.amount))}</td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-slate-300 capitalize flex items-center gap-1.5">
                          <AppIcon className={`fa-solid ${isGift ? "fa-gift text-purple-400" : "fa-building-columns text-blue-400"}`}></AppIcon>
                          {p.payment_method === "bkash" ? "bKash" : p.payment_method.replaceAll("_", " ")}
                        </span>
                        {isGift ? (
                          <p className="text-[10px] text-slate-500 mt-0.5">{p.gift_card_email}</p>
                        ) : p.bank_details ? (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {p.bank_details.holder_name} · {p.bank_details.account_number}
                            <br />{[p.bank_details.bank_name, p.bank_details.branch, p.bank_details.routing_number || p.bank_details.sort_code, p.bank_details.provider_name, p.bank_details.account_type].filter(Boolean).join(" · ")}
                            {p.bank_details.note && <><br />{p.bank_details.note}</>}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-4 hidden sm:table-cell text-slate-400 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="p-4">
                        <span className={`status-badge text-[9px] border ${statusBadge(p.status)}`}>{p.status}</span>
                        {p.status_note && <p className="text-xs text-slate-400 mt-1">{p.status_note}</p>}
                        {p.provider_ref && (
                          <p className="text-[9px] text-emerald-400/80 mt-1 font-mono" title="Payment reference">
                            <AppIcon className="fa-solid fa-hashtag mr-1"></AppIcon>{p.provider_ref}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {["pending", "processing"].includes(p.status) ? (
                          <button className="finance-review-button" disabled={busy} onClick={() => updateStatus(p.id, p.status === "pending" ? "processing" : "paid")}>Review request <span aria-hidden="true"><AppIcon name="arrow-up-right-from-square" /></span></button>
                        ) : (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[10px] text-slate-500">{formatDate(p.processed_at)}</span>
                            {p.status === "paid" && (
                              <button
                                onClick={() => downloadInvoice(p)}
                                disabled={invBusyId === p.id}
                                title="Download remittance advice (PDF)"
                                className="admin-btn bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-60 text-[11px] font-bold flex items-center gap-1.5"
                              >
                                {invBusyId === p.id ? (
                                  <AppIcon className="fa-solid fa-circle-notch animate-spin"></AppIcon>
                                ) : (
                                  <><AppIcon className="fa-solid fa-file-invoice"></AppIcon> Invoice</>
                                )}
                              </button>
                            )}
                          </div>
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
      <dialog ref={actionDialog} className="finance-action-dialog" onClose={() => setAction(null)} onCancel={event => { if (busyId) event.preventDefault(); }} aria-labelledby="finance-action-title">{action && <form onSubmit={confirmAction}><div className="finance-dialog-top"><span className="finance-eyebrow">PAYOUT REVIEW</span><button type="button" aria-label="Close review" disabled={!!busyId} onClick={() => actionDialog.current?.close()}><AppIcon name="xmark" /></button></div><h2 id="finance-action-title">{({processing:"Start processing",paid:"Record a completed payment",failed:"Mark payment unsuccessful",cancelled:"Decline this request"})[action.status]}</h2><p className="finance-dialog-caption">{({processing:"Let the ambassador know finance is taking the next step.",paid:"Confirm the transfer was sent manually, then record its transaction reference.",failed:"The held amount will be returned to the ambassador’s wallet.",cancelled:"Add a reason for the ambassador. Their held funds will be returned."})[action.status]}</p><div className="finance-dialog-recipient"><span>{nameFor(action.payout.user_id)}</span><strong>{formatMoney(action.payout.amount)}</strong></div><dl className="finance-dialog-facts"><div><dt>Method</dt><dd>{action.payout.payment_method === "bkash" ? "bKash" : action.payout.payment_method.replaceAll("_", " ")}</dd></div><div><dt>Recipient</dt><dd>{action.payout.bank_details?.holder_name || action.payout.gift_card_email || "—"}</dd></div><div><dt>Account</dt><dd>{action.payout.bank_details?.account_number || action.payout.gift_card_email || "—"}</dd></div>{action.payout.bank_details?.bank_name && <div><dt>Bank / branch</dt><dd>{action.payout.bank_details.bank_name} · {action.payout.bank_details.branch}</dd></div>}{action.payout.bank_details?.routing_number && <div><dt>Routing number</dt><dd>{action.payout.bank_details.routing_number}</dd></div>}</dl><label className="finance-dialog-field">Next action<AppSelect value={action.status} onChange={event => { setAction({ ...action, status: event.target.value as typeof action.status }); setPageError(""); }}>{action.payout.status === "pending" && <option value="processing">Start processing</option>}<option value="paid">Record manual payment</option><option value="failed">Payment failed · return funds</option><option value="cancelled">Decline request · return funds</option></AppSelect></label>{pageError && <p className="finance-error" role="alert">{pageError}</p>}{action.status === "paid" ? <label className="finance-dialog-field">Transaction reference<input autoFocus required maxLength={120} placeholder="Bank or bKash transaction reference" value={reference} onChange={event => setReference(event.target.value)} /></label> : <label className="finance-dialog-field">{action.status === "processing" ? "Note for the ambassador (optional)" : "Reason for the ambassador"}<textarea autoFocus required={action.status !== "processing"} maxLength={500} placeholder="Keep it clear and helpful." value={reason} onChange={event => setReason(event.target.value)} /></label>}<div className="finance-dialog-actions"><button type="button" disabled={!!busyId} onClick={() => actionDialog.current?.close()}>Go back</button><button type="submit" disabled={!!busyId}>{busyId ? "Saving…" : ({processing:"Start processing",paid:"Confirm payment recorded",failed:"Mark failed & refund",cancelled:"Decline & refund"})[action.status]}</button></div></form>}</dialog>
    </div>
  );
}
