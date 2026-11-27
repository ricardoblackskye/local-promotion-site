# Pages

## Overview
Route view components rendering dynamic views, specifically individual blog article posts by slug.

## Interface
- `BlogPostPage: () => JSX.Element` — Standalone full-page article view with rich content rendering and back navigation.

## Invariants
- Retrieves `slug` parameter from `react-router-dom` `useParams` hook.
- Renders skeleton placeholders while post data is loading and renders not-found fallback view on error.
- Delegates rich content rendering to `renderRichContent` if AST is available or parses plain text paragraphs.

## Side Effects
- Calls `window.history.back()` on user navigation back button click.
- Executes blog post query request on component mount.

## Verification
- Run: `npm test`
