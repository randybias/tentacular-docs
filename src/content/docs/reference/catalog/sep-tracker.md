---
title: "SEP Tracker"
description: "Track MCP SEP proposals from GitHub PRs, diff changes, generate HTML reports, store to Postgres, notify Slack"
---

| Field | Value |
|-------|-------|
| **Name** | `sep-tracker` |
| **Category** | reporting |
| **Complexity** | advanced |
| **Tags** | github-tracking, diff-detection, html-rendering, blob-storage, multi-dependency |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Track MCP SEP (Specification Enhancement Proposals) from GitHub PRs. Detects diffs between runs, generates HTML reports, stores data in Postgres, and notifies Slack. Demonstrates multi-dependency tentacles with database persistence and blob publishing.

## DAG Structure

```
fetch-seps → diff-seps → render-html → store-report → notify
     ↓           ↓            ↑              ↑           ↑
     └───────────┴────────────┘              │           │
                  └──────────────────────────┘           │
                  └──────────────────────────────────────┘
```

| Node | Purpose |
|------|---------|
| `fetch-seps` | Fetch SEP PRs from GitHub |
| `diff-seps` | Compare with previous run, detect changes |
| `render-html` | Generate HTML report |
| `store-report` | Store to Postgres and Azure Blob |
| `notify` | Send change notification to Slack |

## Triggers

- `manual`
- `cron` (`weekly-sunday`): Sundays at 8:00 PM UTC (`0 20 * * 0`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `github` | `api.github.com:443` | `bearer-token` |
| `postgres` | `postgres-postgresql.postgres.svc.cluster.local:5432` | `password` |
| `azure-blob` | `mcpreports9276621.blob.core.windows.net:443` | `sas-token` |
| `slack-webhook` | `hooks.slack.com:443` | `webhook-url` |

## Config

| Key | Description |
|-----|-------------|
| `target_repo` | Repository to track (default: `modelcontextprotocol/specification`) |
| `sep_label` | GitHub label for SEP PRs (default: `sep`) |

## Secrets

| Secret | Description |
|--------|-------------|
| `github.token` | GitHub personal access token |
| `postgres.password` | Postgres database password |
| `azure.sas_token` | Azure Blob Storage SAS token |
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc catalog init sep-tracker
tntc catalog init sep-tracker my-sep-tracker
tntc catalog info sep-tracker
```

## Source

Template source: [`templates/sep-tracker/`](https://github.com/randybias/tentacular-catalog/tree/main/templates/sep-tracker)
