# API Route Handlers

## Overview
Serverless API endpoints for contact inquiry handling via Resend email dispatch and Wix blog proxy queries.

## Interface
- `contact.ts`: `default: async function handler(req: Request): Promise<Response>` — Handles contact form submissions and dispatches email notifications.
- `blog.ts`: `default: asApiHandler((req: Request, res?: VercelResponse) => Promise<Response | void>)` — Queries and returns up to 6 featured blog posts from Wix Headless CMS.
- `blog-post.ts`: `default: asApiHandler((req: Request, res?: VercelResponse) => Promise<Response | void>)` — Fetches a single blog post by slug with full text and rich content fieldsets.
- `blog-shared.ts`: Shared helper functions and types (`asApiHandler`, `handleWixRequest`, `mapWixPost`, `toIsoDate`, `json`, `WixPost`, `VercelResponse`, `ApiHandler`).

## Invariants
- `contact.ts`: Only handles HTTP POST requests; returns status 405 Method not allowed for all other HTTP methods.
- `contact.ts`: Validates JSON payload with `name`, `email`, and `message` fields; returns status 400 for malformed JSON or missing required fields.
- `contact.ts`: Email field validated against regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- `contact.ts`: Input fields sanitized to strings and truncated to maximum length of 5,000 characters.
- `contact.ts`: Requires `CONTACT_EMAIL` and `RESEND_API_KEY` environment variables.
- `blog.ts` & `blog-post.ts`: Only handle HTTP GET requests; return status 405 Method not allowed for other methods.
- `blog.ts`: Limits featured posts to maximum of 6 (`MAX_FEATURED_POSTS = 6`); sets response cache header `Cache-Control: s-maxage=300, stale-while-revalidate=600`.
- `blog-post.ts`: Requires non-empty `slug` query parameter; returns status 400 if missing or 404 if post not found.

## Side Effects
- Transmits transactional email via Resend API to `CONTACT_EMAIL` with user `reply_to` address.
- Performs external API calls to Wix Headless API (`@wix/sdk`, `@wix/blog`) to query posts.
- Emits diagnostic/error logs to `console.error`.

## Verification
- Run: `npm test`
