---
title: "Multi-Source Churn Detector"
description: "Aggregate usage, support, billing, and survey signals to score customer health and detect churn risk"
---

| Field | Value |
|-------|-------|
| **Name** | `multi-source-churn-detector` |
| **Category** | reporting |
| **Complexity** | advanced |
| **Tags** | customer-health, churn-detection, multi-source, llm-scoring, conditional-routing, postgres-state, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Aggregate usage, support, billing, and survey signals to score customer health and detect churn risk. Fetches data from four parallel sources, normalizes into a common signal format, uses AI to score health, stores scores, and fans out to real-time alerts and weekly reports.

## DAG Structure

```
fetch-usage ────┐
fetch-tickets ──┤                                        ┌→ route-alerts
fetch-billing ──┼→ normalize-signals → score-health → store-scores ─┤
fetch-surveys ──┘                                        └→ generate-weekly-report
```

| Node | Purpose |
|------|---------|
| `fetch-usage` | Fetch product usage metrics from analytics API |
| `fetch-tickets` | Fetch support ticket data |
| `fetch-billing` | Fetch billing data from Stripe |
| `fetch-surveys` | Fetch customer survey responses |
| `normalize-signals` | Normalize all data sources into a common signal format |
| `score-health` | AI-powered customer health scoring |
| `store-scores` | Persist health scores to Postgres and S3 |
| `route-alerts` | Route churn risk alerts to Slack based on severity |
| `generate-weekly-report` | Generate weekly customer health summary report |

## Triggers

- `manual`
- `cron` — daily at 8:00 AM (`0 8 * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Analytics API | External | Yes |
| Support API | External | Yes |
| Stripe API | External | Yes |
| Survey API | External | Yes |
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `300s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `accounts` | `[all]` | Account filter (list of IDs or "all") |
| `analytics_api_base` | `https://api.example.com/analytics` | Analytics API base URL |
| `support_api_base` | `https://api.example.com/support` | Support API base URL |
| `stripe_customer_prefix` | `cus_` | Stripe customer ID prefix |

## Secrets

- `analytics.api_key` — Analytics API key
- `support.api_key` — Support API key
- `stripe.api_key` — Stripe API key
- `survey.api_key` — Survey API key
- `anthropic.api_key` — Claude API key for health scoring
- `slack.webhook_url` — Slack webhook for alerts and reports

## Usage

```bash
tntc scaffold init multi-source-churn-detector
tntc scaffold init multi-source-churn-detector my-custom-name
tntc scaffold info multi-source-churn-detector
```

## Source

Scaffold source: [`quickstarts/multi-source-churn-detector/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/multi-source-churn-detector)
