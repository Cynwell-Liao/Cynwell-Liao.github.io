# Contributing

Thanks for your interest in contributing.

This repository is primarily maintained as a personal portfolio project.
Bug fixes and small improvements are welcome.

## Workflow

1. Fork the repository and clone it locally.
2. Install dependencies: `npm ci` and `npx playwright install chromium`.
3. Create a feature branch from `main`.
4. Make focused changes with tests where relevant.
5. Run local checks:
   - Full authoritative quality gate: `npm run check` (runs format check, linting, typecheck, coverage, build with bundle budget, and e2e smoke tests).
   - Or run individual commands during development: `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`.
6. Open a pull request with a clear description of what changed and why.

## Scope and Style

- Keep pull requests small and aligned with the existing architecture.
- Follow existing naming and module boundaries.
- Do not introduce secrets or sensitive data.
