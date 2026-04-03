---
title: CLI Reference
description: Complete reference for the tntc command-line interface
---

The `tntc` CLI manages the full tentacle lifecycle — from scaffolding to deployment and operations. Enclaves are the primary organizational unit; most deployment and operations commands resolve context from the active enclave.

## Enclaves

Enclaves are team-scoped workspaces. All tentacles live inside an enclave. The `tntc enclave` commands manage enclave lifecycle and membership.

| Command | Usage | Description |
|---------|-------|-------------|
| `enclave provision` | `tntc enclave provision --name N --owner E --channel-id C --channel-name N` | Provision a new enclave: namespace, exoskeleton services, RBAC, network policies, quota |
| `enclave info` | `tntc enclave info <name>` | Show enclave status, membership, exoskeleton service state, and quota usage |
| `enclave list` | `tntc enclave list [--status active\|frozen\|all]` | List accessible enclaves |
| `enclave sync` | `tntc enclave sync <name> [--add-member E] [--remove-member E] [--status S] [--sizing S]` | Update membership, status, or sizing |
| `enclave deprovision` | `tntc enclave deprovision <name> --confirm` | Permanently delete an enclave and all its resources (irreversible) |
| `enclave chown` | `tntc enclave chown <enclave> <tentacle> <new-owner-email>` | Transfer tentacle ownership to another member |

```bash
# Provision a new enclave
tntc enclave provision --name marketing-automations \
  --owner alice@company.com \
  --channel-id C08XXXXXXX --channel-name marketing-automations

# Show enclave details
tntc enclave info marketing-automations

# List all accessible enclaves
tntc enclave list
tntc enclave list --status active

# Add/remove members
tntc enclave sync marketing-automations --add-member dave@company.com
tntc enclave sync marketing-automations --remove-member carol@company.com

# Freeze / unfreeze
tntc enclave sync marketing-automations --status frozen
tntc enclave sync marketing-automations --status active

# Resize resource quota
tntc enclave sync marketing-automations --sizing large

# Transfer a tentacle to another member
tntc enclave chown marketing-automations price-monitor bob@company.com

# Deprovision (irreversible)
tntc enclave deprovision marketing-automations --confirm
```

See [Enclave MCP Tools Reference](/tentacular-docs/reference/enclave-tools/) for the full parameter reference for each tool.

## Authentication

| Command | Usage | Description |
|---------|-------|-------------|
| `login` | `tntc login` | Authenticate via OIDC Device Authorization Grant — displays a code, user authenticates in browser |
| `logout` | `tntc logout` | Clear stored credentials |
| `whoami` | `tntc whoami` | Show current authenticated identity, token status, and group membership |

## Permissions

Permissions use a POSIX-like model where the three principals are owner, member (registered enclave members), and other (any other authenticated user). IdP groups are not used for authorization — enclave membership is derived from Slack channel membership.

| Command | Usage | Description |
|---------|-------|-------------|
| `permissions get` | `tntc permissions get <enclave> <name>` | Show owner, mode, and preset for a deployed tentacle |
| `permissions set` | `tntc permissions set <enclave> <name> [--mode M]` | Set mode (owner-only) |
| `permissions chmod` | `tntc permissions chmod <mode> <enclave> <name>` | Set permission mode (e.g., `rwxrwx---` or preset name) |

## Workflow Lifecycle

| Command | Usage | Description |
|---------|-------|-------------|
| `init` | `tntc init <name>` | Scaffold a blank tentacle directory |
| `validate` | `tntc validate [dir]` | Validate workflow.yaml (DAG acyclicity, naming, edges) |
| `dev` | `tntc dev [dir]` | Local dev server with hot-reload |
| `test` | `tntc test [dir][/<node>]` | Run node or pipeline tests against fixtures |
| `build` | `tntc build [dir]` | Build container image (distroless Deno base) |
| `deploy` | `tntc deploy [dir]` | Generate K8s manifests and apply to cluster via the active enclave. Flags: `--enclave <name>` targets a specific enclave, `--share` sets mode to member-readable (rwxr-x---) |
| `visualize` | `tntc visualize [dir]` | Generate Mermaid diagram of the tentacle DAG |

