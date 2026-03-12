---
title: "PR Digest"
description: "Fetch GitHub PRs, summarize with Claude, and send digest to Slack"
---

| Field | Value |
|-------|-------|
| **Name** | `pr-digest` |
| **Category** | reporting |
| **Complexity** | moderate |
| **Tags** | llm-integration, slack-notification, multi-service |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Fetch GitHub PRs, summarize with Claude (Anthropic API), and send a digest to Slack. Demonstrates LLM integration with multi-service dependencies.

## DAG Structure

```
fetch-prs → analyze-prs → notify-slack
```

| Node | Purpose |
|------|---------|
| `fetch-prs` | Fetch recent PRs from GitHub API |
| `analyze-prs` | Summarize PRs using Claude |
| `notify-slack` | Post digest to Slack |

## Triggers

- `manual`
- `cron`: daily at 9:00 AM UTC (`0 9 * * *`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `github` | `api.github.com:443` | `bearer-token` |
| `anthropic` | `api.anthropic.com:443` | `api-key` |
| `slack` | `hooks.slack.com:443` | `webhook-url` |

## Secrets

| Secret | Description |
|--------|-------------|
| `github.token` | GitHub personal access token |
| `anthropic.api_key` | Anthropic API key |
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc catalog init pr-digest
tntc catalog init pr-digest my-pr-digest
tntc catalog info pr-digest
```

## Source

Template source: [`templates/pr-digest/`](https://github.com/randybias/tentacular-catalog/tree/main/templates/pr-digest)
