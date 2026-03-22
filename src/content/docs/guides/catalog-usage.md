---
title: Scaffold Usage
description: Browsing, searching, and creating tentacles from scaffolds
---

Tentacular scaffolds are reusable starting structures for building tentacles. They come from two sources: **public quickstarts** in the [tentacular-scaffolds](https://randybias.github.io/tentacular-scaffolds) repo and **private scaffolds** stored locally. Browse scaffolds online or use the CLI.

:::note
The `tntc catalog` commands still work as deprecated aliases. They print a deprecation warning and delegate to the corresponding `tntc scaffold` command. Use `tntc scaffold` for all new work.
:::

## Prerequisites

- `tntc` CLI installed and configured
- Internet access (to fetch public quickstarts)

## Steps

### 1. Browse Scaffolds

```bash
# List all scaffolds (private + public)
tntc scaffold list

# Filter by source
tntc scaffold list --source private
tntc scaffold list --source public

# Filter by category
tntc scaffold list --category monitoring
tntc scaffold list --category reporting

# Filter by tag
tntc scaffold list --tag beginner-friendly
tntc scaffold list --tag llm-integration

# JSON output for scripting
tntc scaffold list --json
```

### 2. Search Scaffolds

```bash
tntc scaffold search digest
tntc scaffold search "uptime monitor"
tntc scaffold search health
```

Search matches against scaffold name, display name, description, and tags. Results from private scaffolds appear first.

### 3. View Scaffold Details

```bash
tntc scaffold info uptime-tracker
```

Shows: metadata (description, category, tags, complexity, version), parameter summary from `params.schema.yaml`, and file list.

### 4. Create a Tentacle from a Scaffold

```bash
# Default: prints parameter summary, creates tentacle with example values
tntc scaffold init uptime-tracker my-uptime

# Copy as-is without parameter prompts
tntc scaffold init uptime-tracker my-uptime --no-params

# Apply parameter values from a file
tntc scaffold init uptime-tracker my-uptime --params-file params.yaml

# Override output directory
tntc scaffold init uptime-tracker my-uptime --dir ./custom-path/

# Disambiguate when same name exists in private and public
tntc scaffold init uptime-tracker my-uptime --source public
```

### 5. Configure Parameters

After scaffolding with `--no-params`, edit `workflow.yaml` to replace example values with real values. The `params.schema.yaml` file tells you what to configure and where:

```bash
# See what parameters exist and their current values
tntc scaffold params show

# Check that all parameters have been configured (no example values remain)
tntc scaffold params validate
```

### 6. Validate and Test

```bash
tntc validate
tntc test
tntc dev  # local dev server
```

## Available Scaffolds

| Scaffold | Category | Complexity | Description |
|----------|----------|------------|-------------|
| word-counter | starter | simple | Tokenize text and count words -- ideal for e2e testing |
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

## Scaffold Search Order

When searching, the CLI checks sources in this order:

1. **Private scaffolds** (`~/.tentacular/scaffolds/`) -- org-specific patterns
2. **Public quickstarts** (`~/.tentacular/quickstarts/`) -- community scaffolds

Private scaffolds take precedence when the same name exists in both sources. Use `--source` to override.

## Cache Management

Public quickstarts are cached locally at `~/.tentacular/quickstarts/`. To refresh:

```bash
# Refresh from remote (respects TTL)
tntc scaffold sync

# Force refresh, bypass TTL
tntc scaffold sync --force
```

The cache TTL is configurable:

```yaml
# ~/.tentacular/config.yaml
catalog:
  url: https://raw.githubusercontent.com/randybias/tentacular-scaffolds/main
  cacheTTL: 1h
```

## Verification

- `tntc scaffold list` returns scaffolds without errors
- `tntc scaffold info <name>` shows scaffold details and parameters
- Scaffolded tentacle passes `tntc validate`
- `tntc scaffold params validate` reports no example values remaining
- `tntc test` passes with default fixtures

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `failed to fetch scaffolds` | Network issue or wrong URL | Check `catalog.url` in config |
| `scaffold not found` | Typo or stale cache | Run `tntc scaffold sync --force` |
| Version warning on init | CLI older than scaffold requires | Update `tntc` (warning only, not blocking) |
| `directory already exists` | Tentacle name already in use | Choose a different name or remove the existing directory |
