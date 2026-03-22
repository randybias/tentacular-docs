---
title: Getting Started from a Scaffold
description: Step-by-step walkthrough of creating a tentacle from an existing scaffold (Lifecycle B)
---

This guide walks through the most common path for creating a tentacle: finding a matching scaffold, configuring its parameters, and deploying it. This is **Lifecycle B** -- scaffold used as-is.

## Prerequisites

- `tntc` CLI installed and configured
- A Kubernetes cluster with the MCP server installed

## When to Use This Path

Use Lifecycle B when:
- A scaffold closely matches what you need
- You only need to fill in configuration values (endpoints, schedules, thresholds)
- The scaffold's node structure and data flow are correct for your use case

If you need to change the scaffold's structure (add nodes, restructure config, modify the DAG), see [Creating Custom Scaffolds](/tentacular-docs/guides/creating-custom-scaffolds/) for Lifecycle C and D.

## Steps

### 1. Search for Scaffolds

Start by searching for scaffolds that match your goal:

```bash
tntc scaffold search "uptime monitor"
```

```
SOURCE    NAME              CATEGORY     COMPLEXITY  DESCRIPTION
public    uptime-tracker    monitoring   moderate    Probe HTTP endpoints every 5 minutes...
public    uptime-prober     monitoring   simple      Simple HTTP probe with alerting...
```

### 2. Review the Scaffold

Get detailed information about the best match:

```bash
tntc scaffold info uptime-tracker
```

```
Name:         uptime-tracker
Display Name: Uptime Tracker
Source:        public
Category:     monitoring
Complexity:   moderate
Version:      1.0

Parameters:
  endpoints (list, required):
    HTTP endpoints to probe for uptime monitoring.
  latency_threshold_ms (number, optional, default: 2000):
    Maximum acceptable response time in milliseconds before alerting
  probe_schedule (string, optional, default: "*/5 * * * *"):
    Cron expression for how often to probe endpoints

Files:
  scaffold.yaml, workflow.yaml, params.schema.yaml, .secrets.yaml.example
  nodes/probe-endpoints.ts, nodes/store-results.ts, nodes/alert-failures.ts
```

### 3. Create the Tentacle

Initialize a new tentacle from the scaffold:

```bash
tntc scaffold init uptime-tracker acme-uptime --no-params
```

This creates `~/tentacles/acme-uptime/` with all scaffold files plus a `tentacle.yaml` recording the scaffold provenance.

### 4. Configure Parameters

Read `params.schema.yaml` to understand what needs configuring. Each parameter has a `path` field telling you where in `workflow.yaml` the value lives.

Edit `workflow.yaml` to replace example values with your real values:

```yaml
# Before (scaffold example values)
config:
  endpoints:
    - url: "https://example.com"
      expected_body: ""
    - url: "https://example.com/api/health"
      expected_body: ""

# After (your real values)
config:
  endpoints:
    - url: "https://acme.com"
      expected_body: ""
    - url: "https://acme.com/api/health"
      expected_body: ""
    - url: "https://acme.com/dashboard"
      expected_body: ""
```

Verify your configuration:

```bash
# Show current parameter values
tntc scaffold params show

# Verify no example values remain
tntc scaffold params validate
```

**Alternative: Using --params-file**

If you know all parameter values upfront, create a `params.yaml` and apply them during init:

```yaml
# params.yaml
endpoints:
  - url: "https://acme.com"
    expected_body: ""
  - url: "https://acme.com/api/health"
    expected_body: ""
latency_threshold_ms: 1500
probe_schedule: "*/2 * * * *"
```

```bash
tntc scaffold init uptime-tracker acme-uptime --params-file params.yaml
```

### 5. Set Up Secrets

```bash
tntc secrets init
```

Edit `.secrets.yaml` with your actual secret references. Exoskeleton-managed services (like `tentacular-postgres`) have their credentials injected automatically at deploy time.

### 6. Validate and Test

```bash
tntc validate
tntc test
tntc dev  # local dev server
```

### 7. Deploy

```bash
tntc deploy
```

After deployment, verify:

```bash
tntc run acme-uptime
tntc status acme-uptime
```

## What You Get

After completing these steps, you have:

- A tentacle at `~/tentacles/acme-uptime/` with real configuration values
- A `tentacle.yaml` recording that it came from `uptime-tracker` scaffold v1.0
- A deployed and running workflow on your cluster

## Next Steps

- [Scaffold Usage](/tentacular-docs/guides/catalog-usage/) -- Browse and search all available scaffolds
- [Creating Custom Scaffolds](/tentacular-docs/guides/creating-custom-scaffolds/) -- Modify scaffolds or extract new ones
- [Workspace Layout](/tentacular-docs/guides/workspace-layout/) -- Understand where tentacles and scaffolds live
