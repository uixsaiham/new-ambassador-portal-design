"use client";

import AppIcon from "@/components/AppIcon";
import { useState, useEffect, useRef } from "react";

// Checkbox multi-select styled like the admin-input filters. `selected` is the
// list of chosen option keys (empty = "all"). Closes on outside-click.
export default function MultiSelect({
  options,
  selected,
  onChange,
  allLabel,
  noun,
  className = "",
}: {
  options: [string, string][];
  selected: string[];
  onChange: (next: string[]) => void;
  allLabel: string;
  noun: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const label =
    selected.length === 0
      ? allLabel
      : selected.length === 1
      ? options.find(([k]) => k === selected[0])?.[1] ?? `1 ${noun}`
      : `${selected.length} ${noun}s`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="admin-input w-full flex items-center justify-between gap-2 text-left whitespace-nowrap"
      >
        <span className={`truncate min-w-0 ${selected.length === 0 ? "filter-btn-label--all" : "filter-btn-label"}`}>{label}</span>
        <AppIcon className={`fa-solid fa-chevron-down text-[10px] flex-shrink-0 filter-btn-label--all transition-transform ${open ? "rotate-180" : ""}`}></AppIcon>
      </button>
      {open && (
        <div className="filter-menu absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-[8px] shadow-xl p-1">
          <button
            type="button"
            onClick={() => onChange([])}
            className="filter-menu-clear w-full text-left px-3 py-2 text-xs font-semibold rounded-[8px]"
          >
            {allLabel} (clear)
          </button>
          {options.map(([key, name]) => {
            const checked = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className="filter-menu-item w-full flex items-center gap-2 px-3 py-2 text-sm rounded-[8px]"
              >
                <span
                  className={`filter-check ${checked ? "filter-check--checked" : ""} flex h-4 w-4 items-center justify-center rounded flex-shrink-0`}
                >
                  {checked && <AppIcon className="fa-solid fa-check text-[9px] text-white"></AppIcon>}
                </span>
                <span className="truncate">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
