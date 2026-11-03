import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser } from "@/server/auth/session";

export async function GET() {
  return withHandler(async () => {
    await requireUser(["SUPER_ADMIN"]);
    const providers = await prisma.aiProviderConfig.findMany({ orderBy: { createdAt: "asc" } });
    return jsonOk(
      providers.map((p) => ({
        ...p,
        apiKeyConfigured: Boolean(process.env[p.apiKeyEnv]),
      })),
    );
  });
}

const schema = z.object({
  name: z.string(),
  baseUrl: z.string().url(),
  model: z.string(),
  apiKeyEnv: z.string().min(1),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

export async function POST(req: Request) {
  return withHandler(async () => {
    await requireUser(["SUPER_ADMIN"]);
    const body = schema.parse(await req.json());
    if (body.isDefault) {
      await prisma.aiProviderConfig.updateMany({ data: { isDefault: false } });
    }
    const provider = await prisma.aiProviderConfig.create({ data: body });
    return jsonOk(provider, { status: 201 });
  });
}
