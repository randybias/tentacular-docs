---
title: "AI News Roundup"
description: "Daily AI and agentic news roundup -- fetch, filter, summarize via LLM, post to Slack"
---

| Field | Value |
|-------|-------|
| **Name** | `ai-news-roundup` |
| **Category** | reporting |
| **Complexity** | advanced |
| **Tags** | rss-parsing, llm-summarization, multi-source, news-aggregation |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Daily AI and agentic news roundup. Fetches from multiple RSS feeds, filters recent articles, summarizes via LLM (OpenAI), and posts to Slack. Uses dynamic-target networking for the diverse set of news source hosts.

## DAG Structure

```
fetch-feeds → filter-24h → summarize-llm → notify-slack
```

| Node | Purpose |
|------|---------|
| `fetch-feeds` | Fetch articles from RSS feeds and APIs |
| `filter-24h` | Filter to last 24 hours of content |
| `summarize-llm` | Generate summary using OpenAI |
| `notify-slack` | Post roundup to Slack |

## Triggers

- `manual`
- `cron` (`daily-roundup`): daily at 7:00 AM UTC (`0 7 * * *`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `openai-api` | `api.openai.com:443` | `bearer-token` |
| `slack` | `hooks.slack.com:443` | `webhook-url` |
| `news-sources` | dynamic-target (`0.0.0.0/0:443`) | None |

## Config

| Key | Description |
|-----|-------------|
| `openai_model` | Model to use (default: `gpt-4o`) |
| `sources` | List of source objects with name, url, type (rss/json) |

## Secrets

| Secret | Description |
|--------|-------------|
| `openai.api_key` | OpenAI API key |
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc catalog init ai-news-roundup
tntc catalog init ai-news-roundup my-ai-roundup
tntc catalog info ai-news-roundup
```

## Source

Template source: [`templates/ai-news-roundup/`](https://github.com/randybias/tentacular-catalog/tree/main/templates/ai-news-roundup)
