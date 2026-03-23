/** Допустимые значения срока жизни ссылки из клиента / API */
const ALLOWED_DAYS = new Set([7, 30, 365]);

export function parseShareExpiresInDays(raw: unknown): null | 7 | 30 | 365 {
  if (raw === null || raw === undefined || raw === false) return null;
  if (raw === "never" || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || !ALLOWED_DAYS.has(n as 7 | 30 | 365)) return null;
  return n as 7 | 30 | 365;
}

export function expiresAtFromDays(days: null | 7 | 30 | 365): Date | null {
  if (days == null) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
