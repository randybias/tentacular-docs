---
title: Multi-Tenancy and Access Control
description: AAA framework — authentication, authorization, and accounting for multi-tenant tentacle operations
---

Tentacular is a multi-tenant workflow platform. Multiple teams share a single Kubernetes cluster, each owning namespaces and the tentacles deployed within them. Access control follows a familiar model: authenticate users via OIDC, authorize operations through POSIX-like RBAC, and account for every action through audit annotations and structured logging.

This guide covers the three pillars of the AAA (Authentication, Authorization, Accounting) framework that make multi-tenancy work.

![Multi-tenancy AAA architecture showing authentication flow, RBAC enforcement, and audit trail](/tentacular-docs/diagrams/multi-tenancy-aaa.drawio.svg)

## Authentication

Authentication establishes *who you are*. Tentacular supports two authentication paths:

### OIDC (Primary)

Users and agents authenticate via Keycloak using the OIDC Device Authorization Grant. Keycloak brokers identity from external providers (Google SSO, GitHub, etc.) and issues JWTs containing:

- **Subject (`sub`)** — unique user identifier used for ownership matching
- **Email** — display identity
- **Group membership** — used for group-based access control

```bash
# Authenticate via OIDC
tntc login

# Verify your identity
tntc whoami
```

### Bearer Token (Admin/Automation)

Service accounts and automation tools authenticate with a bearer token. Bearer-token requests **bypass all RBAC checks** — this is the admin/automation escape hatch for clusters without SSO or for break-glass operations.

:::caution
Bearer-token access is all-or-nothing. Any request authenticated via bearer token has full access to all namespaces and tentacles. Restrict token distribution to trusted automation and administrators.
:::

## Authorization (RBAC)

Authorization determines *what you can do*. Tentacular implements RBAC using a POSIX filesystem permission model — the same owner/group/mode semantics that Unix administrators already know.

### The Multi-Tenant Model

Namespaces are tenant boundaries. Each team gets one or more namespaces, and the namespace owner controls who can operate within them. Tentacles deployed inside a namespace are further protected by their own permissions.

Think of it as a filesystem:

- **Namespaces = directories** — tenant boundaries with their own owner, group, and mode
- **Tentacles = files** — individual resources with their own owner, group, and mode
- **Both checks must pass** — just like accessing `/team/app.sh` requires directory read + file read

![Namespace authorization model showing directory/file permission analogy and two-layer check flow](/tentacular-docs/diagrams/namespace-authz-model.drawio.svg)

### Permission Scopes

| Scope | Who | Example |
|-------|-----|---------|
| Owner | The user identified by `tentacular.io/owner-sub` | The person who ran `tntc deploy` |
| Group | Members of the group in `tentacular.io/group` | A team like `platform-eng` |
| Others | Any other authenticated user | Anyone else with OIDC access |

### Permission Types

| Permission | Bit | Operations |
|------------|-----|------------|
| Read (r) | 4 | List, status, describe, health, logs, pods, events |
| Write (w) | 2 | Deploy, update, remove, set permissions |
| Execute (x) | 1 | Run, restart |

### Reading Mode Values

Mode is stored as a 9-character rwx string (e.g., `rwxr-x---`). Each group of three characters represents one scope (owner, group, others):

| Mode String | Owner | Group | Others | Meaning |
|-------------|-------|-------|--------|---------|
| `rwxr-x---` | rwx | r-x | --- | Owner full access, group can read and execute, others blocked |
| `rwx------` | rwx | --- | --- | Owner only — private |
| `rwxrwx---` | rwx | rwx | --- | Owner and group have full access |
| `rwx--x---` | rwx | --x | --- | Owner full access, group can execute only |

### Presets

Named presets map to common access patterns. Use preset names with `permissions_set` and `tntc permissions chmod`:

| Preset | Mode String | Use Case |
|--------|-------------|----------|
| `private` | `rwx------` | Only the owner can access the tentacle |
| `group-read` | `rwxr-x---` | Team members can view status and run the tentacle (default) |
| `group-run` | `rwx--x---` | Team members can only execute, not inspect |
| `group-edit` | `rwxrwx---` | Team members have full access |
| `public-read` | `rwxr--r--` | Anyone can view, only owner can modify or run |

The default mode for new deployments is `group-read` (`rwxr-x---`).

### Two-Layer Enforcement

