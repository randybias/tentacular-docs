---
title: "Agent Activity Report"
description: "Weekly composite report of development activity across Codex, Gemini CLI, and Goose open-source AI agent projects"
---

| Field | Value |
|-------|-------|
| **Name** | `agent-activity-report` |
| **Category** | reporting |
| **Complexity** | advanced |
| **Tags** | multi-repo, activity-metrics, llm-analysis, blob-publishing |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Weekly composite report of development activity across Codex, Gemini CLI, and Goose open-source AI agent projects. Demonstrates fan-out fetching, LLM analysis, HTML report generation, and blob storage publishing.

## DAG Structure

```
fetch-codex ──┐
fetch-gemini ─┤→ compute-metrics → generate-analysis → render-html → publish-report → notify
fetch-goose ──┘                                         ↑                              ↑
                                    compute-metrics ────┘        compute-metrics ──────┘
```

| Node | Purpose |
|------|---------|
| `fetch-codex` | Fetch activity from openai/codex repo |
| `fetch-gemini` | Fetch activity from google-gemini/gemini-cli repo |
| `fetch-goose` | Fetch activity from block/goose repo |
| `compute-metrics` | Aggregate metrics across all repos |
| `generate-analysis` | LLM-powered analysis of trends |
| `render-html` | Generate HTML report |
| `publish-report` | Upload to Azure Blob Storage |
| `notify` | Send Slack notification with report link |

## Triggers

- `manual`
- `cron` (`weekly-sunday`): Sundays at 8:00 PM UTC (`0 20 * * 0`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `github` | `api.github.com:443` | `bearer-token` |
| `openai` | `api.openai.com:443` | `bearer-token` |
| `azure-blob` | `mcpreports9276621.blob.core.windows.net:443` | `sas-token` |
| `slack-webhook` | `hooks.slack.com:443` | `webhook-url` |

## Secrets

| Secret | Description |
|--------|-------------|
| `github.token` | GitHub personal access token |
| `openai.api_key` | OpenAI API key |
| `azure.sas_token` | Azure Blob Storage SAS token |
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc scaffold init agent-activity-report
tntc scaffold init agent-activity-report my-activity-report
tntc scaffold info agent-activity-report
```

## Source

Scaffold source: [`quickstarts/agent-activity-report/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/agent-activity-report)
