# Scripts

## Overview
CI automation and tooling scripts, including automated pull request review generation with OpenRouter LLM integrations and deterministic fallback heuristics.

## Interface
- `node scripts/pr-reviewer.js` — Automated PR reviewer CLI invoked in GitHub Actions CI workflow.
- `process.env.GITHUB_EVENT_PATH` — File path to the GitHub Actions event payload JSON.
- `process.env.GITHUB_TOKEN` — GitHub API authentication token for diff fetching and comment posting.
- `process.env.OPENROUTER_API_KEY` — Optional API key for OpenRouter LLM review generation.
- `process.env.MODEL_NAME` — Optional LLM model identifier (defaults to `openai/gpt-4o-mini`).

## Invariants
- Zero secret leakage: all error and diagnostic logs are sanitized through regex-based secret redaction (`redact`).
- Prompt injection mitigation: PR diff content is treated as untrusted input with control characters stripped and explicit fence delimiters.
- Diff budgeting: input diff passed to LLM is strictly capped at 60,000 characters.
- Diff validation: execution terminates with code 1 if PR diff is empty or non-string.
- Graceful degradation: if `OPENROUTER_API_KEY` is unset or LLM request fails, execution falls back to deterministic structural review.
- Diff line metrics are calculated after trimming trailing newlines to avoid off-by-one errors.
- GitHub comment posting includes automatic retry upon HTTP failure.

## Side Effects
- Reads GitHub event payload JSON file from `process.env.GITHUB_EVENT_PATH` via `fs.promises.readFile`.
- Makes HTTP GET request to GitHub API (`https://api.github.com/repos/{owner}/{repo}/pulls/{number}`) with 30s timeout.
- Makes HTTP POST request to OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`) when API key is provided.
- Makes HTTP POST request to GitHub API (`https://api.github.com/repos/{owner}/{repo}/issues/{number}/comments`) to publish review markdown.
- Writes diagnostic, warning, and error messages to standard output and standard error.
- Terminates process with exit code 1 upon fatal configuration, validation, or network failures.

## Verification
- Run: `npm test`
