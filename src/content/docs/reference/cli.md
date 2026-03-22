---
title: CLI Reference
description: Complete reference for the tntc command-line interface
---

The `tntc` CLI manages the full tentacle lifecycle — from scaffolding to deployment and operations.

## Authentication

| Command | Usage | Description |
|---------|-------|-------------|
| `login` | `tntc login` | Authenticate via OIDC Device Authorization Grant — displays a code, user authenticates in browser |
| `logout` | `tntc logout` | Clear stored credentials |
| `whoami` | `tntc whoami` | Show current authenticated identity, token status, and group membership |

## Permissions

| Command | Usage | Description |
|---------|-------|-------------|
| `permissions get` | `tntc permissions get <namespace> <name>` | Show owner, group, and mode for a deployed tentacle |
| `permissions set` | `tntc permissions set <namespace> <name> [--group G] [--mode M]` | Set mode or group (owner-only) |
| `permissions chmod` | `tntc permissions chmod <mode> <namespace> <name>` | Set permission mode (e.g., `rwxr-x---` or preset name) |
| `permissions chgrp` | `tntc permissions chgrp <group> <namespace> <name>` | Change group assignment |

## Workflow Lifecycle

| Command | Usage | Description |
|---------|-------|-------------|
| `init` | `tntc init <name>` | Scaffold a blank tentacle directory |
| `validate` | `tntc validate [dir]` | Validate workflow.yaml (DAG acyclicity, naming, edges) |
| `dev` | `tntc dev [dir]` | Local dev server with hot-reload |
| `test` | `tntc test [dir][/<node>]` | Run node or pipeline tests against fixtures |
| `build` | `tntc build [dir]` | Build container image (distroless Deno base) |
| `deploy` | `tntc deploy [dir]` | Generate K8s manifests and apply to cluster. Flags: `--group <name>` sets group, `--share` sets mode to group-readable (rwxr-x---) |
| `visualize` | `tntc visualize [dir]` | Generate Mermaid diagram of the tentacle DAG |

## Catalog Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `catalog list` | `tntc catalog list [--category=X] [--tag=X]` | List templates from the catalog |
| `catalog search` | `tntc catalog search <query>` | Search templates by name, description, or tags |
| `catalog info` | `tntc catalog info <name>` | Show full details for a template |
| `catalog init` | `tntc catalog init <template> [name]` | Scaffold a tentacle from a catalog template |

```bash
# List all templates (cached for 1h)
tntc catalog list
tntc catalog list --category monitoring
tntc catalog list --tag beginner-friendly
tntc catalog list --json

# Search by keyword
tntc catalog search digest

# Show full template details
tntc catalog info hn-digest

# Scaffold a tentacle from a template
tntc catalog init hn-digest
tntc catalog init hn-digest my-news-digest
tntc catalog init hn-digest my-digest --namespace my-ns

# Bypass cache
tntc catalog list --no-cache
```

## Configuration

| Command | Usage | Description |
|---------|-------|-------------|
| `configure` | `tntc configure` | Set default configuration (registry, namespace, runtime class) |
| `secrets check` | `tntc secrets check [dir]` | Check secrets provisioning against node requirements |
| `secrets init` | `tntc secrets init [dir]` | Initialize `.secrets.yaml` from `.secrets.yaml.example` |

## Operations (via MCP)

All operations commands route through the MCP server. The CLI resolves the MCP client from config and fails with an actionable error if MCP is not configured.

| Command | Usage | Description |
|---------|-------|-------------|
| `status` | `tntc status <name>` | Check deployment readiness; `--detail` for extended info |
| `run` | `tntc run <name>` | Trigger a deployed tentacle, return JSON result |
| `logs` | `tntc logs <name>` | View pod logs; `--tail N` for recent lines |
| `list` | `tntc list` | List all deployed tentacles with version, status, and age |
| `undeploy` | `tntc undeploy <name>` | Remove deployed tentacle resources |
| `audit` | `tntc audit <name>` | Security audit via MCP (RBAC, netpol, PSA) |
| `cluster check` | `tntc cluster check` | Preflight cluster validation via MCP |
| `cluster profile` | `tntc cluster profile` | Cluster capability snapshot via MCP |

