import { createId, normalizeWorkspaceShape } from "./workspace.mjs";

const STOP_WORDS = new Set([
  "and",
  "the",
  "with",
  "for",
  "you",
  "your",
  "have",
  "that",
  "will",
  "from",
  "using",
  "ability",
  "experience",
  "skill",
  "skills",
  "负责",
  "熟悉",
  "相关",
  "能力",
  "经验",
  "以及",
  "能够",
  "以上",
  "优先",
  "岗位",
  "工作",
  "要求",
  "职责",
  "我们",
  "公司",
]);

function extractKeywords(text) {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[，。；：、/()（）,.;]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/我们|需要|熟悉|负责|以及|并且|能够|相关|岗位|工作|要求|职责|工程师|的/g, " ");

  const matches =
    normalized.match(/[\p{Script=Han}]{2,8}|[a-z][a-z0-9+.#/-]{1,}/gu) || [];

  return [...new Set(matches.filter((token) => !STOP_WORDS.has(token)))].slice(0, 24);
}

function scoreText(text, keywords) {
  const haystack = String(text || "").toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    if (haystack.includes(keyword)) {
      score += keyword.length >= 4 ? 3 : 2;
    }
  }

  return score;
}

function rankItems(items, keywords, toText) {
  return items
    .map((item) => ({
      item,
      score: scoreText(toText(item), keywords),
    }))
    .sort((left, right) => right.score - left.score);
}

function pickIds(rankedItems, limit) {
  const positives = rankedItems.filter((entry) => entry.score > 0);
  const source = positives.length > 0 ? positives : rankedItems;
  return source.slice(0, limit).map((entry) => entry.item.id);
}

function stripCodeFences(value) {
  return String(value || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "")
    .trim();
}

function sanitizeOverrides(value, validIds, fieldKeys) {
  if (!value || typeof value !== "object") return {};

  const result = {};

  for (const [id, entry] of Object.entries(value)) {
    if (!validIds.includes(id) || !entry || typeof entry !== "object") continue;

    const next = {};

    for (const fieldKey of fieldKeys) {
      if (typeof entry[fieldKey] === "string" && entry[fieldKey].trim()) {
        next[fieldKey] = entry[fieldKey].trim();
      }
    }

    if (Object.keys(next).length > 0) {
      result[id] = next;
    }
  }

  return result;
}

function sanitizeDraft(workspace, draft, fallbackName) {
  const educationIds = workspace.education.map((item) => item.id);
  const skillIds = workspace.skills.map((item) => item.id);
  const projectIds = workspace.projects.map((item) => item.id);
  const experienceIds = workspace.experience.map((item) => item.id);
  const materialIds = workspace.materials.map((item) => item.id);

  const safe = {
    name: String(draft.name || fallbackName || "JD 定制版").trim() || "JD 定制版",
    headline: String(draft.headline || workspace.basics.title || "").trim(),
    summary: String(draft.summary || workspace.basics.summary || "").trim(),
    educationIds: Array.isArray(draft.educationIds)
      ? draft.educationIds.filter((id) => educationIds.includes(id))
      : educationIds,
    skillIds: Array.isArray(draft.skillIds)
      ? draft.skillIds.filter((id) => skillIds.includes(id))
      : skillIds,
    projectIds: Array.isArray(draft.projectIds)
      ? draft.projectIds.filter((id) => projectIds.includes(id))
      : [],
    experienceIds: Array.isArray(draft.experienceIds)
      ? draft.experienceIds.filter((id) => experienceIds.includes(id))
      : [],
    materialIds: Array.isArray(draft.materialIds)
      ? draft.materialIds.filter((id) => materialIds.includes(id))
      : [],
    projectOverrides: sanitizeOverrides(draft.projectOverrides, projectIds, ["role", "highlights"]),
    experienceOverrides: sanitizeOverrides(
      draft.experienceOverrides,
      experienceIds,
      ["position", "highlights"],
    ),
  };

  return {
    ...safe,
    id: createId("variant"),
  };
}

