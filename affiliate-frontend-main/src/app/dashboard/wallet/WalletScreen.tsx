"use client";

import AppSelect from "@/components/AppSelect";
import AppIcon from "@/components/AppIcon";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, usePortalLanguage } from "@/context/PortalLanguage";
import { api, downloadFile } from "@/lib/api";
import WalletEarningsOverview from "@/components/WalletEarningsOverview";
import { takaDescription } from "@/lib/currency";
import "./wallet.css";

type Method = "bank_transfer" | "bkash" | "other";
type Account = { id: string; payment_method: Method; details: Record<string, string> };
type Payout = { id: string; amount: number; payment_method: string; bank_details: Record<string,string> | null; status: string; status_note?: string; provider_ref?: string; processing_at?: string; processed_at?: string; created_at: string };
type Transaction = { id: string; type: string; amount: number; category: string; description: string; created_at: string };
type RewardReferral = { id: string; lead_name: string; status: string; application_status_label?: string; enrolled_at?: string | null; enrolment_reward_paid: boolean; enrolment_reward_denied?: boolean; enrolment_installment_1_paid?: boolean; enrolment_installment_2_paid?: boolean };
type View = "wallet" | "request" | "account" | "review" | "status";
const methodName = (method: string) => ({ bank_transfer: "Bank transfer", bkash: "bKash", other: "Other manual method", gift_card: "Gift card" }[method] || method);
const statusName = (status: string) => ({ pending: "Requested", processing: "Processing", paid: "Paid", failed: "Failed", cancelled: "Declined / cancelled" }[status] || status);
const shortId = (id: string) => `PO-${id.slice(0,8).toUpperCase()}`;
const date = (value?: string) => value ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" }) : "Awaiting update";
const masked = (value?: string) => value ? `•••• ${value.slice(-4)}` : "—";

