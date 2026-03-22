---
title: "Hacker News Digest"
description: "Fetch and filter top Hacker News stories into a formatted digest"
---

| Field | Value |
|-------|-------|
| **Name** | `hn-digest` |
| **Category** | data-pipeline |
| **Complexity** | moderate |
| **Tags** | public-api, news-aggregation, no-auth-required |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Fetch and filter top Hacker News stories into a formatted digest. Uses the public HN Firebase API with no authentication required.

## DAG Structure

```
fetch-stories → filter-stories → format-digest
```

| Node | Purpose |
|------|---------|
| `fetch-stories` | Fetch top stories from HN Firebase API |
| `filter-stories` | Filter and rank stories by criteria |
| `format-digest` | Format into a readable digest |

## Triggers

- `manual`

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `hn` | `hacker-news.firebaseio.com:443` | None |

## Secrets

None required.

## Usage

```bash
tntc scaffold init hn-digest
tntc scaffold init hn-digest my-news-digest
tntc scaffold info hn-digest
```

## Source

Scaffold source: [`quickstarts/hn-digest/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/hn-digest)
