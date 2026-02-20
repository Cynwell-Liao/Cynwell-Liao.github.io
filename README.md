# Cynwell Portfolio (GitHub Pages)

Modern personal portfolio built with React 18, Vite, TypeScript, Tailwind CSS, and Framer Motion.  
This repository is a single static app (no backend, no API routes, no runtime external API calls).

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Framer Motion
- GitHub Actions for:
  - contribution graph generation
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

## Key Files

- `src/data/projects.json`: local project source data
- `src/types/portfolio.ts`: TypeScript interfaces
- `public/assets/github-contrib.svg`: locally served contribution graph
- `public/resume.pdf`: downloadable static resume
- `scripts/generate-github-contrib.mjs`: graph generation script
- `.github/workflows/update-github-contrib.yml`: contribution update workflow
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment workflow

## Contribution Graph Workflow

Workflow: `.github/workflows/update-github-contrib.yml`

How it works:

1. Runs weekly and can be triggered manually from the Actions tab.
2. Executes `npm run generate:contrib`.
3. Script uses GitHub GraphQL (`secrets.GITHUB_TOKEN`) to fetch contribution history for `${{ github.repository_owner }}`.
4. Saves SVG to `public/assets/github-contrib.svg`.
5. Commits and pushes changes if the generated file changed.

Manual trigger:

1. Open the repo on GitHub.
2. Go to **Actions**.
3. Select **Update GitHub Contribution Graph**.
4. Click **Run workflow**.

## GitHub Pages Deployment

Workflow: `.github/workflows/deploy-pages.yml`

How it works:

1. Triggers on pushes to `main`/`master` and manual dispatch.
2. Installs dependencies with `npm ci`.
3. Builds the static site with `npm run build`.
4. Uploads `dist/` and deploys using official GitHub Pages actions.

Setup:

1. Repository should be `username.github.io`.
2. In GitHub Settings → Pages, select **GitHub Actions** as the source.
3. Keep Vite base as `/` for user-site root deployment.

## Customize

1. Update profile data in `src/data/profile.ts`.
2. Replace project entries in `src/data/projects.json`.
3. Replace `public/resume.pdf` with your actual resume.
