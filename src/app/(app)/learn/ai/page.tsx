import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import { AiCraftClient } from "@/components/learn/ai-craft-client";

export default async function AiCraftPage() {
  await requirePageRoles(CANDIDATE_ROLES);
  return <AiCraftClient />;
}
