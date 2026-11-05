import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { ExecutionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { writeAudit } from "@/server/security/audit";
import { normalizeCodingLanguage } from "@/lib/coding-languages";
import { multilangCommands } from "./coding-family-multilang";
import { HIDDEN_CASES, hiddenTsRunnerSource } from "./hidden-harness";
import { customPyRunnerSource, customTsRunnerSource } from "./custom-harness";

/**
 * Secure execution architecture:
 * - Never run untrusted code in the Next.js process event loop with shared privileges.
 * - Prefer disposable containers (EXECUTION_MODE=docker).
 * - process mode is a constrained local fallback for development only.
 * - Production should use microVMs (Firecracker) / gVisor — Docker socket must not be exposed to candidates.
 */

export type CustomCase = { name?: string; args: unknown[]; expected?: unknown };

export async function enqueueExecution(params: {
  workspaceId: string;
  type: "test" | "hidden_test" | "deploy_check" | "benchmark" | "shell" | "debug";
  command?: string;
  timeoutSec?: number;
  /** Lightning Judge — Premium callers pass higher priority (processed first). */
  priority?: number;
  /** Candidate-authored cases — never used for official grading. */
  customCases?: CustomCase[];
}) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: params.workspaceId },
    include: { assignment: { include: { assessment: { include: { challenge: true } } } } },
  });

  const priority = params.priority ?? 0;
  const timeoutSec =
    params.timeoutSec ??
    (priority >= 10 ? 60 : 120);

  const lang = normalizeCodingLanguage(workspace.language);
  let command = params.command ?? defaultCommand(params.type, lang);

  // Prefer workspace-authored commands.json when present (multilang bank)
  try {
    const cmdPath = path.join(workspace.rootPath, "tests", "commands.json");
    const raw = await fs.readFile(cmdPath, "utf8");
    const cmds = JSON.parse(raw) as { public?: string; hidden?: string };
    if (params.type === "test" && cmds.public) command = cmds.public;
    if (params.type === "hidden_test" && cmds.hidden) command = cmds.hidden;
  } catch {
    /* no commands.json */
  }

  // Coding hidden_test: materialize a real harness when we have one (TS curated)
  if (params.type === "hidden_test" && lang === "typescript") {
    const slug = workspace.assignment.assessment.challenge.slug;
    const src = hiddenTsRunnerSource(slug);
    if (src) {
      const harnessPath = path.join(workspace.rootPath, "tests", "_hidden_run.ts");
      await fs.mkdir(path.dirname(harnessPath), { recursive: true });
      await fs.writeFile(harnessPath, src, "utf8");
      command = "node --experimental-strip-types --disable-warning=ExperimentalWarning tests/_hidden_run.ts";
    }
  }

  // Custom cases — materialize harness + override command (still type "test" for UX)
  if (params.customCases?.length) {
    const testsDir = path.join(workspace.rootPath, "tests");
    await fs.mkdir(testsDir, { recursive: true });
    await fs.writeFile(path.join(testsDir, "custom_cases.json"), JSON.stringify(params.customCases, null, 2), "utf8");
    if (lang === "python") {
      await fs.writeFile(path.join(testsDir, "custom_run.py"), customPyRunnerSource(), "utf8");
      command = "python3 tests/custom_run.py";
    } else {
      await fs.writeFile(path.join(testsDir, "custom_run.ts"), customTsRunnerSource(), "utf8");
      command = "node --experimental-strip-types --disable-warning=ExperimentalWarning tests/custom_run.ts";
    }
  }

  if (!params.command && !params.customCases?.length) {
    const multi = multilangCommands(lang);
    if (params.type === "test") {
      if (lang === "python") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "run_public.py"));
          command = multi.public;
        } catch {
          /* keep default */
        }
      } else if (lang === "go") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "run_public.go"));
          command = multi.public;
        } catch {
          /* keep default */
        }
      } else if (lang === "rust") {
        try {
          await fs.access(path.join(workspace.rootPath, "Cargo.toml"));
          command = multi.public;
        } catch {
          /* keep default */
        }
      } else if (lang === "java") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "RunPublic.java"));
          command = multi.public;
        } catch {
          /* keep default */
        }
      } else if (lang === "javascript") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "run.js"));
          command = multi.public;
        } catch {
          /* keep default */
        }
      }
    }

    if (params.type === "hidden_test") {
      if (lang === "python") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "hidden_run.py"));
          command = multi.hidden;
        } catch {
          /* keep */
        }
      } else if (lang === "go") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "hidden_run.go"));
          command = multi.hidden;
        } catch {
          /* keep */
        }
      } else if (lang === "rust") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "hidden_run.rs"));
          command = multi.hidden;
        } catch {
          /* keep */
        }
      } else if (lang === "java") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "HiddenRun.java"));
          command = multi.hidden;
        } catch {
          /* keep */
        }
      } else if (lang === "javascript") {
        try {
          await fs.access(path.join(workspace.rootPath, "tests", "hidden_run.js"));
          command = multi.hidden;
        } catch {
          /* keep */
        }
      }
    }
  }

  const job = await prisma.executionJob.create({
    data: {
      workspaceId: params.workspaceId,
      type: params.type,
      status: "QUEUED",
      priority,
      imageTag: workspace.imageTag,
      command,
      timeoutSec,
      networkMode: params.type === "deploy_check" ? "egress-limited" : "none",
      cpuLimit: "1",
      memoryLimit: "512m",
      auditMeta: {
        untrusted: true,
        mode: process.env.EXECUTION_MODE ?? "process",
        lightning: priority >= 10,
      },
    },
  });

  // Fire-and-forget local processing (worker also polls)
  void processJob(job.id).catch((err) =>
    logger.error("job processing failed", { jobId: job.id, err: String(err) }),
  );

  return job;
}

