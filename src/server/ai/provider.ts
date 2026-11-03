import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export async function getActiveProvider() {
  const configured = await prisma.aiProviderConfig.findFirst({
    where: { enabled: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return (
    configured ?? {
      name: "default-openai-compatible",
      baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      apiKeyEnv: "OPENAI_API_KEY",
    }
  );
}

export async function completeJson<T>(params: {
  system: string;
  user: string;
  fallback: T;
}): Promise<{ data: T; provider: string; model: string; mocked: boolean }> {
  const provider = await getActiveProvider();
  const apiKey = process.env[provider.apiKeyEnv] || process.env.OPENAI_API_KEY;
  const allowMock = process.env.AI_FALLBACK_MOCK !== "false";

  if (!apiKey) {
    if (!allowMock) throw new Error("No AI API key configured");
    logger.warn("AI provider missing API key; using deterministic mock", { provider: provider.name });
    return {
      data: params.fallback,
      provider: provider.name,
      model: provider.model,
      mocked: true,
    };
  }

  try {
    const client = new OpenAI({ apiKey, baseURL: provider.baseUrl });
    const completion = await client.chat.completions.create({
      model: provider.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "{}";
    return {
      data: JSON.parse(text) as T,
      provider: provider.name,
      model: provider.model,
      mocked: false,
    };
  } catch (err) {
    logger.error("AI completion failed; falling back", {
      err: err instanceof Error ? err.message : String(err),
    });
    if (!allowMock) throw err;
    return {
      data: params.fallback,
      provider: provider.name,
      model: provider.model,
      mocked: true,
    };
  }
}
