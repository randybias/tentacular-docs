---
title: "GitHub Digest"
description: "Fetch GitHub repos and create a summary digest with Slack notification"
---

| Field | Value |
|-------|-------|
| **Name** | `github-digest` |
| **Category** | reporting |
| **Complexity** | moderate |
| **Tags** | api-integration, slack-notification, cron-scheduled |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Fetch GitHub repos and create a summary digest with Slack notification. A straightforward 3-node pipeline demonstrating API integration and notification patterns.

## DAG Structure

```
fetch-repos → summarize → notify
```

| Node | Purpose |
|------|---------|
| `fetch-repos` | Fetch repos from GitHub API |
| `summarize` | Generate summary digest |
| `notify` | Send digest to Slack |

## Triggers

- `manual`
- `cron`: daily at 9:00 AM UTC (`0 9 * * *`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `github` | `api.github.com:443` | `bearer-token` |
| `slack` | `hooks.slack.com:443` | `webhook-url` |

## Secrets

| Secret | Description |
|--------|-------------|
| `github.token` | GitHub personal access token |
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc scaffold init github-digest
tntc scaffold init github-digest my-github-digest
tntc scaffold info github-digest
```

## Source

Scaffold source: [`quickstarts/github-digest/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/github-digest)