function defaultCommand(type: string, language: string) {
  if (type === "deploy_check")
    return "node -e \"console.log(JSON.stringify({ok:true,checks:['dockerfile_present','health_export']}))\"";
  if (type === "benchmark") return "node -e \"console.log(JSON.stringify({p95_ms:42,throughput:100}))\"";
  if (type === "debug")
    return "node -e \"console.log(JSON.stringify({frames:[{fn:'solution',line:1,locals:{}}],status:'paused'}))\"";
  const lang = normalizeCodingLanguage(language);
  if (type === "hidden_test") return multilangCommands(lang).hidden;
  if (type === "test") return multilangCommands(lang).public;
  return multilangCommands(lang).public;
}

export async function processJob(jobId: string) {
  const job = await prisma.executionJob.findUnique({
    where: { id: jobId },
    include: {
      workspace: {
        include: {
          files: true,
          assignment: { include: { assessment: { include: { challenge: true } } } },
        },
      },
    },
  });
  if (!job || job.status !== "QUEUED") return;

  await prisma.executionJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  const mode = process.env.EXECUTION_MODE ?? "process";
  try {
    // Always sync DB → disk before judge so Run works even if storage drifted / imports were bare.
    const { materializeWorkspaceToDisk, repairCodingHarness } = await import("./workspace");
    const challenge = job.workspace.assignment.assessment.challenge;
    if (challenge.type === "CODING_PROBLEM") {
      await repairCodingHarness({
        workspaceId: job.workspaceId,
        challengeSlug: challenge.slug,
        language: job.workspace.language,
        track: challenge.track,
      });
    } else {
      await materializeWorkspaceToDisk(job.workspaceId);
    }

    const result =
      mode === "docker" ? await runInDocker(job) : await runInProcessSandbox(job);

    const status: ExecutionStatus =
      result.timedOut ? "TIMEOUT" : result.exitCode === 0 ? "SUCCEEDED" : "FAILED";

    await prisma.executionJob.update({
      where: { id: jobId },
      data: {
        status,
        stdout: result.stdout.slice(0, 200_000),
        stderr: result.stderr.slice(0, 200_000),
        exitCode: result.exitCode,
        finishedAt: new Date(),
      },
    });

    if (job.type === "test" || job.type === "hidden_test") {
      await recordTestRun(jobId, job.type, result.stdout, job.workspace.assignmentId, result.exitCode === 0);
    }
    if (job.type === "deploy_check") {
      await recordDeploy(job.workspace.assignmentId, result.stdout, status === "SUCCEEDED");
    }

    await writeAudit({
      action: "execution.complete",
      entityType: "ExecutionJob",
      entityId: jobId,
      metadata: { status, mode, type: job.type, priority: job.priority },
    });
  } catch (err) {
    await prisma.executionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        stderr: err instanceof Error ? err.message : String(err),
        finishedAt: new Date(),
        exitCode: 1,
      },
    });
  }
}

async function runInProcessSandbox(job: {
  command: string;
  timeoutSec: number;
  workspace: { rootPath: string };
}) {
  const cleanEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: "/tmp",
    NODE_ENV: "test",
    RUN_SERVER: "0",
    GOPATH: "/tmp/go",
    GOCACHE: "/tmp/gocache",
    CARGO_HOME: "/tmp/cargo",
    CARGO_TARGET_DIR: "/tmp/crucible-target",
    RUSTUP_HOME: process.env.RUSTUP_HOME,
  };
  return execCommand(job.command, job.workspace.rootPath, cleanEnv, job.timeoutSec);
}

async function runInDocker(job: {
  command: string;
  timeoutSec: number;
  imageTag: string;
  cpuLimit: string;
  memoryLimit: string;
  networkMode: string;
  workspace: { rootPath: string };
}) {
  const image =
    job.imageTag.includes("python")
      ? "python:3.12-alpine"
      : job.imageTag.includes("go")
        ? "golang:1.22-alpine"
        : job.imageTag.includes("rust")
          ? "rust:1.78-alpine"
          : job.imageTag.includes("java")
            ? "eclipse-temurin:21-jdk-alpine"
            : "node:20-alpine";

  const network = job.networkMode === "none" ? "none" : "bridge";
  const dockerCmd = [
    "docker",
    "run",
    "--rm",
    "--network",
    network,
    "--cpus",
    job.cpuLimit,
    "--memory",
    job.memoryLimit,
    "--pids-limit",
    "256",
    "--read-only",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=64m",
    "--security-opt",
    "no-new-privileges",
    "--cap-drop",
    "ALL",
    "-v",
    `${job.workspace.rootPath}:/workspace:ro`,
    "-w",
    "/workspace",
    image,
    "sh",
    "-c",
    job.command,
  ];
  return execCommand(dockerCmd.join(" "), process.cwd(), { PATH: process.env.PATH }, job.timeoutSec);
}

