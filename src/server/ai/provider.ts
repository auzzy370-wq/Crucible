import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmProviderConfig = {
  name: string;
  baseUrl: string;
  model: string;
  apiKeyEnv: string;
};

/** Free / cheap OpenAI-compatible endpoints preferred for competition benches. */
export const FREE_PROVIDER_PRESETS: LlmProviderConfig[] = [
  {
    name: "groq-free",
    baseUrl: "https://api.groq.com/openai/v1",
    model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
    apiKeyEnv: "GROQ_API_KEY",
  },
  {
    name: "openrouter-free",
    baseUrl: "https://openrouter.ai/api/v1",
    model: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.2-3b-instruct:free",
    apiKeyEnv: "OPENROUTER_API_KEY",
  },
];

export function envHasKey(apiKeyEnv: string): boolean {
  const v = process.env[apiKeyEnv];
  return Boolean(v && v.trim());
}

/** Prefer Groq → OpenRouter → configured DB provider → OPENAI_* env. */
export async function getActiveProvider(): Promise<LlmProviderConfig> {
  for (const preset of FREE_PROVIDER_PRESETS) {
    if (envHasKey(preset.apiKeyEnv)) return preset;
  }

  const configured = await prisma.aiProviderConfig.findFirst({
    where: { enabled: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (configured) {
    return {
      name: configured.name,
      baseUrl: configured.baseUrl,
      model: configured.model,
      apiKeyEnv: configured.apiKeyEnv,
    };
  }

  return {
    name: "default-openai-compatible",
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
  };
}

export async function completeJson<T>(params: {
  system: string;
  user: string;
  fallback: T;
  /** When set (e.g. competition AiModel), overrides the active provider. */
  providerOverride?: Partial<LlmProviderConfig> & { name?: string };
}): Promise<{ data: T; provider: string; model: string; mocked: boolean }> {
  const active = await getActiveProvider();
  const provider: LlmProviderConfig = {
    name: params.providerOverride?.name ?? active.name,
    baseUrl: params.providerOverride?.baseUrl ?? active.baseUrl,
    model: params.providerOverride?.model ?? active.model,
    apiKeyEnv: params.providerOverride?.apiKeyEnv ?? active.apiKeyEnv,
  };

  const apiKey =
    (provider.apiKeyEnv && process.env[provider.apiKeyEnv]?.trim()) ||
    process.env.GROQ_API_KEY?.trim() ||
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";
  const allowMock = process.env.AI_FALLBACK_MOCK !== "false";

  if (!apiKey) {
    if (!allowMock) throw new Error("No AI API key configured (set GROQ_API_KEY or OPENROUTER_API_KEY)");
    logger.warn("AI provider missing API key; using deterministic mock", { provider: provider.name });
    return {
      data: params.fallback,
      provider: provider.name,
      model: provider.model,
      mocked: true,
    };
  }

  // If override asked for a key we don't have, fall through to any available free key + its preset
  let baseUrl = provider.baseUrl;
  let modelId = provider.model;
  let providerName = provider.name;
  if (provider.apiKeyEnv && !process.env[provider.apiKeyEnv]?.trim()) {
    const fallbackPreset = FREE_PROVIDER_PRESETS.find((p) => envHasKey(p.apiKeyEnv));
    if (fallbackPreset) {
      baseUrl = fallbackPreset.baseUrl;
      modelId = fallbackPreset.model;
      providerName = `${provider.name}→${fallbackPreset.name}`;
    }
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      defaultHeaders:
        baseUrl.includes("openrouter.ai")
          ? {
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3847",
              "X-Title": "Crucible AI vs Human",
            }
          : undefined,
    });
    const completion = await client.chat.completions.create({
      model: modelId,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${params.system}\n\nRespond with a single JSON object only.`,
        },
        { role: "user", content: params.user },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "{}";
    // Strip accidental markdown fences some free models emit
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return {
      data: JSON.parse(cleaned) as T,
      provider: providerName,
      model: modelId,
      mocked: false,
    };
  } catch (err) {
    logger.error("AI completion failed; falling back", {
      err: err instanceof Error ? err.message : String(err),
      provider: providerName,
      model: modelId,
    });
    if (!allowMock) throw err;
    return {
      data: params.fallback,
      provider: providerName,
      model: modelId,
      mocked: true,
    };
  }
}
