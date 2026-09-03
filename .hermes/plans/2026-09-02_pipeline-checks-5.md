# Add Complete Pipeline Checks — Implementation Plan (issue #5)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. This plan was authored in the `feat/pipeline-checks-5` branch off `main`.

**Goal:** Port WebFeedPOC's CI/CD pipeline into `local-promotion-site` so that (a) every PR runs MegaLinter + unit tests + Playwright e2e, (b) an AI PR-reviewer comment is posted on PRs, and (c) Vercel only promotes a preview deploy once all required checks pass.

**Architecture:** Copy WebFeedPOC's three GitHub Actions workflows (CI tests, MegaLinter, PR-reviewer) and their supporting files (`scripts/pr-reviewer.js`, `.mega-linter.yml`, `.cspell.json`, `cspell.json`) into this repo, adapting only the paths/names that differ. Then configure the Vercel `black-skye` project so new branches get preview deployments but production promotion is gated on the required commit statuses. No application code changes — this is infrastructure only.

**Tech Stack:** GitHub Actions, MegaLinter v10, Vitest, Playwright, Vercel CLI/API, OpenRouter (AI PR reviewer, optional).

---

## Current state audit (verified)

`local-promotion-site` currently has **none** of the pipeline files. It has:
- `vite.config.ts` (dev server port 3001), `tsconfig.json` (clean), `tests/` + `e2e/` dirs already present
- `vercel.json` (rewrites + security headers), already linked to Vercel project `black-skye`
- NO `.github/`, NO `scripts/`, NO `.mega-linter.yml`, NO `.cspell.json`

WebFeedPOC (source of truth) has all the files below and they are confirmed working there.

**Secrets / vars the workflows need (repo `Settings > Secrets and variables`):**
- `GITHUB_TOKEN` — provided automatically by Actions (no action needed)
- `OPENROUTER_API_KEY` — **repo secret**, optional (if absent, `pr-reviewer.js` falls back to a structural review). Get from user / OpenRouter dashboard.
- `MODEL_NAME` — **repo variable**, defaults to `openai/gpt-4o-mini` if unset.

---

## Task 1: Add CI workflow (`ci.yml`)

**Objective:** Run unit tests + Playwright e2e on every push to `main` and every PR.

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the file**

Copy WebFeedPOC's `ci.yml` verbatim (it runs `npx vitest run` then, on PRs, `npx vitest run --coverage`, then `npm run test:e2e` with Playwright). Confirm it references `node-version: 20` and caches `npm` (this repo uses `npm ci` via `package-lock.json` — confirmed present).

> Note: WebFeedPOC's `ci.yml` pins action versions with SHA comments (`# v4`, `# v6`). Copy those pins as-is; they are intentional supply-chain hardening.

**Step 2: Sanity check the commands locally**

