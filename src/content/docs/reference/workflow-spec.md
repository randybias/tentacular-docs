---
title: Workflow Specification
description: Complete field-by-field reference for workflow.yaml
---

Tentacles are defined in `workflow.yaml` at the root of each tentacle directory.

## Full Example

```yaml
name: my-tentacle           # kebab-case, required
version: "1.0"              # semver string, required
description: "What it does" # optional

triggers:
  - type: manual
  - type: cron
    name: daily-digest
    schedule: "0 9 * * *"
  - type: queue
    subject: events.incoming

nodes:
  fetch-data:
    path: ./nodes/fetch-data.ts
  process:
    path: ./nodes/process.ts
  notify:
    path: ./nodes/notify.ts

edges:
  - from: fetch-data
    to: process
  - from: process
    to: notify

config:
  timeout: 30s
  retries: 1
  # arbitrary keys are preserved
  custom_key: "any value"

deployment:
  namespace: pd-my-tentacle

contract:
  version: "1"
  dependencies:
    github-api:
      protocol: https
      host: api.github.com
      port: 443
      auth:
        type: bearer-token
        secret: github.token
    slack-webhook:
      protocol: https
      host: hooks.slack.com
      port: 443
    news-sources:
      type: dynamic-target
      protocol: https
      cidr: "0.0.0.0/0"
      dynPorts:
        - "443/TCP"
    tentacular-postgres:
      # exoskeleton-managed: host/port/auth auto-provisioned
```

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Tentacle name. Must be kebab-case. |
| `version` | string | Yes | Semantic version (quoted to prevent YAML number parsing). |
| `description` | string | No | Human-readable description. |
| `triggers` | array | No | How the tentacle is initiated. Defaults to manual only. |
| `nodes` | map | Yes | Named nodes with paths to TypeScript files. At least one required. |
| `edges` | array | Yes | Directed edges between nodes forming a DAG. |
| `config` | map | No | Workflow-level configuration passed to nodes via `ctx.config`. |
| `deployment` | map | No | Deployment-specific settings. |
| `contract` | map | No | Security contract declaring external dependencies. |

## Triggers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | One of: `manual`, `cron`, `queue`, `webhook` (roadmap) |
| `name` | string | No | Named trigger for parameterized execution |
| `schedule` | string | Cron only | Cron expression (5-field) |
| `subject` | string | Queue only | NATS subject to subscribe to |

Named cron triggers send `{"trigger": "<name>"}` as input to root nodes, enabling workflows with multiple schedules that branch on trigger identity.

## Nodes

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | Relative path to the TypeScript node file |
| `capabilities` | map | No | Legacy per-node capabilities (deprecated in favor of contract) |

Node names must be kebab-case and unique within the tentacle.

## Edges

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | Yes | Source node name |
| `to` | string | Yes | Target node name |

Edges must reference defined nodes. Self-loops and cycles are rejected at validation time. The DAG is compiled using Kahn's algorithm into execution stages — nodes at the same depth level run in parallel.

## Config

The config block is **open** — arbitrary keys are preserved alongside typed fields. In Go, extra keys flow into `WorkflowConfig.Extras` via `yaml:",inline"`. Nodes access config via `ctx.config`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `timeout` | string | `30s` | Per-node execution timeout |
| `retries` | integer | `0` | Maximum retry count with exponential backoff |
| `*` | any | — | Arbitrary keys preserved for node access |

## Deployment

| Field | Type | Description |
|-------|------|-------------|
| `namespace` | string | Target Kubernetes namespace |

Namespace resolution order: CLI `-n` flag > `deployment.namespace` > config file default > `default`.

## Contract

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Contract format version (currently `"1"`) |
| `dependencies` | map | Yes | Named external service declarations |

### Dependency Fields (Manual)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocol` | string | Yes | `https`, `postgres`, `nats`, etc. |
| `host` | string | Yes | Target hostname |
| `port` | integer | Yes | Target port |
| `auth` | map | No | Authentication configuration |
| `auth.type` | string | No | Auth type string (e.g., `bearer-token`, `api-key`) |
| `auth.secret` | string | No | Secret reference in `service.key` format |

### Dynamic Target Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `dynamic-target` |
| `protocol` | string | Yes | Protocol for dynamic targets |
| `cidr` | string | Yes | CIDR range (e.g., `0.0.0.0/0`) |
| `dynPorts` | array | Yes | Port/protocol pairs (e.g., `443/TCP`) |
| `reason` | string | No | Human-readable explanation |

### Exoskeleton Dependencies

Dependencies prefixed with `tentacular-` are auto-provisioned by the exoskeleton. No host, port, or auth configuration needed.

```yaml
tentacular-postgres:    # Scoped database schema and role
tentacular-nats:        # Scoped subjects and credentials
tentacular-rustfs:      # Scoped S3-compatible object storage
```

## Execution Model

Nodes within the same execution stage run in parallel via `Promise.all()`. Stages execute sequentially based on the topological sort of the DAG.

For a tentacle with edges `A→B`, `A→C`, `B→D`, `C→D`:
- **Stage 1:** `[A]`
- **Stage 2:** `[B, C]` (parallel)
- **Stage 3:** `[D]`

## Validation Rules

- `name`: must be kebab-case (`[a-z0-9-]+`)
- `version`: must be a quoted semver string
- At least one node must be defined
- All edge references must point to defined nodes
- No self-loops or cycles in the DAG
- Trigger types must be one of: `manual`, `cron`, `queue`
- Cron triggers must include a `schedule` field
- Queue triggers must include a `subject` field
