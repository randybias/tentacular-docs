---
title: Catalog Usage
description: Browsing, searching, and scaffolding tentacles from the template catalog
---

The Tentacular template catalog provides pre-built tentacle templates for common patterns like news digests, PR reviews, health monitoring, and more. Browse the catalog online at [randybias.github.io/tentacular-catalog](https://randybias.github.io/tentacular-catalog) or use the CLI.

## Prerequisites

- `tntc` CLI installed and configured
- Internet access (to fetch catalog index)

## Steps

### 1. Browse Templates

```bash
# List all templates
tntc catalog list

# Filter by category
tntc catalog list --category monitoring
tntc catalog list --category reporting

# Filter by tag
tntc catalog list --tag beginner-friendly
tntc catalog list --tag llm-integration

# JSON output for scripting
tntc catalog list --json
```

### 2. Search Templates

```bash
tntc catalog search digest
tntc catalog search health
tntc catalog search pr
```

### 3. View Template Details

```bash
tntc catalog info hn-digest
```

Shows: description, category, tags, complexity, nodes, edges, triggers, config keys, required secrets.

### 4. Scaffold from a Template

```bash
# Use template name as tentacle name
tntc catalog init hn-digest

# Custom name
tntc catalog init hn-digest my-news-digest

# With namespace
tntc catalog init hn-digest my-digest --namespace my-ns
```

### 5. Customize

After scaffolding, edit the generated files:

```bash
cd my-news-digest
# Edit workflow.yaml — adjust triggers, config
# Edit nodes/*.ts — customize logic
# Set up secrets
tntc secrets init
```

## Available Templates

| Template | Category | Complexity | Description |
|----------|----------|------------|-------------|
| word-counter | starter | simple | Tokenize text and count words — ideal for e2e testing |
| hn-digest | data-pipeline | moderate | Fetch and filter top Hacker News stories |
| github-digest | reporting | moderate | GitHub repo summary digest with Slack notification |
| pr-digest | reporting | moderate | PR summary with Claude analysis and Slack notification |
| uptime-prober | monitoring | moderate | HTTP endpoint monitoring with alerting |
| cluster-health-collector | monitoring | moderate | K8s health data collection to Postgres |
| cluster-health-reporter | reporting | moderate | Daily cluster health report from Postgres |
| ai-news-roundup | reporting | advanced | Multi-source AI news aggregation with LLM summarization |
| agent-activity-report | reporting | advanced | Weekly activity metrics across AI agent projects |
| pr-review | automation | advanced | Agentic PR review with parallel scanning |
| sep-tracker | reporting | advanced | MCP SEP proposal tracking with diff detection |
| sep-weekly-digest | reporting | advanced | Weekly SEP activity digest with trend analysis |

## Verification

- `tntc catalog list` returns templates without errors
- `tntc catalog info <name>` shows template details
- Scaffolded tentacle passes `tntc validate`
- `tntc test` passes with default fixtures

## Cache Management

The catalog index is cached locally at `~/.tentacular/cache/catalog.yaml` for 1 hour. To bypass:

```bash
tntc catalog list --no-cache
```

The cache TTL is configurable in your config:

```yaml
# ~/.tentacular/config.yaml
catalog:
  url: https://raw.githubusercontent.com/randybias/tentacular-catalog/main
  cacheTTL: 1h
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `failed to fetch catalog` | Network issue or wrong URL | Check `catalog.url` in config |
| `template not found` | Typo or stale cache | Run with `--no-cache` |
| Version warning on init | CLI older than template requires | Update `tntc` (warning only, not blocking) |
