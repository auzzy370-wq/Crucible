import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";

/** Signed-in users go home; everyone else lands on the free Learn page. */
export default async function Home() {
  try {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  } catch {
    /* db/session unavailable — still send guests to Learn */
  }
  redirect("/learn?welcome=1");
}
