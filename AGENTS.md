# AGENTS.md

> AI coding agent instructions for the **Cynwell-Liao.github.io** portfolio.

This is a static, single-page React application with no backend or API routes.
It is deployed to GitHub Pages. Do not introduce server-side logic, API routes, or SSR.

## Tech Stack

- React 19 · Vite 8 · TypeScript ~6.0 (strict) · Tailwind CSS 4 · Framer Motion 12
- Runtime content validation with Zod
- CI/CD via GitHub Actions
- Node 24 (pinned in CI)

## Setup & Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Dev server → http://localhost:5173
npm run build                # TypeScript compile + Vite production build
npm run lint                 # ESLint (zero warnings enforced)
npm run typecheck            # TypeScript strict type-check
npm run test                 # Vitest unit tests
npm run test:coverage        # Vitest with coverage (75% thresholds)
npm run test:e2e             # Playwright e2e (requires build first)
npm run check                # Full pipeline: lint → typecheck → coverage → build → e2e
npm run format               # Prettier auto-format
```

Always run `npm run check` before pushing. This mirrors what CI enforces.

## Architecture & Module Boundaries

Source code is organized into four layers with strict, ESLint-enforced import directions:

```
app  →  features  →  shared
 ↓
content  →  shared
```

**Import rules (enforced by `import/no-restricted-paths` in `eslint.config.js`):**

- `shared` must NOT import from `app`, `features`, or `content`.
- `features` must NOT import from `app` or `content`.
- `content` must NOT import from `app` or `features`.
- Only `app` may compose across all layers.

**Layer structure:**

| Layer      | Path                   | Purpose                                                                        |
| ---------- | ---------------------- | ------------------------------------------------------------------------------ |
| `app`      | `src/app/`             | Entry point, top-level composition (`App.tsx`, `main.tsx`)                     |
| `features` | `src/features/<name>/` | Feature modules (hero, about, projects, education, tech-stack, navbar, footer) |
| `content`  | `src/content/`         | Unified static content module with pure JSON data, schemas, and loaders        |
| `shared`   | `src/shared/`          | Reusable UI components (`ui/`), utilities (`lib/`), types (`types/`)           |

**Feature module convention:**

- Each feature has `index.ts` (public API), `ui/` (components), `model/` (types, logic).
- Import features only via `@features/<name>` — never reach into `ui/` or `model/` directly.

**Content module convention:**

- Content data is strictly JSON in `src/content/data/`.
- Loaders and schemas are internal to the module (`loaders/`, `schemas/`).
- Import content only via `@content` barrel — never reach into internal directories directly.

**Import aliases** (configured in `vite.config.ts` and `tsconfig.app.json`):

- `@app/*`, `@features/*`, `@shared/*`, `@content/*`

## Data & Content Mapping

All personal data is centralized in the following static content JSON files:

| File                                               | Purpose                                                      | Format |
| -------------------------------------------------- | ------------------------------------------------------------ | ------ |
| `src/content/data/profile.json`                    | Identity, about, hero config, certifications, section labels | JSON   |
| `src/content/data/projects.json`                   | Project cards                                                | JSON   |
| `src/content/data/skills.json`                     | Tech stack categories and items                              | JSON   |
| `src/content/data/education.json`                  | Education history and achievements                           | JSON   |
| `site-meta.json`                                   | SEO metadata (injected into `index.html` at build time)      | JSON   |
| `public/favicon.ico`, `public/assets/og-cover.png` | Branding assets                                              | Images |

**Icon registry:** Skills and education reference icons by string keys (e.g., `"java"`, `"python"`).
The registry is in `src/shared/lib/icons/iconRegistry.ts`. To add an icon, import the component
and add a key-value entry — no other files need changes.

**SEO injection:** `index.html` uses `__PLACEHOLDER__` tokens replaced at build time by a Vite
`transformIndexHtml` plugin reading from `site-meta.json`. Do not hardcode personal data in `index.html`.

## Code Style & Conventions

Formatting is enforced by Prettier (`.prettierrc.json`) and ESLint (`eslint.config.js`).
Husky pre-commit hook runs lint-staged automatically. Do not bypass it.

Key conventions that cannot be inferred from tool configs alone:

- Use `import type { ... }` for type-only imports (enforced by ESLint `consistent-type-imports`).
- Functional React components only. No class components.
- Export public API through barrel `index.ts` files with named exports.
- Use Zod schemas for all runtime content validation.
- Use `clsx` + `tailwind-merge` for conditional/merged Tailwind class names.
- Framer Motion for all animations. It is globally mocked in unit tests (see `src/test/setup.ts`).
- Import order: builtin → external → internal → parent → sibling → index → object → type (alphabetized, with blank lines between groups).
- Tailwind design tokens: accent palette (pink, primary brand), secondary palette (cyan). Defined via `@theme` variables in `src/index.css`.
- Fonts: Sora Variable (sans-serif), JetBrains Mono Variable (monospace). Loaded via `@fontsource-variable`.

## Testing

### Unit Tests (Vitest + React Testing Library)

- Co-locate test files as `*.test.{ts,tsx}` alongside source files.
- Coverage thresholds enforced at 75% (lines, branches, functions, statements).
- Framer Motion is globally mocked in `src/test/setup.ts` — do NOT re-mock it in individual tests.
- `matchMedia` and `ResizeObserver` are also globally polyfilled in test setup.
- Strict TypeScript lint rules are relaxed in test files (see ESLint config test overrides).

### End-to-End Tests (Playwright)

- Test files live in `e2e/`.
- Tests run against a Vite preview server — `npm run build` must succeed first.
- Use `@desktop` and `@mobile` tags to scope tests by viewport (Chromium + Pixel 7 projects).
- Playwright config: `playwright.config.ts`.

### Adding Tests

- Always add or update tests for code changes. Don't ask — just do it.
- For content loaders, test both valid parsing and error cases (see `loadProjects.test.ts`).

## Boundaries — Do Not Touch

- **Personal content files:** Do not modify JSON files in `src/content/data/` or `site-meta.json` unless explicitly asked. These contain personal portfolio data.
- **Governance files:** Do not modify `LICENSE`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, or `CONTRIBUTING.md` without explicit approval.
- **CI/CD workflows:** Do not modify `.github/workflows/ci.yml` or `.github/workflows/cd.yml` without explicit approval.
- **No secrets:** Never commit `.env` files, API keys, tokens, or credentials. Use `.env.example` for templates.
- **No weakening quality gates:** Do not disable ESLint rules, lower TypeScript strictness, reduce coverage thresholds, or skip pre-commit hooks.

## Deployment & Release

- **CI** (`ci.yml`): Triggers on push to `main` and all PRs. Runs `quality` (lint + typecheck + coverage) then `e2e-smoke`.
- **CD** (`cd.yml`): Triggers after successful CI on `main`. Runs full `npm run check`, builds `dist/`, and deploys to GitHub Pages.
- **Branch protection:** `main` requires passing `quality` and `e2e-smoke` checks.
- **Base URL:** `'/'` in `vite.config.ts` (user site at `<username>.github.io`).
- **Release-only deploys:** Do not push a normal deploy commit to `main`. Every commit that lands on `main` must be a patch release commit, must bump `package.json`/`package-lock.json`, must be tagged, and must have a matching GitHub Release.
- **Patch-only versioning:** Use the next patch version for every change in this repo. Do not use `minor` or `major` bumps unless explicitly instructed.

### Cutting a Patch Release

Follow these exact commands in order:

1. Validate:

```bash
npm run check
```

2. Bump version (no commit/tag):

```bash
npm version patch --no-git-tag-version
```

3. Commit:

```bash
git add .
git commit -m "release: v<version>"
```

4. Tag:

```bash
git tag v<version>
```

5. Push:

```bash
git push origin main --follow-tags
```

6. Create GitHub Release:

```bash
gh release create v<version> --generate-notes
```

Conventions:

- Commit message for release: `release: vX.Y.Z`
- Tag format: `vX.Y.Z`
- `package.json` version MUST match the tag.
- Every commit pushed to `main` MUST follow the release commit convention and have a matching tag and GitHub Release.
- Do not modify CI/CD workflows.
- Do not bypass lint/typecheck/tests.
