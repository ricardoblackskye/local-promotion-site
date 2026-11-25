# Frontend Source Subsystem

## System Overview
Application client root providing client bootstrapping, React Router declarative routing, global Tailwind stylesheet configurations, and TanStack QueryClient provider context.

## Local Interface & Invariants
- `App: () => JSX.Element` — Root component defining query provider and route table (`/` -> `HomePage`, `/blog/:slug` -> `BlogPostPage`).
- `ImportMetaEnv: interface` — Ambient environment variable typing (`VITE_WIX_CLIENT_ID`, `VITE_WIX_SITE_ID`).
- `main.tsx` validates existence of `#root` DOM container before calling `createRoot` or throws an Error.
- `index.css` defines base CSS custom properties (`--accent`, `--accent-dim`, `--surface`, `--border-subtle`), typography classes, accessibility focus styles, and keyframe animations (`grid-pulse`, `cursor-blink`).

## Subdirectories & System Boundaries
- [Components](./components/README.md) — UI component tree containing layout chrome, full-page sections, and atomic UI design system primitives.
- [Hooks](./hooks/README.md) — Custom React hooks for viewport scroll monitoring and cached TanStack Query integrations.
- [Lib](./lib/README.md) — Global constants, pre-configured Wix SDK client, media formatters, and Ricos AST rich text renderer.
- [Pages](./pages/README.md) — Route view components for dynamic article pages.
- [Types](./types/README.md) — TypeScript type definitions and domain model contracts.

## Global Invariants
- All client-side pages and components run under React 18 StrictMode and React Router v7.
- External CMS interactions are isolated behind TanStack Query hooks with fallback states.

## Global Side Effects
- Renders the React DOM tree into `#root`.
- Injects global theme variables, custom scroll properties, and animations into browser window and document root.

## System Verification
- Run: `npm test`
