import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { canAccessPath, homeForRole } from "@/lib/access";

export async function requirePageRoles(roles?: readonly string[], opts?: { redirectTo?: string }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(opts?.redirectTo ?? homeForRole(user.role));
  }
  return user;
}

export async function requirePathAccess(pathname: string) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canAccessPath(user.role, pathname)) {
    redirect(homeForRole(user.role));
  }
  return user;
}
