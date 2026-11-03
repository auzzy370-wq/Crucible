import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonOk, withHandler } from "@/server/auth/api";
import { requireUser, canReview } from "@/server/auth/session";
import { enqueueExecution } from "@/server/execution/runner";
import { AppError } from "@/lib/errors";

const schema = z.object({
  type: z.enum(["test", "hidden_test", "deploy_check", "benchmark", "shell"]),
  command: z.string().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withHandler(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const ws = await prisma.workspace.findUnique({
      where: { id },
      include: { assignment: true },
    });
    if (!ws) throw new AppError("Not found", 404, "NOT_FOUND");
    if (ws.assignment.candidateId !== user.id && !canReview(user.role)) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    const body = schema.parse(await req.json());
    const job = await enqueueExecution({
      workspaceId: id,
      type: body.type,
      command: body.command,
    });
    return jsonOk(job, { status: 202 });
  });
}
