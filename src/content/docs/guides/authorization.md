---
title: Multi-Tenancy and Access Control
description: AAA framework — authentication, authorization, and accounting for multi-tenant tentacle operations
---

Tentacular is a multi-tenant workflow platform. Multiple teams share a single Kubernetes cluster, each owning an enclave and the tentacles deployed within it. Access control follows a familiar model: authenticate users via OIDC, authorize operations through POSIX-like RBAC, and account for every action through audit annotations and structured logging.

This guide covers the three pillars of the AAA (Authentication, Authorization, Accounting) framework that make multi-tenancy work.

![Multi-tenancy AAA architecture showing authentication flow, RBAC enforcement, and audit trail](/tentacular-docs/diagrams/multi-tenancy-aaa.drawio.svg)

## Authentication

Authentication establishes *who you are*. Tentacular supports two authentication paths:

### OIDC (Primary)

Users and agents authenticate via Keycloak using the OIDC Device Authorization Grant. Keycloak brokers identity from external providers (Google SSO, GitHub, etc.) and issues JWTs containing:

- **Subject (`sub`)** — unique user identifier used for ownership matching
- **Email** — display identity

Group membership from the IdP (Keycloak groups) is **not used for authorization**. Enclave membership is derived from Slack channel membership, not directory groups. This keeps the group model self-service and removes dependency on enterprise directory structures.

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

Enclaves are tenant boundaries. Each team owns one enclave, and the enclave owner controls who can operate within it. Tentacles deployed inside an enclave are further protected by their own permissions.

Think of it as a filesystem:

- **Enclaves = directories** — tenant boundaries with their own owner, members, and mode
- **Tentacles = files** — individual resources with their own owner and mode
- **Both checks must pass** — just like accessing `/team/app.sh` requires directory read + file read

![Enclave authorization model showing directory/file permission analogy and two-layer check flow](/tentacular-docs/diagrams/namespace-authz-model.drawio.svg)

### Permission Scopes

| Scope | Who | How Determined |
|-------|-----|----------------|
| Owner | The user identified by `tentacular.io/owner-sub` | The person who provisioned the enclave or deployed the tentacle |
| Member | Registered enclave members | Users who joined the Slack channel and completed OIDC sign-in |
| Other | Any other authenticated user | Authenticated users who are not the owner or a registered member |

IdP group membership (Keycloak groups, LDAP groups) is not used for authorization. The `tentacular.io/group` annotation is deprecated — enclave membership is the authorization primitive.

### Permission Types

| Permission | Bit | Operations |
|------------|-----|------------|
| Read (r) | 4 | List, status, describe, health, logs, pods, events |
| Write (w) | 2 | Deploy, update, remove, set permissions |
| Execute (x) | 1 | Run, restart |

### Reading Mode Values

Mode is stored as a 9-character rwx string (e.g., `rwxrwx---`). Each group of three characters represents one scope (owner, member, other):

| Mode String | Owner | Member | Other | Meaning |
|-------------|-------|--------|-------|---------|
| `rwxr-x---` | rwx | r-x | --- | Owner full access, members can read and run, others blocked |
| `rwx------` | rwx | --- | --- | Owner only — private |
| `rwxrwx---` | rwx | rwx | --- | Owner and members have full access (default) |
| `rwx--x---` | rwx | --x | --- | Owner full access, members can execute only |
| `rwxrwxr--` | rwx | rwx | r-- | Owner and members full access, others can view |
| `rwxrwxr-x` | rwx | rwx | r-x | Owner and members full access, others can view and run |

### Presets

Named presets map to common access patterns. Use preset names with `permissions_set` and `tntc permissions chmod`. The presets reflect enclave membership (member = registered enclave member, other = unenrolled authenticated user):

