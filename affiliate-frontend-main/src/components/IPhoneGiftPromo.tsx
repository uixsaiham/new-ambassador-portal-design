"use client";

import AppIcon from "@/components/AppIcon";
import React, { useEffect, useState } from "react";
import Link from "next/link";

// Ambassador promo for the iPhone 18 Pro Max Gift. A dismissible dashboard banner
// (brand blue) that opens a modal showing the marketing artwork. The modal opens
// ONLY when the ambassador clicks the banner, and the whole promo hides itself
// automatically after the Closing Date. Informational only - NOT a blocking gate.
// The modal image is /promo/iphone-gift.png (marketing artwork).
//
// NOTE: the poster used to auto-open once per device, 650ms after the dashboard
// painted. That was removed. It is z-[90] against the old phone modal's z-50, so
// it landed on top of a form the new ambassador could not then reach.
//
// THEME-PROOFING: the dashboard's `.light` theme force-recolours slate backgrounds,
// bare <p>/<h#> tags and text-white/text-slate-* utilities with !important (which
// beats inline styles). So the banner paints every colour with inline styles and
// uses only <div>/<span> for text (never <p>/<h#>), keeping the brand-blue banner
// legible in BOTH themes. Layout/hover/animation come from globals.css .promo-*.

// 31 January 2027, 23:59 UK (winter = GMT), i.e. the promotion Closing Date.
// Exported so the dashboard banner carousel can decide whether this slide exists
// at all WITHOUT mounting the component (an inactive slide is not rendered).
export const PROMO_END_MS = Date.parse("2027-02-01T00:00:00Z");
export const LS_BANNER_HIDDEN = "bhe_iphone_promo_banner_hidden";
const TERMS_HREF = "/promotions/iphone-gift-terms";
const PROMO_IMG = "/promo/iphone-gift.png";

// Brand palette from the artwork (theme-proof; see note above).
const ORANGE = "#f97316";

function lsGet(key: string): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function lsSet(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* private mode / blocked storage - non-fatal */
  }
}

// Optional hooks used when this banner is a slide in the dashboard carousel:
// `onDismiss` lets the carousel drop the slide, and `onModalOpenChange` lets it
// pause auto-rotation while the poster is open (otherwise rotating away would
// unmount the modal mid-view).
export default function IPhoneGiftPromo({
  onDismiss,
  onModalOpenChange,
}: {
  onDismiss?: () => void;
  onModalOpenChange?: (open: boolean) => void;
} = {}) {
  const [mounted, setMounted] = useState(false);
  const [expired, setExpired] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (Date.now() > PROMO_END_MS) {
      setExpired(true); // promo over - render nothing
      return;
    }
    // The poster is click-only now; nothing opens on its own.
    setBannerHidden(lsGet(LS_BANNER_HIDDEN));
  }, []);

  // Close the modal on Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModalOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  // Let a parent carousel pause rotation while the poster is open.
  useEffect(() => {
    onModalOpenChange?.(modalOpen);
  }, [modalOpen, onModalOpenChange]);

  // Avoid SSR/first-paint flash: decide visibility only after mount (localStorage).
  if (!mounted || expired) return null;

  const dismissBanner = () => {
    setBannerHidden(true);
    lsSet(LS_BANNER_HIDDEN);
    onDismiss?.(); // let a parent carousel drop this slide
  };

  return (
    <>
      {!bannerHidden && (
        <div
          onClick={() => setModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setModalOpen(true)}
          className="promo-banner group relative h-full overflow-hidden rounded-[8px] cursor-pointer px-4 py-4 sm:px-6 flex items-center"
          style={{
            background: "linear-gradient(90deg,#152a72 0%,#1e3a94 52%,#254aa8 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 14px 44px -18px rgba(20,40,110,0.85)",
          }}
        >
          {/* warm glow + oversized gift, purely decorative */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-64"
            style={{ background: "linear-gradient(270deg,rgba(249,115,22,0.28),rgba(249,115,22,0.05) 55%,transparent)" }}
          />
          <div
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-5xl sm:text-6xl rotate-12 select-none transition-transform duration-300 group-hover:scale-110"
            style={{ opacity: 0.35 }}
          >
            🎁
          </div>
          <div className="relative w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-xl"
                style={{ background: "rgba(249,115,22,0.18)", color: "#fdba74", boxShadow: "inset 0 0 0 1px rgba(251,146,60,0.45)" }}
              >
                <AppIcon className="fa-solid fa-gift"></AppIcon>
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: "#fdba74" }}>
                  <AppIcon className="fa-solid fa-star text-[9px] mr-1.5"></AppIcon>Ambassador reward
                </div>
                <div className="font-extrabold text-[15px] sm:text-lg leading-tight truncate" style={{ color: "#ffffff" }}>
                  Win an iPhone 18 Pro Max
                </div>
                <div className="text-[11px] sm:text-xs mt-0.5 truncate" style={{ color: "#c7d2f0" }}>
                  Refer 10 successful enrolments (1 Oct 2026 - 31 Jan 2027)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="promo-cta hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-[8px]"
                style={{ background: ORANGE, color: "#ffffff", boxShadow: "0 8px 22px -6px rgba(124,45,18,0.6)" }}
              >
                View offer <AppIcon className="fa-solid fa-arrow-right text-[10px]"></AppIcon>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); dismissBanner(); }}
                aria-label="Dismiss"
                className="promo-dismiss p-1.5 rounded-[8px]"
                style={{ color: "#9fb0d8" }}
              >
                <AppIcon className="fa-solid fa-xmark"></AppIcon>
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="promo-fade fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(2,6,23,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
          role="dialog"
          aria-modal="true"
          aria-label="iPhone 18 Pro Max offer"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="promo-pop relative"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* The artwork is self-contained (headline, phone, dates, CTA, T&C line);
                tapping it opens the full terms. */}
            <Link
              href={TERMS_HREF}
              aria-label="View iPhone 18 Pro Max offer details and terms"
              className="block"
            >
              <img
                src={PROMO_IMG}
                alt="Win an iPhone 18 Pro Max for 10 successful enrolments, 1 October 2026 to 31 January 2027. On top of your usual ambassador rewards. Tap to view offer details."
                className="block rounded-[8px] shadow-2xl"
                style={{ maxHeight: "92vh", maxWidth: "92vw", width: "auto", height: "auto" }}
              />
            </Link>
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              className="promo-icon-btn absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.5)", color: "#ffffff" }}
            >
              <AppIcon className="fa-solid fa-xmark"></AppIcon>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
