import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getStorageRoot } from "@/lib/storage";
import { starterFilesForChallenge } from "./starters";

import { imageTagForCodingLanguage } from "@/lib/coding-languages";

function imageTagForLanguage(language: string) {
  return imageTagForCodingLanguage(language);
}

export async function createWorkspaceForAssignment(params: {
  assignmentId: string;
  challengeSlug: string;
  language: string;
  track: string;
}) {
  const rootPath = path.join(getStorageRoot(), "workspaces", params.assignmentId);
  await fs.mkdir(rootPath, { recursive: true });

  const files = starterFilesForChallenge(params.challengeSlug, params.language, params.track);
  for (const file of files) {
    const full = path.join(rootPath, file.path);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, file.content, "utf8");
  }

  const workspace = await prisma.workspace.create({
    data: {
      assignmentId: params.assignmentId,
      language: params.language,
      imageTag: imageTagForLanguage(params.language),
      rootPath,
      gitRemoteUrl: `local://gauntlet/${params.assignmentId}`,
      status: "ready",
      files: {
        create: files.map((f) => ({
          path: f.path,
          content: f.content,
          language: f.language,
        })),
      },
      commits: {
        create: {
          sha: "init",
          message: "chore: scaffold assessment workspace",
          authorEmail: "platform@engineering-gauntlet.local",
        },
      },
    },
    include: { files: true },
  });

  return workspace;
}

/** Re-scaffold starter files for an existing workspace (seed / platform upgrades). */
export async function refreshWorkspaceStarters(params: {
  workspaceId: string;
  challengeSlug: string;
  language: string;
  track: string;
  force?: boolean;
}) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: params.workspaceId },
    include: { files: true, commits: { take: 1 } },
  });
  const files = starterFilesForChallenge(params.challengeSlug, params.language, params.track);
  const onlyInit = workspace.commits.length <= 1 && workspace.files.every((f) => f.path !== "BRIEF.md" || (f.content?.length ?? 0) < 200);
  if (!params.force && !onlyInit) {
    // Still upsert mission brief docs so candidates get updated briefs without wiping code
    const briefPaths = new Set(["BRIEF.md", "CHECKLIST.md", "docs/ARCHITECTURE.md", "README.md"]);
    for (const file of files.filter((f) => briefPaths.has(f.path))) {
      await upsertWorkspaceFile({
        workspaceId: workspace.id,
        filePath: file.path,
        content: file.content,
        language: file.language,
      });
    }
    return { refreshed: "briefs", count: briefPaths.size };
  }

  for (const file of files) {
    const full = path.join(workspace.rootPath, file.path);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, file.content, "utf8");
    await prisma.workspaceFile.upsert({
      where: { workspaceId_path: { workspaceId: workspace.id, path: file.path } },
      create: {
        workspaceId: workspace.id,
        path: file.path,
        content: file.content,
        language: file.language,
      },
      update: { content: file.content, language: file.language },
    });
  }
  return { refreshed: "full", count: files.length };
}

/** Write DB file snapshots to disk and normalize bare ESM relative imports (Node needs extensions). */
export async function materializeWorkspaceToDisk(workspaceId: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { files: true },
  });
  await fs.mkdir(workspace.rootPath, { recursive: true });

  for (const file of workspace.files) {
    let content = file.content;
    if (/\.(m?[jt]sx?|mjs|cjs)$/.test(file.path)) {
      const preferTs = /\.tsx?$/.test(file.path);
      content = content.replace(/from\s+(["'])(\.[^"']+)\1/g, (full, quote: string, spec: string) => {
        if (/\.(?:[cm]?[jt]s|tsx|jsx|json)$/i.test(spec)) return full;
        const ext = preferTs ? ".ts" : ".js";
        return `from ${quote}${spec}${ext}${quote}`;
      });
    }
    if (file.path === "package.json") {
      try {
        const pkg = JSON.parse(content) as { type?: string; scripts?: Record<string, string> };
        pkg.type = "module";
        pkg.scripts = {
          ...(pkg.scripts ?? {}),
          test:
            "node --experimental-strip-types --disable-warning=ExperimentalWarning tests/run.ts",
        };
        content = JSON.stringify(pkg, null, 2);
      } catch {
        /* keep */
      }
    }
    const full = path.join(workspace.rootPath, file.path);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, "utf8");
    if (content !== file.content) {
      await prisma.workspaceFile.update({
        where: { id: file.id },
        data: { content },
      });
    }
  }

  return workspace.rootPath;
}

/** Refresh harness/test runner files from current starters without wiping candidate solution code. */
export async function repairCodingHarness(params: {
  workspaceId: string;
  challengeSlug: string;
  language: string;
  track: string;
}) {
  const files = starterFilesForChallenge(params.challengeSlug, params.language, params.track);
  const harnessPaths = new Set(
    files
      .map((f) => f.path)
      .filter(
        (p) =>
          p.startsWith("tests/") ||
          p === "package.json" ||
          p === "PROBLEM.md" ||
          p === "README.md" ||
          p === "Cargo.toml" ||
          p === "go.mod",
      ),
  );
  for (const file of files.filter((f) => harnessPaths.has(f.path))) {
    await upsertWorkspaceFile({
      workspaceId: params.workspaceId,
      filePath: file.path,
      content: file.content,
      language: file.language,
    });
  }
  await materializeWorkspaceToDisk(params.workspaceId);
  return { repaired: harnessPaths.size };
}

export async function upsertWorkspaceFile(params: {
  workspaceId: string;
  filePath: string;
  content: string;
  language?: string;
}) {
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: params.workspaceId } });
  const full = path.join(workspace.rootPath, params.filePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, params.content, "utf8");

  return prisma.workspaceFile.upsert({
    where: {
      workspaceId_path: { workspaceId: params.workspaceId, path: params.filePath },
    },
    create: {
      workspaceId: params.workspaceId,
      path: params.filePath,
      content: params.content,
      language: params.language,
    },
    update: { content: params.content, language: params.language },
  });
}

export async function commitWorkspace(params: {
  workspaceId: string;
  message: string;
  authorEmail: string;
}) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: params.workspaceId },
    include: { files: true },
  });
  const sha = `c${Date.now().toString(36)}`;
  // Persist snapshot
  const snapDir = path.join(workspace.rootPath, ".snapshots", sha);
  await fs.mkdir(snapDir, { recursive: true });
  for (const file of workspace.files) {
    const dest = path.join(snapDir, file.path);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, file.content, "utf8");
  }
  const commit = await prisma.gitCommit.create({
    data: {
      workspaceId: params.workspaceId,
      sha,
      message: params.message,
      authorEmail: params.authorEmail,
    },
  });
  await prisma.workspace.update({
    where: { id: params.workspaceId },
    data: { lastCommitSha: sha },
  });
  return commit;
}
