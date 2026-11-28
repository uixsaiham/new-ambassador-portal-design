"use client";
import { useEffect, useState } from "react";
import Nav from "./Nav";
import styles from "@/app/home.module.css";

export default function StickyNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <header className={`${styles.hero} ${styles.stickyHeader}`} data-scrolled={scrolled}><Nav /></header>;
}
