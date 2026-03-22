---
title: "Cluster Health Reporter"
description: "Generate daily cluster health report from Postgres data and send to Slack"
---

| Field | Value |
|-------|-------|
| **Name** | `cluster-health-reporter` |
| **Category** | reporting |
| **Complexity** | moderate |
| **Tags** | db-querying, llm-analysis, trend-reporting, slack-notification |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Generate daily cluster health report from Postgres data and send to Slack. Uses Claude (Anthropic API) for trend analysis. Designed to work with the [Cluster Health Collector](/tentacular-docs/reference/catalog/cluster-health-collector/) template.

## DAG Structure

```
query-health-history → analyze-trends → send-report
```

| Node | Purpose |
|------|---------|
| `query-health-history` | Query historical health data from Postgres |
| `analyze-trends` | Analyze trends using Claude |
| `send-report` | Send formatted report to Slack |

## Triggers

- `manual`
- `cron` (`daily-report`): daily at 3:00 PM UTC (`0 15 * * *`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `postgres` | `postgres-postgresql.postgres.svc.cluster.local:5432` | `password` |
| `anthropic` | `api.anthropic.com:443` | `api-key` |
| `slack` | `hooks.slack.com:443` | `webhook-url` |

## Secrets

| Secret | Description |
|--------|-------------|
| `postgres.password` | Postgres database password |
| `anthropic.api_key` | Anthropic API key |
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc scaffold init cluster-health-reporter
tntc scaffold init cluster-health-reporter my-reporter
tntc scaffold info cluster-health-reporter
```

## Source

Scaffold source: [`quickstarts/cluster-health-reporter/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/cluster-health-reporter)
