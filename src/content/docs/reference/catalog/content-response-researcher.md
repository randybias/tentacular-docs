---
title: "Content Response Researcher"
description: "Research a competitor article, find contrarian angles and evidence gaps, and produce a structured response outline"
---

| Field | Value |
|-------|-------|
| **Name** | `content-response-researcher` |
| **Category** | reporting |
| **Complexity** | advanced |
| **Tags** | content-strategy, research, llm-analysis, fan-out-pattern, gap-analysis, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Research a competitor article, find contrarian angles and evidence gaps, and produce a structured response outline. Fetches the target article, fans out to three parallel research tracks (supporting, contrary, and adjacent), synthesizes gaps, generates an actionable response outline, and stores results.

## DAG Structure

```
                    ┌→ research-supporting ─┐
fetch-article ──────┼→ research-contrary ───┼→ synthesize-gaps → generate-outline → store-and-notify
                    └→ research-adjacent ───┘
```

| Node | Purpose |
|------|---------|
| `fetch-article` | Retrieve the target competitor article |
| `research-supporting` | Find supporting evidence and data |
| `research-contrary` | Find contrarian viewpoints and counterarguments |
| `research-adjacent` | Discover adjacent topics and angles |
| `synthesize-gaps` | Identify evidence gaps across all research tracks |
| `generate-outline` | Produce a structured response outline |
| `store-and-notify` | Store results to S3 and notify via Slack |

## Triggers

- `manual` only

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Anthropic API | External | Yes |
| Tavily Search API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |
| Probe targets (article URLs) | Dynamic | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `300s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `target_url` | `https://example.com/article` | URL of the article to research |
| `search_api_provider` | `tavily` | Search API provider for research |

## Secrets

- `anthropic.api_key` — Claude API key for analysis and outline generation
- `tavily.api_key` — Tavily API key for web search
- `slack.webhook_url` — Slack webhook for notifications

## Usage

```bash
tntc scaffold init content-response-researcher
tntc scaffold init content-response-researcher my-custom-name
tntc scaffold info content-response-researcher
```

## Source

Scaffold source: [`quickstarts/content-response-researcher/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/content-response-researcher)