| Preset | Mode String | Use Case |
|--------|-------------|----------|
| `private` | `rwx------` | Owner only — personal or sensitive work |
| `member-read` | `rwxr-x---` | Members can view and run; only owner deploys |
| `member-run` | `rwx--x---` | Members can only execute, not inspect |
| `member-edit` | `rwxrwx---` | **Default** — full collaboration within the team |
| `open-read` | `rwxrwxr--` | Visitors (non-members) can view; members have full access |
| `open-run` | `rwxrwxr-x` | Visitors can view and trigger; members have full access |

The default mode for new enclaves and new tentacle deployments is `member-edit` (`rwxrwx---`).

### Two-Layer Enforcement

The MCP server is the single enforcement point. Every OIDC-authenticated request passes through two permission checks:

1. **Enclave check** — does the caller have the required permission on the enclave?
2. **Tentacle check** — does the caller have the required permission on the tentacle?

Both must pass. A user with enclave read but no tentacle read cannot describe a tentacle. A user with tentacle write but no enclave read cannot even reach the tentacle. The **enclave owner** is a superuser within their enclave — they bypass tentacle-level checks and can perform any operation on any tentacle.

| POSIX Operation | Tentacular Equivalent | Required Permission |
|-----------------|----------------------|---------------------|
| `ls /team/` | `wf_list` in enclave | Enclave Read |
| `touch /team/app.sh` | `wf_apply` (create tentacle) | Enclave Write |
| `cat /team/app.sh` | `wf_describe` on tentacle | Enclave Read + Tentacle Read |
| `./team/app.sh` | `wf_run` on tentacle | Enclave Read + Tentacle Execute |
| `rm /team/app.sh` | `wf_remove` on tentacle | Enclave Read + Tentacle Write |

### Enclave Permissions

Enclaves carry the same permission model as tentacles and serve as the tenant boundary:

#### Enclave Permission Bits

| Bit | Operations |
|-----|-----------|
| Read (`r`) | `wf_list`, `enclave_info`, `wf_health`, `wf_pods`, `wf_logs`, `wf_events` |
| Write (`w`) | `wf_apply` (deploy new tentacle), `enclave_sync` settings |
| Execute (`x`) | Run tentacles within the enclave |

#### Enclave Ownership and Membership

When `enclave_provision` is called, the caller becomes the enclave owner. The enclave namespace receives annotations:

- `tentacular.io/owner-sub`, `owner-email`, `owner-name` — from OIDC identity
- `tentacular.io/enclave-members` — JSON array of registered member emails
- `tentacular.io/mode` — permission mode string (default: `rwxrwx---`)

The `tentacular.io/group` annotation is deprecated and not used for authorization.

#### Default Inheritance

Enclaves specify defaults for new tentacles deployed within them:

- `tentacular.io/default-mode` — default mode for new tentacles (e.g., `rwxrwx---`)

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
| `tentacular.io/mode` | Permission string (e.g., `rwxrwx---`) |
| `tentacular.io/auth-provider` | Authentication provider used at deploy time (e.g., `keycloak`, `bearer-token`) |
| `tentacular.io/created-at` | Creation timestamp (set once on first deploy) |

Enclave namespaces additionally carry:

| Annotation | Description |
|------------|-------------|
| `tentacular.io/enclave-owner` | Enclave owner email |
| `tentacular.io/enclave-owner-sub` | Enclave owner OIDC subject identifier |
| `tentacular.io/enclave-members` | JSON array of registered member emails |
| `tentacular.io/channel-id` | Platform channel ID (e.g., Slack channel ID) |
| `tentacular.io/channel-name` | Platform channel display name |

The `tentacular.io/group` annotation is deprecated. It may be present on pre-enclave deployments but is not used by the authorization evaluator.

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

### From `tentacular.dev/*`

The following `tentacular.dev/*` annotations have been replaced:

| Old Annotation | Replacement |
|----------------|-------------|
| `tentacular.dev/owner` | `tentacular.io/owner-sub`, `tentacular.io/owner-email`, `tentacular.io/owner-name` |
| `tentacular.dev/team` | Deprecated — use enclave membership instead |
| `tentacular.dev/environment` | `tentacular.io/environment` |
| `tentacular.dev/tags` | `tentacular.io/tags` |
| `tentacular.dev/cron-schedule` | `tentacular.io/cron-schedule` |

