/** Клиентский запрос статуса премиума (источник правды — сервер). */
export async function fetchHasPremium(): Promise<boolean> {
  try {
    const r = await fetch("/api/user/premium", { cache: "no-store" });
    const d = (await r.json()) as { hasPremium?: boolean };
    return d.hasPremium === true;
  } catch {
    return false;
  }
}
