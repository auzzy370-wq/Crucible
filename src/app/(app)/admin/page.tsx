import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { AdminClient } from "@/components/admin/admin-client";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return <AdminClient />;
}