The old `tentacular.dev/*` annotations are no longer recognized. Existing deployments using old annotations must be redeployed to receive authorization metadata.

### From Group-Based Authorization

The `tentacular.io/group` annotation and the `--group`/`--share` group flag are deprecated. Authorization now uses enclave membership (owner/member/other) instead of IdP group assignment. Existing deployments with `tentacular.io/group` set will have the annotation ignored by the authorization evaluator — access is controlled by enclave membership only.

## CLI Commands

```bash
# --- Tentacle permissions (2 positional args: enclave + tentacle name) ---

# Check permissions on a tentacle
tntc permissions get <enclave> <name>

# Set mode using a preset name or rwx string
tntc permissions chmod member-read <enclave> <name>
tntc permissions chmod rwxr-x--- <enclave> <name>

# Deploy with member-readable mode
tntc deploy --share --enclave <enclave>

# --- Enclave permissions (1 positional arg: enclave name) ---

# Check permissions on an enclave
tntc permissions get <enclave>

# Set enclave mode
tntc permissions set <enclave> --mode open-read

# Shortcuts
tntc chmod <mode-or-preset> <enclave>
```

Only the owner can modify permissions on a tentacle or enclave. The `--group` and `chgrp` flags are removed — member access is governed by enclave membership (Slack channel membership), not group assignment.

## MCP Server Configuration

Authorization is enabled by default when the MCP server starts. To disable all authorization checks, set the environment variable:

```bash
TENTACULAR_AUTHZ_ENABLED=false
```

When disabled, all authenticated requests (OIDC or bearer token) have full access to all operations. The default mode for new enclaves and tentacles is `member-edit` (`rwxrwx---`).

## MCP Tools

| Tool | Description |
|------|-------------|
| `permissions_get` | Get owner, mode, and preset for a deployed tentacle or enclave |
| `permissions_set` | Set mode or share preset on a tentacle or enclave (owner-only) |
| `enclave_provision` | Provision a new enclave with ownership and membership |
| `enclave_sync` | Update enclave membership, status, or mode |
| `enclave_info` | Show enclave details, membership, and quota |
| `enclave_list` | List accessible enclaves |
| `enclave_deprovision` | Permanently delete an enclave (irreversible) |

The `ns_permissions_get` and `ns_permissions_set` tools are deprecated in favor of using `permissions_get`/`permissions_set` with an enclave name. The `ns_create`, `ns_list`, `ns_delete` tools are deprecated in favor of the enclave tools.

See [Enclave MCP Tools Reference](/tentacular-docs/reference/enclave-tools/) for full parameter details.

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
kubectl annotate deploy -n my-enclave my-tentacle \
  tentacular.io/owner-sub=<user-uuid> \
  tentacular.io/owner-email=user@example.com \
  tentacular.io/owner-name="User Name" \
  tentacular.io/mode=rwxrwx---

# Stamp ownership on an enclave namespace
kubectl annotate ns my-enclave \
  tentacular.io/owner-sub=<user-uuid> \
  tentacular.io/owner-email=user@example.com \
  tentacular.io/owner-name="User Name" \
  tentacular.io/enclave-members='["member1@example.com","member2@example.com"]' \
  tentacular.io/mode=rwxrwx---
```

Find user UUIDs via `tntc whoami` (Subject field) or the Keycloak admin console.

### Transferring Ownership

```bash
kubectl annotate deploy -n my-enclave my-tentacle \
  tentacular.io/owner-sub=<new-uuid> \
  tentacular.io/owner-email=new@example.com \
  tentacular.io/owner-name="New Owner" \
  --overwrite
```

### Auditing Permissions

```bash
kubectl get deploy -n my-enclave -o custom-columns=\
  NAME:.metadata.name,\
  OWNER:.metadata.annotations.tentacular\.io/owner-email,\
  MODE:.metadata.annotations.tentacular\.io/mode
```
