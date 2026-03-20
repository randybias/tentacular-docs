---
title: MCP Tools
description: Complete reference for Tentacular MCP server tools
---

The Tentacular MCP server exposes 30 tools across 9 groups via the Model Context Protocol. These tools are used by the `tntc` CLI and can be called directly by AI agents.

## Namespace Management

| Tool | Description |
|------|-------------|
| `ns_create` | Create a namespace with PSA labels, default NetworkPolicy, and owner/group/mode permissions. Accepts `group`, `mode`/`share`, `default_mode`, and `default_group` parameters |
| `ns_get` | Get namespace details including labels and annotations |
| `ns_list` | List all tentacular-managed namespaces |
| `ns_update` | Update namespace labels or annotations |
| `ns_delete` | Delete a namespace and all its resources |

## Workflow Lifecycle

| Tool | Description |
|------|-------------|
| `wf_apply` | Apply workflow manifests to the cluster. The exoskeleton intercepts this to run registrars, enrich contracts, and inject credentials. |
| `wf_remove` | Remove a workflow's K8s resources. When cleanup is enabled, also runs unregistrars. |
| `wf_list` | List all tentacular-managed workflows in a namespace |
| `wf_status` | Get deployment status (replicas, conditions, image) |
| `wf_describe` | Detailed workflow description including pods and events |
| `wf_run` | Trigger a deployed workflow via HTTP POST to `/run` |
| `wf_restart` | Restart a workflow deployment (rolling restart) |
| `wf_logs` | Get pod logs (snapshot, not streaming) |
| `wf_pods` | List pods for a workflow |
| `wf_events` | Get recent events for a workflow's resources |
| `wf_jobs` | List jobs associated with a workflow |

## Workflow Health

| Tool | Description |
|------|-------------|
| `wf_health` | Health check for a single workflow (Green/Amber/Red classification) |
| `wf_health_ns` | Health check for all workflows in a namespace |

## Cluster Operations

| Tool | Description |
|------|-------------|
| `cluster_preflight` | Preflight validation: MCP connectivity, namespace creation, RuntimeClass, NetworkPolicy |
| `cluster_profile` | Cluster capability snapshot: K8s version, CNI, storage, gVisor, extensions |
| `health_cluster_summary` | Overall cluster health summary |
| `health_nodes` | Node health and resource usage |
| `health_ns_usage` | Namespace resource usage |

## Security Audit

| Tool | Description |
|------|-------------|
| `audit_rbac` | Verify service account has minimal permissions |
| `audit_netpol` | Verify NetworkPolicy matches contract |
| `audit_psa` | Verify Pod Security Admission labels |

## Exoskeleton

| Tool | Description |
|------|-------------|
| `exo_status` | Check which backing services are available on the cluster |
| `exo_registration` | View exoskeleton registration status for a workflow |

## Permissions

| Tool | Description |
|------|-------------|
| `permissions_get` | Get owner, group, mode, and preset for a deployed tentacle |
| `permissions_set` | Set group or share preset for a deployed tentacle (owner-only). Takes `group` and/or `share` (preset name) parameters |
| `ns_permissions_get` | Get owner, group, mode, default-mode, and default-group for a namespace |
| `ns_permissions_set` | Set group, mode, or share preset for a namespace (namespace-owner-only). Takes `group`, `mode`, and/or `share` parameters |

Authorization is enforced only when OIDC authentication is active. Bearer-token requests bypass authorization entirely. The `permissions_set` and `ns_permissions_set` tools can only be called by the respective owner. Default mode is `group-read` (`rwxr-x---`).

## Module Proxy

| Tool | Description |
|------|-------------|
| `proxy_status` | Check ESM module proxy status and cached modules |

## Tool Groups

Tools are organized into 9 functional groups:

1. **Namespace** — `ns_*` (5 tools)
2. **Workflow Lifecycle** — `wf_apply`, `wf_remove`, `wf_list`, `wf_status`, `wf_describe`, `wf_run`, `wf_restart`, `wf_logs`, `wf_pods`, `wf_events`, `wf_jobs` (11 tools)
3. **Workflow Health** — `wf_health`, `wf_health_ns` (2 tools)
4. **Cluster** — `cluster_preflight`, `cluster_profile` (2 tools)
5. **Health** — `health_cluster_summary`, `health_nodes`, `health_ns_usage` (3 tools)
6. **Audit** — `audit_rbac`, `audit_netpol`, `audit_psa` (3 tools)
7. **Exoskeleton** — `exo_status`, `exo_registration` (2 tools)
8. **Permissions** — `permissions_get`, `permissions_set`, `ns_permissions_get`, `ns_permissions_set` (4 tools)
9. **Module Proxy** — `proxy_status` (1 tool)

## Authentication

All MCP tools require authentication. The server supports dual auth:

- **OIDC tokens** — from Keycloak/Google SSO, tried first
- **Bearer tokens** — fallback, always accepted

Tools that modify state (deploy, undeploy, credential operations) record deployer provenance when OIDC authentication is used.

## Authorization

When OIDC authentication is active, the MCP server enforces POSIX-like permissions on both namespaces and tentacles. Namespaces act as directories and tentacles as files — both layers must pass for an operation to succeed. Each has an owner, group, and mode that control who can read (list/status), write (deploy/update/remove), or execute (run/restart) it. Bearer-token requests bypass authorization entirely.

See the [Authorization guide](/tentacular-docs/guides/authorization/) for details on the permission model, annotation schema, and configuration.

*Generated from: `tentacular-mcp/pkg/tools/register.go`*
*Run `scripts/gen-mcp-reference.sh` to regenerate.*
