export type ResumeBasics = {
  name: string;
  title: string;
  photo: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  summary: string;
};

export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  period: string;
  description: string;
};

export type SkillCategory = {
  id: string;
  name: string;
  content: string;
};

export type ProjectItem = {
  id: string;
  name: string;
  role: string;
  period: string;
  highlights: string;
};

export type ExperienceItem = {
  id: string;
  company: string;
  position: string;
  period: string;
  highlights: string;
};

export type MaterialItem = {
  id: string;
  title: string;
  category: string;
  content: string;
};

export type ResumeVariant = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  educationIds: string[];
  skillIds: string[];
  projectIds: string[];
  experienceIds: string[];
  materialIds: string[];
};

export type ResumeWorkspace = {
  basics: ResumeBasics;
  education: EducationItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  materials: MaterialItem[];
  variants: ResumeVariant[];
  activeVariantId: string;
  updatedAt: string;
};

export const STORAGE_KEY = 'personal-resume-studio:v1';

const defaultBasics: ResumeBasics = {
  name: '示例候选人',
  title: '前端 / 全栈 / AI 应用工程师',
  photo: '',
  email: 'name@example.com',
  phone: '(+86) 138-0000-0000',
  location: '上海 / 中国',
  website: 'your-site.dev',
  github: 'github.com/yourname',
  linkedin: 'linkedin.com/in/yourname',
  summary:
    '专注于把产品需求拆解成可落地的软件能力，覆盖前端体验、后端接口、数据结构和 AI 应用集成。擅长快速搭建可交付原型，并把零散素材整理成清晰、稳定、可复用的工作流。',
};

const defaultEducation: EducationItem[] = [
  {
    id: 'edu-scut-law',
    school: '示例大学',
    degree: '计算机科学与技术 - 本科',
    period: '2020.09 - 2024.06',
    description:
      '核心课程：数据结构、操作系统、数据库、软件工程。可在这里补充 GPA、奖项、课程项目或研究方向。',
  },
];

const defaultSkills: SkillCategory[] = [
  {
    id: 'skill-ai',
    name: 'AI 应用',
    content:
      'Prompt Engineering、RAG、Function Calling、Agent Workflow，可对接主流模型 API。',
  },
  {
    id: 'skill-dev',
    name: '工程开发',
    content: 'TypeScript、React、Node.js、Python、REST API、数据库建模。',
  },
  {
    id: 'skill-tools',
    name: '工具链',
    content: 'Vite、Tailwind CSS、Git、Docker、Playwright、自动化脚本。',
  },
  {
    id: 'skill-cross',
    name: '协作与交付',
    content: '需求拆解、文档编写、跨角色协同、结果复盘与流程沉淀。',
  },
];

const defaultProjects: ProjectItem[] = [
  {
    id: 'project-rag-law',
    name: '个人简历生成器',
    role: '独立开发',
    period: '2025.02 - 2025.03',
    highlights: [
      '基于 React 与 Vite 构建本地优先的简历工作台，支持素材管理、版本切换、实时预览与 PDF 导出。',
      '将个人资料、项目、经历、补充素材抽象成统一工作区数据结构，支持 JSON 导入导出。',
      '通过 print CSS 优化 A4 输出效果，减少浏览器打印时的版式偏移。',
      '为公开仓库补齐 README、LICENSE 和隐私说明，降低二次使用成本。',
    ].join('\n'),
  },
  {
    id: 'project-multi-agent',
    name: '内部知识库问答助手',
    role: '核心开发者',
    period: '2024.08 - 2024.12',
    highlights: [
      '搭建知识清洗、分块、索引和问答链路，帮助团队快速检索内部文档与规范。',
      '设计召回与提示词策略，提升回答相关性与结构化输出质量。',
      '补充后台配置与日志能力，方便持续迭代模型参数和知识源。',
    ].join('\n'),
  },
];

const defaultExperience: ExperienceItem[] = [
  {
    id: 'exp-legal-center',
    company: '示例科技公司',
    position: '产品工程实习生',
    period: '2024.03 - 2024.09',
    highlights: [
      '参与多个内部工具从需求梳理到交付上线的全过程，覆盖前端页面、接口联调与反馈修复。',
      '推动重复工作脚本化，减少手动整理和格式转换的时间成本。',
    ].join('\n'),
  },
];

