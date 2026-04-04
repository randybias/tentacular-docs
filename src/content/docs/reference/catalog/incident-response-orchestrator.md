---
title: "Incident Response Orchestrator"
description: "Receive monitoring alerts, gather context from history and runbooks, classify severity with AI, and orchestrate response actions"
---

| Field | Value |
|-------|-------|
| **Name** | `incident-response-orchestrator` |
| **Category** | automation |
| **Complexity** | advanced |
| **Tags** | incident-response, double-diamond-dag, monitoring, llm-classification, nats-events, s3-storage, postgres-state |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Receive monitoring alerts, gather context from incident history and runbooks, classify severity with AI, and orchestrate response actions. Uses a double-diamond DAG pattern: first fan-out gathers context (history, runbooks, deploys), then fan-in to classify; second fan-out dispatches actions (ticket, Slack, event, page), then fan-in to log.

## DAG Structure

```
                 ┌→ query-history ──┐                    ┌→ create-ticket ──┐
receive-alert ───┼→ fetch-runbook ──┼→ classify-and-brief ─┼→ notify-slack ───┼→ log-actions
                 └→ query-deploys ──┘                    ├→ publish-event ──┤
                                                         └→ page-oncall ────┘
```

| Node | Purpose |
|------|---------|
| `receive-alert` | Receive and parse the incoming monitoring alert |
| `query-history` | Query Postgres for past incidents on the same service |
| `fetch-runbook` | Retrieve the relevant runbook from S3 |
| `query-deploys` | Check recent deploys via GitHub API |
| `classify-and-brief` | AI-powered severity classification and incident brief |
| `create-ticket` | Create a tracking ticket in GitHub Issues |
| `notify-slack` | Post incident brief to Slack |
| `publish-event` | Publish structured event to NATS |
| `page-oncall` | Page on-call via PagerDuty (for critical severity) |
| `log-actions` | Log all response actions to Postgres |

## Triggers

- `manual` only

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| GitHub API | External | Yes |
| Anthropic API | External | Yes |
| PagerDuty API | External | Yes (for paging) |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |
| tentacular-nats | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `180s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `alert_service` | (empty) | Service name from the alert |
| `alert_metric` | (empty) | Metric name from the alert |
| `alert_value` | (empty) | Current metric value |
| `alert_threshold` | (empty) | Threshold that was breached |
| `github_org` | `my-org` | GitHub organization for deploy history |
| `service_repos` | (example map) | Mapping of service names to repo names |

## Secrets

- `github.token` — GitHub token for deploy history and issue creation
- `anthropic.api_key` — Claude API key for severity classification
- `pagerduty.api_key` — PagerDuty API key for on-call paging
- `slack.webhook_url` — Slack webhook for incident notifications

## Usage

```bash
tntc scaffold init incident-response-orchestrator
tntc scaffold init incident-response-orchestrator my-custom-name
tntc scaffold info incident-response-orchestrator
```

## Source

Scaffold source: [`quickstarts/incident-response-orchestrator/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/incident-response-orchestrator)
