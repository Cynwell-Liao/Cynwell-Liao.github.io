# Architecture

This repository is a static, client-only portfolio deployed to GitHub Pages. Its
architecture is deliberately smaller than a general-purpose React application:
there is one page, no server runtime, no API layer, no client-side router, and no
remote data cache.

React does not prescribe a canonical folder structure. The structure here applies
React's component and one-way data-flow guidance, Vite's client-only SPA model,
and TypeScript's recommendation to separate distinct runtime environments.

## Source layout

```text
src/
├── app/       Application entry point and cross-feature composition
├── content/   Static JSON, Zod schemas, and validated content loaders
├── features/  User-facing portfolio sections and interactive capabilities
├── shared/    Reusable UI, utilities, and dependency-free contracts
└── test/      Test setup and factories shared by multiple modules
```

The dependency direction is:

```text
app ──────> features ──────> shared
 │                            ▲
 └────────> content ──────────┘
```

- `app` is the composition root. It may import every lower layer and is the only
  layer that connects validated content to feature components.
- `features` are organized by product capability, not by technical file type.
  Each feature owns its UI and feature-specific model logic.
- `content` owns untrusted static input. JSON is parsed at the boundary before it
  reaches the component tree.
- `shared` contains code that is genuinely reused and has no dependency on a
  product feature, application composition, or content implementation.

These directions are enforced by ESLint and verified by
`config/moduleBoundaries.test.ts`; they are not merely naming conventions.

## Module boundaries

Each feature and the content module exposes an `index.ts` public API. Consumers
outside a module import that API rather than reaching into `ui/`, `model/`,
`schemas/`, `loaders/`, or `data/`.

Inside a feature:

```text
feature-name/
├── index.ts   Minimal public API
├── model/     Feature state, hooks, types, and pure logic
└── ui/        React components and adjacent feature CSS
```

Not every feature needs every directory. A small feature should remain small;
empty layers and speculative abstractions are not added for symmetry.

## Data flow

```text
JSON -> Zod schema -> content loader -> App -> feature props -> UI
```

Content loading is synchronous because the JSON is bundled at build time. Feature
components receive explicit props and do not import personal content directly.
This keeps them testable with fixtures and prevents portfolio data from becoming
an implicit global dependency.

Application-wide interactive state stays in `App` only when multiple features
coordinate around it. State and hooks used by one capability stay in that
feature's `model/` directory. Reusable browser behavior belongs in `shared` only
after it has a real cross-feature consumer.

## Tooling boundaries

TypeScript projects follow execution environments:

- `tsconfig.app.json` covers browser source.
- `tsconfig.node.json` covers build and test configuration running in Node.js.
- `tsconfig.e2e.json` covers Playwright tests, which use Node.js and DOM types.
- `tsconfig.json` is the solution entry point referencing all three.

Static files that must keep stable public names live in `public/`. Source modules,
styles, and JSON that participate in the module graph live in `src/`. Build-time
metadata logic lives in `config/`; executable maintenance scripts live in
`scripts/`; browser tests live in `e2e/`.

## Deliberate non-goals

Do not add these without a concrete product requirement:

- SSR, server components, API routes, or server-only modules
- a router for in-page anchor navigation
- a global state library for local UI coordination
- a repository or service layer over bundled static JSON
- a monorepo or package-per-layer layout
- generic `components/`, `hooks/`, or `utils/` dumping grounds

If the site gains multiple pages, remote data, or a server runtime, revisit this
decision rather than stretching the current layers to model a different product.

## Primary guidance

- [React: Creating a React App](https://react.dev/learn/creating-a-react-app)
- [React: Build a React App from Scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [React: Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components)
- [React: Thinking in React](https://react.dev/learn/thinking-in-react)
- [Vite: Getting Started](https://vite.dev/guide/)
- [Vite: Static Asset Handling](https://vite.dev/guide/assets.html)
- [TypeScript: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Zod: Basic usage and inferred types](https://zod.dev/basics)
