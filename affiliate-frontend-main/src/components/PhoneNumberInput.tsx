"use client";

import { useRef, type ComponentProps, type Ref } from "react";
import { phoneInputParts, formatPhoneDigits } from "@/lib/phone";
import styles from "./phone-number-input.module.css";

type Props = Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "ref"> & {
  value: string;
  onChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
};

export default function PhoneNumberInput({ value, onChange, inputRef, disabled, className = "", ...props }: Props) {
  const input = useRef<HTMLInputElement | null>(null);
  const { prefix, digits } = phoneInputParts(value);
  const formatted = formatPhoneDigits(digits, prefix);

  return <div className={`${styles.field} ${className}`} data-disabled={disabled || undefined}>
    <span className={styles.prefix} aria-hidden="true">{prefix}</span>
    <input {...props} ref={node => {
      input.current = node;
      if (typeof inputRef === "function") inputRef(node);
      else if (inputRef) inputRef.current = node;
    }} data-phone-number type="tel" inputMode="tel" autoComplete="tel-national" aria-label={props["aria-label"] || `Mobile number, country code ${prefix}`} disabled={disabled} value={formatted} placeholder={prefix === "+880" ? "1712 345 678" : "Phone number"} pattern={prefix === "+880" ? "1[3-9][0-9]{2} [0-9]{3} [0-9]{3}" : undefined} title={prefix === "+880" ? "Enter your 10-digit mobile number without +880 or the leading zero." : undefined} onChange={event => {
      const raw = event.target.value;
      const before = raw.slice(0, event.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
      const fullNumber = raw.trim().startsWith("+") || raw.trim().startsWith("00") || /^8801/.test(raw.replace(/\D/g, ""));
      const parts = fullNumber ? phoneInputParts(raw) : { prefix, digits: (prefix === "+880" ? raw.replace(/\D/g, "").replace(/^0/, "") : raw.replace(/\D/g, "")).slice(0, prefix === "+880" ? 10 : 15 - (prefix.length - 1)) };
      const removed = raw.replace(/\D/g, "").length - parts.digits.length;
      const digitPosition = Math.max(0, before - Math.max(0, removed));
      onChange(parts.digits ? parts.prefix + parts.digits : "");
      const next = formatPhoneDigits(parts.digits, parts.prefix);
      let caret = 0;
      let count = 0;
      while (caret < next.length && count < digitPosition) { if (/\d/.test(next[caret])) count++; caret++; }
      requestAnimationFrame(() => { if (document.activeElement === input.current) input.current?.setSelectionRange(caret, caret); });
    }} />
  </div>;
}