function execCommand(
  command: string,
  cwd: string,
  env: Record<string, string | undefined>,
  timeoutSec: number,
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    const child = spawn("bash", ["-lc", command], {
      cwd,
      env: env as NodeJS.ProcessEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutSec * 1000);
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1, timedOut });
    });
  });
}

async function recordTestRun(
  jobId: string,
  type: string,
  stdout: string,
  assignmentId: string,
  runSucceeded: boolean,
) {
  let parsed: { results?: { name: string; pass: boolean; hidden?: boolean }[] } = {};
  try {
    const line = stdout.trim().split("\n").reverse().find((l) => l.trim().startsWith("{"));
    parsed = line ? JSON.parse(line) : {};
  } catch {
    parsed = {};
  }
  const results = parsed.results ?? [{ name: "parse_or_run", pass: false }];
  const publicResults = results.filter((r) => !r.hidden);
  const harnessHidden = results.filter((r) => r.hidden);
  const hiddenResults =
    type === "hidden_test"
      ? harnessHidden.length
        ? harnessHidden
        : await evaluateHidden(assignmentId, runSucceeded)
      : harnessHidden;

  const submission = await prisma.submission.findFirst({
    where: { assignmentId },
    orderBy: { createdAt: "desc" },
  });

  await prisma.testRun.create({
    data: {
      jobId,
      submissionId: submission?.id,
      suite: type,
      passed: publicResults.filter((r) => r.pass).length,
      failed: publicResults.filter((r) => !r.pass).length,
      hiddenPassed: hiddenResults.filter((r) => r.pass).length,
      hiddenFailed: hiddenResults.filter((r) => !r.pass).length,
      results: { public: publicResults, hidden: hiddenResults },
    },
  });
}

async function evaluateHidden(assignmentId: string, runSucceeded: boolean) {
  const assignment = await prisma.assessmentAssignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: {
      workspace: { include: { files: true } },
      assessment: { include: { challenge: true } },
    },
  });
  const files = assignment.workspace?.files ?? [];
  const content = files.map((f) => f.path + "\n" + f.content).join("\n").toLowerCase();
  const slug = assignment.assessment.challenge.slug;
  const catalogCases = HIDDEN_CASES[slug];

  if (catalogCases?.length) {
    return catalogCases.map((c) => {
      const tokens = (c.evidenceTokens ?? c.description.toLowerCase().split(/\W+/)).filter((t) => t.length > 2);
      const evidence = tokens.filter((t) => content.includes(t.toLowerCase())).length;
      // Require substantive implementation signal — stubs that only void args fail
      const hasTodo = /todo|void\s+\w+|return\s+(\[\]|false|null|0|\"\")/i.test(content);
      const pass = !hasTodo && evidence >= Math.min(2, tokens.length) && (runSucceeded || evidence >= 2);
      return {
        name: c.id,
        pass,
        hidden: true,
        requirement: c.description,
        evidenceHits: evidence,
      };
    });
  }

  const hidden = (assignment.assessment.challenge.hiddenRequirements as string[]) ?? [];
  return hidden.map((req, idx) => {
    const tokens = req.toLowerCase().split(/\W+/).filter((t) => t.length > 4);
    const evidence = tokens.filter((t) => content.includes(t)).length;
    const hasTodo = /todo implement|not implemented/i.test(content);
    const pass = !hasTodo && evidence >= Math.min(2, tokens.length);
    return { name: `hidden_${idx + 1}`, pass, hidden: true, requirement: req, evidenceHits: evidence };
  });
}

async function recordDeploy(assignmentId: string, stdout: string, success: boolean) {
  let checks: unknown = { raw: stdout.slice(0, 2000) };
  try {
    const line = stdout.trim().split("\n").reverse().find((l) => l.trim().startsWith("{"));
    if (line) checks = JSON.parse(line);
  } catch {
    /* keep raw */
  }
  const ws = await prisma.workspace.findFirst({ where: { assignmentId } });
  const hasDocker = await fileExists(path.join(ws?.rootPath ?? "", "Dockerfile"));
  const ok = success && hasDocker;
  await prisma.deploymentResult.create({
    data: {
      assignmentId,
      success: ok,
      url: ok ? `https://preview.gauntlet.local/${assignmentId}` : null,
      checks: { ...(typeof checks === "object" ? checks : {}), dockerfile: hasDocker },
      logs: stdout.slice(0, 50_000),
    },
  });
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Lightning-aware poller: higher priority first, then FIFO. */
export async function pollQueuedJobs(limit = 5) {
  const jobs = await prisma.executionJob.findMany({
    where: { status: "QUEUED" },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
  });
  for (const job of jobs) await processJob(job.id);
  return jobs.length;
}
