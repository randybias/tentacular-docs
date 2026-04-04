---
title: "GitHub Security Digest"
description: "Daily digest of Dependabot and code scanning alerts across GitHub repos with LLM-powered prioritization"
---

| Field | Value |
|-------|-------|
| **Name** | `github-security-digest` |
| **Category** | reporting |
| **Complexity** | moderate |
| **Tags** | github-security, dependabot, llm-triage, cron-triggered, postgres-state |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Daily digest of Dependabot and code scanning alerts across GitHub repos with LLM-powered prioritization. Fetches security alerts from the GitHub API, deduplicates against previously seen alerts in Postgres, uses Claude to prioritize and summarize findings, and delivers a digest to Slack.

## DAG Structure

```
fetch-alerts → deduplicate-store → prioritize-summarize → notify-slack
```

| Node | Purpose |
|------|---------|
| `fetch-alerts` | Fetch Dependabot and code scanning alerts from GitHub |
| `deduplicate-store` | Deduplicate against previously seen alerts in Postgres |
| `prioritize-summarize` | AI-powered prioritization and summary of new alerts |
| `notify-slack` | Deliver prioritized digest to Slack |

## Triggers

- `manual`
- `cron` — daily at 7:00 AM (`0 7 * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| GitHub API | External | Yes |
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `120s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `github_org` | `my-org` | GitHub organization to scan |
| `repos` | `[]` | Specific repos to scan (empty = all in org) |

## Secrets

- `github.token` — GitHub personal access token with security alert permissions
- `anthropic.api_key` — Claude API key for prioritization
- `slack.webhook_url` — Slack webhook for digest delivery

## Usage

```bash
tntc scaffold init github-security-digest
tntc scaffold init github-security-digest my-custom-name
tntc scaffold info github-security-digest
```

## Source

Scaffold source: [`quickstarts/github-security-digest/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/github-security-digest)
