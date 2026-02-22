# Cynwell Portfolio (GitHub Pages)

Modern personal portfolio built with React 18, Vite, TypeScript, Tailwind CSS, and Framer Motion.  
This repository is a single static app (no backend, no API routes).

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Framer Motion
- GitHub Actions for:
  - CI quality gates
  - GitHub Pages build and deployment

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
npm run check
```

Pre-commit checks run via Husky + lint-staged.

## Key Files

- `src/app/App.tsx`: application composition root
- `src/content/projects/projects.json`: local project source data
- `src/content/projects/loadProjects.ts`: runtime project data validation (Zod)
- `src/content/profile/profile.ts`: profile, navigation, education, and skill content
- `public/resume.pdf`: downloadable static resume
- `.github/workflows/cd.yml`: GitHub Pages deployment workflow
- `.github/workflows/ci.yml`: lint, typecheck, unit coverage, Playwright smoke tests

## Architecture

`src` is organized by app shell, feature modules, shared utilities, and content:

- `src/app`: entrypoint and app composition
- `src/features`: feature modules (`about`, `hero`, `projects`, `education`, etc.)
- `src/shared`: shared UI primitives and reusable logic
- `src/content`: static content and validated content loaders

Import aliases are enabled and expected:

- `@app/*`
- `@features/*`
- `@shared/*`
- `@content/*`

Feature boundaries:

- Cross-feature imports should use feature public APIs (`@features/<feature>`).
- Internal feature files should be imported via relative paths inside the same feature.
- Content consumers should use content public APIs (`@content/<slice>`).

## GitHub Pages Deployment

Workflow: `.github/workflows/cd.yml`

How it works:

1. Triggers after `CI Quality Gates` succeeds on `main`/`master`, plus manual dispatch.
2. Installs dependencies with `npm ci`.
3. Runs `npm run check` (lint, typecheck, unit coverage, production build, and e2e).
4. Uploads `dist/` and deploys using official GitHub Pages actions.

Setup:

1. Repository should be `username.github.io`.
2. In GitHub Settings → Pages, select **GitHub Actions** as the source.
3. Keep Vite base as `/` for user-site root deployment.

## Customize

1. Update profile data in `src/content/profile/profile.ts`.
2. Replace project entries in `src/content/projects/projects.json`.
3. Replace `public/resume.pdf` with your actual resume.
