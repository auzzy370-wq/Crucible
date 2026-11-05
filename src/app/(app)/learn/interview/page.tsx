import { CANDIDATE_ROLES } from "@/lib/access";
import { requirePageRoles } from "@/server/auth/page-guard";
import { InterviewCraftClient } from "@/components/learn/interview-craft-client";

export default async function InterviewCraftPage() {
  await requirePageRoles(CANDIDATE_ROLES);
  return <InterviewCraftClient />;
}