async function tailorWithLlm(workspace, options) {
  const apiBaseUrl = process.env.LLM_API_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!apiBaseUrl || !apiKey || !model) return null;

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You tailor resumes truthfully. Return strict JSON only. Never invent facts, dates, employers, or metrics. Select only from the provided item ids. You may rewrite wording for project and experience highlights, but the rewrite must stay faithful to the source content.",
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Create a tailored resume variant for this JD.",
              variantName: options.variantName,
              instructions: options.instructions || "",
              preferredMaterialIds: options.preferredMaterialIds || [],
              jobDescription: options.jobDescription,
              workspace,
              responseShape: {
                name: "string",
                headline: "string",
                summary: "string",
                educationIds: ["id"],
                skillIds: ["id"],
                projectIds: ["id"],
                experienceIds: ["id"],
                materialIds: ["id"],
                projectOverrides: {
                  "<projectId>": {
                    role: "optional string",
                    highlights: "newline separated bullets",
                  },
                },
                experienceOverrides: {
                  "<experienceId>": {
                    position: "optional string",
                    highlights: "newline separated bullets",
                  },
                },
              },
            },
            null,
            2,
          ),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with ${response.status}.`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LLM response did not include message content.");
  }

  return sanitizeDraft(
    workspace,
    JSON.parse(stripCodeFences(content)),
    options.variantName,
  );
}

function tailorHeuristically(workspace, options) {
  const keywords = extractKeywords(options.jobDescription);
  const rankedProjects = rankItems(
    workspace.projects,
    keywords,
    (item) => `${item.name} ${item.role} ${item.highlights}`,
  );
  const rankedExperience = rankItems(
    workspace.experience,
    keywords,
    (item) => `${item.company} ${item.position} ${item.highlights}`,
  );
  const rankedSkills = rankItems(
    workspace.skills,
    keywords,
    (item) => `${item.name} ${item.content}`,
  );
  const rankedMaterials = rankItems(
    workspace.materials,
    keywords,
    (item) => `${item.title} ${item.category} ${item.content}`,
  );

  const projectIds = pickIds(rankedProjects, 3);
  const experienceIds = pickIds(rankedExperience, 2);
  const skillIds = pickIds(rankedSkills, 4);
  const preferredMaterialIds = Array.isArray(options.preferredMaterialIds)
    ? options.preferredMaterialIds.filter((id) => workspace.materials.some((item) => item.id === id))
    : [];
  const materialIds =
    preferredMaterialIds.length > 0
      ? preferredMaterialIds
      : pickIds(rankedMaterials, 2);

  const topKeywords = keywords.slice(0, 6);
  const displayKeywords = topKeywords.filter((token) => /[a-z]/i.test(token)).slice(0, 4);
  const variantName =
    options.variantName ||
    (topKeywords.length > 0 ? `${topKeywords[0]} 定制版` : "JD 定制版");

  const summaryParts = [workspace.basics.summary];

  if (displayKeywords.length > 0) {
    summaryParts.push(`针对岗位描述，重点强调 ${displayKeywords.join(" / ")} 相关经验。`);
  }

  if (projectIds.length > 0) {
    const projectNames = workspace.projects
      .filter((item) => projectIds.includes(item.id))
      .map((item) => item.name)
      .slice(0, 2);

    if (projectNames.length > 0) {
      summaryParts.push(`优先呈现 ${projectNames.join("、")} 等与岗位目标更贴近的项目。`);
    }
  }

  return {
    id: createId("variant"),
    name: variantName,
    headline: workspace.basics.title,
    summary: summaryParts.join(" "),
    educationIds: workspace.education.map((item) => item.id),
    skillIds,
    projectIds,
    experienceIds,
    materialIds,
    projectOverrides: {},
    experienceOverrides: {},
  };
}

export async function tailorVariant(workspaceInput, options) {
  const workspace = normalizeWorkspaceShape(workspaceInput);

  const llmDraft = await tailorWithLlm(workspace, options).catch((error) => {
    return {
      __llmError: error instanceof Error ? error.message : String(error),
    };
  });

  if (llmDraft && !llmDraft.__llmError) {
    return {
      mode: "llm",
      variant: llmDraft,
    };
  }

  const heuristicVariant = tailorHeuristically(workspace, options);

  return {
    mode: llmDraft?.__llmError ? "heuristic-fallback" : "heuristic",
    llmError: llmDraft?.__llmError,
    variant: heuristicVariant,
  };
}
