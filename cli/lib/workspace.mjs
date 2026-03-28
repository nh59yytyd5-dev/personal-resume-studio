import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function resolveFromRoot(input, fallback) {
  const value = input || fallback;
  return path.isAbsolute(value) ? value : path.resolve(ROOT_DIR, value);
}

export function getWorkspacePaths(options = {}) {
  return {
    workspacePath: resolveFromRoot(
      options.workspacePath || process.env.RESUME_WORKSPACE_PATH,
      ".local/resume-workspace.json",
    ),
    templatePath: resolveFromRoot(
      options.templatePath || process.env.RESUME_WORKSPACE_TEMPLATE_PATH,
      "data/workspace-template.json",
    ),
  };
}

export async function ensureWorkspaceFile(options = {}) {
  const { workspacePath, templatePath } = getWorkspacePaths(options);

  try {
    await readFile(workspacePath, "utf8");
  } catch {
    await mkdir(path.dirname(workspacePath), { recursive: true });
    await copyFile(templatePath, workspacePath);
  }

  return { workspacePath, templatePath };
}

function normalizeVariant(variant) {
  return {
    projectOverrides: {},
    experienceOverrides: {},
    ...variant,
    projectOverrides: isRecord(variant?.projectOverrides) ? variant.projectOverrides : {},
    experienceOverrides: isRecord(variant?.experienceOverrides)
      ? variant.experienceOverrides
      : {},
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

export function normalizeWorkspaceShape(value) {
  if (!isRecord(value)) {
    throw new Error("Workspace must be a JSON object.");
  }

  const workspace = structuredClone(value);
  workspace.education = Array.isArray(workspace.education) ? workspace.education : [];
  workspace.skills = Array.isArray(workspace.skills) ? workspace.skills : [];
  workspace.projects = Array.isArray(workspace.projects) ? workspace.projects : [];
  workspace.experience = Array.isArray(workspace.experience) ? workspace.experience : [];
  workspace.materials = Array.isArray(workspace.materials) ? workspace.materials : [];
  workspace.variants = Array.isArray(workspace.variants)
    ? workspace.variants.map(normalizeVariant)
    : [];

  if (!workspace.activeVariantId && workspace.variants[0]?.id) {
    workspace.activeVariantId = workspace.variants[0].id;
  }

  return workspace;
}

export async function readWorkspace(options = {}) {
  const { workspacePath } = await ensureWorkspaceFile(options);
  const raw = await readFile(workspacePath, "utf8");
  return {
    workspacePath,
    workspace: normalizeWorkspaceShape(JSON.parse(raw)),
  };
}

export async function writeWorkspace(workspace, options = {}) {
  const { workspacePath } = await ensureWorkspaceFile(options);
  const normalized = normalizeWorkspaceShape(workspace);
  normalized.updatedAt = new Date().toISOString();
  await writeFile(workspacePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return {
    workspacePath,
    workspace: normalized,
  };
}

export function createId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

export function splitMultilineText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function deriveTitle(value, fallback) {
  const firstLine = splitMultilineText(value)[0];
  if (!firstLine) return fallback;
  return firstLine.slice(0, 40);
}

function getActiveVariant(workspace) {
  return (
    workspace.variants.find((variant) => variant.id === workspace.activeVariantId) ||
    workspace.variants[0] ||
    null
  );
}

function attachId(variant, key, id, attach) {
  if (!variant || !attach) return variant;
  if (variant[key].includes(id)) return variant;
  return {
    ...variant,
    [key]: [...variant[key], id],
  };
}

export function ingestEntry(workspace, payload) {
  const next = normalizeWorkspaceShape(workspace);
  const kind = (payload.kind || "material").trim().toLowerCase();
  const content = String(payload.content || "").trim();

  if (!content) {
    throw new Error("`content` is required.");
  }

  const attach = payload.attach !== false;
  const activeVariant = getActiveVariant(next);

  if (kind === "project") {
    const created = {
      id: createId("project"),
      name: payload.title?.trim() || deriveTitle(content, "新项目"),
      role: payload.subtitle?.trim() || "",
      period: payload.period?.trim() || "",
      highlights: splitMultilineText(content).join("\n"),
    };

    next.projects.push(created);

    if (activeVariant) {
      const patched = attachId(activeVariant, "projectIds", created.id, attach);
      next.variants = next.variants.map((variant) =>
        variant.id === patched.id ? patched : variant,
      );
    }

    return { workspace: next, created, kind };
  }

  if (kind === "experience") {
    const created = {
      id: createId("experience"),
      company: payload.title?.trim() || deriveTitle(content, "新经历"),
      position: payload.subtitle?.trim() || "",
      period: payload.period?.trim() || "",
      highlights: splitMultilineText(content).join("\n"),
    };

    next.experience.push(created);

    if (activeVariant) {
      const patched = attachId(activeVariant, "experienceIds", created.id, attach);
      next.variants = next.variants.map((variant) =>
        variant.id === patched.id ? patched : variant,
      );
    }

    return { workspace: next, created, kind };
  }

  const created = {
    id: createId("material"),
    title: payload.title?.trim() || deriveTitle(content, "新素材"),
    category: payload.category?.trim() || "补充素材",
    content,
  };

  next.materials.push(created);

  if (activeVariant) {
    const patched = attachId(activeVariant, "materialIds", created.id, attach);
    next.variants = next.variants.map((variant) =>
      variant.id === patched.id ? patched : variant,
    );
  }

  return { workspace: next, created, kind: "material" };
}
