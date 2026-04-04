---
title: "Uptime Tracker"
description: "Probe HTTP endpoints every 5 minutes, store time-series data in Postgres, generate weekly uptime and latency reports"
---

| Field | Value |
|-------|-------|
| **Name** | `uptime-tracker` |
| **Category** | monitoring |
| **Complexity** | moderate |
| **Tags** | uptime-monitoring, time-series, latency-tracking, tls-inspection, weekly-reports, postgres-state, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Probe HTTP endpoints every 5 minutes, store time-series data in Postgres, and generate weekly uptime and latency reports. Has two independent paths: the probe path runs on a 5-minute cron schedule, while the report path is triggered manually for weekly summaries.

## DAG Structure

```
Probe path (every 5 minutes):
probe-endpoints → store-results → alert-failures

Report path (manual):
aggregate-weekly → generate-report → publish-report
```

| Node | Purpose |
|------|---------|
| `probe-endpoints` | HTTP probe of configured endpoints with latency measurement |
| `store-results` | Store probe results as time-series data in Postgres |
| `alert-failures` | Send Slack alerts for failed probes or high latency |
| `aggregate-weekly` | Aggregate time-series data into weekly statistics |
| `generate-report` | Generate uptime and latency report with AI summary |
| `publish-report` | Store report in S3 and deliver via Slack |

## Triggers

- `manual`
- `cron` — every 5 minutes (`*/5 * * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Anthropic API | External | Yes (report generation) |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |
| Probe targets (monitored endpoints) | Dynamic | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `60s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `latency_threshold_ms` | `2000` | Latency threshold for alerts (ms) |
| `endpoints` | (example list) | List of endpoints with URL and expected body |

## Secrets

- `anthropic.api_key` — Claude API key for report generation
- `slack.webhook_url` — Slack webhook for alerts and reports

## Usage

```bash
tntc scaffold init uptime-tracker
tntc scaffold init uptime-tracker my-custom-name
tntc scaffold info uptime-tracker
```

## Source

Scaffold source: [`quickstarts/uptime-tracker/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/uptime-tracker)
