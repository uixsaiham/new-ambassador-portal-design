"use client";

import { useRef, useState, type RefObject } from "react";

/** A single accessible OTP input with six visual cells, paste and SMS autofill. */
export default function VerificationCodeInput({ value, onChange, disabled, inputRef, id }: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  id: string;
}) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [position, setPosition] = useState(0);
  const update = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setPosition(Math.min(digits.length, 5));
    onChange(digits);
  };

  return <div className={`google-otp-control${disabled ? " is-disabled" : ""}`}>
    <input ref={node => { localRef.current = node; inputRef.current = node; }} id={id} className="google-otp-native" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required aria-label="Six-digit verification code" value={value} disabled={disabled}
      onChange={event => update(event.target.value)} onFocus={() => { setFocused(true); setPosition(Math.min(value.length, 5)); }} onBlur={() => setFocused(false)}
      onSelect={event => setPosition(Math.min(event.currentTarget.selectionStart ?? value.length, 5))}
      onClick={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const index = Math.min(5, Math.max(0, Math.floor((event.clientX - bounds.left) / (bounds.width / 6))));
        const caret = Math.min(index, value.length);
        event.currentTarget.setSelectionRange(caret, Math.min(caret + 1, value.length));
        setPosition(caret);
      }}
      onPaste={event => { event.preventDefault(); update(event.clipboardData.getData("text")); }} />
    <div className="google-otp-cells" aria-hidden="true">{Array.from({length:6}, (_, index) => <span key={index} className={`${value[index] ? "is-filled" : ""}${focused && position === index ? " is-active" : ""}`}>{value[index] || ""}</span>)}</div>
  </div>;
}
