---
title: "Lead Enrichment Pipeline"
description: "Enrich new leads from Google Sheets with company and person data from multiple sources, score against ICP, and route"
---

| Field | Value |
|-------|-------|
| **Name** | `lead-enrichment-pipeline` |
| **Category** | automation |
| **Complexity** | advanced |
| **Tags** | lead-enrichment, google-sheets, llm-scoring, fan-out-pattern, sales-automation, postgres-state |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Enrich new leads from Google Sheets with company and person data from multiple sources, score against an ideal customer profile (ICP) with AI, and route qualified leads. Uses a fan-out/fan-in pattern to run three enrichment tracks in parallel before scoring.

## DAG Structure

```
              ┌→ enrich-company ─┐
poll-sheet ───┼→ enrich-person ──┼→ score-leads → store-and-route
              └→ enrich-website ─┘
```

| Node | Purpose |
|------|---------|
| `poll-sheet` | Poll Google Sheets for new lead entries |
| `enrich-company` | Enrich with company data from external API |
| `enrich-person` | Enrich with person/contact data |
| `enrich-website` | Scrape and analyze company website |
| `score-leads` | AI-powered ICP scoring using all enrichment data |
| `store-and-route` | Store enriched leads to Postgres and route via Slack |

## Triggers

- `manual`
- `cron` — every 5 minutes (`*/5 * * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Google Sheets API | External | Yes |
| Enrichment API | External | Yes |
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| Probe targets (company websites) | Dynamic | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `180s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `sheets_id` | `YOUR_SHEETS_ID` | Google Sheets spreadsheet ID |
| `sheet_name` | `Leads` | Sheet tab name |
| `icp_criteria` | `B2B SaaS, 50-500 employees, Series A-C, technical buyer` | ICP description for scoring |
| `enrichment_api_base` | `https://api.example.com` | Base URL for enrichment API |

## Secrets

- `google.access_token` — Google API access token for Sheets
- `enrichment.api_key` — Enrichment API key
- `anthropic.api_key` — Claude API key for ICP scoring
- `slack.webhook_url` — Slack webhook for lead routing

## Usage

```bash
tntc scaffold init lead-enrichment-pipeline
tntc scaffold init lead-enrichment-pipeline my-custom-name
tntc scaffold info lead-enrichment-pipeline
```

## Source

Scaffold source: [`quickstarts/lead-enrichment-pipeline/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/lead-enrichment-pipeline)
