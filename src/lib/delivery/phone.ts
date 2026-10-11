/** US-centric E.164 normaliser (same rules as finalizeOrder's). */
export function toE164(phone?: string | null): string {
  const raw = (phone || "").trim();
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}
