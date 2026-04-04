---
title: "GitHub Vulnerability Triage"
description: "Aggregate Dependabot and CodeQL alerts across a GitHub org, enrich with repo context, triage with AI, and auto-create issues"
---

| Field | Value |
|-------|-------|
| **Name** | `github-vuln-triage` |
| **Category** | automation |
| **Complexity** | advanced |
| **Tags** | github-security, dependabot, codeql, llm-triage, fan-out-pattern, auto-remediation, postgres-state, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Aggregate Dependabot and CodeQL alerts across a GitHub org, enrich with repo context (customer-facing status, environment, owning team), triage with AI, and auto-create GitHub issues for actionable findings. Uses a fan-out/fan-in DAG pattern for parallel alert fetching and a second fan-out for response actions.

## DAG Structure

```
fetch-dependabot ─┐                          ┌→ create-issues ─┐
                  ├→ deduplicate → enrich-context → triage ─┼→ alert-critical ←┘
fetch-codescan ───┘                          └→ log-all
```

| Node | Purpose |
|------|---------|
| `fetch-dependabot` | Fetch Dependabot alerts from GitHub API |
| `fetch-codescan` | Fetch CodeQL code scanning alerts from GitHub API |
| `deduplicate` | Merge and deduplicate alerts from both sources |
| `enrich-context` | Add repo context (environment, team, customer exposure) |
| `triage` | AI-powered severity triage and action recommendations |
| `create-issues` | Auto-create GitHub issues for actionable findings |
| `alert-critical` | Send critical alerts to Slack with issue links |
| `log-all` | Log all triage results to Postgres and S3 |

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
| tentacular-rustfs | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `180s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `github_org` | `my-org` | GitHub organization to scan |
| `repo_context` | (example map) | Per-repo context: customer_facing, environment, team |

## Secrets

- `github.token` — GitHub personal access token with security and issues permissions
- `anthropic.api_key` — Claude API key for triage analysis
- `slack.webhook_url` — Slack webhook for critical alerts

## Usage

```bash
tntc scaffold init github-vuln-triage
tntc scaffold init github-vuln-triage my-custom-name
tntc scaffold info github-vuln-triage
```

## Source

Scaffold source: [`quickstarts/github-vuln-triage/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/github-vuln-triage)