Run: `npx vitest run` — expected: existing suite passes (this repo already has `tests/`).
Run: `npm run test:e2e` — expected: e2e suite runs (needs `npx playwright install chromium` first; note if browsers aren't installed).

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add tests + e2e workflow (port from WebFeedPOC)"
```

---

## Task 2: Add MegaLinter workflow + config

**Objective:** Lint the whole codebase (spelling, security, formatting) on push and PR.

**Files:**
- Create: `.github/workflows/mega-linter.yml` (copy from WebFeedPOC verbatim)
- Create: `.mega-linter.yml` (copy from WebFeedPOC verbatim)
- Create: `.cspell.json` (copy from WebFeedPOC verbatim)
- Create: `cspell.json` (copy from WebFeedPOC verbatim)

**Step 1: Create the four files**

Copy each from WebFeedPOC. Key adaptation points to verify *before* committing:
- `.mega-linter.yml` references `.lycheeignore` and `megalinter-reports` — both already handled (WebFeedPOC has `.lycheeignore`; this repo doesn't but the config's `SPELL_LYCHEE_FILTER_REGEX_EXCLUDE` only excludes `package-lock.json`, and link-checking is best-effort). Create `.lycheeignore` only if MegaLinter flags missing-file errors — see Task 2 Step 3.
- `.mega-linter.yml` disables `TYPESCRIPT_STANDARD` and `REPOSITORY_DEVSKIM` and excludes `.specify/` — this repo has no `.specify/`, harmless.
- The cspell `words` list includes WebFeedPOC-specific terms (`webfeed`, `prerender`, `antiquesmarketplace`, etc.). Keep them — they don't hurt, and removing risks breaking the dictionary for copied config. Optionally add project-specific words if MegaLinter flags them later.

**Step 2: Run MegaLinter config validation locally (if megalinter available)**

Not strictly required; the workflow runs it in CI. But do a dry check of `.mega-linter.yml` YAML validity.

**Step 3: Commit, then watch the first CI run**

```bash
git add .github/workflows/mega-linter.yml .mega-linter.yml .cspell.json cspell.json
git commit -m "ci: add MegaLinter workflow + spell/lint config (port from WebFeedPOC)"
```

> After push, the first MegaLinter run may report new spelling/style issues for files not yet in WebFeedPOC's dictionary (e.g. `Richard`, `Lloyd`, `Wix`-specific terms already covered). If it flags real issues, either fix the source or add the word to `.cspell.json`. Do NOT disable linters to hide findings.

---

## Task 3: Add PR-reviewer workflow + script

**Objective:** Post an AI code-review comment on every PR (opened/synchronize/reopened), with a deterministic fallback if the model is unavailable.

**Files:**
- Create: `.github/workflows/pr-reviewer.yml` (copy from WebFeedPOC verbatim)
- Create: `scripts/pr-reviewer.js` (copy the REAL file from WebFeedPOC — do NOT use the redacted `***` display version; the real file uses `process.env.OPENROUTER_API_KEY`, `process.env.GITHUB_TOKEN`, `process.env.MODEL_NAME`)

**Step 1: Create the workflow**

Copy WebFeedPOC's `pr-reviewer.yml`. It sets `permissions: contents: read, pull-requests: write` and runs `node scripts/pr-reviewer.js`. No changes needed.

**Step 2: Create the script**

Fetch the real `scripts/pr-reviewer.js` from WebFeedPOC (via `gh` or the PAT REST API, decoding base64) and write it verbatim to `scripts/pr-reviewer.js`. The script:
- reads the GitHub event payload, fetches the PR diff,
- redacts secrets before logging,
- calls OpenRouter if `OPENROUTER_API_KEY` is set, else returns a structural fallback review,
- posts the result as a PR comment.

**Step 3: Verify the script runs without crashing (fallback path, no key)**

```bash
cd scripts && node -e "require('./pr-reviewer.js')" 2>&1 | head   # expect: fail "GITHUB_EVENT_PATH not set" — proves it loads
```
Expected: exits non-zero with a redacted error (confirms it parses and the guard works).

**Step 4: Commit**

```bash
git add .github/workflows/pr-reviewer.yml scripts/pr-reviewer.js
git commit -m "ci: add AI PR-reviewer workflow + script (port from WebFeedPOC)"
```

> NOTE on the OpenRouter key: `pr-reviewer.yml` reads `secrets.OPENROUTER_API_KEY` and `vars.MODEL_NAME`. These must be added to this repo's **Settings > Secrets and variables** before the AI review activates. Until then the workflow still runs and posts the fallback structural review. Action item for the user: add `OPENROUTER_API_KEY` (and optionally `MODEL_NAME`) to repo settings, OR confirm the fallback is acceptable.

---

## Task 4: Configure Vercel deployment gating

**Objective (the two remaining issue requirements):**
1. "When we create a new branch, Vercel picks it up" — already true for `black-skye` (it's Git-linked; Vercel auto-creates preview deployments for every pushed branch). Verify, don't assume.
2. "Vercel only deploy to preview when all checks have passed the PR" — configure the Vercel project's **required commit statuses** so preview/production promotion waits for the checks.

**Files:** (Vercel project config — no repo file change, but document in `vercel.json`? No — this is a Vercel-side setting.)

**Step 1: Verify branch preview deploys already work**

Push this branch; confirm Vercel creates a preview deployment for `feat/pipeline-checks-5` (check `vercel projects ls` / dashboard). If it does, requirement (1) is satisfied with no action.

**Step 2: Set required checks on the Vercel project**

Using the Vercel token (from `com.vercel.cli/auth.json`, team `richard-lloyds-projects`), call:
- `GET /v9/projects/black-skye?teamId=...` to read current `checkingEnabled` / required statuses.
- Set the project's deployment gate so preview deploys wait for the CI checks. In Vercel, this is the "Required Commit Status Checks" setting per environment. The check names that will exist once Tasks 1–3 are merged/running are:
  - `test` (from `ci.yml` job name) — note: GitHub status name = `<workflow job>`; confirm exact name after first run
  - `e2e` (from `ci.yml`)
  - `megalinter` (from `mega-linter.yml`)
  - (PR-reviewer posts a comment, not a required status — exclude it from required checks)

Implementation: use `vercel` CLI or the REST API `POST /v9/projects/{id}/?teamId=` with `autoJobCancelation`/`requiredReviews` as applicable, OR set it in the dashboard under Project → Settings → Git → "Required Commit Status Checks". Recommend doing it in the dashboard if the API field name is uncertain — it's a one-time toggle.

**Step 3: Verify the gate**

Open a test PR from this branch; confirm Vercel shows "Checks pending" / blocks the preview until `test`, `e2e`, `megalinter` are green.

> This task is **Vercel-side configuration**, not a code change. It can be done from the dashboard without touching the repo. Listed here so the plan covers the full issue; the actual toggle is quick.

---

## Validation (end-to-end)

1. Push `feat/pipeline-checks-5` → Vercel creates a preview deployment for the branch.
2. Open a PR → `ci.yml` (test + e2e), `mega-linter.yml`, and `pr-reviewer.yml` all trigger.
3. MegaLinter passes (or findings fixed/added to dictionary).
4. PR-reviewer posts a comment (AI if `OPENROUTER_API_KEY` set, else fallback).
5. Vercel preview is gated on `test` + `e2e` + `megalinter` before it goes live.
6. Local: `npm run build` still exits 0 (no app-code changes, so this should be unchanged).

## Risks / open questions

- **OpenRouter key:** `pr-reviewer.js` needs `OPENROUTER_API_KEY` in repo secrets for the AI review; otherwise it posts a structural fallback. → User must add it, or accept fallback.
- **MegaLinter first-run noise:** copying WebFeedPOC's cspell dictionary may still miss project-specific terms (e.g. `Richard`, `Lloyd`, `CMgr`, `MCMI`). First MegaLinter run may flag these → add to `.cspell.json` `words`.
- **Playwright browsers in CI:** `ci.yml` runs `npx playwright install chromium` — fine in CI; locally may need the same.
- **Vercel required-status name mismatch:** GitHub reports check names as `<job>` within the workflow; confirm exact names (e.g. `test` vs `CI — Tests / test`) before setting the Vercel gate, or use the dashboard's auto-detected list.
- **`.gitignore` leftover:** there is a pre-existing unstaged `M .gitignore` (from an earlier `vercel link` adding `.env*`). It is out of scope for this issue — leave it unstaged; do not include in any plan commit.

## Files likely to change (summary)

| Action | Path |
|---|---|
| Create | `.github/workflows/ci.yml` |
| Create | `.github/workflows/mega-linter.yml` |
| Create | `.github/workflows/pr-reviewer.yml` |
| Create | `scripts/pr-reviewer.js` |
| Create | `.mega-linter.yml` |
| Create | `.cspell.json` |
| Create | `cspell.json` |
| Vercel config (no repo file) | `black-skye` project required-checks setting |
