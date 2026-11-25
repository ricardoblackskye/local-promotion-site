# Hooks

## Overview
Custom React hooks managing viewport scroll tracking and cached TanStack Query integrations for Wix CMS collections and blog endpoints.

## Interface
- `useScrollProgress: () => { scrollY: number; isPastHero: boolean }` — Tracks scroll position and whether the viewport has scrolled past the hero threshold.
- `useWixData: <T>(collectionId: string, limit?: number) => UseQueryResult<T[], Error>` — Generic hook for querying Wix collection items with caching.
- `useWixServices: (limit?: number) => UseQueryResult<Service[], Error>` — Fetches services list from Wix CMS.
- `useWixBlog: (limit?: number) => UseQueryResult<BlogPost[], Error>` — Fetches recent blog posts from `/api/blog`.
- `useWixPost: (slug: string) => UseQueryResult<BlogPost, Error>` — Fetches single blog post by slug from `/api/blog-post`.

## Invariants
- All Wix CMS queries share a default 5-minute `staleTime` cache policy.
- `useScrollProgress` attaches passive event listener to window scroll and detaches on unmount.
- `useWixData` and `useWixServices` safely catch query errors and resolve with empty fallback collections.
- `useWixPost` disables query retries on failure to prevent repeated 404 lookups.

## Side Effects
- Registers and unregisters passive scroll event listener on `window`.
- Performs network HTTP requests via `fetch` and `wixClient.items.query`.

## Verification
- Run: `npm test`
