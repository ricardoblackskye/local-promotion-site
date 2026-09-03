# Wix Blog Production Site Routing Fix Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the Wix Blog API requests from the Vercel deployment use the configured Wix site ID so the production blog request receives the correct CORS policy and returns the site's live posts.

**Architecture:** Keep the existing browser-side Wix SDK integration and visitor-token flow. Pass the already-configured `VITE_WIX_SITE_ID` as the SDK's `wix-site-id` client header, making site selection explicit without changing the CMS data hooks or deployment architecture.

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
- `src/lib/wixClient.ts` already reads `import.meta.env.VITE_WIX_SITE_ID` at line 6 and warns when it is missing, but currently constructs the client without a site header:
  ```ts
  OAuthStrategy({ clientId: clientId ?? '' })
  ```
  Therefore the configured site ID is not passed to the SDK.
- The installed SDK (`@wix/sdk` 1.21.5) does **not** accept `siteId` in `OAuthStrategy`; TypeScript rejects that property. Its `createClient` API accepts default headers, and the SDK's supported site-routing header is `wix-site-id`.
- The user has already configured the site ID in Vercel and wants the code change followed by a later redeploy.
- Existing untracked `.vercel/` metadata and `scripts/diag-wix-blog.mjs` were preserved in a stash before branch creation; they are unrelated to the production fix and must not be added by this plan.

## Root cause (verified)

The app reads the production Wix site ID but discards it when creating the Wix client. As a result, the Blog API request does not receive explicit site routing, and Wix returns a CORS policy for the localhost origin rather than `https://black-skye.vercel.app`. The CMS Data API happens to work without explicit routing, which is why this defect is isolated to the Blog API in the deployed app.

## Intended fix

Modify only the Wix client construction so the supported `wix-site-id` header is included when the site ID is configured:

```ts
auth: OAuthStrategy({
  clientId: clientId ?? '',
  siteId: siteId || undefined,
}),
```

Keep `siteId` optional for local or existing configurations where it is absent. Do not change the `featured: true` behavior, fallback content, Vercel settings, Wix settings, or unrelated UI in this issue.

---

## Task 1: Add a regression assertion for explicit site routing

**Objective:** Establish a test that fails unless `VITE_WIX_SITE_ID` is forwarded to `OAuthStrategy`.

**Files:**
- Modify: `src/test/lib/wixClient.test.ts`
- Test target: the existing Wix client construction/auth-strategy tests in that file

**Step 1: Write the failing test**

Extend the existing client-construction test setup to assert that when `VITE_WIX_CLIENT_ID` and `VITE_WIX_SITE_ID` are configured, `createClient` receives `{ 'wix-site-id': 'test-site-id' }` in its headers. Use the existing module-mocking approach in `src/test/lib/wixClient.test.ts`; do not expose real credentials in test output.

The assertion must distinguish the desired `{ headers: { 'wix-site-id': 'test-site-id' } }` client configuration from the current implementation, so it must fail before the production change.

**Step 2: Run the focused test to verify RED**

Run:

```bash
npm test -- src/test/lib/wixClient.test.ts
```

Expected: FAIL because the current `createClient` call omits the `wix-site-id` header.

**Step 3: Commit the RED test**

```bash
git add src/test/lib/wixClient.test.ts
git commit -m "test(wix): cover explicit site routing"
```

---

## Task 2: Pass the configured site ID to the Wix SDK request header

**Objective:** Forward the environment-provided site ID as the SDK's supported site-routing header while preserving the optional behavior when it is absent.

**Files:**
- Modify: `src/lib/wixClient.ts:16-19`

**Step 1: Implement the minimal fix**

Change the client construction to:

```ts
export const wixClient = createClient({
  modules: { items, posts },
  headers: siteId ? { 'wix-site-id': siteId } : undefined,
  auth: OAuthStrategy({
    clientId: clientId ?? '',
  }),
})
```

Do not change token storage, the blog hook, filtering, or fallback rendering.

**Step 2: Run the focused test to verify GREEN**

Run:

```bash
npm test -- src/test/lib/wixClient.test.ts
```

Expected: PASS, including the new explicit-header-routing assertion and all existing Wix client tests.

**Step 3: Commit the implementation**

```bash
git add src/lib/wixClient.ts
git commit -m "fix(wix): route SDK calls to configured site"
```

---

## Task 3: Run full validation and local lint gates

**Objective:** Confirm the change has no TypeScript, unit-test, build, or lint regressions before pushing the implementation branch.

**Files:**
- Validate changed files: `src/lib/wixClient.ts`, `src/test/lib/wixClient.test.ts`
- Also validate this plan file with the repository's configured spell/lint checks.

Run:

```bash
npm test
npm run build
npm run lint
npx cspell .hermes/plans/2026-09-03_wix-blog-site-id-1.md src/lib/wixClient.ts src/test/lib/wixClient.test.ts
```

Expected:
- Vitest exits 0 with all tests passing.
- TypeScript compilation and Vite production build exit 0.
- ESLint exits 0 with no warnings.
- cspell exits 0 for the changed source and plan.

If the repository's MegaLinter configuration requires additional local checks, run the relevant checks for the changed files and resolve every finding before pushing. Do not include `.vercel/` or the diagnostic script from the stash.

---

## Task 4: Redeploy and verify production behavior (after implementation approval)

**Objective:** Confirm the deployed Wix Blog request uses the configured site and no longer receives the localhost CORS header.

**Prerequisites:**
- `VITE_WIX_SITE_ID` is configured in Vercel Production, as the user has reported.
- The implementation branch has passed Task 3.
- User explicitly authorizes deployment/redeployment; this plan phase does not deploy automatically.

Deployment command:

```bash
vercel deploy --prod
```

Browser validation at `https://black-skye.vercel.app`:

1. Open a private/incognito window or clear the site's Wix token storage.
2. Inspect the request to `https://edge.wixapis.com/v3/posts?...`.
3. Confirm the request succeeds and the response no longer contains:
   ```text
   Access-Control-Allow-Origin: http://localhost:3001
   ```
4. Confirm the home page displays the live Wix article rather than the hardcoded fallback title.
5. Confirm an article link still opens `/blog/:slug` and the detail page remains functional.

The expected result is a successful Blog API response from the Vercel origin and live blog content rendered in the home-page Insights section.

---

## Files likely to change

- `src/lib/wixClient.ts` — pass `siteId` as the SDK's `wix-site-id` client header.
- `src/test/lib/wixClient.test.ts` — regression coverage for the forwarded site ID.
- `.hermes/plans/2026-09-03_wix-blog-site-id-1.md` — this implementation plan.

No changes are planned to `src/hooks/useWixBlog.ts`, `src/components/sections/Blog.tsx`, `vercel.json`, or Vercel/Wix configuration in this issue.

## Risks and open questions

- **Risk:** The Wix Blog API may still require an additional Wix-side origin setting after explicit site routing. The production browser Network response will be the acceptance check; do not claim resolution without it.
- **Risk:** Vercel must rebuild after the code change because Vite embeds `VITE_WIX_SITE_ID` at build time.
- **Compatibility:** `siteId: siteId || undefined` preserves behavior when the variable is missing and avoids passing an empty string.
- **Scope:** This issue addresses the production Blog API/CORS failure only. It does not implement the separate visual/content changes originally described in #1 (retitling the section, changing the tile design, or increasing the displayed count to six).
- **Open question:** If the post-list request remains CORS-blocked after this change and a redeploy, return to Phase 1 of systematic debugging and compare the exact Wix client/site configuration and request headers rather than adding another speculative configuration change.
