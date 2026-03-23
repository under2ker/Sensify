/**
 * Проверка IP для webhook ЮKassa.
 * Официальные IP: https://yookassa.ru/developers/using-api/webhooks
 * YOOKASSA_WEBHOOK_IP_CHECK=0 — отключить проверку (для локальной разработки).
 */

const YOOKASSA_IP_WHITELIST = [
  "77.75.156.35",
  "77.75.156.11",
  "77.75.154.128/25",
  "77.75.153.0/25",
  "185.71.77.0/27",
  "185.71.76.0/27",
] as const;

function ipv4ToNumber(ip: string): number {
  const parts = ip.split(".");
  return parts.reduce((acc, p, i) => acc + parseInt(p, 10) * 256 ** (3 - i), 0);
}

function parseCidr(cidr: string): { network: number; mask: number } | null {
  const [ip, bits] = cidr.split("/");
  if (!ip || !bits) return null;
  const maskBits = parseInt(bits, 10);
  if (isNaN(maskBits) || maskBits < 0 || maskBits > 32) return null;
  const network = ipv4ToNumber(ip);
  const mask = maskBits === 0 ? 0 : 0xffff_ffff << (32 - maskBits);
  return { network: network & mask, mask };
}

function ipInCidr(ip: string, cidr: string): boolean {
  const parsed = parseCidr(cidr);
  if (!parsed) return false;
  const ipNum = ipv4ToNumber(ip);
  return (ipNum & parsed.mask) === parsed.network;
}

export function isYooKassaWebhookIp(clientIp: string): boolean {
  const ip = clientIp.trim();
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;
  for (const entry of YOOKASSA_IP_WHITELIST) {
    if (entry.includes("/")) {
      if (ipInCidr(ip, entry)) return true;
    } else if (ip === entry) return true;
  }
  return false;
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return request.headers.get("x-vercel-forwarded-for");
}

export function shouldCheckYooKassaIp(): boolean {
  return process.env.YOOKASSA_WEBHOOK_IP_CHECK !== "0";
}
