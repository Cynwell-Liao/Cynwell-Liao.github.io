# Open-Source Portfolio (GitHub Pages)

[![ci](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/actions/workflows/ci.yml)
[![cd](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/actions/workflows/cd.yml/badge.svg)](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/actions/workflows/cd.yml)
[![release](https://img.shields.io/github/v/release/Cynwell-Liao/Cynwell-Liao.github.io?sort=semver)](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/releases)
[![license](https://img.shields.io/github/license/Cynwell-Liao/Cynwell-Liao.github.io)](LICENSE)

Modern personal portfolio built with React 19, Vite, TypeScript, Tailwind CSS, and Framer Motion.
This is a static frontend app with no backend/API routes.

This project is open source under MIT and is also used as a personal portfolio.
Forks and small improvements are welcome.

## Tech Stack

- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS 4
- Framer Motion 12
- GitHub Actions (CI/CD)
- GitHub Pages

## Fork and Run

1. Fork this repository on GitHub.
2. Clone your fork locally.

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
npm run dev
```

3. Open `http://localhost:5173`.

## Customize for Your Portfolio

### Step 1 — Personal Information _(required)_

Edit `src/content/data/profile.json`:

- **`name` / `title` / `tagline`** — core identity.
- **`about`** — biography paragraphs.
- **`hero`** — terminal prompt and directories.
- **`certifications`** — certification badge URLs.
- **`navLinks`** — top navigation links.
- **`labels`** _(optional)_ — section headings and button text.

### Step 2 — Projects _(required)_

Edit `src/content/data/projects.json` — title, summary, highlights, stack, links.

### Step 3 — Skills & Education _(required)_

Edit `src/content/data/skills.json` — tech stack categories. Icons reference keys from `src/shared/lib/icons/iconRegistry.ts`.
Edit `src/content/data/education.json` — academic background and achievements.

### Step 4 — SEO Metadata _(required)_

Edit `site-meta.json` (project root) — name, site URL, description, keywords, Google verification. These values are injected into `index.html` at build time.

### Step 5 — Branding _(optional)_

- Replace `public/favicon.ico` and `public/assets/og-cover.png`.
- Update `public/sitemap.xml` and `public/robots.txt` with your site URL.

### Adding New Skill Icons

1. Install/import the icon component in `src/shared/lib/icons/iconRegistry.ts`.
2. Add a key-value entry (e.g., `react: SiReact`).
3. Use the key in `skills.json` (`"icon": "react"`).

## Deploy Your Fork to GitHub Pages

The deployment workflow is already included in `.github/workflows/cd.yml`.

Use one of these modes:

- User site repository (`<username>.github.io`): keep `base: '/'` in `vite.config.ts`.
- Project site repository (`<repo-name>`): change Vite base in `vite.config.ts` to `'/<repo-name>/'` and update `site-meta.json` `siteUrl` to your final Pages URL.

Then:

1. In GitHub: `Settings` -> `Pages` -> `Build and deployment` -> `Source: GitHub Actions`.
2. Push to `main` (or run `cd.yml` manually with workflow dispatch).

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
npm run check
```

## Architecture Overview

`src` is organized by app shell, feature modules, shared utilities, and content:

- `src/app`: app entry and composition
- `src/features`: feature modules (`about`, `hero`, `projects`, `education`, etc.)
- `src/shared`: shared UI and reusable logic
- `src/content`: static content and validated loaders

Import aliases:

- `@app/*`
- `@features/*`
- `@shared/*`
- `@content/*`

## Open Source Governance

- License: [MIT](LICENSE)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security: [SECURITY.md](SECURITY.md)
- Community discussion and reporting: [GitHub Discussions](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/discussions)

## Recommended GitHub Repository Settings

- Enable `Issues`.
- Enable `Discussions`.
- Protect `main` with pull requests and required checks: `quality`, `e2e-smoke`.
