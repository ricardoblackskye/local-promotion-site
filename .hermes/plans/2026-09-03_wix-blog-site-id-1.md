# Wix Blog Production Site Routing Fix Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Serve live Wix Blog posts through a same-origin Vercel Serverless Function so production does not make browser requests directly to the Wix Blog API and therefore bypasses the Wix Blog CORS limitation.

**Current status:** The first site-routing hypothesis was tested and rejected. The installed SDK's global `wix-site-id` header caused browser preflight failures and `WDE0117: MetaSite not found`; it has been removed. The current branch is back to the working CMS baseline, but the Blog list remains CORS-blocked in deployed browsers.

**Architecture:** Move only the Blog list request behind `api/blog.ts`. The browser calls same-origin `/api/blog`; the Vercel Node.js function creates a server-side Wix SDK client, obtains visitor tokens without browser storage, calls `posts.listPosts`, validates and normalizes the response, and returns a small JSON payload. Keep the existing client-side Wix client for the other CMS sections and do not add global vendor headers. For local development, use `vercel dev` (or document an equivalent Vite-to-function proxy) so `/api/blog` exercises the same serverless path.

**Tech Stack:** React 18, TypeScript, Vite, `@wix/sdk`, `@wix/data`, `@wix/blog`, Vitest.

---

## Section A: Verified findings / audit

- GitHub issue: **#1 — Article tiles (main page)**.
- The reported production failure is specific to the Wix Blog list request:
  ```text
  GET https://edge.wixapis.com/v3/posts?featured=true&paging.limit=3
  Access-Control-Allow-Origin: http://localhost:3001
  request origin: https://black-skye.vercel.app
  ```
- The Vercel site successfully receives live Wix CMS data for other sections, so the Wix client ID, visitor authentication, deployment, and general Wix connectivity are working.
- `src/hooks/useWixBlog.ts` calls `wixClient.posts.listPosts(...)`; the failure is swallowed into `{ posts: [] }`, after which `Blog.tsx` uses fallback posts.
- `src/lib/wixClient.ts` reads `import.meta.env.VITE_WIX_SITE_ID` at line 6, but the current browser client does not provide a supported way to make the Blog API's CORS policy follow each Vercel deployment origin:
  ```ts
  OAuthStrategy({ clientId: clientId ?? '' })
  ```
- The installed SDK (`@wix/sdk` 1.21.5) does **not** accept `siteId` in `OAuthStrategy`; TypeScript rejects that property. A global `wix-site-id` header was tested as an alternative, but Wix rejected it during browser preflight and returned `WDE0117: MetaSite not found`.
- The user has configured the required Wix/Vercel variables and requested a same-origin serverless proxy followed by a later redeploy.
- Existing untracked `.vercel/` metadata and `scripts/diag-wix-blog.mjs` were preserved in a stash before branch creation; they are unrelated to the production fix and must not be added by this plan.

## Root cause (verified)

The app's Blog API request receives a CORS policy for `http://localhost:3001` rather than `https://black-skye.vercel.app`, while other Wix CMS requests work. The first attempted remedy—adding `wix-site-id` globally—was rejected by Wix preflight and caused all CMS requests to fail with `WDE0117: MetaSite not found`; that remedy has been reverted. The remaining Blog-specific root cause is not yet confirmed.

## Intended fix

Move the Blog list request to a same-origin serverless endpoint:

```text
Browser → /api/blog → Vercel Node.js function → Wix Blog API
```

The function will use `process.env.VITE_WIX_CLIENT_ID` server-side, create an isolated Wix client with the `posts` module, generate visitor tokens using a server-safe per-request/in-memory strategy, call `listPosts({ paging: { limit: 6 }, featured: true })`, and return only the fields needed by `BlogPost` cards. The browser-side Wix client remains unchanged for the other CMS sections.

The API will return explicit JSON errors and status codes instead of exposing Wix error details to visitors. The frontend hook will fetch `/api/blog` and throw on non-2xx responses so React Query's error state is observable; `Blog.tsx` may retain its existing fallback policy unless the implementation task confirms a better user-facing error state.

Do not add `wix-site-id` as a global browser header. Do not expose a client secret. The Wix client ID is read from the server-side environment for the function, and Vercel must have it in the relevant Preview/Production environments.