const defaultMaterials: MaterialItem[] = [
  {
    id: 'material-law-retrieval',
    title: '架构思考',
    category: '补充素材',
    content: '习惯先抽象数据结构和工作流，再决定 UI 与导出方式，降低后续扩展的重构成本。',
  },
  {
    id: 'material-writing',
    title: '协作方式',
    category: '能力标签',
    content: '能把零散需求整理成明确的任务边界、验收口径和交付文档，减少沟通损耗。',
  },
];

const defaultVariants: ResumeVariant[] = [
  {
    id: 'variant-general',
    name: '通用投递版',
    headline: '前端 / 全栈 / AI 应用工程师',
    summary: defaultBasics.summary,
    educationIds: defaultEducation.map((item) => item.id),
    skillIds: defaultSkills.map((item) => item.id),
    projectIds: defaultProjects.map((item) => item.id),
    experienceIds: defaultExperience.map((item) => item.id),
    materialIds: ['material-law-retrieval'],
  },
];

export const defaultWorkspace: ResumeWorkspace = {
  basics: defaultBasics,
  education: defaultEducation,
  skills: defaultSkills,
  projects: defaultProjects,
  experience: defaultExperience,
  materials: defaultMaterials,
  variants: defaultVariants,
  activeVariantId: 'variant-general',
  updatedAt: new Date().toISOString(),
};

export function cloneWorkspace(workspace: ResumeWorkspace = defaultWorkspace): ResumeWorkspace {
  return JSON.parse(JSON.stringify(workspace)) as ResumeWorkspace;
}

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEducationItem(): EducationItem {
  return {
    id: createId('edu'),
    school: '',
    degree: '',
    period: '',
    description: '',
  };
}

export function createSkillCategory(): SkillCategory {
  return {
    id: createId('skill'),
    name: '',
    content: '',
  };
}

export function createProjectItem(): ProjectItem {
  return {
    id: createId('project'),
    name: '',
    role: '',
    period: '',
    highlights: '',
  };
}

export function createExperienceItem(): ExperienceItem {
  return {
    id: createId('experience'),
    company: '',
    position: '',
    period: '',
    highlights: '',
  };
}

export function createMaterialItem(): MaterialItem {
  return {
    id: createId('material'),
    title: '',
    category: '补充素材',
    content: '',
  };
}

