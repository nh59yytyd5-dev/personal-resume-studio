import {Fragment, useEffect, useRef, useState, type ChangeEvent} from 'react';
import {
  Download,
  FileDown,
  FolderArchive,
  Github,
  Globe,
  Layers3,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

import {
  STORAGE_KEY,
  cloneWorkspace,
  createEducationItem,
  createExperienceItem,
  createMaterialItem,
  createProjectItem,
  createSkillCategory,
  createVariant,
  defaultWorkspace,
  formatTimestamp,
  normalizeWorkspace,
  splitMultilineText,
  type EducationItem,
  type ExperienceItem,
  type MaterialItem,
  type ProjectItem,
  type ResumeVariant,
  type ResumeWorkspace,
  type SkillCategory,
} from './resume-data';

type SelectionKey = 'educationIds' | 'skillIds' | 'projectIds' | 'experienceIds' | 'materialIds';

const inputClassName =
  'w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100';

const textareaClassName = `${inputClassName} min-h-24 resize-y`;

const buttonClassName =
  'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950';

function getInitialWorkspace(): ResumeWorkspace {
  if (typeof window === 'undefined') {
    return cloneWorkspace(defaultWorkspace);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeWorkspace(JSON.parse(raw)) : cloneWorkspace(defaultWorkspace);
  } catch {
    return cloneWorkspace(defaultWorkspace);
  }
}

function SectionTitle({eyebrow, title, description}: {eyebrow: string; title: string; description: string}) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-700/80">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <textarea
        className={textareaClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        checked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}

function ResumeSectionHeader({title}: {title: string}) {
  return <h2 className="resume-section-title">{title}</h2>;
}

function linkifyContact(value: string) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('mailto:')) return value;
  return `https://${value}`;
}

function toFilenamePart(value: string, fallback: string) {
  const sanitized = value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-');
  return sanitized || fallback;
}

