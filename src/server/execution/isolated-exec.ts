import fs from "fs/promises";
import os from "os";
import path from "path";
import { execAllowlisted } from "./safe-exec";

/**
 * Run allowlisted commands against a disposable copy of the workspace.
 * Candidate code never executes inside the durable shared storage tree, and
 * inherits no app secrets / network credentials from the host process env.
 */
export async function runInIsolatedScratch(params: {
  command: string;
  sourceRoot: string;
  timeoutSec: number;
}): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "crucible-sandbox-"));
  try {
    await copyWorkspaceTree(params.sourceRoot, scratch);
    const cleanEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      HOME: scratch,
      TMPDIR: scratch,
      TEMP: scratch,
      TMP: scratch,
      NODE_ENV: "test",
      RUN_SERVER: "0",
      GOPATH: path.join(scratch, ".go"),
      GOCACHE: path.join(scratch, ".gocache"),
      CARGO_HOME: path.join(scratch, ".cargo"),
      CARGO_TARGET_DIR: path.join(scratch, ".target"),
      // Explicitly unset common secret-bearing vars for the child
      DATABASE_URL: "",
      SESSION_SECRET: "",
      SETUP_SECRET: "",
      GROQ_API_KEY: "",
      OPENAI_API_KEY: "",
      OPENROUTER_API_KEY: "",
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
      REDIS_URL: "",
    };
    return await execAllowlisted(params.command, scratch, cleanEnv, params.timeoutSec);
  } finally {
    await fs.rm(scratch, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function copyWorkspaceTree(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".snapshots" || entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyWorkspaceTree(from, to);
    } else if (entry.isFile()) {
      await fs.copyFile(from, to);
    }
  }
}
