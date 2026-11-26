// Shared phone validation for ambassador profile fields.
//
// Accepts normal phone characters (digits, +, spaces, (), -) and requires enough
// digits to be a real number. Crucially it REJECTS anything containing letters or
// an "@", so an email address can never be saved as a phone. This closes a real
// gap: a Google sign-up once typed their email into the phone box, which was
// accepted (the field only checked it was non-empty) and left bad data behind.

export function isValidPhone(v: string | null | undefined): boolean {
  const t = (v ?? "").trim();
  if (!t) return false;
  if (/[a-zA-Z@]/.test(t)) return false; // no letters / email addresses
  const digits = t.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}


export function phoneInputParts(value: string) {
  const raw = value.trim();
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00880")) digits = digits.slice(5);
  else if (digits.startsWith("880")) digits = digits.slice(3);
  else if (raw.startsWith("+") || raw.startsWith("00")) {
    if (raw.startsWith("00")) digits = digits.slice(2);
    // Keep international numbers usable without imposing Bangladesh's format.
    const prefix = digits.startsWith("44") ? "+44" : digits.startsWith("1") ? "+1" : "+";
    return { prefix, digits: digits.slice(prefix.length - 1).slice(0, 15 - (prefix.length - 1)) };
  }
  return { prefix: "+880", digits: digits.replace(/^0/, "").slice(0, 10) };
}

export function formatPhoneDigits(digits: string, prefix: string) {
  const groups = prefix === "+880" ? [4, 3, 3] : [3, 3, 4, 5];
  let offset = 0;
  return groups.map(size => { const group = digits.slice(offset, offset + size); offset += size; return group; }).filter(Boolean).join(" ");
}