## Scaffold Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `scaffold list` | `tntc scaffold list [--source=X] [--category=X] [--tag=X]` | List scaffolds from private and public sources |
| `scaffold search` | `tntc scaffold search <query>` | Search scaffolds by name, description, or tags |
| `scaffold info` | `tntc scaffold info <name>` | Show scaffold details and parameters |
| `scaffold init` | `tntc scaffold init <scaffold> <name> [--params-file F] [--no-params]` | Create a tentacle from a scaffold |
| `scaffold extract` | `tntc scaffold extract [--name N] [--private\|--public]` | Extract a scaffold from a working tentacle |
| `scaffold sync` | `tntc scaffold sync [--force]` | Refresh public quickstarts cache |
| `scaffold params show` | `tntc scaffold params show` | Show current parameter values for a tentacle |
| `scaffold params validate` | `tntc scaffold params validate` | Check that parameters have non-example values |

```bash
# List all scaffolds (private + public)
tntc scaffold list
tntc scaffold list --source private
tntc scaffold list --category monitoring
tntc scaffold list --tag beginner-friendly
tntc scaffold list --json

# Search by keyword
tntc scaffold search "uptime monitor"

# Show scaffold details and parameters
tntc scaffold info uptime-tracker

# Create a tentacle from a scaffold
tntc scaffold init uptime-tracker my-uptime --no-params
tntc scaffold init uptime-tracker my-uptime --params-file params.yaml
tntc scaffold init hn-digest my-digest --enclave my-team

# Extract a scaffold from a working tentacle
tntc scaffold extract --name my-scaffold
tntc scaffold extract --public

# Refresh public quickstarts
tntc scaffold sync
tntc scaffold sync --force

# Parameter inspection (run from tentacle directory)
tntc scaffold params show
tntc scaffold params validate
```

### Deprecated: Catalog Commands

The `tntc catalog` commands still work as deprecated aliases. They print a warning and delegate to `tntc scaffold`:

| Old Command | New Command |
|-------------|-------------|
| `tntc catalog list` | `tntc scaffold list` |
| `tntc catalog search` | `tntc scaffold search` |
| `tntc catalog info` | `tntc scaffold info` |
| `tntc catalog init` | `tntc scaffold init` |

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
| `--enclave` | `-e` | (auto-resolved) | Target enclave name. Auto-resolves if you belong to exactly one enclave. |
| `--registry` | `-r` | (none) | Container registry URL |
| `--output` | `-o` | `text` | Output format: `text` or `json` |
| `--env` | | (none) | Target environment from config |

Enclave resolution order: CLI `--enclave` flag > `workflow.yaml deployment.enclave` > config file default. If exactly one enclave is accessible, it is used automatically.

## Key Command Flags

```bash
# Configure
tntc configure --registry reg.io
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
tntc deploy --enclave my-team              # deploy into a specific enclave
tntc deploy --runtime-class gvisor         # default
tntc deploy --runtime-class ""             # disable gVisor
tntc deploy --image reg.io/engine:v2
tntc deploy --share                        # set mode to member-readable (rwxr-x---)

# Permissions (enclave replaces namespace as the first positional arg)
tntc permissions get my-team my-tentacle
tntc permissions chmod rwxrwx--- my-team my-tentacle
tntc permissions chmod member-edit my-team my-tentacle

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
runtime_class: gvisor
default_env: dev

environments:
  dev:
    image: ghcr.io/yourorg/tentacular-engine:latest
    runtime_class: ""
    mcp_endpoint: http://172.31.29.1:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token
  prod:
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
| `runtime_class` | Top / Env | RuntimeClass name (empty disables gVisor) |
| `default_env` | Top | Environment used when `--env` is not specified |
| `mcp_endpoint` | Env | Full URL to MCP server `/mcp` path |
| `mcp_token_path` | Env | Path to bearer token file, `~` expanded |
| `image` | Env | Engine image override |
| `catalog.url` | Top | Base URL for the scaffolds repo (public quickstarts) |
| `catalog.cacheTTL` | Top | How long to cache scaffolds index locally (default: `1h`) |

The `namespace` field is removed. Namespace targeting is derived from the enclave context — use `--enclave` on individual commands or let tntc auto-resolve.

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
