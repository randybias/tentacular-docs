---
title: Creating Custom Scaffolds
description: Modifying scaffolds for custom needs and extracting reusable scaffolds from working tentacles
---

This guide covers two related workflows: **modifying a scaffold** to meet custom requirements (Lifecycle C) and **extracting a new scaffold** from a working tentacle (Lifecycle D).

## Part 1: Modifying a Scaffold (Lifecycle C)

Use this path when a scaffold is close to what you need but requires structural changes -- different config layout, additional nodes, modified data flow, or different contract dependencies.

### When to Modify vs. Use As-Is

| Situation | Path |
|-----------|------|
| Need to change config values only (URLs, schedules, thresholds) | Lifecycle B -- use as-is |
| Need to add/remove nodes or change the DAG structure | Lifecycle C -- modify |
| Need to restructure the config section (e.g., flat list to grouped regions) | Lifecycle C -- modify |
| Need different contract dependencies | Lifecycle C -- modify |

### Steps

#### 1. Initialize from the Scaffold

```bash
tntc scaffold init uptime-tracker regional-uptime --no-params
```

#### 2. Plan Your Changes

Before editing, review the scaffold's `workflow.yaml` and node code. Identify:
- What to keep (reusable logic, patterns)
- What to change (config structure, nodes, contract)
- What to add (new nodes, new dependencies)

#### 3. Make Structural Changes

Edit `workflow.yaml` freely. For example, restructuring a flat endpoint list into regional groups:

```yaml
config:
  timeout: 120s
  retries: 1
  regions:
    - name: us
      latency_threshold_ms: 1500
      slack_channel: "#us-ops"
      endpoints:
        - url: "https://us.acme.com"
          expected_body: ""
    - name: eu
      latency_threshold_ms: 2000
      slack_channel: "#eu-ops"
      endpoints:
        - url: "https://eu.acme.com"
          expected_body: ""
```

Modify node code as needed. Add or remove nodes. Update edges.

#### 4. Update Metadata

Delete or rewrite `params.schema.yaml`:
- **Delete** if the structure diverged significantly from the original scaffold
- **Rewrite** if you plan to extract this tentacle as a new scaffold later

Update `tentacle.yaml` to reflect the modification:

```yaml
name: regional-uptime
created: 2026-03-22T14:30:00Z
scaffold:
  name: uptime-tracker
  version: "1.0"
  source: public
  modified: true
```

#### 5. Validate and Deploy

```bash
tntc validate
tntc test
tntc deploy
```

## Part 2: Extracting a Scaffold (Lifecycle D)

After building a working tentacle -- whether from scratch or by modifying a scaffold -- you can extract it as a reusable scaffold. This is how the scaffold library grows organically.

### When to Extract

- The tentacle solves a pattern that other projects could reuse
- You want to share an org-specific pattern across your team
- You want to contribute a public quickstart

### Steps

#### 1. Analyze the Tentacle

Run extraction analysis from within the tentacle directory:

```bash
cd ~/tentacles/regional-uptime
tntc scaffold extract --json
```

This outputs a JSON analysis identifying:
- Values that appear org-specific (URLs, channel names, org names) -- these will be parameterized
- Values that are structural defaults (timeouts, retry counts) -- these may become parameters with defaults
- Node code and contract structure -- copied as-is

#### 2. Review the Parameterization Plan

The extraction heuristics classify values into three categories:

**Parameterize (replace with safe examples):**
- Custom domain URLs, organization names, Slack channels, GitHub repos, email addresses

**Parameterize with current value as default:**
- Numeric thresholds, cron schedules, batch sizes

**Do NOT parameterize:**
- Well-known API hosts (`api.anthropic.com`), exoskeleton dependency names and protocols, node graph structure

#### 3. Generate Scaffold Files

```bash
# Save as a private scaffold (default)
tntc scaffold extract --name regional-uptime-tracker

# Or save for public contribution
tntc scaffold extract --name regional-uptime-tracker --public
```

Private scaffolds are saved to `~/.tentacular/scaffolds/<name>/`. Public scaffolds are saved to `./scaffold-output/` for review before PR.

#### 4. Review Generated Files

The extraction generates:

```
scaffold-output/
+-- scaffold.yaml              # Metadata
+-- workflow.yaml              # Real values replaced with safe examples
+-- params.schema.yaml         # Parameter declarations
+-- params.yaml.example        # Example parameter values
+-- .secrets.yaml.example      # Sanitized secret structure
+-- nodes/                     # Node code (copied as-is)
+-- tests/fixtures/            # Test fixtures (copied as-is)
+-- README.md                  # Generated documentation
```

Review `workflow.yaml` to verify org-specific values were properly replaced. Review `params.schema.yaml` to verify parameter descriptions are clear.

#### 5. Publish (Optional)

For private scaffolds, you are done. The scaffold is immediately available via `tntc scaffold list --source private`.

For public quickstarts, submit a PR to the `tentacular-scaffolds` repo with the contents of `./scaffold-output/`.

## Authoring params.schema.yaml

When writing or editing `params.schema.yaml` manually:

### Parameter Definition

```yaml
version: "1"
description: "Parameters for the regional-uptime-tracker scaffold"

parameters:
  regions:
    path: config.regions
    type: list
    items: map
    description: >
      Region definitions for uptime monitoring. Each region has a name,
      latency threshold in ms, Slack channel for alerts, and a list of
      HTTP endpoints to probe.
    required: true
    example:
      - name: "us-east"
        latency_threshold_ms: 2000
        slack_channel: "#us-east-ops"
        endpoints:
          - url: "https://example.com"
            expected_body: ""
```

### Path Expression Syntax

The `path` field uses a minimal syntax to point into `workflow.yaml`:

| Pattern | Example | Meaning |
|---------|---------|---------|
| Dot-separated keys | `config.endpoints` | Navigate nested mappings |
| Filtered key | `triggers[name=check-endpoints].schedule` | Find list element by field value |

### Type System

| Type | YAML Representation |
|------|-------------------|
| `string` | Scalar |
| `number` | Integer or float |
| `boolean` | `true` / `false` |
| `list` | Sequence (use `items` for element type) |
| `map` | Mapping |

### Guidelines

- Write descriptions for a machine that relays to a human -- be concise and unambiguous
- Use realistic but not real example values (`https://example.com/pricing` over `https://example.com`)
- Mark parameters `required: true` only when there is no sensible default
- Set `default` for optional parameters with reasonable starting values
- Secrets are never parameters -- they use `.secrets.yaml`, not `params.schema.yaml`

## Next Steps

- [Getting Started from a Scaffold](/tentacular-docs/guides/getting-started-from-scaffold/) -- The simpler Lifecycle B path
- [Scaffold Usage](/tentacular-docs/guides/catalog-usage/) -- Browse and search all available scaffolds
- [Workspace Layout](/tentacular-docs/guides/workspace-layout/) -- Understand the directory structure
