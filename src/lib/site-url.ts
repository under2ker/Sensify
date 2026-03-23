/** Канонический origin сайта: OG, sitemap, robots. */
export function getCanonicalSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sensify.app";
  return raw.replace(/\/$/, "");
}
