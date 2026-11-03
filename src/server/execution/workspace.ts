import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { starterFilesForChallenge } from "./starters";

const STORAGE = process.env.STORAGE_ROOT ?? "./storage";

export async function createWorkspaceForAssignment(params: {
  assignmentId: string;
  challengeSlug: string;
  language: string;
  track: string;
}) {
  const rootPath = path.join(STORAGE, "workspaces", params.assignmentId);
  await fs.mkdir(rootPath, { recursive: true });

  const files = starterFilesForChallenge(params.challengeSlug, params.language, params.track);
  for (const file of files) {
    const full = path.join(rootPath, file.path);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, file.content, "utf8");
  }

  const imageTag =
    params.language === "python"
      ? "gauntlet/python:3.12"
      : params.language === "go"
        ? "gauntlet/go:1.22"
        : params.language === "rust"
          ? "gauntlet/rust:1.78"
          : params.language === "csharp"
            ? "gauntlet/dotnet:8"
            : "gauntlet/node:20";

  const workspace = await prisma.workspace.create({
    data: {
      assignmentId: params.assignmentId,
      language: params.language,
      imageTag,
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
