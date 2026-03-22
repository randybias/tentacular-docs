---
title: Workspace Layout
description: Where tentacles, scaffolds, and quickstarts live on disk
---

Tentacular uses a predictable directory structure for tentacles, scaffolds, and system configuration. Understanding this layout helps you navigate between local development, scaffold management, and deployment.

## Directory Structure

```
~/tentacles/                            # ALL tentacles live here
+-- acme-uptime/                        #   a tentacle
|   +-- tentacle.yaml                   #   identity + scaffold provenance
|   +-- workflow.yaml                   #   real configuration values
|   +-- .secrets.yaml                   #   real secret references
|   +-- params.schema.yaml              #   (optional) copied from scaffold
|   +-- nodes/
|   |   +-- probe-endpoints.ts
|   |   +-- store-results.ts
|   +-- tests/fixtures/
|   +-- .gitignore
+-- regional-monitor/                   #   another tentacle
+-- api-latency-reporter/               #   another tentacle

~/.tentacular/                          # SYSTEM directory
+-- config.yaml                         #   CLI configuration
+-- cache/
|   +-- scaffolds-index.yaml            #   cached quickstart index
+-- scaffolds/                          #   PRIVATE scaffolds
|   +-- our-standard-monitor/
|   |   +-- scaffold.yaml               #   scaffold metadata
|   |   +-- workflow.yaml               #   safe example values
|   |   +-- params.schema.yaml          #   parameter declarations
|   |   +-- nodes/
|   +-- our-etl-pipeline/
+-- quickstarts/                        #   LOCAL CACHE of public quickstarts
    +-- uptime-tracker/
    +-- site-change-detector/
    +-- github-digest/
```

## Tentacle Directory (`~/tentacles/`)

The tentacle directory is **flat** -- every subdirectory is a tentacle, no exceptions. There are no nested folders for organization.

Each tentacle contains:

| File | Purpose |
|------|---------|
| `tentacle.yaml` | Identity and scaffold provenance (name, creation date, which scaffold it came from) |
| `workflow.yaml` | Workflow definition with **real** configuration values |
| `.secrets.yaml` | Real secret references (gitignored) |
| `params.schema.yaml` | (Optional) Parameter schema copied from the scaffold, for reference |
| `nodes/` | TypeScript node implementations |
| `tests/fixtures/` | Test fixtures for each node |
| `.gitignore` | Ignores `.secrets.yaml` and other sensitive files |

### tentacle.yaml

This file records where the tentacle came from:

**Created from a scaffold:**
```yaml
name: acme-uptime
created: 2026-03-22T14:30:00Z
scaffold:
  name: uptime-tracker
  version: "1.0"
  source: public
  modified: false        # true if structure was changed (Lifecycle C)
```

**Created from scratch:**
```yaml
name: custom-monitor
created: 2026-03-22T15:00:00Z
```

### Name Validation

Scaffold and tentacle names must be valid kebab-case identifiers:
- Pattern: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`
- Maximum length: 64 characters
- No path separators (`/`, `\`), no `..`, no special characters
- Valid examples: `uptime-tracker`, `our-etl-pipeline`, `e2e-test`

This is enforced by `tntc init`, `tntc scaffold init`, and `tntc scaffold extract`.

## Scaffold Directory (`~/.tentacular/scaffolds/`)

Private scaffolds are stored here. They are created by `tntc scaffold extract` or manually. The CLI searches this directory first when looking for scaffolds.

The `~/.tentacular/` directory and its subdirectories are created with 0700 permissions (owner-only access). Private scaffolds may contain org-specific patterns, internal URLs, or architectural details that should not be readable by other users on the system.

Each scaffold contains:

| File | Purpose |
|------|---------|
| `scaffold.yaml` | Metadata (name, description, category, tags, version) |
| `workflow.yaml` | Complete workflow with **safe example** values |
| `params.schema.yaml` | Declares configurable parameters with paths into workflow.yaml |
| `.secrets.yaml.example` | Secret structure template |
| `nodes/` | TypeScript node implementations |
| `tests/fixtures/` | Test fixtures |

### Key Difference: Scaffolds vs. Tentacles

| | Scaffold | Tentacle |
|---|---------|----------|
| Config values | Safe examples (`example.com`) | Real values (`acme.com`) |
| Identity file | `scaffold.yaml` (metadata) | `tentacle.yaml` (provenance) |
| Secrets | `.secrets.yaml.example` (template) | `.secrets.yaml` (real refs) |
| Location | `~/.tentacular/scaffolds/` or `quickstarts/` | `~/tentacles/` |
| Purpose | Reusable starting point | Working workflow |

## Quickstarts Directory (`~/.tentacular/quickstarts/`)

A local cache of public scaffolds from the `tentacular-scaffolds` repo. Refreshed by `tntc scaffold sync` or automatically when the cache TTL expires (default: 1 hour).

```bash
# Refresh the cache
tntc scaffold sync

# Force refresh, bypass TTL
tntc scaffold sync --force
```

## Scaffold Search Order

When the CLI searches for scaffolds, it checks in this order:

1. **Private scaffolds** (`~/.tentacular/scaffolds/`) -- org-specific, checked first
2. **Public quickstarts** (`~/.tentacular/quickstarts/`) -- community scaffolds

If the same scaffold name exists in both sources, the private version wins. Use `--source public` or `--source private` to override.

## Commands by Location

| Command | Where to Run | What It Does |
|---------|-------------|--------------|
| `tntc init <name>` | Anywhere | Creates tentacle at `~/tentacles/<name>/` |
| `tntc scaffold init <scaffold> <name>` | Anywhere | Creates tentacle at `~/tentacles/<name>/` from scaffold |
| `tntc scaffold extract` | Inside a tentacle dir | Creates scaffold at `~/.tentacular/scaffolds/<name>/` |
| `tntc scaffold params show` | Inside a tentacle dir | Shows parameter values from `workflow.yaml` |
| `tntc scaffold params validate` | Inside a tentacle dir | Checks for unconfigured example values |
| `tntc scaffold list` | Anywhere | Lists scaffolds from both sources |
| `tntc scaffold sync` | Anywhere | Refreshes public quickstarts cache |
| `tntc validate` | Inside a tentacle dir | Validates workflow structure |
| `tntc deploy` | Inside a tentacle dir | Deploys to cluster |

## Next Steps

- [Getting Started from a Scaffold](/tentacular-docs/guides/getting-started-from-scaffold/) -- Create a tentacle from a scaffold (Lifecycle B)
- [Creating Custom Scaffolds](/tentacular-docs/guides/creating-custom-scaffolds/) -- Modify scaffolds and extract new ones
- [Scaffold Usage](/tentacular-docs/guides/catalog-usage/) -- Browse and search all available scaffolds
