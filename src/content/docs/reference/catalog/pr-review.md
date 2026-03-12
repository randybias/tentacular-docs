---
title: "PR Review"
description: "Agentic PR review with parallel scanning and Claude synthesis, triggered by GitHub webhook"
---

| Field | Value |
|-------|-------|
| **Name** | `pr-review` |
| **Category** | automation |
| **Complexity** | advanced |
| **Tags** | webhook-triggered, fan-in-pattern, advanced-dag, security-scanning, llm-synthesis |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Agentic PR review with parallel scanning and Claude synthesis. Demonstrates a fan-out/fan-in DAG pattern where a PR is fetched, then 4 parallel scanners run, results are synthesized by Claude, and a review is posted back to GitHub.

## DAG Structure

```
                    ┌→ semgrep-scan ──┐
                    ├→ dep-review ────┤
fetch-pr ──────────┤                  ├→ synthesize → post-review
                    ├→ check-runs ────┤
                    ├→ code-scan ─────┘
                    └→ synthesize (also receives fetch-pr directly)
```

| Node | Purpose |
|------|---------|
| `fetch-pr` | Fetch PR diff and metadata from GitHub |
| `semgrep-scan` | Run Semgrep security scanning |
| `dep-review` | Review dependency changes |
| `check-runs` | Check CI/CD run status |
| `code-scan` | General code quality scan |
| `synthesize` | LLM synthesis of all scan results |
| `post-review` | Post review comment to GitHub |

## Triggers

- `manual`
- `webhook`: GitHub `pull_request` event (actions: opened, synchronize, reopened)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `github` | `api.github.com:443` | `bearer-token` |
| `anthropic` | `api.anthropic.com:443` | `bearer-token` |

## Secrets

| Secret | Description |
|--------|-------------|
| `github.token` | GitHub personal access token with PR read/write |
| `anthropic.api_key` | Anthropic API key |

## Usage

```bash
tntc catalog init pr-review
tntc catalog init pr-review my-pr-review
tntc catalog info pr-review
```

## Source

Template source: [`templates/pr-review/`](https://github.com/randybias/tentacular-catalog/tree/main/templates/pr-review)