The MCP server is the single enforcement point. Every OIDC-authenticated request passes through two permission checks:

1. **Namespace check** — does the caller have the required permission on the namespace?
2. **Tentacle check** — does the caller have the required permission on the tentacle?

Both must pass. A user with namespace read but no tentacle read cannot describe a tentacle. A user with tentacle write but no namespace read cannot even reach the tentacle.

| POSIX Operation | Tentacular Equivalent | Required Permission |
|-----------------|----------------------|---------------------|
| `ls /team/` | `wf_list` in namespace | Namespace Read |
| `touch /team/app.sh` | `wf_apply` (create tentacle) | Namespace Write |
| `cat /team/app.sh` | `wf_describe` on tentacle | Namespace Read + Tentacle Read |
| `./team/app.sh` | `wf_run` on tentacle | Namespace Read + Tentacle Execute |
| `rm /team/app.sh` | `wf_remove` on tentacle | Namespace Read + Tentacle Write |

### Namespace Permissions

Namespaces carry the same permission model as tentacles:

#### Namespace Permission Bits

| Bit | Operations |
|-----|-----------|
| Read (`r`) | `wf_list`, `wf_health_ns`, `wf_pods`, `wf_logs`, `wf_events`, `wf_jobs` (namespace-scoped) |
| Write (`w`) | `wf_apply` (create new tentacle), `ns_update`, `ns_delete` |
| Execute (`x`) | Reserved for future use |

#### Namespace Ownership

When `ns_create` is called with OIDC authentication, the caller becomes the namespace owner. The namespace receives the same annotations as tentacles:

- `tentacular.io/owner-sub`, `owner-email`, `owner-name` — from OIDC identity
- `tentacular.io/group` — from `--group` flag
- `tentacular.io/mode` — from `--share`/`--mode` flag (default: `rwxr-x---`)

#### Default Inheritance

Namespaces can specify defaults for new tentacles deployed within them. When a deployer does not pass `--group` or `--share`, the namespace defaults are used:

- `tentacular.io/default-mode` — default mode for new tentacles (e.g., `rwxrwx---`)
- `tentacular.io/default-group` — default group for new tentacles (e.g., `platform-eng`)

## Accounting

Accounting tracks *who did what and when*. Tentacular records audit data in two places: Kubernetes annotations on resources and structured slog output.

### Annotation-Based Audit Trail

Authorization metadata is stored as Kubernetes annotations on Deployment resources and Namespace resources. All annotations use the `tentacular.io/` prefix.

#### Ownership Annotations (stamped on CREATE only)

These are set when a tentacle is first deployed and preserved on subsequent updates. This prevents ownership takeover on redeploy.

| Annotation | Description |
|------------|-------------|
| `tentacular.io/owner-sub` | Owner's OIDC subject identifier (used for identity matching) |
| `tentacular.io/owner-email` | Owner's email address (display) |
| `tentacular.io/owner-name` | Owner's display name (display) |
| `tentacular.io/group` | Group assignment (from `--group` flag or empty) |
| `tentacular.io/mode` | Permission string (e.g., `rwxr-x---`) |
| `tentacular.io/auth-provider` | Authentication provider used at deploy time (e.g., `keycloak`, `bearer-token`) |
| `tentacular.io/created-at` | Creation timestamp (set once on first deploy) |

#### Update Tracking Annotations (stamped on UPDATE)

These are updated on every subsequent deploy to track who last modified the tentacle.

| Annotation | Description |
|------------|-------------|
| `tentacular.io/updated-at` | Last update timestamp |
| `tentacular.io/updated-by-sub` | Last updater's OIDC subject identifier |
| `tentacular.io/updated-by-email` | Last updater's email address |

#### Provenance Annotations

These annotations are always stamped on Deployments regardless of authz configuration:

| Annotation | Description |
|------------|-------------|
| `tentacular.io/deployed-by` | Deployer email |
| `tentacular.io/deployed-via` | Agent type (e.g., `cli`) |
| `tentacular.io/deployed-at` | Deployment timestamp |

### Structured Audit Logging

The MCP server emits structured slog entries for every authorization decision. These logs integrate with standard Kubernetes log aggregation (Loki, Fluentd, CloudWatch, etc.) for centralized audit trails.

## Annotation Migration

The following `tentacular.dev/*` annotations have been replaced:

