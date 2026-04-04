---
title: "Site Change Detector"
description: "Monitor web pages for changes, store snapshots in S3, and deliver LLM-summarized change alerts"
---

| Field | Value |
|-------|-------|
| **Name** | `site-change-detector` |
| **Category** | monitoring |
| **Complexity** | moderate |
| **Tags** | web-monitoring, change-detection, llm-analysis, s3-storage, postgres-state |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Monitor web pages for changes, store snapshots in S3, and deliver LLM-summarized change alerts to Slack. Fetches configured URLs on a schedule, diffs against stored snapshots, uses Claude to summarize what changed and why it matters, and notifies via Slack.

## DAG Structure

```
fetch-pages → diff-snapshots → summarize-changes → notify-slack
```

| Node | Purpose |
|------|---------|
| `fetch-pages` | Fetch configured web pages |
| `diff-snapshots` | Compare current content against stored snapshots in S3 |
| `summarize-changes` | AI-powered summarization of detected changes |
| `notify-slack` | Deliver change summaries to Slack |

## Triggers

- `manual`
- `cron` — every 4 hours (`0 */4 * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |
| Probe targets (monitored URLs) | Dynamic | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `120s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `urls` | `[https://example.com]` | List of URLs to monitor |
| `s3_bucket` | `tentacular` | S3 bucket for snapshot storage |

## Secrets

- `anthropic.api_key` — Claude API key for change summarization
- `slack.webhook_url` — Slack webhook for change alerts

## Usage

```bash
tntc scaffold init site-change-detector
tntc scaffold init site-change-detector my-custom-name
tntc scaffold info site-change-detector
```

## Source

Scaffold source: [`quickstarts/site-change-detector/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/site-change-detector)
