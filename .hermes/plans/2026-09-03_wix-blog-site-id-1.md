# Wix Blog Production Site Routing Fix Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the Wix Blog API requests from the Vercel deployment use the configured Wix site ID so the production blog request receives the correct CORS policy and returns the site's live posts.

**Current status:** The first implementation hypothesis was tested and rejected. The installed SDK accepts a global `wix-site-id` header, but Wix rejects that browser preflight in this project and returns `WDE0117: MetaSite not found`. The header has been removed; this branch does not yet contain a validated production fix.

**Architecture:** Preserve the existing browser-side Wix SDK integration and visitor-token flow while investigating the Blog-specific CORS behavior. Do not add a global site-routing header until Wix confirms that mechanism is supported for this client and browser origin.

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
- The installed SDK (`@wix/sdk` 1.21.5) does **not** accept `siteId` in `OAuthStrategy`; TypeScript rejects that property. A global `wix-site-id` header was tested as an alternative, but Wix rejected it during browser preflight and returned `WDE0117: MetaSite not found`.
- The user has already configured the site ID in Vercel and wants the code change followed by a later redeploy.
- Existing untracked `.vercel/` metadata and `scripts/diag-wix-blog.mjs` were preserved in a stash before branch creation; they are unrelated to the production fix and must not be added by this plan.

## Root cause (verified)

The app's Blog API request receives a CORS policy for `http://localhost:3001` rather than `https://black-skye.vercel.app`, while other Wix CMS requests work. The first attempted remedy—adding `wix-site-id` globally—was rejected by Wix preflight and caused all CMS requests to fail with `WDE0117: MetaSite not found`; that remedy has been reverted. The remaining Blog-specific root cause is not yet confirmed.

## Intended fix

The rejected implementation is recorded for audit only and must not be redeployed:

```ts
auth: OAuthStrategy({
  clientId: clientId ?? '',
  siteId: siteId || undefined,
}),
```

Do not change the `featured: true` behavior, fallback content, Vercel settings, Wix settings, or unrelated UI until the Blog-specific cause is established.

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

## Task 2: Implement the validated Blog-specific fix

**Objective:** Apply only a Wix-supported fix identified by the follow-up investigation; this task is not complete on the current branch.

**Files:**
- Modify: `src/lib/wixClient.ts:16-19`

**Step 1: Implement the minimal fix**

The previously attempted change was:

```ts
export const wixClient = createClient({
  modules: { items, posts },
  // Do not add a global wix-site-id header without Wix-side confirmation.
  headers: siteId ? { 'wix-site-id': siteId } : undefined,
  auth: OAuthStrategy({ clientId: clientId ?? '' }),
})
```

Do not change token storage, the blog hook, filtering, or fallback rendering.

**Step 2: Run the focused test to verify GREEN**

Run:

```bash
npm test -- src/test/lib/wixClient.test.ts
```

Expected: PASS for the eventual validated fix and all existing Wix client tests. The rejected header assertion was removed after Wix rejected the global header in Preview.

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

- `src/lib/wixClient.ts` — candidate Blog/client change once a Wix-supported mechanism is confirmed.
- `src/test/lib/wixClient.test.ts` — regression coverage for the eventual validated behavior.
- `.hermes/plans/2026-09-03_wix-blog-site-id-1.md` — this implementation plan.

No changes are planned to `src/hooks/useWixBlog.ts`, `src/components/sections/Blog.tsx`, `vercel.json`, or Vercel/Wix configuration in this issue.

## Risks and open questions

- **Risk:** The Wix Blog API may still require an additional Wix-side origin setting after explicit site routing. The production browser Network response will be the acceptance check; do not claim resolution without it.
- **Risk:** Vercel must rebuild after any client-side code or `VITE_*` change because Vite embeds those values at build time.
- **Compatibility:** The working client construction remains unchanged after the rejected global-header experiment was reverted.
- **Scope:** This issue addresses the production Blog API/CORS failure only. It does not implement the separate visual/content changes originally described in #1 (retitling the section, changing the tile design, or increasing the displayed count to six).
- **Open question:** If the post-list request remains CORS-blocked after this change and a redeploy, return to Phase 1 of systematic debugging and compare the exact Wix client/site configuration and request headers rather than adding another speculative configuration change.

## Implementation outcome / follow-up investigation

The attempted `wix-site-id` header implementation was reverted after Preview browser evidence showed it broke every Wix request:

```text
Request header field wix-site-id is not allowed by Access-Control-Allow-Headers in preflight response
WDE0117: MetaSite not found.
```

This proves that `wix-site-id` cannot be added as a global browser header for this Wix client/site configuration. The working CMS behavior is restored, but the original Blog-specific CORS issue remains unresolved. The next fix must be based on a Wix-supported Blog/client configuration or an architecture that avoids the browser Blog API CORS limitation; do not redeploy the rejected header implementation.
