# Plan - Clear the dependency advisories (#23)

**Issue:** [local-promotion-site#23](https://github.com/ricardoblackskye/local-promotion-site/issues/23)
**Branch:** `plan/23-dependency-advisories` · **Status:** awaiting GATE 1
**Related:** #24 (osv-scanner), #25 (trivy) - **same lockfile, same pass**

## Goal

Every advisory either **fixed** or **explicitly accepted with the reasoning recorded**. Stated so it holds
for any repo: *a scanner's result must reflect the dependency state the project chose, not a stale pin
nobody revisited.*

## Measured state (npm audit, 21 packages flagged)

| stage | packages                                                                                             | severity      | fix                                                               |
|-------|------------------------------------------------------------------------------------------------------|---------------|-------------------------------------------------------------------|
| **1** | `dompurify`                                                                                          | low           | **in range** - declared `^3.4.13`, installed 3.4.14, fixed 3.4.17 |
| **1** | `vite`                                                                                               | high          | **in range**                                                      |
| **2** | `brace-expansion` (HIGH x2), `minimatch`                                                             | high          | resolve through **`@typescript-eslint` 7 -> 8 (MAJOR)**           |
| **2** | `@typescript-eslint/{parser,eslint-plugin,type-utils,typescript-estree}`, `@typescript-eslint/utils` | moderate      | same major bump                                                   |
| **3** | `resend` -> `@react-email/render`, `editorconfig`, `glob`, `js-beautify`                             | moderate      | resend major                                                      |
| **3** | `@tailwindcss/typography` -> `postcss-selector-parser`                                               | moderate      | typography bump                                                   |
| **1** | `source-map-js`, `undici`, `vitest`, `@vitest/{mocker,coverage-v8}`                                  | high/moderate | `fix: True` (non-major)                                           |

**One oddity worth fixing while in here:** the manifest declares **`"brace-expansion": "2.1.4"` directly**.
That is an unusual thing to pin - someone silenced this before, and the pin is now the stale artefact. It
should come out with stage 2.

## Stages

Each stage is **its own commit**, so a regression is attributable rather than a mystery across one large
bump. After every stage: the full unit suite, `tsc`, the lint (which now works - #17), and the e2e.

- **Stage 1 - in-range updates.** `dompurify` and `vite` are already declared with ranges that permit a
  fixed version, plus the `fix: True` non-major group. Lowest risk; shrinks the list immediately.
  **`dompurify` first of all** - an XSS sanitizer with a published advisory is a different category from a
  duplicated test fixture, even at "low".
- **Stage 2 - `@typescript-eslint` 7 -> 8.** The big one, and it incidentally clears **both HIGH findings**
  via `brace-expansion` and `minimatch`. It touches the ESLint setup #17 just landed, so the config and the
  lint gate are part of the acceptance.
- **Stage 3 - `resend` and `@tailwindcss/typography`.** Separate bundles of transitive findings; do them
  individually so each is attributable.

## Acceptance

1. `npm audit` reports **zero** findings at or above the configured threshold.
2. `grype`, `osv-scanner` and `trivy` all pass (#23, #24, #25 close together).
3. The unit suite, `tsc`, the lint and the e2e all pass at every stage.
4. **Provable locally** - `npm audit` plus the suite is the evidence.
5. **No linter configured to ignore a finding** without that decision written down.

## Risks / open questions

- **The majors can break things.** `@typescript-eslint` 8 changes rule behaviour; `resend` and
  `@tailwindcss/typography` touch the email and build paths. The suite is the oracle - **if a stage cannot
  go green, stop and report it rather than forcing the bump**.
- **The scanners disagree.** grype said 10, osv-scanner said 40, npm audit says 21 - different databases
  and scopes. The acceptance is per-scanner, not a single number.
- **Dev vs runtime.** Most findings are `(dev)`. If anything proves genuinely unfixable, it is **accepted
  with the reasoning recorded and the scanner configured to match** - not silently ignored.

## Why it matters

This is the last blocker in #20's set. With #22 merged and this cleared, MegaLinter reports a result that
varies with the change under review - which is the only thing that makes it a check.
