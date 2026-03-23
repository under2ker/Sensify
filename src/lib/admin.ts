function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL;
  if (!raw || typeof raw !== "string") return [];
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.trim().toLowerCase());
}