---

## Task 1: Add the serverless Blog API contract test (RED)

**Objective:** Define the same-origin endpoint's method, configuration, Wix response mapping, and failure behavior before implementation.

**Files:**
- Create: `api/blog.test.ts`
- Implementation target: `api/blog.ts`

**Step 1: Write failing tests**

Using the existing `api/contact.test.ts` pattern and Node test environment, mock the Wix SDK and cover:

- GET requests are accepted and return JSON posts.
- The handler passes the configured client ID to `OAuthStrategy` and does not require browser `localStorage`.
- Wix posts are mapped to the public response shape: `_id`, `title`, `excerpt`, `slug`, `coverImage`, `publishedDate`, `readingTime`, `categories`, and `featured`.
- The handler requests no more than six posts.
- Missing `VITE_WIX_CLIENT_ID` returns HTTP 500 with a generic `Server misconfiguration` error.
- Wix API/token failures return HTTP 502 with a generic upstream error and do not leak credentials.
- Unsupported methods return HTTP 405.

Use fake Wix responses and no real credentials or network calls.

**Step 2: Run the focused test to verify RED**

```bash
npm test -- api/blog.test.ts
```

Expected: FAIL because `api/blog.ts` does not exist.

**Step 3: Commit the RED test**

```bash
git add api/blog.test.ts
git commit -m "test(blog): define serverless proxy contract"
```

---

## Task 2: Implement `/api/blog.ts` (GREEN)

**Objective:** Proxy the Wix Blog list request server-side without browser CORS.

**Files:**
- Create: `api/blog.ts`
- Test: `api/blog.test.ts`

**Step 1: Implement the minimal handler**

Follow the existing `api/contact.ts` Web API `Request`/`Response` style. The handler should:

1. Accept GET only.
2. Read `process.env.VITE_WIX_CLIENT_ID` and return 500 if absent.
3. Create a Wix client with only the `posts` module and `OAuthStrategy({ clientId, tokenStorage: ... })` using a server-safe per-request/in-memory token storage implementation if required by the installed SDK.
4. Call `generateVisitorTokens()` in the serverless runtime, without `window`, browser `localStorage`, or shared mutable tokens between requests.
5. Call `posts.listPosts({ paging: { limit: 6 }, featured: true })`.
6. Map Wix posts defensively, including Wix image references to `static.wixstatic.com` URLs using the existing media helper or a small server-safe equivalent.
7. Return a five-minute shared cache with stale-while-revalidate behavior only if compatible with the desired freshness, plus `Content-Type: application/json`.
8. Return generic errors for missing configuration and upstream failures; log only safe diagnostic context.

The function must not import `src/lib/wixClient.ts`, because that module performs browser-only `localStorage` operations at module load time.

**Step 2: Run the focused test to verify GREEN**

```bash
npm test -- api/blog.test.ts
```

Expected: all Blog API contract tests pass.

**Step 3: Commit the implementation**

```bash
git add api/blog.ts
git commit -m "feat(blog): add Wix serverless proxy"
```

---

## Task 3: Route `useWixBlog` through the same-origin proxy

**Objective:** Replace the browser-side Wix Blog API call with a request to `/api/blog` while preserving the existing `BlogPost[]` mapping contract.

**Files:**
- Modify: `src/hooks/useWixBlog.ts`
- Test: `src/test/hooks/useWixBlog.test.ts`

**Step 1: Write the failing test**

Update the hook tests to mock `fetch` and assert:

- The hook requests `/api/blog` with GET.
- A successful proxy response produces the expected `BlogPost[]`.
- A non-OK proxy response rejects so the failure is not silently treated as a successful empty Wix response.
- The hook no longer calls `wixClient.posts.listPosts`.

Run the focused test and confirm RED against the current direct-SDK implementation.

**Step 2: Implement the minimal frontend change**

Use `fetch('/api/blog')`, parse JSON, throw on non-OK responses, and return the proxy's validated posts. Keep the existing query key, stale time, and caller-facing `BlogPost[]` type unless tests demonstrate a necessary adjustment.

**Step 3: Run focused and full tests**

```bash
npm test -- src/test/hooks/useWixBlog.test.ts
npm test
```

