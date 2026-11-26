"use client";

import AppSelect from "@/components/AppSelect";
import AppIcon from "@/components/AppIcon";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { usePortalLanguage } from "@/context/PortalLanguage";
import "./settings.css";
import AmbassadorMilestones from "@/components/AmbassadorMilestones";
import { isValidPhone } from "@/lib/phone";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { language, setLanguage } = usePortalLanguage();

  // Read-only: the ambassador's name comes from their account and is not editable
  // here. Still submitted unchanged so the profile PUT keeps its existing contract.
  const fullName = user?.full_name || "";
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");

  // Counsellor the ambassador routes their leads to. "" = None of the above.
  const [counsellors, setCounsellors] = useState<{ id: string; name: string }[]>([]);
  const [counsellorId, setCounsellorId] = useState(user?.counsellor_id ? String(user.counsellor_id) : "");
  useEffect(() => {
    api.get<{ id: string; name: string }[]>("/auth/counsellors")
      .then(setCounsellors)
      .catch(() => setCounsellors([]));
  }, []);

  // Deep-link support: when arriving from the Wallet ("Add your account in your
  // Profile"), jump straight to the Bank Details section. On mobile the page is a
  // single column (Profile first, Bank second), so without this they'd land at the
  // top and have to scroll past everything. scrollIntoView handles the inner
  // overflow-y-auto scroll container that a bare #hash wouldn't.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#bank-details") {
      const t = setTimeout(() => {
        const bank = document.getElementById("bank-details");
        const section = bank?.closest("details");
        if (section) section.open = true;
        bank?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => clearTimeout(t);
    }
  }, []);

  // Bank Details
  const [holderName, setHolderName] = useState(user?.bank_details?.holder_name || "");
  const [sortCode, setSortCode] = useState(user?.bank_details?.sort_code || "");
  const [accountNumber, setAccountNumber] = useState(user?.bank_details?.account_number || "");

  // Billing address — stored alongside bank details and required for bank-transfer
  // payouts (tax/business record of who we paid). Country defaults to the UK.
  const [addrLine1, setAddrLine1] = useState(user?.bank_details?.address?.line1 || "");
  const [addrLine2, setAddrLine2] = useState(user?.bank_details?.address?.line2 || "");
  const [addrCity, setAddrCity] = useState(user?.bank_details?.address?.city || "");
  const [addrPostcode, setAddrPostcode] = useState(user?.bank_details?.address?.postcode || "");
  const [addrCountry, setAddrCountry] = useState(user?.bank_details?.address?.country || "United Kingdom");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) return null;

  // "Lock once saved": bank + billing details become read-only as soon as a
  // COMPLETE set exists, so an ambassador can enter them once but cannot later
  // re-point where their money goes. An INCOMPLETE record stays editable, so
  // nobody is ever stuck unable to finish and get paid. Changes after that go
  // through support, which is the point: self-service bank edits are a classic
  // payout-fraud vector.
  const savedBank = user.bank_details;
  const bankLocked = Boolean(
    savedBank?.holder_name &&
      savedBank?.sort_code &&
      savedBank?.account_number &&
      savedBank?.address?.line1 &&
      savedBank?.address?.city &&
      savedBank?.address?.postcode &&
      savedBank?.address?.country
  );
  // Dimmed, non-interactive styling for any field the ambassador cannot change.
  // Uses the dedicated .field-locked class rather than Tailwind colour utilities:
  // the light theme forces white background / dark text onto every input with
  // !important, which silently wiped the previous slate-based dimming and made
  // locked fields look fully editable in light mode. See globals.css.
  const LOCKED_CLS = "student-input w-full field-locked";
  const fieldCls = (locked: boolean) => (locked ? LOCKED_CLS : "student-input w-full");
  // Small padlock shown next to the label of anything the ambassador cannot edit,
  // so "locked" reads as deliberate rather than as a broken/greyed-out field.


  // Save only when every required field (bank + address) is filled. One rule covers
  // both cases: an existing holder effectively waits on just the address (bank fields
  // pre-filled), a brand-new person waits on both.
  const bankFormComplete = [holderName, sortCode, accountNumber, addrLine1, addrCity, addrPostcode, addrCountry]
    .every((v) => (v || "").trim() !== "");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim() && !isValidPhone(phone)) {
      setMessage({ type: "error", text: "Please enter a valid phone number (not an email address)." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const chosen = counsellors.find((c) => String(c.id) === counsellorId);
      const payload: any = {
        full_name: fullName,
        phone: phone,
        counsellor_id: chosen ? chosen.id : null,
        counsellor_name: chosen ? chosen.name : null,
      };
      if (password) {
        payload.password = password;
      }
      await api.put<any>("/auth/settings", payload);
      setMessage({ type: "success", text: "Profile information updated successfully!" });
      setPassword("");
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        bank_details: {
          // Preserve any existing fields (e.g. iban) so a save never drops data.
          ...(user.bank_details || {}),
          holder_name: holderName,
          sort_code: sortCode,
          account_number: accountNumber,
          address: {
            line1: addrLine1,
            line2: addrLine2,
            city: addrCity,
            postcode: addrPostcode,
            country: addrCountry,
          },
        },
      };
      await api.put<any>("/auth/settings", payload);
      setMessage({ type: "success", text: "Bank & address details updated!" });
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update bank account details." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-heading">
        <div><h1>Your profile &amp; preferences.</h1>
        <p>The details that keep your ambassador journey moving.</p></div>

      </header>
      <section className="settings-identity" aria-label="Your profile">
        <span className="settings-avatar">{fullName.split(" ").filter(Boolean).map(part => part[0]).slice(0, 2).join("")}</span>
        <div><h2>{fullName}</h2><p>{[user.university, user.department_year].filter(Boolean).join(" · ") || user.email}</p></div>
        <span className="settings-tier"><AppIcon name="medal"/>{user.tier === "standard" ? "Ambassador" : `${user.tier} ambassador`}</span>
      </section>

      {message && (
        <div className={`p-4 rounded-[8px] text-sm mb-6 ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        <form onSubmit={handleUpdateProfile} className="settings-profile-form">
          <div className="settings-fields">
            <label>Full name <input type="text" disabled value={fullName} /></label>
            <label>Your BHE Uni counsellor
              <AppSelect value={counsellorId} onChange={e => setCounsellorId(e.target.value)}>
                <option value="">None of the above</option>
                {counsellors.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </AppSelect>
            </label>
            <label>Email address <input type="email" disabled value={user.email ?? ""} placeholder="Not provided" /></label>
            <label>Mobile number <input type="tel" value={phone} autoComplete="tel" onChange={e => setPhone(e.target.value)} placeholder="Your mobile number" /></label>
          </div>
          <button type="submit" disabled={loading} className="settings-save">{loading ? "Saving…" : "Save profile"}</button>

        </form>
        <div className="settings-account-row">
          <form onSubmit={handleUpdateProfile} className="settings-preference settings-security">
            <div><h2>Account security</h2><p>Keep your account secure with a strong password.</p></div>
            <label>New password<input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep your current password" /></label>
            <button type="submit" disabled={loading || !password} className="settings-outline">{loading ? "Saving…" : "Update password"}</button>
          </form>
        <section className="settings-preference settings-payout-card"><div><h2>Payout accounts</h2><p>Save where your rewards should go.</p></div>
          <div className="settings-payout-preview">{user.bank_details?.payout_accounts?.length ? user.bank_details.payout_accounts.slice(0,2).map(account => <div className="settings-payout-destination" key={account.id}><span><AppIcon name={account.payment_method === "bank_transfer" ? "building-columns" : "mobile-screen-button"}/></span><div><strong>{account.payment_method === "bkash" ? "bKash" : account.payment_method === "bank_transfer" ? account.details.bank_name || "Bank transfer" : account.details.provider_name || "Other account"}</strong><small>{account.details.holder_name} · •••• {account.details.account_number?.slice(-4)}</small></div><AppIcon name="circle-check"/></div>) : <p>No payout accounts yet. Add bKash, a bank account, or another payment service.</p>}</div>
          <div className="settings-payout-actions"><Link className="settings-outline" href="/dashboard/wallet/request">Manage accounts<AppIcon name="arrow-right"/></Link><Link href="/dashboard/wallet/account"><AppIcon name="plus"/> Add account</Link></div>
        </section>
        </div>
        <details className="settings-bank">
          <summary>Bank &amp; billing details <span>Manage details <AppIcon className="fa-solid fa-chevron-down" aria-hidden="true" /></span></summary>
        {/* Payout Details */}
        <form id="bank-details" onSubmit={handleUpdateBank} className="student-card space-y-4 scroll-mt-4">
          <h3 className="font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
            Bank Details
            {bankLocked && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AppIcon className="fa-solid fa-lock text-[9px]"></AppIcon> Locked
              </span>
            )}
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alexander Morgan"
              disabled={bankLocked}
              className={fieldCls(bankLocked)}
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Sort Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="20-45-14"
                disabled={bankLocked}
                className={fieldCls(bankLocked)}
                value={sortCode}
                onChange={(e) => setSortCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="12345678"
                disabled={bankLocked}
                className={fieldCls(bankLocked)}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Billing address — stored with the bank details and required to receive a
              bank-transfer payout (tax / business record of who was paid). */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-sm font-semibold text-slate-300 mb-1">Billing Address</p>
            <p className="text-xs text-slate-500 mb-3">Required to receive payouts by bank transfer.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12 King Street"
                  disabled={bankLocked}
                  className={fieldCls(bankLocked)}
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Flat, building, etc."
                  disabled={bankLocked}
                  className={fieldCls(bankLocked)}
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    City / Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Manchester"
                    disabled={bankLocked}
                    className={fieldCls(bankLocked)}
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Postcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M1 2AB"
                    disabled={bankLocked}
                    className={fieldCls(bankLocked)}
                    value={addrPostcode}
                    onChange={(e) => setAddrPostcode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="United Kingdom"
                  disabled={bankLocked}
                  className={fieldCls(bankLocked)}
                  value={addrCountry}
                  onChange={(e) => setAddrCountry(e.target.value)}
                />
              </div>
            </div>
          </div>

          {bankLocked ? (
            <p className="text-xs text-slate-500 mt-4 flex items-start gap-2">
              <AppIcon className="fa-solid fa-lock mt-0.5"></AppIcon>
              <span>
                Your payout details are locked. To change them, contact the Ambassador &amp;
                Rewards team so the request can be verified.
              </span>
            </p>
          ) : (
            <button
              type="submit"
              disabled={loading || !bankFormComplete}
              className="student-btn bg-[#F37124] hover:bg-[#e5631a] text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Bank Info"}
            </button>
          )}
          {!bankLocked && !bankFormComplete && (
            <p className="text-xs text-slate-500 mt-2">
              Complete all required fields (marked <span className="text-red-500">*</span>) to save.
            </p>
          )}
        </form>
        </details>
        <div className="settings-milestones"><AmbassadorMilestones /></div>
        <section className="settings-preference"><div><h2>Programme &amp; privacy</h2><p>Review the terms and how we look after your information.</p></div><div className="settings-links"><Link href="/privacy-policy">Privacy policy</Link><Link href="/rewards-terms-and-conditions">Programme terms</Link></div></section>
        <section className="settings-preference"><div><h2>Sign out</h2><p>See you on your next step.</p></div><button type="button" onClick={logout} className="settings-signout"><AppIcon className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" /> Sign out</button></section>
      </div>
    </div>
  );
}
