"use client";

import AppIcon from "@/components/AppIcon";
import React, { useCallback, useEffect, useState } from "react";
import IPhoneGiftPromo, { PROMO_END_MS, LS_BANNER_HIDDEN } from "@/components/IPhoneGiftPromo";

// The dashboard's two hero banners (the iPhone promo, and Refer & Earn) share a
// single rotating slot instead of stacking, reclaiming roughly 150px above the fold.
//
// Slide order is PROMO FIRST, then Refer & Earn (team's call: the promo is the
// time-limited one, so it gets the first impression).
//
// LAYOUT: both slides are rendered into the SAME grid cell, so the slot is always
// as tall as the tallest banner and the two never jump size as they rotate. The
// inactive slide is hidden with `invisible`, not unmounted, which also keeps the
// promo's position:fixed poster alive while it is open. There is deliberately no
// transformed track: a transformed ancestor would become the containing block for
// that fixed poster and clip it.
//
// Rotation pauses on hover, on keyboard focus, and while the poster is open. It is
// disabled entirely under prefers-reduced-motion. With a single slide (promo
// expired or dismissed) it degrades to a plain static banner: no dots, no
// rotation, no empty slot.

const ROTATE_MS = 7000;

function promoIsLive(): boolean {
  if (Date.now() > PROMO_END_MS) return false;
  try {
    return window.localStorage.getItem(LS_BANNER_HIDDEN) !== "1";
  } catch {
    return true; // blocked/private storage: show it rather than hide it
  }
}

// Padding matched to the promo banner so the two slides are visually the same box.
function ReferEarnBanner({ onShare }: { onShare: () => void }) {
  return (
    <div className="earn-banner relative h-full overflow-hidden rounded-[8px] px-4 py-4 sm:px-6 flex items-center shadow-[0_12px_40px_-12px_rgba(243,113,36,0.6)]">
      <div className="earn-banner-shine" />
      <div className="pointer-events-none absolute -right-3 -top-4 text-5xl sm:text-6xl opacity-20 rotate-12 select-none">💰</div>
      <div className="relative w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-white max-w-xl">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] bg-white/25 rounded-full px-3 py-1 mb-2 backdrop-blur-sm">
            <AppIcon className="fa-solid fa-bolt"></AppIcon> Refer &amp; Earn
          </p>
          <h2 className="text-lg sm:text-xl md:text-[22px] font-bold leading-tight drop-shadow-sm">
            Earn ৳500 for every friend who enrols 💸
          </h2>
          <p className="text-white/85 text-[11px] sm:text-xs mt-1.5 font-normal">
            Plus ৳10 the moment they qualify. No limit, refer as many friends as you like. 🚀
          </p>
        </div>
        <button
          onClick={onShare}
          className="group w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-white text-[#F37124] font-black text-sm px-5 py-3 rounded-[8px] shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          Share my link
          <AppIcon className="fa-solid fa-arrow-right-long group-hover:translate-x-1 transition-transform"></AppIcon>
        </button>
      </div>
    </div>
  );
}

export default function DashboardBannerCarousel({ onShare }: { onShare: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [promoLive, setPromoLive] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPromoLive(promoIsLive());
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduceMotion(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    } catch {
      /* no matchMedia: keep motion */
    }
  }, []);

  const handleDismissPromo = useCallback(() => {
    setPromoLive(false);
    setIndex(0);
  }, []);

  const showPromo = mounted && promoLive;
  const slideCount = showPromo ? 2 : 1;

  // Keep the index valid if the promo slide disappears while it is showing.
  useEffect(() => {
    if (index >= slideCount) setIndex(0);
  }, [index, slideCount]);

  useEffect(() => {
    if (slideCount < 2 || paused || reduceMotion) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slideCount), ROTATE_MS);
    return () => clearInterval(t);
  }, [slideCount, paused, reduceMotion]);

  // Promo first, Refer & Earn second.
  const slides: { key: string; node: React.ReactNode }[] = [
    ...(showPromo
      ? [
          {
            key: "promo",
            node: <IPhoneGiftPromo onDismiss={handleDismissPromo} onModalOpenChange={setPaused} />,
          },
        ]
      : []),
    { key: "earn", node: <ReferEarnBanner onShare={onShare} /> },
  ];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription={slideCount > 1 ? "carousel" : undefined}
      aria-label={slideCount > 1 ? "Ambassador offers" : undefined}
    >
      {/* Every slide shares one grid cell, so the slot is as tall as the tallest
          banner and nothing resizes mid-rotation. */}
      <div className="grid items-stretch">
        {slides.map((s, i) => (
          <div
            key={s.key}
            className={`col-start-1 row-start-1 transition-opacity duration-300 ${
              i === index ? "opacity-100" : "opacity-0 invisible pointer-events-none"
            }`}
            aria-hidden={i !== index}
          >
            {s.node}
          </div>
        ))}
      </div>

      {slideCount > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show offer ${i + 1} of ${slideCount}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-orange-500" : "w-1.5 bg-slate-400/60 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