## Global Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--namespace` | `-n` | `default` | Kubernetes namespace |
| `--registry` | `-r` | (none) | Container registry URL |
| `--output` | `-o` | `text` | Output format: `text` or `json` |
| `--env` | | (none) | Target environment from config |

Namespace resolution order: CLI `-n` flag > `workflow.yaml deployment.namespace` > config file default > `default`.

## Key Command Flags

```bash
# Configure
tntc configure --registry reg.io --namespace prod
tntc configure --registry reg.io --project

# Secrets
tntc secrets check my-tentacle
tntc secrets init my-tentacle
tntc secrets init my-tentacle --force

# Build
tntc build -t custom:tag
tntc build -r reg.io --push
tntc build --platform linux/arm64

# Deploy
tntc deploy --runtime-class gvisor   # default
tntc deploy --runtime-class ""       # disable gVisor
tntc deploy --image reg.io/engine:v2
tntc deploy --group my-team          # set group at deploy time
tntc deploy --share                  # set mode to group-readable (rwxr-x---)

# Permissions
tntc permissions get my-ns my-tentacle
tntc permissions chmod rwxr-x--- my-ns my-tentacle
tntc permissions chmod group-read my-ns my-tentacle
tntc permissions chgrp my-team my-ns my-tentacle

# Test
tntc test my-tentacle/fetch-data
tntc test --pipeline

# Logs
tntc logs my-tentacle --tail 50

# Run
tntc run my-tentacle --timeout 60s

# Undeploy
tntc undeploy my-tentacle --yes

# Cluster profile
tntc cluster profile --env prod --save
tntc cluster profile --all --save --force
tntc cluster profile --output json
```

## Configuration File

Config resolution order: CLI flags > project config (`.tentacular/config.yaml`) > user config (`~/.tentacular/config.yaml`).

```yaml
# ~/.tentacular/config.yaml
registry: ghcr.io/yourorg
namespace: default
runtime_class: gvisor
default_env: dev

environments:
  dev:
    namespace: tentacular-dev
    image: ghcr.io/yourorg/tentacular-engine:latest
    runtime_class: ""
    mcp_endpoint: http://172.31.29.1:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token
  prod:
    namespace: tentacular-prod
    image: ghcr.io/yourorg/tentacular-engine:latest
    runtime_class: gvisor
    mcp_endpoint: http://prod-mcp.example.com:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token-prod

catalog:
  url: https://raw.githubusercontent.com/randybias/tentacular-scaffolds/main
  cacheTTL: 1h
```

### Configuration Fields

| Field | Level | Description |
|-------|-------|-------------|
| `registry` | Top | Default container registry for `tntc build --push` |
| `namespace` | Top / Env | Default K8s namespace for deployments |
| `runtime_class` | Top / Env | RuntimeClass name (empty disables gVisor) |
| `default_env` | Top | Environment used when `--env` is not specified |
| `mcp_endpoint` | Env | Full URL to MCP server `/mcp` path |
| `mcp_token_path` | Env | Path to bearer token file, `~` expanded |
| `image` | Env | Engine image override |
| `catalog.url` | Top | Base URL for the template catalog |
| `catalog.cacheTTL` | Top | How long to cache catalog.yaml locally (default: `1h`) |

### MCP Resolution

MCP endpoint and token are resolved per-environment:

1. Active environment's `mcp_endpoint` / `mcp_token_path` (from `--env` > `TENTACULAR_ENV` > `default_env`)
2. `TNTC_MCP_ENDPOINT` / `TNTC_MCP_TOKEN` environment variables

## Cluster Profile

`tntc cluster profile` generates a capability snapshot for agent-informed tentacle design.

| Category | Details |
|----------|---------|
| Identity | K8s version, distribution (EKS/GKE/AKS/kind/vanilla) |
| Nodes | Count, architecture, labels, taints |
| Runtime | Available RuntimeClasses; gVisor detected |
| CNI | Plugin name, NetworkPolicy support |
| Storage | StorageClasses, CSI drivers, RWX capability |
| Extensions | Istio, cert-manager, Prometheus Operator, External Secrets, etc. |

Profiles are stored at `.tentacular/envprofiles/<env>.md` and `.json`. Agents should treat profiles older than 7 days as potentially stale.