export default function WalletScreen({ initialView = "wallet" }: { initialView?: View }) {
  const { user, refreshUser } = useAuth();
  const { language } = usePortalLanguage();
  const bn = language === "bn";
  const money = (amount: number) => formatMoney(amount, language);
  const [view, setView] = useState<View>(initialView);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [rewardReferrals, setRewardReferrals] = useState<RewardReferral[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeId, setActiveId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("bkash");
  const [details, setDetails] = useState<Record<string,string>>({ account_type: "personal" });
  const [policy, setPolicy] = useState({ min_withdrawal: 50, max_withdrawal: 5000, enrolment_reward: 500 });
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const requestKey = useRef("");
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const fetchData = async () => {
    const [saved, requests, logs, limits, stats, referrals] = await Promise.all([
      api.get<Account[]>("/ambassador/payout-accounts"), api.get<Payout[]>("/ambassador/payouts"),
      api.get<Transaction[]>("/ambassador/transactions"), api.get<typeof policy>("/public/payout-policy"), api.get<{ wallet_balance: number }>("/ambassador/stats"), api.get<RewardReferral[]>("/ambassador/referrals"),
    ]);
    setAccounts(saved); setPayouts(requests.sort((a,b) => new Date(b.created_at).getTime()-new Date(a.created_at).getTime()));
    setTransactions(logs); setPolicy({ ...limits, enrolment_reward: limits.enrolment_reward ?? 500 }); setRewardReferrals(referrals); setWalletBalance(Number(stats.wallet_balance));
    setSelectedId(current => current || saved[0]?.id || "");
  };
  useEffect(() => {
    fetchData().catch(e => setError(e instanceof Error ? e.message : "Could not load your wallet.")).finally(() => setLoading(false));
    const timer = setInterval(() => { fetchData().catch(() => {}); }, 15000);
    return () => clearInterval(timer);
  // The refresh loop must preserve the withdrawal form and selected account.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const followLink = () => {
      if (window.location.hash === "#request-payout") { requestKey.current = ""; setAmount(""); setView("request"); }
      if (window.location.hash === "#add-account") { setDetails({account_type:"personal"}); setView("account"); }
      if (window.location.hash === "#saved-accounts") { setView("wallet"); requestAnimationFrame(() => document.getElementById("saved-accounts")?.scrollIntoView({behavior:"smooth",block:"start"})); }
    };
    if (!loading) followLink();
    window.addEventListener("hashchange",followLink);
    return () => window.removeEventListener("hashchange",followLink);
  }, [loading]);
  useEffect(() => { heading.current?.focus(); }, [view]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 5000); return () => clearTimeout(timer); }, [toast]);
  if (!user) return null;
  const selected = accounts.find(a => a.id === selectedId);
  const active = payouts.find(p => p.id === activeId);
  const available = Number(walletBalance ?? user.wallet_balance);
  const numericAmount = Number(amount);
  const pending = payouts.filter(p => ["pending","processing"].includes(p.status)).reduce((sum,p) => sum + Number(p.amount),0);
  const paid = payouts.filter(p => p.status === "paid").reduce((sum,p) => sum + Number(p.amount),0);
  const changeView = (next: View) => { setError(""); setView(next); };
  const startRequest = () => { requestKey.current = ""; setAmount(""); changeView("request"); };
  const updateDetail = (key: string, value: string) => setDetails(current => ({ ...current, [key]: value }));
  const review = (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (!selected) { setError("Choose or add a payout account."); return; }
    if (!Number.isFinite(numericAmount) || numericAmount < policy.min_withdrawal || numericAmount > policy.max_withdrawal || numericAmount > available || !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError(`Enter an amount from ${money(policy.min_withdrawal)} to ${money(Math.min(available, policy.max_withdrawal))}, using at most two decimal places.`); return;
    }
    requestKey.current = crypto.randomUUID(); changeView("review");
  };
  const saveAccount = async (event: React.FormEvent) => {
    event.preventDefault(); if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const saved = await api.post<Account>("/ambassador/payout-accounts", { payment_method: method, details });
      setAccounts(current => [...current, saved]); setSelectedId(saved.id); setToast("Payout account saved."); changeView("request");
      await refreshUser().catch(() => {});
    } catch(e) { setError(e instanceof Error ? e.message : "Could not save this account."); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const submit = async () => {
    if (!selected || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const payout = await api.post<Payout>("/ambassador/payouts", { amount: numericAmount, payment_method: selected.payment_method, bank_details: selected.details, request_key: requestKey.current });
      setPayouts(current => [payout, ...current.filter(p => p.id !== payout.id)]); setActiveId(payout.id); setWalletBalance(available - numericAmount); changeView("status"); setToast("Your payout request has been sent to finance.");
      await Promise.all([refreshUser(), fetchData()]).catch(() => setToast("Request saved. Refresh to see your updated balance."));
    } catch(e) { setError(e instanceof Error ? e.message : "Could not submit. You can safely retry this request."); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const cancel = async () => {
    if (!active || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const updated = await api.post<Payout>(`/ambassador/payouts/${active.id}/cancel`, {});
      setPayouts(current => current.map(p => p.id === updated.id ? updated : p));
      await Promise.all([refreshUser(), fetchData()]); setToast("Request cancelled. The amount is back in your wallet.");
    } catch(e) { setError(e instanceof Error ? e.message : "Could not cancel the request."); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const removeAccount = async (account: Account) => {
    if (inFlight.current || !window.confirm("Remove this saved account? Existing payout requests keep their original details.")) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      await api.delete(`/ambassador/payout-accounts/${account.id}`);
      setAccounts(current => current.filter(item => item.id !== account.id));
      if (selectedId === account.id) setSelectedId(accounts.find(item => item.id !== account.id)?.id || "");
      setToast("Saved payout account removed.");
      await refreshUser().catch(() => {});
    } catch(e) { setError(e instanceof Error ? e.message : "Could not remove this account."); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const updateAccountAndRetry = () => {
    if (!active) return;
    setMethod(["bkash", "bank_transfer", "other"].includes(active.payment_method) ? active.payment_method as Method : "bank_transfer");
    setDetails({ account_type: "personal", ...(active.bank_details || {}) });
    setAmount(String(active.amount));
    requestKey.current = "";
    changeView("account");
  };
  const receipt = async () => {
    if (!active) return;
    setBusy(true); setError("");
    try { await downloadFile(`/ambassador/payouts/${active.id}/receipt`, `${shortId(active.id)}.pdf`); }
    catch(e) { setError(e instanceof Error ? e.message : "Could not download the receipt."); }
    finally { setBusy(false); }
  };
  const stepIndex = ({ account: 0, request: 1, review: 2, status: 3, wallet: 0 })[view];
  const methodIcon = (value: string) => value === "bank_transfer" ? "fa-building-columns" : value === "bkash" ? "fa-mobile-screen-button" : "fa-money-bill-transfer";
  const field = (key: string, label: string, placeholder: string, options: { pattern?: string; inputMode?: "numeric" | "text"; required?: boolean; maxLength?: number } = {}) => <label className="wallet-field" key={key}><span>{label}</span><input value={details[key] || ""} onChange={e => updateDetail(key,e.target.value)} placeholder={placeholder} required={options.required !== false} pattern={options.pattern} inputMode={options.inputMode} maxLength={options.maxLength || 120} autoComplete="off" /></label>;

  return <div className={`wallet-screen wallet-view-${view}`}><header className="wallet-title"><div>{view !== "wallet" && <button className="wallet-back" onClick={() => changeView(view === "review" ? "request" : "wallet")} disabled={busy}><AppIcon className="fa-solid fa-arrow-left" aria-hidden="true" /> {bn ? "ফিরে যান" : view === "review" ? "Back to withdrawal" : "Back to wallet"}</button>}<h1 ref={heading} tabIndex={-1}>{({ wallet: bn ? "ছোট প্রচেষ্টা। বাস্তব পুরস্কার।" : "A little effort. Real rewards.", request: "Request a payout", account: "Add a payout account", review: "One last look.", status: "Your payout journey" })[view]}</h1><p className="wallet-page-subtitle">{({wallet:bn ? "প্রতিটি টাকা, প্রতিটি পদক্ষেপ। সব এক জায়গায়।" : "Every taka, every step. All in one place.",account:"Choose where your rewards should go. We’ll keep the details ready for next time.",request:"Choose an account and an amount. We’ll take care of the next step.",review:"Check the details below before sending your request to finance.",status:"A clear view of your request, from the first step to payment."})[view]}</p></div>{view === "wallet" && <button className="wallet-primary" disabled={loading} onClick={startRequest}>{bn ? "পেআউট অনুরোধ" : "Request payout"}<span aria-hidden="true"><AppIcon name="arrow-up-right-from-square" /></span></button>}</header>
    {view !== "wallet" && <ol className="payout-flow-steps" aria-label="Payout progress">{["Payout account", "Withdrawal", "Review", "Track payment"].map((label,index) => <li key={label} className={index === stepIndex ? "is-current" : index < stepIndex ? "is-complete" : ""} aria-current={index === stepIndex ? "step" : undefined}><span>{index < stepIndex ? <AppIcon className="fa-solid fa-check" aria-hidden="true" /> : String(index+1).padStart(2,"0")}</span><strong>{label}</strong></li>)}</ol>}
    {error && <div className="wallet-alert" role="alert">{error}{view === "wallet" && <button onClick={() => { setLoading(true); setError(""); fetchData().catch(e => setError(e.message)).finally(() => setLoading(false)); }}>Try again</button>}</div>}
    {toast && <div className="wallet-toast" role="status"><AppIcon name="check" /> {toast}</div>}
    <div className={view === "wallet" ? "wallet-overview-body" : "wallet-process-layout"}>
      {view !== "wallet" && <aside className="payout-context-rail"><div className="payout-balance-inline"><span className="payout-context-icon"><AppIcon className="fa-solid fa-wallet" aria-hidden="true" /></span><p className="eyebrow">YOUR AVAILABLE BALANCE</p><strong className="payout-context-balance">{money(available)}</strong></div><p className="payout-context-caption">Ready when you are.</p>{view === "account" && !loading && <section className="wallet-inline-accounts" aria-label="Your saved payout accounts"><div className="wallet-section-heading"><div><p className="section-eyebrow">YOUR PAYOUT DESTINATIONS</p><h2>Saved accounts</h2></div></div>{accounts.length ? <div className="saved-account-list">{accounts.map(account => <div className={`saved-account account-${account.payment_method}`} key={account.id}><span className="method-icon"><AppIcon className={`fa-solid ${account.payment_method === "bank_transfer" ? "fa-building-columns" : "fa-mobile-screen-button"}`} /></span><div><strong>{account.payment_method === "other" ? account.details.provider_name : methodName(account.payment_method)}</strong><p>{account.details.holder_name} · {masked(account.details.account_number)}</p></div><button type="button" aria-label={`Request payout to ${account.details.holder_name}`} onClick={() => { setSelectedId(account.id); setAmount(""); changeView("request"); }}>Withdraw <AppIcon name="arrow-up-right-from-square" /></button><button type="button" disabled={busy} className="remove-payout-account" aria-label={`Remove saved ${methodName(account.payment_method)} account`} onClick={() => removeAccount(account)}><AppIcon name="xmark" /></button></div>)}</div> : <p className="wallet-empty">Save a bank, bKash or other manual payout account to get started.</p>}</section>}<div className="payout-context-divider"/><h2>A little clarity<br/>at every step.</h2><ul><li><AppIcon className="fa-regular fa-circle-check" aria-hidden="true"/><span>Bank, bKash or your preferred manual method.</span></li><li><AppIcon className="fa-regular fa-clock" aria-hidden="true"/><span>Every request is reviewed by our finance team.</span></li><li><AppIcon className="fa-solid fa-arrow-rotate-left" aria-hidden="true"/><span>Unsuccessful requests return to your wallet.</span></li></ul><a href="mailto:ask@bheuni.io">Need a hand? <span>Contact support <AppIcon name="arrow-up-right-from-square" /></span></a></aside>}
      <div className="wallet-process-content">
    {loading ? <div aria-busy="true" className="overview-skeleton"><div className="skeleton"/><div className="skeleton"/></div> : view === "wallet" ? <>
      <section className="wallet-open-summary" aria-label={bn ? "ওয়ালেটের সারাংশ" : "Wallet summary"}><div><p>{bn ? "উত্তোলনযোগ্য" : "Available to withdraw"}</p><strong className="available-money">{money(available)}</strong><small>{bn ? "আপনি প্রস্তুত হলেই" : "Ready whenever you are"}</small></div><div><p>{bn ? "পর্যালোচনায়" : "In review"}</p><strong>{money(pending)}</strong><small>{bn ? "ফাইন্যান্স পর্যালোচনার অপেক্ষায়" : "Waiting for finance review"}</small></div><div><p>{bn ? "পরিশোধিত" : "Paid out"}</p><strong>{money(paid)}</strong><small>{bn ? "আপনার পেআউট অ্যাকাউন্টে পাঠানো হয়েছে" : "Sent to your payout accounts"}</small></div></section>
      <WalletEarningsOverview transactions={transactions} referrals={rewardReferrals} enrolmentReward={policy.enrolment_reward} />
      <section id="saved-accounts" className="wallet-section wallet-accounts-section" style={{scrollMarginTop:20}}><div className="wallet-section-heading"><div><p className="section-eyebrow">YOUR PAYOUT DESTINATIONS</p><h2>Saved accounts</h2></div><button onClick={() => { setDetails({ account_type: "personal" }); changeView("account"); }}><AppIcon name="plus" /> Add account</button></div>{accounts.length ? <div className="saved-account-list">{accounts.map(account => <div className={`saved-account account-${account.payment_method}`} key={account.id}><span className="method-icon"><AppIcon className={`fa-solid ${account.payment_method === "bank_transfer" ? "fa-building-columns" : "fa-mobile-screen-button"}`} /></span><div><strong>{account.payment_method === "other" ? account.details.provider_name : methodName(account.payment_method)}</strong><p>{account.details.holder_name} · {masked(account.details.account_number)}</p></div><button aria-label={`Request payout to ${account.details.holder_name}`} onClick={() => { setSelectedId(account.id); setAmount(""); changeView("request"); }}>Withdraw <AppIcon name="arrow-up-right-from-square" /></button><button disabled={busy} className="remove-payout-account" aria-label={`Remove saved ${methodName(account.payment_method)} account`} onClick={() => removeAccount(account)}><AppIcon name="xmark" /></button></div>)}</div> : <p className="wallet-empty">Save a bank, bKash or other manual payout account to get started.</p>}</section>
      <section className="wallet-section wallet-requests-section"><div className="wallet-section-heading"><div><p className="section-eyebrow">FOLLOW THE PROGRESS</p><h2>Payout requests</h2></div><span>{payouts.length} requests</span></div>{payouts.length ? <div className="wallet-request-list">{payouts.map(p => <button key={p.id} className="wallet-request-row" onClick={() => { setActiveId(p.id); changeView("status"); }}><span className={`payout-status-icon status-${p.status}`}><AppIcon className={`fa-solid ${p.status === "paid" ? "fa-check" : ["failed","cancelled"].includes(p.status) ? "fa-xmark" : "fa-clock"}`} /></span><span><strong>{methodName(p.payment_method)}</strong><small>{shortId(p.id)} · {date(p.created_at)}</small></span><span className="request-row-amount"><strong>{money(p.amount)}</strong><small className={`wallet-status status-${p.status}`}>{statusName(p.status)}</small></span><span aria-hidden="true"><AppIcon name="chevron-right" /></span></button>)}</div> : <p className="wallet-empty">Your requests will appear here. Every payout is reviewed and sent manually.</p>}</section>
      <section className="wallet-section wallet-activity-section"><div className="wallet-section-heading"><div><p className="section-eyebrow">EVERY MOVEMENT, IN ONE PLACE</p><h2>Wallet activity</h2></div></div>{transactions.length ? transactions.map(tx => <div key={tx.id} className="wallet-activity-row"><div><strong>{tx.category.replaceAll("_"," ")}</strong><p>{takaDescription(tx.description)}</p><small>{date(tx.created_at)}</small></div><strong className={tx.type === "credit" ? "activity-credit" : ""}>{tx.type === "credit" ? "+" : "−"}{money(tx.amount)}</strong></div>) : <p className="wallet-empty">Your rewards and withdrawals will appear here.</p>}</section>
    </> : view === "account" ? <form className="wallet-flow wallet-account-form" onSubmit={saveAccount}><div className="wallet-flow-intro"><span className="flow-kicker">01 / PAYOUT ACCOUNT</span><h2>Where should we send it?</h2><p className="wallet-muted">Choose a method, then add the recipient details below.</p></div><fieldset className="wallet-methods"><legend className="sr-only">Payout method</legend>{(["bkash","bank_transfer","other"] as Method[]).map(item => <label key={item} className={method === item ? "is-selected" : ""}><input type="radio" name="method" value={item} checked={method === item} onChange={() => { setMethod(item); setDetails({ account_type: "personal" }); }} /><span className={`method-choice-icon method-${item}`}><AppIcon className={`fa-solid ${methodIcon(item)}`} aria-hidden="true" /></span><span><strong>{methodName(item)}</strong><small>{item === "bkash" ? "Mobile wallet" : item === "bank_transfer" ? "Direct to your bank" : "Nagad, Rocket & more"}</small></span><AppIcon className="fa-solid fa-circle-check method-choice-check" aria-hidden="true" /></label>)}</fieldset>
      <div className="wallet-account-fields">{field("holder_name","Account holder name","Full name on the account")}
      {method === "bank_transfer" && <>{field("bank_name","Bank name","e.g. Dutch-Bangla Bank")}{field("branch","Branch","e.g. Dhanmondi")}{field("routing_number","Routing number","9-digit routing number",{pattern:"[0-9]{9}", inputMode:"numeric", maxLength:9})}</>}
      {method === "other" && field("provider_name","Payment service / manual method","e.g. Nagad, Rocket or another service")}
      {field("account_number",method === "bkash" ? "bKash number" : "Account number / recipient details", method === "bkash" ? "01XXXXXXXXX" : "Account number", method === "bkash" ? {pattern:"(\\+88)?01[3-9][0-9]{8}",inputMode:"numeric",maxLength:14} : method === "bank_transfer" ? {pattern:"[0-9]{5,20}",inputMode:"numeric",maxLength:20} : {})}
      {method === "bkash" && <label className="wallet-field"><span>Account type</span><AppSelect value={details.account_type} onChange={e => updateDetail("account_type",e.target.value)}><option value="personal">Personal</option><option value="agent">Agent</option></AppSelect></label>}
      {field("note","Additional instructions (optional)","Anything finance should know",{required:false,maxLength:300})}
      </div><div className="wallet-flow-footnote"><AppIcon className="fa-regular fa-circle-check" aria-hidden="true" /> Saved details can be reused for future payouts.</div><button className="wallet-primary" disabled={busy}>{busy ? "Saving…" : "Save payout account"}</button></form>
    : view === "request" ? <form className="wallet-flow wallet-withdraw-form" onSubmit={review}><div className="wallet-flow-intro"><span className="flow-kicker">02 / WITHDRAWAL</span><h2>Make it yours.</h2><p className="wallet-muted">Select a destination and tell us how much you’d like to withdraw.</p></div><div className="wallet-available"><span>Available to withdraw</span><strong>{money(available)}</strong></div><h2>Pay to</h2><div className="wallet-account-options">{accounts.map(account => <label key={account.id} className={selectedId === account.id ? "is-selected" : ""}><input type="radio" name="account" checked={selectedId === account.id} onChange={() => setSelectedId(account.id)}/><span className={`method-choice-icon method-${account.payment_method}`}><AppIcon className={`fa-solid ${methodIcon(account.payment_method)}`} aria-hidden="true" /></span><span><strong>{account.payment_method === "other" ? account.details.provider_name : methodName(account.payment_method)}</strong><small>{account.details.holder_name} · {masked(account.details.account_number)}</small></span></label>)}</div><button type="button" className="wallet-text-button" onClick={() => { setDetails({account_type:"personal"}); changeView("account"); }}><AppIcon name="plus" /> Add another payout account</button><label className="wallet-field wallet-amount"><span>Amount (৳)</span><input type="number" inputMode="decimal" step="0.01" min={policy.min_withdrawal} max={Math.min(available,policy.max_withdrawal)} required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label><div className="wallet-presets">{[500,1000,1500].filter(value => value <= available && value <= policy.max_withdrawal).map(value => <button type="button" key={value} onClick={() => setAmount(String(value))}>{money(value)}</button>)}<button type="button" onClick={() => setAmount(String(Math.min(available,policy.max_withdrawal)))}>All available</button></div><p className="wallet-muted">Min {money(policy.min_withdrawal)} · Max {money(policy.max_withdrawal)}. Finance reviews every request.</p><button className="wallet-primary" disabled={!selected || available < policy.min_withdrawal}>Review withdrawal <AppIcon name="arrow-right" /></button></form>
    : view === "review" && selected ? <section className="wallet-flow wallet-review-form"><div className="wallet-flow-intro"><span className="flow-kicker">03 / REVIEW YOUR REQUEST</span><h2>Everything look right?</h2></div><p className="wallet-muted">You’re withdrawing</p><h2 className="wallet-review-amount">{money(numericAmount)}</h2><div className="wallet-review-account"><span><strong>{selected.payment_method === "other" ? selected.details.provider_name : methodName(selected.payment_method)}</strong><p>{selected.details.holder_name} · {masked(selected.details.account_number)}</p></span><button onClick={() => changeView("request")}>Change</button></div><dl className="wallet-review-details"><div><dt>Amount</dt><dd>{money(numericAmount)}</dd></div><div><dt>Fee charged by this system</dt><dd>{money(0)}</dd></div><div><dt>You receive</dt><dd>{money(numericAmount)}</dd></div><div><dt>Balance after request</dt><dd>{money(available-numericAmount)}</dd></div><div><dt>Payment process</dt><dd>Manual finance review</dd></div></dl><p className="wallet-info"><AppIcon className="fa-solid fa-circle-info" aria-hidden="true"/> The amount is held from your wallet when you confirm. Finance sends payment manually and records the reference. A failed or declined request returns the held amount to your wallet.</p><button className="wallet-primary" disabled={busy} onClick={submit}>{busy ? "Sending request…" : "Confirm payout request"}<AppIcon className="fa-solid fa-arrow-right" aria-hidden="true" /></button></section>
    : view === "status" && active ? <section className="wallet-flow wallet-status-view"><span className={`payout-status-icon status-${active.status}`}><AppIcon className={`fa-solid ${active.status === "paid" ? "fa-check" : ["failed","cancelled"].includes(active.status) ? "fa-triangle-exclamation" : "fa-clock"}`} /></span><h2>{({pending:"Withdrawal requested",processing:"Withdrawal in progress",paid:"Payment completed",failed:"Payout failed",cancelled:"Request declined / cancelled"})[active.status] || active.status}</h2><p className="wallet-muted">{money(active.amount)} · {methodName(active.payment_method)} · {masked(active.bank_details?.account_number)}</p><ol className="wallet-status-timeline"><li className="done"><span><AppIcon name="check" /></span><div><strong>Requested</strong><small>{date(active.created_at)}</small></div></li><li className={active.status === "processing" ? "current" : active.processing_at || active.status === "paid" ? "done" : ""}><span>{active.processing_at || active.status === "paid" ? <><AppIcon name="check" /></> : "2"}</span><div><strong>Finance review & processing</strong><small>{date(active.processing_at || (active.status === "paid" ? active.processed_at : undefined))}</small></div></li><li className={active.status === "paid" ? "done" : ["failed","cancelled"].includes(active.status) ? "stopped" : ""}><span>{active.status === "paid" ? <><AppIcon name="check" /></> : ["failed","cancelled"].includes(active.status) ? "!" : "3"}</span><div><strong>{["failed","cancelled"].includes(active.status) ? statusName(active.status) : "Paid"}</strong><small>{date(active.processed_at)}</small></div></li></ol>{active.status_note && <p className="wallet-info">{active.status_note}</p>}{["failed","cancelled"].includes(active.status) && <p className="wallet-refunded"><AppIcon name="check" /> {money(active.amount)} has been returned to your wallet. You can update the account and submit a new request.</p>}<dl className="wallet-review-details"><div><dt>Status</dt><dd className={`wallet-status status-${active.status}`}>{statusName(active.status)}</dd></div><div><dt>Amount</dt><dd>{money(active.amount)}</dd></div><div><dt>Recipient</dt><dd>{active.bank_details?.holder_name || "—"}</dd></div><div><dt>Payout ID</dt><dd>{shortId(active.id)}</dd></div>{active.provider_ref && <div><dt>Payment reference</dt><dd>{active.provider_ref}</dd></div>}</dl><button className="wallet-primary" onClick={() => changeView("wallet")}>Back to wallet</button>{active.status === "pending" && <button className="wallet-text-button" disabled={busy} onClick={cancel}>{busy ? "Cancelling…" : "Cancel request & return funds"}</button>}{active.status === "paid" && <button className="wallet-text-button" disabled={busy} onClick={receipt}>{busy ? "Downloading…" : "Download receipt"}</button>}{["failed","cancelled"].includes(active.status) && <button className="wallet-text-button" onClick={updateAccountAndRetry}>Update account / request again <AppIcon name="arrow-right" /></button>}<a className="wallet-support" href="mailto:ask@bheuni.io">Contact support <AppIcon name="arrow-up-right-from-square" /></a></section> : null}
  </div></div></div>;
}
