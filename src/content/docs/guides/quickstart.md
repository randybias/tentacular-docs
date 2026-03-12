---
title: Quickstart
description: Get up and running with Tentacular in minutes
---

## Prerequisites

- **Kubernetes cluster** — any distribution (EKS, GKE, AKS, k0s, k3s, kind)
- **kubectl** — configured to access your cluster
- **Docker** — for building tentacle images
- **Node.js 20+** — for local development
- **Deno 2.x** — for running the engine locally
- **Go 1.22+** — if building `tntc` from source

## Install the CLI

```bash
# Option 1: Install script (recommended)
curl -fsSL https://raw.githubusercontent.com/randybias/tentacular/main/install.sh | sh

# Option 2: Build from source
git clone https://github.com/randybias/tentacular.git
cd tentacular
go build -o tntc ./cmd/tntc
install tntc ~/.local/bin/
```

:::note
Make sure `~/.local/bin` is on your `PATH`. You can add it by appending
`export PATH="$HOME/.local/bin:$PATH"` to your shell profile.
:::

## Install the MCP Server

The MCP server is the control plane for managing tentacles in your cluster. Install it via Helm:

```bash
helm install tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --create-namespace
```

## Configure the CLI

```bash
# Set up your environment
tntc configure --registry ghcr.io/yourorg --namespace tentacular-dev --project

# Verify cluster connectivity
tntc cluster check

# Generate a cluster profile (helps agents design tentacles)
tntc cluster profile --save
```

## Create Your First Tentacle

### From Scratch

```bash
tntc init my-first-tentacle
cd my-first-tentacle
```

This scaffolds:
- `workflow.yaml` — tentacle definition
- `nodes/hello.ts` — a starter node
- `tests/fixtures/hello.json` — test fixture

### From a Template

```bash
# Browse available templates
tntc catalog list

# Scaffold from a template
tntc catalog init word-counter my-first-tentacle
cd my-first-tentacle
```

## Develop Locally

```bash
# Validate the workflow spec
tntc validate

# Run the local dev server with hot-reload
tntc dev

# In another terminal, trigger the tentacle
curl -X POST http://localhost:8080/run

# Run tests
tntc test
```

## Deploy to Kubernetes

```bash
# Set up secrets (if the tentacle needs them)
tntc secrets init
# Edit .secrets.yaml with your values

# Build the engine image
tntc build --push

# Deploy
tntc deploy

# Verify
tntc status my-first-tentacle
tntc logs my-first-tentacle --tail 20
```

## Trigger and Monitor

```bash
# Trigger manually
tntc run my-first-tentacle

# List all deployed tentacles
tntc list

# Check health
tntc status my-first-tentacle --detail

# Security audit
tntc audit my-first-tentacle
```

## Clean Up

```bash
tntc undeploy my-first-tentacle --yes
```

## Next Steps

- [Your First Tentacle](/tentacular-docs/guides/first-tentacle/) — detailed walkthrough of building a tentacle from scratch
- [CLI Reference](/tentacular-docs/reference/cli/) — complete command reference
- [Workflow Spec](/tentacular-docs/reference/workflow-spec/) — all workflow.yaml fields
- [Security](/tentacular-docs/concepts/security/) — understand the defense-in-depth model
- [Catalog Templates](/tentacular-docs/guides/catalog-usage/) — browse and use pre-built templates