export default function App() {
  const [workspace, setWorkspace] = useState<ResumeWorkspace>(getInitialWorkspace);
  const [flashMessage, setFlashMessage] = useState('本地自动保存已开启。');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resumePaperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    const timer = window.setTimeout(() => setFlashMessage(''), 3200);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const updateWorkspace = (updater: (current: ResumeWorkspace) => ResumeWorkspace) => {
    setWorkspace((current) => ({
      ...updater(current),
      updatedAt: new Date().toISOString(),
    }));
  };

  const activeVariant =
    workspace.variants.find((variant) => variant.id === workspace.activeVariantId) ?? workspace.variants[0];

  const selectedEducation = workspace.education.filter((item) => activeVariant.educationIds.includes(item.id));
  const selectedSkills = workspace.skills.filter((item) => activeVariant.skillIds.includes(item.id));
  const selectedProjects = workspace.projects.filter((item) => activeVariant.projectIds.includes(item.id));
  const selectedExperience = workspace.experience.filter((item) => activeVariant.experienceIds.includes(item.id));
  const selectedMaterials = workspace.materials.filter((item) => activeVariant.materialIds.includes(item.id));

  const updateBasics = (field: keyof ResumeWorkspace['basics'], value: string) => {
    updateWorkspace((current) => ({
      ...current,
      basics: {
        ...current.basics,
        [field]: value,
      },
    }));
  };

  const updateActiveVariant = (field: keyof ResumeVariant, value: string) => {
    updateWorkspace((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId ? {...variant, [field]: value} : variant,
      ),
    }));
  };

  const toggleSelection = (key: SelectionKey, itemId: string) => {
    updateWorkspace((current) => ({
      ...current,
      variants: current.variants.map((variant) => {
        if (variant.id !== current.activeVariantId) return variant;

        const currentIds = variant[key];
        const nextIds = currentIds.includes(itemId)
          ? currentIds.filter((id) => id !== itemId)
          : [...currentIds, itemId];

        return {...variant, [key]: nextIds};
      }),
    }));
  };

  const removeSelectionFromAllVariants = (variants: ResumeVariant[], key: SelectionKey, itemId: string) =>
    variants.map((variant) => ({
      ...variant,
      [key]: variant[key].filter((id) => id !== itemId),
    }));

  const updateEducation = (itemId: string, field: keyof EducationItem, value: string) => {
    updateWorkspace((current) => ({
      ...current,
      education: current.education.map((item) => (item.id === itemId ? {...item, [field]: value} : item)),
    }));
  };

  const addEducation = () => {
    const item = createEducationItem();
    updateWorkspace((current) => ({
      ...current,
      education: [...current.education, item],
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId ? {...variant, educationIds: [...variant.educationIds, item.id]} : variant,
      ),
    }));
  };

  const removeEducation = (itemId: string) => {
    updateWorkspace((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== itemId),
      variants: removeSelectionFromAllVariants(current.variants, 'educationIds', itemId),
    }));
  };

  const updateSkill = (itemId: string, field: keyof SkillCategory, value: string) => {
    updateWorkspace((current) => ({
      ...current,
      skills: current.skills.map((item) => (item.id === itemId ? {...item, [field]: value} : item)),
    }));
  };

  const addSkill = () => {
    const item = createSkillCategory();
    updateWorkspace((current) => ({
      ...current,
      skills: [...current.skills, item],
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId ? {...variant, skillIds: [...variant.skillIds, item.id]} : variant,
      ),
    }));
  };

  const removeSkill = (itemId: string) => {
    updateWorkspace((current) => ({
      ...current,
      skills: current.skills.filter((item) => item.id !== itemId),
      variants: removeSelectionFromAllVariants(current.variants, 'skillIds', itemId),
    }));
  };

  const updateProject = (itemId: string, field: keyof ProjectItem, value: string) => {
    updateWorkspace((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === itemId ? {...item, [field]: value} : item)),
    }));
  };

  const addProject = () => {
    const item = createProjectItem();
    updateWorkspace((current) => ({
      ...current,
      projects: [...current.projects, item],
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId ? {...variant, projectIds: [...variant.projectIds, item.id]} : variant,
      ),
    }));
  };

  const removeProject = (itemId: string) => {
    updateWorkspace((current) => ({
      ...current,
      projects: current.projects.filter((item) => item.id !== itemId),
      variants: removeSelectionFromAllVariants(current.variants, 'projectIds', itemId),
    }));
  };

  const updateExperience = (itemId: string, field: keyof ExperienceItem, value: string) => {
    updateWorkspace((current) => ({
      ...current,
      experience: current.experience.map((item) => (item.id === itemId ? {...item, [field]: value} : item)),
    }));
  };

  const addExperience = () => {
    const item = createExperienceItem();
    updateWorkspace((current) => ({
      ...current,
      experience: [...current.experience, item],
      variants: current.variants.map((variant) =>
        variant.id === current.activeVariantId
          ? {...variant, experienceIds: [...variant.experienceIds, item.id]}
          : variant,
      ),
    }));
  };

  const removeExperience = (itemId: string) => {
    updateWorkspace((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== itemId),
      variants: removeSelectionFromAllVariants(current.variants, 'experienceIds', itemId),
    }));
  };

  const updateMaterial = (itemId: string, field: keyof MaterialItem, value: string) => {
    updateWorkspace((current) => ({
      ...current,
      materials: current.materials.map((item) => (item.id === itemId ? {...item, [field]: value} : item)),
    }));
  };

  const addMaterial = () => {
    const item = createMaterialItem();
    updateWorkspace((current) => ({
      ...current,
      materials: [...current.materials, item],
    }));
  };

  const removeMaterial = (itemId: string) => {
    updateWorkspace((current) => ({
      ...current,
      materials: current.materials.filter((item) => item.id !== itemId),
      variants: removeSelectionFromAllVariants(current.variants, 'materialIds', itemId),
    }));
  };

  const addVariantAction = () => {
    updateWorkspace((current) => {
      const variant = createVariant(current, `新版本 ${current.variants.length + 1}`);
      return {
        ...current,
        variants: [...current.variants, variant],
        activeVariantId: variant.id,
      };
    });
  };

  const deleteVariant = (variantId: string) => {
    updateWorkspace((current) => {
      if (current.variants.length === 1) return current;
      const variants = current.variants.filter((variant) => variant.id !== variantId);
      return {
        ...current,
        variants,
        activeVariantId: current.activeVariantId === variantId ? variants[0].id : current.activeVariantId,
      };
    });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFlashMessage('已导出 JSON 工作区。');
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setWorkspace({
        ...normalizeWorkspace(JSON.parse(text)),
        updatedAt: new Date().toISOString(),
      });
      setFlashMessage(`已导入 ${file.name}。`);
    } catch {
      setFlashMessage('导入失败，文件内容不是可识别的工作区 JSON。');
    } finally {
      event.target.value = '';
    }
  };

  const resetWorkspace = () => {
    setWorkspace(cloneWorkspace(defaultWorkspace));
    setFlashMessage('已恢复示例工作区。');
  };

  const downloadPdf = async () => {
    if (!resumePaperRef.current || isDownloadingPdf) return;

    try {
      setIsDownloadingPdf(true);
      setFlashMessage('正在生成 PDF...');

      const [{default: html2canvas}, {jsPDF}] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(resumePaperRef.current, {
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: resumePaperRef.current.scrollWidth,
        windowHeight: resumePaperRef.current.scrollHeight,
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const filename = `${toFilenamePart(workspace.basics.name, 'resume')}-${toFilenamePart(activeVariant.name, 'variant')}.pdf`;
      pdf.save(filename);
      setFlashMessage('PDF 已下载。');
    } catch (error) {
      console.error(error);
      setFlashMessage('PDF 生成失败。若使用了外链图片，请确认它支持跨域访问后重试。');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-5 text-slate-800 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={importJson}
      />

      <div className="mx-auto flex max-w-[1560px] flex-col gap-6 print:max-w-none">
        <header className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur print:hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-700/80">Resume Studio</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                把模板升级成你自己的简历生成器
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                这版支持本地保存个人素材、维护多个投递版本、实时预览，并支持一键下载 PDF 或浏览器打印。
                数据默认保存在当前浏览器的本地存储，也可以随时导入导出 JSON 备份。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={buttonClassName} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                导入 JSON
              </button>
              <button type="button" className={buttonClassName} onClick={exportJson}>
                <Download className="h-4 w-4" />
                导出 JSON
              </button>
              <button type="button" className={buttonClassName} onClick={resetWorkspace}>
                <RefreshCcw className="h-4 w-4" />
                恢复示例
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={isDownloadingPdf}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition ${
                  isDownloadingPdf ? 'cursor-progress bg-slate-500' : 'bg-slate-950 hover:-translate-y-0.5 hover:bg-slate-800'
                }`}
              >
                <FileDown className="h-4 w-4" />
                {isDownloadingPdf ? '生成 PDF...' : '下载 PDF'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
              >
                <Printer className="h-4 w-4" />
                打印
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <Layers3 className="h-4 w-4 text-slate-500" />
              当前版本：{activeVariant.name}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <FolderArchive className="h-4 w-4 text-slate-500" />
              素材总数：{workspace.projects.length + workspace.experience.length + workspace.materials.length}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">
              <Sparkles className="h-4 w-4" />
              自动保存：{formatTimestamp(workspace.updatedAt)}
            </span>
            {flashMessage && <span className="text-sm text-slate-500">{flashMessage}</span>}
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.95fr)] print:block">
          <div className="space-y-5 print:hidden">
            <section className="editor-panel">
              <SectionTitle
                eyebrow="01"
                title="个人信息"
                description="这里保存你的通用基础资料。不同岗位版本可以复用它，再在版本区里做定制化摘要。"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="姓名" value={workspace.basics.name} onChange={(value) => updateBasics('name', value)} />
                <Field label="求职标题" value={workspace.basics.title} onChange={(value) => updateBasics('title', value)} />
                <Field label="邮箱" value={workspace.basics.email} onChange={(value) => updateBasics('email', value)} />
                <Field label="电话" value={workspace.basics.phone} onChange={(value) => updateBasics('phone', value)} />
                <Field label="地点" value={workspace.basics.location} onChange={(value) => updateBasics('location', value)} />
                <Field label="个人网站" value={workspace.basics.website} onChange={(value) => updateBasics('website', value)} />
                <Field label="GitHub" value={workspace.basics.github} onChange={(value) => updateBasics('github', value)} />
                <Field label="LinkedIn" value={workspace.basics.linkedin} onChange={(value) => updateBasics('linkedin', value)} />
                <div className="md:col-span-2">
                  <Field
                    label="头像 URL"
                    value={workspace.basics.photo}
                    onChange={(value) => updateBasics('photo', value)}
                    placeholder="留空可隐藏照片"
                  />
                </div>
                <div className="md:col-span-2">
                  <TextArea
                    label="默认个人总结"
                    value={workspace.basics.summary}
                    onChange={(value) => updateBasics('summary', value)}
                    placeholder="用 3-5 句说明你的定位、优势与方向。"
                  />
                </div>
              </div>
            </section>

            <section className="editor-panel">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <SectionTitle
                  eyebrow="02"
                  title="版本管理"
                  description="同一套素材可以维护多个投递版本，例如通用版、AI 产品版、法务科技版。"
                />
                <button type="button" className={buttonClassName} onClick={addVariantAction}>
                  <Plus className="h-4 w-4" />
                  新建版本
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {workspace.variants.map((variant) => {
                  const isActive = variant.id === workspace.activeVariantId;
                  return (
                    <div
                      key={variant.id}
                      className={`rounded-[24px] border px-4 py-3 ${
                        isActive ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setWorkspace((current) => ({
                            ...current,
                            activeVariantId: variant.id,
                          }))
                        }
                        className="text-left"
                      >
                        <div className="text-sm font-semibold">{variant.name}</div>
                        <div className={`mt-1 text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          {variant.headline || workspace.basics.title}
                        </div>
                      </button>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs ${
                            isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                          onClick={() =>
                            setWorkspace((current) => ({
                              ...current,
                              activeVariantId: variant.id,
                            }))
                          }
                        >
                          切换
                        </button>
                        <button
                          type="button"
                          disabled={workspace.variants.length === 1}
                          onClick={() => deleteVariant(variant.id)}
                          className={`rounded-full px-3 py-1 text-xs ${
                            workspace.variants.length === 1
                              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                              : isActive
                                ? 'bg-rose-400/15 text-rose-100'
                                : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="版本名称" value={activeVariant.name} onChange={(value) => updateActiveVariant('name', value)} />
                <Field
                  label="版本标题"
                  value={activeVariant.headline}
                  onChange={(value) => updateActiveVariant('headline', value)}
                />
                <div className="md:col-span-2">
                  <TextArea
                    label="版本总结"
                    value={activeVariant.summary}
                    onChange={(value) => updateActiveVariant('summary', value)}
                    placeholder="如果不同岗位需要不同的自我介绍，可以在这里覆盖默认总结。"
                  />
                </div>
              </div>
            </section>

            <section className="editor-panel">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="03" title="教育背景" description="维护母版教育经历，并决定是否出现在当前版本。" />
                <button type="button" className={buttonClassName} onClick={addEducation}>
                  <Plus className="h-4 w-4" />
                  新增
                </button>
              </div>

              <div className="space-y-4">
                {workspace.education.map((item) => (
                  <div key={item.id} className="rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Toggle
                        checked={activeVariant.educationIds.includes(item.id)}
                        label={activeVariant.educationIds.includes(item.id) ? '已加入当前版本' : '未加入当前版本'}
                        onChange={() => toggleSelection('educationIds', item.id)}
                      />
                      <button type="button" className="rounded-full bg-white p-2 text-slate-500 hover:text-rose-600" onClick={() => removeEducation(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="学校" value={item.school} onChange={(value) => updateEducation(item.id, 'school', value)} />
                      <Field label="学位 / 专业" value={item.degree} onChange={(value) => updateEducation(item.id, 'degree', value)} />
                      <Field label="时间" value={item.period} onChange={(value) => updateEducation(item.id, 'period', value)} />
                      <div className="md:col-span-2">
                        <TextArea
                          label="描述"
                          value={item.description}
                          onChange={(value) => updateEducation(item.id, 'description', value)}
                          placeholder="GPA、课程、奖项、研究方向都可以写在这里。"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="editor-panel">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="04" title="技能与工具" description="按类别保存技能描述，便于不同版本切换展示重点。" />
                <button type="button" className={buttonClassName} onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                  新增
                </button>
              </div>

              <div className="space-y-4">
                {workspace.skills.map((item) => (
                  <div key={item.id} className="rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Toggle
                        checked={activeVariant.skillIds.includes(item.id)}
                        label={activeVariant.skillIds.includes(item.id) ? '已加入当前版本' : '未加入当前版本'}
                        onChange={() => toggleSelection('skillIds', item.id)}
                      />
                      <button type="button" className="rounded-full bg-white p-2 text-slate-500 hover:text-rose-600" onClick={() => removeSkill(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                      <Field label="分类名称" value={item.name} onChange={(value) => updateSkill(item.id, 'name', value)} />
                      <TextArea
                        label="分类内容"
                        value={item.content}
                        onChange={(value) => updateSkill(item.id, 'content', value)}
                        placeholder="例如：React、TypeScript、Puppeteer、RAG、LangChain。"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="editor-panel">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="05" title="项目素材库" description="每条项目支持多行亮点，换行即一个 bullet。" />
                <button type="button" className={buttonClassName} onClick={addProject}>
                  <Plus className="h-4 w-4" />
                  新增
                </button>
              </div>

              <div className="space-y-4">
                {workspace.projects.map((item) => (
                  <div key={item.id} className="rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Toggle
                        checked={activeVariant.projectIds.includes(item.id)}
                        label={activeVariant.projectIds.includes(item.id) ? '已加入当前版本' : '未加入当前版本'}
                        onChange={() => toggleSelection('projectIds', item.id)}
                      />
                      <button type="button" className="rounded-full bg-white p-2 text-slate-500 hover:text-rose-600" onClick={() => removeProject(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="项目名称" value={item.name} onChange={(value) => updateProject(item.id, 'name', value)} />
                      <Field label="角色" value={item.role} onChange={(value) => updateProject(item.id, 'role', value)} />
                      <Field label="时间" value={item.period} onChange={(value) => updateProject(item.id, 'period', value)} />
                      <div className="md:col-span-2">
                        <TextArea
                          label="亮点描述"
                          value={item.highlights}
                          onChange={(value) => updateProject(item.id, 'highlights', value)}
                          placeholder="每行一条，预览里会自动变成项目符号。"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="editor-panel">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="06" title="经历素材库" description="校园、实习、全职、社团经历都可以放在这里。" />
                <button type="button" className={buttonClassName} onClick={addExperience}>
                  <Plus className="h-4 w-4" />
                  新增
                </button>
              </div>

              <div className="space-y-4">
                {workspace.experience.map((item) => (
                  <div key={item.id} className="rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Toggle
                        checked={activeVariant.experienceIds.includes(item.id)}
                        label={activeVariant.experienceIds.includes(item.id) ? '已加入当前版本' : '未加入当前版本'}
                        onChange={() => toggleSelection('experienceIds', item.id)}
                      />
                      <button
                        type="button"
                        className="rounded-full bg-white p-2 text-slate-500 hover:text-rose-600"
                        onClick={() => removeExperience(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="机构 / 公司"
                        value={item.company}
                        onChange={(value) => updateExperience(item.id, 'company', value)}
                      />
                      <Field
                        label="职位 / 角色"
                        value={item.position}
                        onChange={(value) => updateExperience(item.id, 'position', value)}
                      />
                      <Field label="时间" value={item.period} onChange={(value) => updateExperience(item.id, 'period', value)} />
                      <div className="md:col-span-2">
                        <TextArea
                          label="亮点描述"
                          value={item.highlights}
                          onChange={(value) => updateExperience(item.id, 'highlights', value)}
                          placeholder="每行一条，预览里会自动变成项目符号。"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="editor-panel">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="07" title="补充素材" description="把暂时不放进正式经历的亮点、奖项、方法论或标签先沉淀在这里。" />
                <button type="button" className={buttonClassName} onClick={addMaterial}>
                  <Plus className="h-4 w-4" />
                  新增
                </button>
              </div>

              <div className="space-y-4">
                {workspace.materials.map((item) => (
                  <div key={item.id} className="rounded-[26px] border border-slate-200/80 bg-slate-50/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Toggle
                        checked={activeVariant.materialIds.includes(item.id)}
                        label={activeVariant.materialIds.includes(item.id) ? '已加入当前版本' : '仅保存在素材库'}
                        onChange={() => toggleSelection('materialIds', item.id)}
                      />
                      <button type="button" className="rounded-full bg-white p-2 text-slate-500 hover:text-rose-600" onClick={() => removeMaterial(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                      <Field label="分类" value={item.category} onChange={(value) => updateMaterial(item.id, 'category', value)} />
                      <Field label="标题" value={item.title} onChange={(value) => updateMaterial(item.id, 'title', value)} />
                      <div className="md:col-span-2">
                        <TextArea
                          label="内容"
                          value={item.content}
                          onChange={(value) => updateMaterial(item.id, 'content', value)}
                          placeholder="用于记录奖项、方法论、关键成果、补充说明等。"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="mb-4 flex items-center justify-between rounded-[24px] border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur print:hidden">
              <span className="font-medium text-slate-900">实时预览</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadPdf}
                  disabled={isDownloadingPdf}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium text-white transition ${
                    isDownloadingPdf ? 'cursor-progress bg-slate-500' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <FileDown className="h-4 w-4" />
                  {isDownloadingPdf ? '生成中' : '下载 PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  <Printer className="h-4 w-4" />
                  打印
                </button>
              </div>
            </div>

            <div ref={resumePaperRef} className="resume-paper">
              <header className="resume-header resume-section">
                <div className="flex-1">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-700/80">Curriculum Vitae</p>
                    <h1 className="font-['Noto_Serif_SC',serif] text-4xl font-semibold tracking-tight text-slate-950">
                      {workspace.basics.name || '未填写姓名'}
                    </h1>
                    <p className="text-xl text-slate-600">{activeVariant.headline || workspace.basics.title || '未填写求职标题'}</p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                    {workspace.basics.email && (
                      <a className="inline-flex items-center gap-2 hover:text-slate-950" href={`mailto:${workspace.basics.email}`}>
                        <Mail className="h-4 w-4 text-slate-400" />
                        {workspace.basics.email}
                      </a>
                    )}
                    {workspace.basics.phone && (
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {workspace.basics.phone}
                      </span>
                    )}
                    {workspace.basics.location && (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {workspace.basics.location}
                      </span>
                    )}
                    {workspace.basics.github && (
                      <a className="inline-flex items-center gap-2 hover:text-slate-950" href={linkifyContact(workspace.basics.github)} target="_blank" rel="noreferrer">
                        <Github className="h-4 w-4 text-slate-400" />
                        {workspace.basics.github}
                      </a>
                    )}
                    {workspace.basics.linkedin && (
                      <a
                        className="inline-flex items-center gap-2 hover:text-slate-950"
                        href={linkifyContact(workspace.basics.linkedin)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Linkedin className="h-4 w-4 text-slate-400" />
                        {workspace.basics.linkedin}
                      </a>
                    )}
                    {workspace.basics.website && (
                      <a className="inline-flex items-center gap-2 hover:text-slate-950" href={linkifyContact(workspace.basics.website)} target="_blank" rel="noreferrer">
                        <Globe className="h-4 w-4 text-slate-400" />
                        {workspace.basics.website}
                      </a>
                    )}
                  </div>
                </div>

                {workspace.basics.photo && (
                  <img
                    src={workspace.basics.photo}
                    alt={workspace.basics.name || 'Profile'}
                    className="h-32 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm"
                  />
                )}
              </header>

              <section className="resume-section">
                <ResumeSectionHeader title="个人优势" />
                <p className="text-sm leading-7 text-slate-700">
                  {activeVariant.summary || workspace.basics.summary || '在左侧填写个人总结后，这里会自动生成预览。'}
                </p>
              </section>

              {selectedSkills.length > 0 && (
                <section className="resume-section">
                  <ResumeSectionHeader title="专业技能" />
                  <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
                    {selectedSkills.map((item) => (
                      <Fragment key={item.id}>
                        <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                        <div className="text-sm leading-7 text-slate-700">{item.content}</div>
                      </Fragment>
                    ))}
                  </div>
                </section>
              )}

              {selectedProjects.length > 0 && (
                <section className="resume-section">
                  <ResumeSectionHeader title="项目经验" />
                  <div className="space-y-6">
                    {selectedProjects.map((item) => (
                      <div key={item.id}>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                          <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
                          <span className="text-sm font-medium text-slate-500">{item.period}</span>
                        </div>
                        {item.role && <p className="mt-1 text-sm font-medium text-amber-800">{item.role}</p>}
                        <ul className="mt-3 space-y-2 pl-5 text-sm leading-7 text-slate-700">
                          {splitMultilineText(item.highlights).map((line, index) => (
                            <li key={`${item.id}-${index}`} className="list-disc">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedExperience.length > 0 && (
                <section className="resume-section">
                  <ResumeSectionHeader title="校园 / 实习经历" />
                  <div className="space-y-6">
                    {selectedExperience.map((item) => (
                      <div key={item.id}>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                          <h3 className="text-lg font-semibold text-slate-950">{item.company}</h3>
                          <span className="text-sm font-medium text-slate-500">{item.period}</span>
                        </div>
                        {item.position && <p className="mt-1 text-sm font-medium text-amber-800">{item.position}</p>}
                        <ul className="mt-3 space-y-2 pl-5 text-sm leading-7 text-slate-700">
                          {splitMultilineText(item.highlights).map((line, index) => (
                            <li key={`${item.id}-${index}`} className="list-disc">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedEducation.length > 0 && (
                <section className="resume-section">
                  <ResumeSectionHeader title="教育背景" />
                  <div className="space-y-5">
                    {selectedEducation.map((item) => (
                      <div key={item.id}>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                          <h3 className="text-lg font-semibold text-slate-950">{item.school}</h3>
                          <span className="text-sm font-medium text-slate-500">{item.period}</span>
                        </div>
                        {item.degree && <p className="mt-1 text-sm font-medium text-slate-700">{item.degree}</p>}
                        {item.description && <p className="mt-2 text-sm leading-7 text-slate-700">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedMaterials.length > 0 && (
                <section className="resume-section">
                  <ResumeSectionHeader title="补充亮点" />
                  <div className="space-y-4">
                    {selectedMaterials.map((item) => (
                      <div key={item.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.category && <span className="resume-tag">{item.category}</span>}
                          <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-700">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