Expected: focused tests and the full suite pass.

**Step 4: Commit the frontend integration**

```bash
git add src/hooks/useWixBlog.ts src/test/hooks/useWixBlog.test.ts
 git commit -m "feat(blog): fetch posts through same-origin proxy"
```

---

## Task 4: Validate local and Vercel function behavior

**Objective:** Prove the proxy works in both the Vercel runtime and the deployed browser without reintroducing CORS failures.

**Files:**
- Validate: `api/blog.ts`, `api/blog.test.ts`, `src/hooks/useWixBlog.ts`, `src/test/hooks/useWixBlog.test.ts`

Run:

```bash
npm run build
npm test
npx cspell .hermes/plans/2026-09-03_wix-blog-site-id-1.md api/blog.ts api/blog.test.ts src/hooks/useWixBlog.ts src/test/hooks/useWixBlog.test.ts
```

The repository's `npm run lint` currently cannot run because no ESLint configuration file exists; record that pre-existing limitation rather than masking it. Run applicable MegaLinter checks if available and resolve findings on changed files.

For local runtime validation, use:

```bash
vercel dev
```

with `VITE_WIX_CLIENT_ID` available to the local Vercel runtime. Verify:

```bash
curl -i http://localhost:3000/api/blog
```

Expected: HTTP 200 JSON from the proxy, or a clear HTTP 500/502 configuration/upstream error—not a browser CORS error.

---

## Task 5: Redeploy and verify production behavior

**Objective:** Confirm the deployed browser calls only the same-origin proxy and live posts render.

**Prerequisites:**
- `VITE_WIX_CLIENT_ID` exists in Vercel Preview and Production environments.
- The implementation has passed Task 4.
- User explicitly authorizes redeployment; this plan does not deploy automatically.

Deployment:

```bash
vercel deploy --prod
```

Browser validation:

1. Open `https://black-skye.vercel.app` or an authenticated/unprotected Preview URL.
2. Inspect Network requests and confirm the browser requests `/api/blog`, not `https://edge.wixapis.com/v3/posts`.
3. Confirm `/api/blog` returns HTTP 200 JSON containing the live Wix article.
4. Confirm the page renders the live article card.
5. Confirm the article link still opens `/blog/:slug` and the detail page remains functional.
6. Confirm no Wix Blog CORS error appears. Other Wix CMS sections must continue to show their live data.

---

## Files likely to change

- Create: `api/blog.ts`
- Create: `api/blog.test.ts`
- Modify: `src/hooks/useWixBlog.ts`
- Modify: `src/test/hooks/useWixBlog.test.ts`
- Modify: `.hermes/plans/2026-09-03_wix-blog-site-id-1.md`

No global Wix request headers, changes to `src/lib/wixClient.ts`, changes to `vercel.json`, or changes to unrelated CMS sections are planned.

- **Risk:** Wix Blog API authentication may require a server-safe token strategy different from the browser SDK path. The API contract tests and deployed `/api/blog` request are the acceptance checks; do not claim resolution without them.
- **Risk:** Vercel must rebuild after any client-side code or `VITE_*` change because Vite embeds those values at build time.
- **Compatibility:** The working client construction remains unchanged after the rejected global-header experiment was reverted.
- **Scope:** This issue addresses the production Blog API/CORS failure only. It does not implement the separate visual/content changes originally described in #1 (retitling the section, changing the tile design, or increasing the displayed count to six).
- **Open question:** If the serverless proxy cannot authenticate with the public client ID, determine whether Wix requires an approved server-side credential or a different Wix Blog API access mode before implementing another browser-side workaround.

## Implementation outcome / follow-up investigation

The attempted `wix-site-id` header implementation was reverted after Preview browser evidence showed it broke every Wix request:

```text
Request header field wix-site-id is not allowed by Access-Control-Allow-Headers in preflight response
WDE0117: MetaSite not found.
```

This proves that `wix-site-id` cannot be added as a global browser header for this Wix client/site configuration. The working CMS behavior is restored, but the original Blog-specific CORS issue remains unresolved. The next fix must be based on a Wix-supported Blog/client configuration or an architecture that avoids the browser Blog API CORS limitation; do not redeploy the rejected header implementation.
