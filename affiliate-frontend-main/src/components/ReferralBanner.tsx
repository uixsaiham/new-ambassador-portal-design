"use client";

import AppIcon from "@/components/AppIcon";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Ported from the bheuni.uk marketing site (bhe-uni-next components/home/Referral.js)
// so the ambassador programme reads the same on both sites. Styles live under
// `.ref2-*` in globals.css. Reveal animations use this page's `.reveal*` classes,
// which the landing page's IntersectionObserver switches on with `.in`.

const TIER_ONE = [
  "Share their full name, email & phone",
  "We assess whether they're eligible",
  "You hear the outcome either way",
];
const TIER_TWO = [
  "We guide eligible leads through applying",
  "They secure a place and enrol",
  "No cap - refer as many as you like",
];

function MiniList({ items }: { items: string[] }) {
  return (
    <ul className="ref2-list">
      {items.map((t, i) => (
        <li key={t} style={{ animationDelay: `${i * 90}ms` }}>
          <AppIcon className="fa-solid fa-check" aria-hidden="true"></AppIcon>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const progress = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.round(eased * to));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{value}</span>;
}

export default function ReferralBanner({ id = "programme" }: { id?: string }) {
  return (
    <section id={id} className="ref2-section reveal">
      <div className="ref2-container">
        <div className="ref2-layout">
          {/* ---- Left: intro + CTA ---- */}
          <div className="ref2-intro reveal-l">
            <span className="ref2-eyebrow">
              <AppIcon className="fa-solid fa-gift" aria-hidden="true"></AppIcon> Ambassador programme
            </span>
            <h2 className="ref2-title">Refer someone in - and get rewarded twice.</h2>
            <p className="ref2-text">
              Anyone can join. Send us a lead and earn <b>৳10</b>{" "}
              the moment they&apos;re confirmed eligible - then <b>up to ৳500</b> more if that same person enrols at university with our support.
            </p>
            <div className="ref2-cta">
              <Link href="/signup" className="ref2-btn">
                <span>Join us - it&apos;s free</span>
                <AppIcon className="fa-solid fa-arrow-right" aria-hidden="true"></AppIcon>
              </Link>
              <span className="ref2-note">
                Create your account in seconds &middot; paid per eligible lead &amp; per enrolment &middot; no cap on
                earnings.
              </span>
            </div>
          </div>

          {/* ---- Right: vertical timeline ---- */}
          <div className="ref2-timeline">
            <span className="ref2-timeline-line" aria-hidden="true" />

            <article className="ref2-step reveal-r" style={{ transitionDelay: "80ms" }}>
              <span className="ref2-marker">
                <AppIcon className="fa-solid fa-user-plus" aria-hidden="true"></AppIcon>
              </span>
              <div className="ref2-step-card">
                <div className="ref2-step-top">
                  <span className="ref2-tag">Stage 1</span>
                  <div className="ref2-step-reward">
                    <span className="ref2-reward-num">
                      ৳<CountUp to={10} />
                    </span>
                    <span className="ref2-reward-label">per eligible lead</span>
                  </div>
                </div>
                <h3 className="ref2-step-title">Send us a lead</h3>
                <MiniList items={TIER_ONE} />
              </div>
            </article>

            <article className="ref2-step ref2-step-feature reveal-s" style={{ transitionDelay: "180ms" }}>
              <span className="ref2-marker ref2-marker-feature">
                <AppIcon className="fa-solid fa-graduation-cap" aria-hidden="true"></AppIcon>
              </span>
              <div className="ref2-step-card">
                <div className="ref2-step-top">
                  <span className="ref2-tag ref2-tag-feature">Stage 2</span>
                  <div className="ref2-step-reward">
                    <span className="ref2-reward-num ref2-reward-num-feature">
                      <span className="ref2-reward-prefix">up to</span> ৳<CountUp to={500} />
                    </span>
                    <span className="ref2-reward-label">per student who enrols</span>
                  </div>
                </div>
                <h3 className="ref2-step-title">They enrol at university</h3>
                <MiniList items={TIER_TWO} />
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