export function createVariant(workspace: ResumeWorkspace, name: string): ResumeVariant {
  return {
    id: createId('variant'),
    name,
    headline: workspace.basics.title,
    summary: workspace.basics.summary,
    educationIds: workspace.education.map((item) => item.id),
    skillIds: workspace.skills.map((item) => item.id),
    projectIds: workspace.projects.map((item) => item.id),
    experienceIds: workspace.experience.map((item) => item.id),
    materialIds: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeEducationItem(value: unknown): EducationItem | null {
  if (!isRecord(value)) return null;

  return {
    id: getString(value.id, createId('edu')),
    school: getString(value.school),
    degree: getString(value.degree),
    period: getString(value.period),
    description: getString(value.description),
  };
}

function normalizeSkillCategory(value: unknown): SkillCategory | null {
  if (!isRecord(value)) return null;

  return {
    id: getString(value.id, createId('skill')),
    name: getString(value.name),
    content: getString(value.content),
  };
}

function normalizeProjectItem(value: unknown): ProjectItem | null {
  if (!isRecord(value)) return null;

  return {
    id: getString(value.id, createId('project')),
    name: getString(value.name),
    role: getString(value.role),
    period: getString(value.period),
    highlights: getString(value.highlights),
  };
}

function normalizeExperienceItem(value: unknown): ExperienceItem | null {
  if (!isRecord(value)) return null;

  return {
    id: getString(value.id, createId('experience')),
    company: getString(value.company),
    position: getString(value.position),
    period: getString(value.period),
    highlights: getString(value.highlights),
  };
}

function normalizeMaterialItem(value: unknown): MaterialItem | null {
  if (!isRecord(value)) return null;

  return {
    id: getString(value.id, createId('material')),
    title: getString(value.title),
    category: getString(value.category, '补充素材'),
    content: getString(value.content),
  };
}

function sanitizeIds(ids: string[], validIds: string[]) {
  return ids.filter((id) => validIds.includes(id));
}

export function normalizeWorkspace(value: unknown): ResumeWorkspace {
  if (!isRecord(value)) {
    return cloneWorkspace(defaultWorkspace);
  }

  const basicsSource = isRecord(value.basics) ? value.basics : {};
  const basics: ResumeBasics = {
    name: getString(basicsSource.name, defaultWorkspace.basics.name),
    title: getString(basicsSource.title, defaultWorkspace.basics.title),
    photo: getString(basicsSource.photo, defaultWorkspace.basics.photo),
    email: getString(basicsSource.email, defaultWorkspace.basics.email),
    phone: getString(basicsSource.phone, defaultWorkspace.basics.phone),
    location: getString(basicsSource.location, defaultWorkspace.basics.location),
    website: getString(basicsSource.website, defaultWorkspace.basics.website),
    github: getString(basicsSource.github, defaultWorkspace.basics.github),
    linkedin: getString(basicsSource.linkedin, defaultWorkspace.basics.linkedin),
    summary: getString(basicsSource.summary, defaultWorkspace.basics.summary),
  };

  const education = Array.isArray(value.education)
    ? value.education.map(normalizeEducationItem).filter((item): item is EducationItem => item !== null)
    : [];
  const skills = Array.isArray(value.skills)
    ? value.skills.map(normalizeSkillCategory).filter((item): item is SkillCategory => item !== null)
    : [];
  const projects = Array.isArray(value.projects)
    ? value.projects.map(normalizeProjectItem).filter((item): item is ProjectItem => item !== null)
    : [];
  const experience = Array.isArray(value.experience)
    ? value.experience.map(normalizeExperienceItem).filter((item): item is ExperienceItem => item !== null)
    : [];
  const materials = Array.isArray(value.materials)
    ? value.materials.map(normalizeMaterialItem).filter((item): item is MaterialItem => item !== null)
    : [];

  const safeEducation = education.length ? education : cloneWorkspace(defaultWorkspace).education;
  const safeSkills = skills.length ? skills : cloneWorkspace(defaultWorkspace).skills;
  const safeProjects = projects.length ? projects : cloneWorkspace(defaultWorkspace).projects;
  const safeExperience = experience.length ? experience : cloneWorkspace(defaultWorkspace).experience;
  const safeMaterials = materials;

  const validEducationIds = safeEducation.map((item) => item.id);
  const validSkillIds = safeSkills.map((item) => item.id);
  const validProjectIds = safeProjects.map((item) => item.id);
  const validExperienceIds = safeExperience.map((item) => item.id);
  const validMaterialIds = safeMaterials.map((item) => item.id);

  const variants = Array.isArray(value.variants)
    ? value.variants
        .map((item) => {
          if (!isRecord(item)) return null;

          return {
            id: getString(item.id, createId('variant')),
            name: getString(item.name, '未命名版本'),
            headline: getString(item.headline, basics.title),
            summary: getString(item.summary, basics.summary),
            educationIds: sanitizeIds(getStringArray(item.educationIds), validEducationIds),
            skillIds: sanitizeIds(getStringArray(item.skillIds), validSkillIds),
            projectIds: sanitizeIds(getStringArray(item.projectIds), validProjectIds),
            experienceIds: sanitizeIds(getStringArray(item.experienceIds), validExperienceIds),
            materialIds: sanitizeIds(getStringArray(item.materialIds), validMaterialIds),
          } satisfies ResumeVariant;
        })
        .filter((item): item is ResumeVariant => item !== null)
    : [];

  const safeVariants = variants.length
    ? variants
    : [
        {
          id: createId('variant'),
          name: '通用投递版',
          headline: basics.title,
          summary: basics.summary,
          educationIds: validEducationIds,
          skillIds: validSkillIds,
          projectIds: validProjectIds,
          experienceIds: validExperienceIds,
          materialIds: [],
        },
      ];

  const activeVariantId = getString(value.activeVariantId, safeVariants[0]?.id ?? '');
  const hasActiveVariant = safeVariants.some((item) => item.id === activeVariantId);

  return {
    basics,
    education: safeEducation,
    skills: safeSkills,
    projects: safeProjects,
    experience: safeExperience,
    materials: safeMaterials,
    variants: safeVariants,
    activeVariantId: hasActiveVariant ? activeVariantId : safeVariants[0].id,
    updatedAt: getString(value.updatedAt, new Date().toISOString()),
  };
}

export function splitMultilineText(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}
