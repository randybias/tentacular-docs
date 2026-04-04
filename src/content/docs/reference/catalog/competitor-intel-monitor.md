---
title: "Competitor Intelligence Monitor"
description: "Track competitor web pages, news mentions, and GitHub activity with AI-powered change analysis and significance scoring"
---

| Field | Value |
|-------|-------|
| **Name** | `competitor-intel-monitor` |
| **Category** | reporting |
| **Complexity** | advanced |
| **Tags** | competitor-monitoring, web-scraping, change-detection, llm-analysis, multi-source, postgres-state, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Track competitor web pages, news mentions, and GitHub activity with AI-powered change analysis and significance scoring. Fetches configured competitor URLs on a schedule, diffs against previous snapshots stored in S3, uses Claude to analyze the significance of changes, and delivers a digest to Slack.

## DAG Structure

```
fetch-sources → diff-snapshots → analyze-changes → store-assessments → notify-digest
```

| Node | Purpose |
|------|---------|
| `fetch-sources` | Fetch configured competitor web pages |
| `diff-snapshots` | Compare current content against stored snapshots |
| `analyze-changes` | AI-powered significance analysis of detected changes |
| `store-assessments` | Persist change assessments to Postgres and S3 |
| `notify-digest` | Deliver change digest to Slack |

## Triggers

- `manual`
- `cron` — every 6 hours (`0 */6 * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |
| Probe targets (competitor URLs) | Dynamic | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `180s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `competitors` | (example list) | List of competitor names and URLs to monitor |

## Secrets

- `anthropic.api_key` — Claude API key for change analysis
- `slack.webhook_url` — Slack webhook for digest delivery

## Usage

```bash
tntc scaffold init competitor-intel-monitor
tntc scaffold init competitor-intel-monitor my-custom-name
tntc scaffold info competitor-intel-monitor
```

## Source

Scaffold source: [`quickstarts/competitor-intel-monitor/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/competitor-intel-monitor)
