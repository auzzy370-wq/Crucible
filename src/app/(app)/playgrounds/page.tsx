import { prisma } from "@/lib/db";
import { getSessionUser, isPremium } from "@/server/auth/session";
import { PlaygroundsClient } from "@/components/saas/playgrounds-client";

export default async function PlaygroundsPage() {
  const user = await getSessionUser();
  const playgrounds = await prisma.playground.findMany({
    where: { userId: user!.id },
    orderBy: [{ folder: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <PlaygroundsClient
      premium={isPremium(user)}
      playgrounds={playgrounds.map((p) => ({
        id: p.id,
        name: p.name,
        folder: p.folder,
        language: p.language,
        content: p.content,
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  );
}