| Old Annotation | Replacement |
|----------------|-------------|
| `tentacular.dev/owner` | `tentacular.io/owner-sub`, `tentacular.io/owner-email`, `tentacular.io/owner-name` |
| `tentacular.dev/team` | `tentacular.io/group` |
| `tentacular.dev/environment` | `tentacular.io/environment` |
| `tentacular.dev/tags` | `tentacular.io/tags` |
| `tentacular.dev/cron-schedule` | `tentacular.io/cron-schedule` |

The old `tentacular.dev/*` annotations are no longer recognized. Existing deployments using old annotations must be redeployed to receive authorization metadata.

## CLI Commands

```bash
# --- Tentacle permissions (2 positional args: namespace + name) ---

# Check permissions on a tentacle
tntc permissions get <namespace> <name>

# Set mode using a preset name or rwx string
tntc permissions chmod group-read <namespace> <name>
tntc permissions chmod rwxr-x--- <namespace> <name>

# Change group
tntc permissions chgrp <group> <namespace> <name>

# Deploy with group
tntc deploy --group <group> --env <target>

# Deploy with group-readable mode
tntc deploy --share --env <target>

# --- Namespace permissions (1 positional arg: namespace) ---

# Check permissions on a namespace
tntc permissions get <namespace>

# Set namespace mode
tntc permissions set <namespace> --mode group-edit

# Shortcuts
tntc chmod <mode-or-preset> <namespace>
tntc chgrp <group> <namespace>
```

Only the owner can modify permissions on a tentacle or namespace.

## MCP Server Configuration

Authorization is enabled by default when the MCP server starts. To disable all authorization checks, set the environment variable:

```bash
TENTACULAR_AUTHZ_ENABLED=false
```

When disabled, all authenticated requests (OIDC or bearer token) have full access to all operations. The default mode for new deployments is `group-read` (`rwxr-x---`).

## MCP Tools

| Tool | Description |
|------|-------------|
| `permissions_get` | Get owner, group, mode, and preset for a deployed tentacle |
| `permissions_set` | Set group or share preset on a tentacle (owner-only) |
| `ns_permissions_get` | Get owner, group, mode, and preset for a namespace |
| `ns_permissions_set` | Set group, mode, or share preset on a namespace (owner-only) |

See [MCP Tools Reference](/tentacular-docs/reference/mcp-tools/) for parameter details.

## Unowned Resources

Resources without a `tentacular.io/owner-sub` annotation are **denied** to all OIDC callers. This prevents accidental access to resources that were deployed before authorization was enabled or whose ownership annotations were removed.

To adopt unowned resources, use bearer-token authentication or `kubectl` (see below).

## Kubernetes Administrator Guide

MCP-layer authorization enforces permissions through Kubernetes annotations. Cluster administrators with `kubectl` access can directly manage these annotations as a break-glass mechanism.

:::caution
`kubectl` access to annotations bypasses MCP-layer authorization entirely. Kubernetes RBAC is the outer security perimeter. Restrict `kubectl` access to trusted administrators.
:::

### Adopting Unowned Resources

```bash
# Stamp ownership on a tentacle
kubectl annotate deploy -n tent-dev my-tentacle \
  tentacular.io/owner-sub=<user-uuid> \
  tentacular.io/owner-email=user@example.com \
  tentacular.io/owner-name="User Name" \
  tentacular.io/group=platform-team \
  tentacular.io/mode=rwxr-x---

# Stamp ownership on a namespace
kubectl annotate ns tent-dev \
  tentacular.io/owner-sub=<user-uuid> \
  tentacular.io/owner-email=user@example.com \
  tentacular.io/owner-name="User Name" \
  tentacular.io/group=platform-team \
  tentacular.io/mode=rwxr-x---
```

Find user UUIDs via `tntc whoami` (Subject field) or the Keycloak admin console.

### Transferring Ownership

```bash
kubectl annotate deploy -n tent-dev my-tentacle \
  tentacular.io/owner-sub=<new-uuid> \
  tentacular.io/owner-email=new@example.com \
  tentacular.io/owner-name="New Owner" \
  --overwrite
```

### Auditing Permissions

```bash
kubectl get deploy -n tent-dev -o custom-columns=\
  NAME:.metadata.name,\
  OWNER:.metadata.annotations.tentacular\.io/owner-email,\
  GROUP:.metadata.annotations.tentacular\.io/group,\
  MODE:.metadata.annotations.tentacular\.io/mode
```
