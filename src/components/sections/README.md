# Section Components

## Overview
Full-page presentation sections covering Hero, About, Services, AI Focus, Case Studies, Insights/Blog, and Contact forms.

## Interface
- `Hero: () => JSX.Element` — Hero banner with animated headline, subtitle, and CTA buttons.
- `About: () => JSX.Element` — Executive biography with CMS integration and local fallback.
- `Services: () => JSX.Element` — Consulting offerings and capabilities grid.
- `AIFocus: () => JSX.Element` — AI strategy and executive leadership focus section.
- `CaseStudies: () => JSX.Element` — Interactive portfolio grid with modal detail view.
- `Blog: () => JSX.Element` — Recent articles and publications feed.
- `Contact: () => JSX.Element` — Direct inquiry form with serverless submission.

## Invariants
- Sections trigger staggered entry animations once viewport intersection reaches threshold (0.1 - 0.15).
- Data-driven sections gracefully fall back to local constants when Wix CMS queries are empty or fail.
- Contact form validates non-empty name, RFC-compliant email, and message before dispatching POST requests.
- CMS HTML content in About section is sanitized via DOMPurify before `dangerouslySetInnerHTML` injection.

## Side Effects
- Sends POST request to `/api/contact` on contact form submission.
- Fetches CMS data via TanStack Query (`SpeakingEvents`, `HomeSectionTwo`, `Services`, `CaseStudies`, `/api/blog`).
- Controls modal overlay dialog DOM state when a case study card is selected.

## Verification
- Run: `npm test`
