# Richard Lloyd Promotion Site Blueprint

## System Overview
A high-performance personal promotion and executive advisory web application built with React 18, TypeScript, Vite, and Tailwind CSS. The system integrates with Wix Headless CMS for dynamic articles and services data, Resend for automated contact inquiries, and GitHub Actions for continuous testing and automated PR code reviews.

## Local Interface & Invariants
- `vite.config.ts`: Configures Vite build options, code splitting (`vendor-react`, `vendor-motion`, `vendor-query`, `vendor-wix`), local dev server on port 3001, and Vitest test runner with 86% coverage thresholds.
- `playwright.config.ts`: End-to-end browser testing suite across Chromium, Firefox, Mobile Chrome, and Mobile Safari against dev server at `http://localhost:3001`.
- `eslint.config.js`: ESLint flat configuration enforcing React Hooks, React Refresh, and TypeScript lint rules.

## Subdirectories & System Boundaries
- [API](./api/README.md) — Serverless API route handlers for contact inquiry email dispatch via Resend and Wix Headless CMS blog proxy endpoints.
- [Scripts](./scripts/README.md) — CI automation scripts for pull request review generation using OpenRouter LLMs with deterministic fallback heuristics.
- [Source](./src/README.md) — Frontend client application subsystem providing layout chrome, presentation sections, design system primitives, custom hooks, and page routing.

## Global Invariants
- All client-side pages and components run under React 18 StrictMode and React Router v7.
- External CMS interactions are isolated behind TanStack Query hooks with local fallback states for resilience against external API outages.
- Contact inquiries are processed strictly serverless; API keys (`RESEND_API_KEY`, `CONTACT_EMAIL`) never leak to client bundles.
- Unit and integration tests must satisfy minimum 86% coverage thresholds across lines, functions, branches, and statements.

## Global Side Effects
- Serves interactive single-page application on port 3001 (or configured runtime port).
- Connects to external third-party services: Wix Headless CMS APIs (`@wix/sdk`, `@wix/blog`), Resend email API, and OpenRouter LLM APIs (in CI).

## System Verification
- Run: `npm test`
