# Cynwell Portfolio (GitHub Pages)

[![CI Quality Gates](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/Cynwell-Liao/Cynwell-Liao.github.io/actions/workflows/ci.yml)

Modern personal portfolio built with React 18, Vite, TypeScript, Tailwind CSS, and Framer Motion.
This is a static frontend app with no backend/API routes.

This project is open source under MIT and is also used as a personal portfolio.
Forks and small improvements are welcome.

## Tech Stack

- React 18
- Vite
- TypeScript (strict)
- Tailwind CSS
- Framer Motion
- GitHub Actions (CI + CD)
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

Update these files first:

- `src/content/profile/profile.ts`: name, title, tagline, bio paragraphs, social links, section labels, education items, skills.
- `src/content/projects/projects.json`: project cards (title, summary, highlights, stack, links).
- `index.html`: SEO metadata (`title`, `description`, `author`, canonical URL, `og:*`).
- `public/favicon.ico` and `public/assets/og-cover.svg`: branding and social preview image.

## Deploy Your Fork to GitHub Pages

The deployment workflow is already included in `.github/workflows/cd.yml`.

Use one of these modes:

- User site repository (`<username>.github.io`): keep `base: '/'` in `vite.config.ts`.
- Project site repository (`<repo-name>`): change Vite base in `vite.config.ts` to `'/<repo-name>/'` and update `index.html` canonical/Open Graph URLs to your final Pages URL.

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
