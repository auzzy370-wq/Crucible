import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";
import { ensureDefaultAiModels } from "@/server/competition/ai-benchmark";

export async function GET() {
  return withHandler(async () => {
    await requireUser();
    const models = await ensureDefaultAiModels();
    return jsonOk({
      models: models.map((m) => ({
        id: m.id,
        slug: m.slug,
        displayName: m.displayName,
        provider: m.provider,
        modelId: m.modelId,
        isOpenSource: m.isOpenSource,
        notes: m.notes,
      })),
      policy: {
        hiddenTests: "never_sent_to_models",
        singleFailImpliesIncapable: false,
        mockedRunsAreExperimental: true,
      },
    });
  });
}
