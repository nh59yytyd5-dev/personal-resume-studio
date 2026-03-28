#!/usr/bin/env node

import "dotenv/config";

import { cac } from "cac";
import { readFile } from "node:fs/promises";

import { tailorVariant } from "./lib/tailor.mjs";
import {
  getWorkspacePaths,
  ingestEntry,
  readWorkspace,
  writeWorkspace,
} from "./lib/workspace.mjs";

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

async function readTextFromOptions({ text, file }, label) {
  if (typeof text === "string" && text.trim()) {
    return text.trim().replace(/\\n/g, "\n");
  }

  if (typeof file === "string" && file.trim()) {
    return (await readFile(file, "utf8")).trim();
  }

  throw new Error(`Provide ${label} with --text/--content or --file.`);
}

const cli = cac("resume-agent");

cli
  .command("workspace get", "Read the current workspace JSON.")
  .option("--workspace <path>", "Custom workspace path.")
  .action(async (options) => {
    const { workspacePath, templatePath } = getWorkspacePaths({
      workspacePath: options.workspace,
    });
    const { workspace } = await readWorkspace({ workspacePath });

    printJson({
      ok: true,
      workspacePath,
      templatePath,
      workspace,
    });
  });

cli
  .command("ingest", "Ingest material, project, or experience into the workspace.")
  .option("--workspace <path>", "Custom workspace path.")
  .option("--kind <kind>", "material | project | experience", {
    default: "material",
  })
  .option("--title <value>", "Material title, project name, or company name.")
  .option("--subtitle <value>", "Project role or experience position.")
  .option("--period <value>", "Project/experience period.")
  .option("--category <value>", "Material category.")
  .option("--content <value>", "Main content. For project/experience, use multiple lines for bullets.")
  .option("--file <path>", "Read content from a text file.")
  .option("--attach", "Attach the created item to the active variant.", {
    default: true,
  })
  .action(async (options) => {
    const content = await readTextFromOptions(
      { text: options.content, file: options.file },
      "content",
    );
    const { workspacePath, workspace } = await readWorkspace({
      workspacePath: options.workspace,
    });
    const result = ingestEntry(workspace, {
      kind: options.kind,
      title: options.title,
      subtitle: options.subtitle,
      period: options.period,
      category: options.category,
      content,
      attach: options.attach,
    });
    const saved = await writeWorkspace(result.workspace, { workspacePath });

    printJson({
      ok: true,
      workspacePath: saved.workspacePath,
      kind: result.kind,
      created: result.created,
      workspace: saved.workspace,
    });
  });

cli
  .command("tailor", "Create a tailored resume variant from a job description.")
  .option("--workspace <path>", "Custom workspace path.")
  .option("--name <value>", "Variant name.")
  .option("--jd <value>", "Inline job description text.")
  .option("--jd-file <path>", "Read the job description from a text file.")
  .option("--instructions <value>", "Extra instructions for tailoring.")
  .option("--material-id <id>", "Preferred material id. Repeatable.")
  .option("--dry-run", "Return the generated variant without saving.", {
    default: false,
  })
  .action(async (options) => {
    const jobDescription = await readTextFromOptions(
      { text: options.jd, file: options.jdFile },
      "job description",
    );
    const { workspacePath, workspace } = await readWorkspace({
      workspacePath: options.workspace,
    });
    const result = await tailorVariant(workspace, {
      variantName: options.name,
      jobDescription,
      instructions: options.instructions,
      preferredMaterialIds: toArray(options.materialId),
    });

    if (options.dryRun) {
      printJson({
        ok: true,
        workspacePath,
        dryRun: true,
        ...result,
      });
      return;
    }

    const nextWorkspace = structuredClone(workspace);
    nextWorkspace.variants.push(result.variant);
    nextWorkspace.activeVariantId = result.variant.id;
    const saved = await writeWorkspace(nextWorkspace, { workspacePath });

    printJson({
      ok: true,
      workspacePath: saved.workspacePath,
      ...result,
      workspace: saved.workspace,
    });
  });

cli.help();
cli.parse();
