"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionToken, ADMIN_COOKIE, sessionCookieOptions } from "../../../lib/admin-session";
import { getConfiguredAdminPasswordHash, verifyAdminPassword } from "../../../lib/admin-password";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!await verifyAdminPassword(password, getConfiguredAdminPasswordHash())) redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  (await cookies()).set(ADMIN_COOKIE, await createSessionToken(), sessionCookieOptions);
  redirect(next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function logoutAdmin() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
