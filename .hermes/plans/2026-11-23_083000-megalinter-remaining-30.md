# Plan - Clear MegaLinter's remaining set (#30)

**Issue:** [local-promotion-site#30](https://github.com/ricardoblackskye/local-promotion-site/issues/30)
**Parent:** #20 · **Branch:** `plan/30-megalinter-remaining`
**Status:** awaiting GATE 1

## Goal

**MegaLinter's result must vary with the change under review.** That is #20's bar and the only thing that
makes the check useful. "Clearing the reds" is the means, not the goal - a job that is red for a fixed set
of pre-existing findings carries no signal, and it blocks every PR in this repo.

## State at plan time

Taken from **main's latest MegaLinter run**, not a stale paste:

| linter                                           | errors        | class                                                   |
|--------------------------------------------------|---------------|---------------------------------------------------------|
| `REPOSITORY_OSV_SCANNER`                         | **1**         | one Medium advisory, **fixable** - down from 40         |
| `ACTION_ZIZMOR`                                  | 13 (2 medium) | 11 suppressed; both real ones **auto-fixable**          |
| `SPELL_LYCHEE`                                   | 3             | a missing file + two 404ing URLs                        |
| `JAVASCRIPT_ES` / `TSX_ESLINT` / `TYPESCRIPT_ES` | 1 each        | **ESLint v10 migration** - one cause, three descriptors |
| `SPELL_CSPELL`                                   | 75            | spellings + proper nouns + two plan files               |
| `CSS_STYLELINT`                                  | 39            | a foreign config + style opinions                       |

**Already cleared and recorded so the umbrella's shrinkage is visible:** `REPOSITORY_GRYPE` and
`REPOSITORY_TRIVY` (gone from main's run), `COPYPASTE_JSCPD` (#22).

## Stages

Each is its own commit, verified before it lands. The suite, `tsc` and the repo's own lint are the gate
throughout; for the linter changes the gate is MegaLinter itself on the branch.

1. **osv-scanner** - one Medium advisory, reported fixable. The identity comes from the scanner's own table
   at implementation time (`npm audit` and osv-scanner do not report identical sets - they disagreed by one
   throughout #23). Closes #24.
2. **zizmor** - both real findings are `ref-version-mismatch`: a hash pin whose comment says `# v10` while
   the commit is tagged `v10.0.0`. Safe auto-fixes exist.
3. **lychee** - `favicon.svg` is referenced but absent, and two bare font-domain URLs 404. Decide per case:
   add the file, or fix the reference.
4. **ESLint v10 migration** - **the one real decision.** MegaLinter runs eslint 10, which dropped
   `.eslintrc.*`; the repo pins 8.57 and #17 chose a legacy config to fit it. The repair is a flat
   `eslint.config.js` plus a declared `typescript-eslint`. **This supersedes #17's approach**, so it gets
   its own issue rather than being folded in here.
5. **cspell** - two distinct causes: genuine British spellings in the repo's own source (`organizations`,
   `Optimization`, `sanitize`, `initialized`) and proper nouns (`Ricos`, `FTSE`, `FMCG`, `Grotesk`,
   `richardlloyd`). Proper nouns go in the dictionary; spellings are reworded. **`as a general rule` in one of my
   own plan files is mine to fix where it appears** - not by widening the dictionary.
6. **stylelint** - MegaLinter ran its own config, not the repo's. `@tailwind` at-rules are unknown to it.
   Mostly configuration; the genuine style findings are handled on their merits, not silenced.

## Acceptance

1. MegaLinter runs to completion and **its result varies with the change under review**.
2. Every item above is either fixed, or **accepted with the reasoning recorded** next to the config.
3. **No linter disabled wholesale** to make the job green.
4. Each stage provable locally where the linter can run locally; otherwise the CI run is the evidence.

## Risks / open questions

- **The ESLint v10 migration changes a config that currently works.** The repo's `npm run lint` passes
  today with 8.57. Moving to a flat config touches the gate #17 just made honest - so that stage needs both
  the repo's lint AND MegaLinter green, not one of them.
- **cspell's 75 is a count, not a severity.** Most are a dictionary and a spelling convention. I will not
  treat a proper noun as a defect.
- **osv-scanner and npm audit disagree by one**, as they did throughout #23. The acceptance is per-scanner.

## Why the shape matters

**Six checks, four causes - and only two are code defects** (the absent favicon, the residual advisory).
The rest are a migration, a foreign config, and a dictionary. Reporting all of them as "error" is what made
this week's triage manual, one log-read at a time. That is the case for agent-eve#743, and this issue is its
best evidence.
