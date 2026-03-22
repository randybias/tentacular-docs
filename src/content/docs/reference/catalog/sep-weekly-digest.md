---
title: "SEP Weekly Digest"
description: "Weekly SEP activity digest with LLM-powered analysis, trend tracking, and health scoring"
---

| Field | Value |
|-------|-------|
| **Name** | `sep-weekly-digest` |
| **Category** | reporting |
| **Complexity** | advanced |
| **Tags** | github-tracking, db-analytics, llm-analysis, blob-publishing, complex-dag |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Weekly SEP activity digest with LLM-powered analysis, trend tracking, and health scoring. The most complex template in the catalog — demonstrates a 7-node DAG with database analytics, LLM analysis, HTML rendering, blob publishing, and Slack notification.

## DAG Structure

```
fetch-seps → store-snapshots → analyze-activity → generate-report → render-html → publish-report → notify
     ↓                              ↓                    ↑              ↑               ↑
     └──────────────────────────────┴────────────────────┘              │               │
                                    └───────────────────────────────────┘               │
                                    └───────────────────────────────────────────────────┘
```

| Node | Purpose |
|------|---------|
| `fetch-seps` | Fetch current SEP data from GitHub |
| `store-snapshots` | Store point-in-time snapshots to Postgres |
| `analyze-activity` | Analyze trends and compute health scores |
| `generate-report` | LLM-powered report generation (OpenAI) |
| `render-html` | Convert to HTML format |
| `publish-report` | Upload to Azure Blob Storage |
| `notify` | Send digest summary to Slack |

## Triggers

- `manual`
- `cron` (`weekly-sunday`): Sundays at 8:00 PM UTC (`0 20 * * 0`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `github` | `api.github.com:443` | `bearer-token` |
| `postgres` | `postgres-postgresql.postgres.svc.cluster.local:5432` | `password` |
| `openai` | `api.openai.com:443` | `bearer-token` |
| `azure-blob` | `mcpreports9276621.blob.core.windows.net:443` | `sas-token` |
| `slack-webhook` | `hooks.slack.com:443` | `webhook-url` |

## Config

| Key | Description |
|-----|-------------|
| `target_repo` | Repository to track (default: `modelcontextprotocol/specification`) |
| `sep_label` | GitHub label for SEP PRs (default: `sep`) |
| `azure_blob_base_url` | Base URL for published reports |

## Secrets

| Secret | Description |
|--------|-------------|
| `github.token` | GitHub personal access token |
| `postgres.password` | Postgres database password |
| `openai.api_key` | OpenAI API key |
| `azure.sas_token` | Azure Blob Storage SAS token |
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc scaffold init sep-weekly-digest
tntc scaffold init sep-weekly-digest my-sep-digest
tntc scaffold info sep-weekly-digest
```

## Source

Scaffold source: [`quickstarts/sep-weekly-digest/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/sep-weekly-digest)
