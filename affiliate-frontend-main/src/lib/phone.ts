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
