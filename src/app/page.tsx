import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { LandingPage } from "@/components/marketing/landing";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <LandingPage />;
}
