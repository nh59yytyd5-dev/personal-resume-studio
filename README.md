# Personal Resume Studio

A local-first resume generator for personal use. It lets you save profile data and reusable resume materials, maintain multiple application variants, preview the result in real time, download PDF with one click, and fall back to browser print when needed.

![Personal Resume Studio preview](./.github/assets/app-preview.png)

## Features

- Local-first workspace stored in the browser
- Multiple resume variants based on one shared material library
- Real-time preview with print-optimized layout
- JSON import/export for backup and migration
- One-click PDF download
- Browser print export as a fallback
- Agent-friendly CLI for accumulating materials and tailoring resume variants
- GitHub Actions CI for type-check and build verification

## Privacy

- No backend, no account system, no analytics, no API key requirement
- Resume data is stored in browser `localStorage`
- Agent CLI stores its working data in `.local/resume-workspace.json` by default, which is gitignored
- Data leaves your machine only when you explicitly export JSON, open external links, or provide a remote avatar URL yourself
- The default project no longer loads remote fonts or remote avatar images

## Quick Start

### Requirements

- Node.js 20+

### Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Production build

```bash
npm run build
npm run preview
```

## Agent CLI

This repo now includes a deterministic CLI interface inspired by the explicit, scriptable design of [`ahpxex/resume-cli`](https://github.com/ahpxex/resume-cli). The goal is to make resume operations callable from Codex, other agents, and future skills without relying on fragile UI automation.

### Read the current workspace

```bash
npm run agent -- workspace get
```

### Ingest a new material snippet

```bash
npm run agent -- ingest \
  --kind material \
  --title "React 交付亮点" \
  --category "JD 素材" \
  --content "主导 React + TypeScript 项目交付。\n对齐产品与设计，缩短需求到上线周期。"
```

### Generate a JD-tailored variant

```bash
npm run agent -- tailor \
  --name "AI 前端岗定制版" \
  --jd-file ./job-description.txt
```

### Optional AI-assisted tailoring

Copy `.env.example` to `.env` and set:

- `LLM_API_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

If these are unset, the CLI falls back to a deterministic heuristic mode instead of failing.

## Project Structure

- `src/App.tsx`: editor UI, preview, import/export, version management
- `src/resume-data.ts`: workspace schema, default data, normalization helpers
- `src/index.css`: visual theme and print styles
- `cli/index.mjs`: agent-facing CLI entrypoint
- `cli/lib/workspace.mjs`: workspace storage and ingest operations
- `cli/lib/tailor.mjs`: JD tailoring logic with heuristic and optional LLM mode

## Open Source Workflow

- CI runs `npm ci`, `npm run lint`, and `npm run build` on pushes and pull requests
- Issue templates are included for bugs and feature requests
- A pull request template is included to keep contributions reviewable

## Notes

- This project is inspired by tools like JSON Resume, Reactive Resume, OpenResume, and RenderCV, but is intentionally much smaller and optimized for single-user local usage.
- The default PDF download is client-side and does not require a backend service.
- Browser print remains available as a fallback when you want to use the system print dialog.

## License

MIT
