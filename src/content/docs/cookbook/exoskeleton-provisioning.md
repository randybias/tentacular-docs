---
title: Exoskeleton Provisioning
description: How tentacles get scoped backing-service resources
---

## Goal

Understand and use the exoskeleton to automatically provision Postgres, NATS, and RustFS resources for a tentacle.

## Prerequisites

- Exoskeleton services enabled on the target cluster (see [Exoskeleton Setup](/tentacular-docs/guides/exoskeleton-setup/))
- `tntc` CLI configured with MCP access

## Steps

### 1. Check Available Services

Use the MCP `enclave_info` tool or CLI to see what backing services are available for the enclave:

```bash
# The agent checks enclave_info (exo_services field) before designing a tentacle
# Available services vary per cluster
```

### 2. Declare Dependencies

Add `tentacular-*` prefixed dependencies to your contract. No host, port, or auth needed — the exoskeleton fills these in:

```yaml
contract:
  version: "1"
  dependencies:
    # Exoskeleton-managed (auto-provisioned)
    tentacular-postgres:    # Scoped database schema and role
    tentacular-nats:        # Scoped subjects and credentials
    tentacular-rustfs:      # Scoped S3-compatible object storage

    # Manual (you provide host/port/auth)
    github-api:
      protocol: https
      host: api.github.com
      port: 443
      auth:
        type: bearer-token
        secret: github.token
```

### 3. Deploy

```bash
tntc deploy
```

During deployment, the exoskeleton:
1. Computes a deterministic **identity** from `(namespace, workflow-name)`
2. Runs **registrars** for each declared `tentacular-*` dependency
3. **Enriches the contract** — fills in host/port/database/user fields
4. **Injects credentials** — builds a K8s Secret with per-service credentials

### 4. Access Services in Nodes

```typescript
import type { Context } from "tentacular";

export default async function run(ctx: Context, input: unknown) {
  // Postgres — credentials and connection details are auto-injected
  const pg = ctx.dependency("tentacular-postgres");
  // pg.host, pg.port, pg.secret contain the provisioned values

  // NATS — scoped subjects and auth
  const nats = ctx.dependency("tentacular-nats");

  // RustFS — S3-compatible with scoped prefix
  const rustfs = ctx.dependency("tentacular-rustfs");
}
```

## What Gets Provisioned

| Service | Resources | Scope |
|---------|-----------|-------|
| **Postgres** | Role + schema | Per-tentacle: role named from identity, schema owned by role |
| **NATS** | Authorization entry | Per-tentacle: scoped subject prefix, publish/subscribe permissions |
| **RustFS** | IAM user + policy | Per-tentacle: user with access to scoped S3 prefix only |
| **SPIRE** | ClusterSPIFFEID | Per-tentacle: SPIFFE identity for mTLS |

## Verification

- `tntc status my-tentacle --detail` shows the deployment with exoskeleton dependencies
- Tentacle can connect to provisioned services without manual credential management
- `tntc run my-tentacle` succeeds when using backing services

## Failure Modes

| Failure | Cause | Resolution |
|---------|-------|------------|
| `exoskeleton: postgres not enabled` | Postgres not installed on cluster | Check `enclave_info` (exo_services) and install if needed |
| Connection refused to backing service | Service endpoint changed | Re-check exoskeleton installation |
| Permission denied on Postgres | Role misconfigured | Undeploy and redeploy to re-run registrars |
| Stale credentials | Service credentials rotated | Undeploy and redeploy to re-run registrars |

## Cleanup

By default, undeploying a tentacle **retains** exoskeleton data (Postgres schemas, NATS entries, RustFS objects). To destroy data:

```bash
tntc undeploy my-tentacle --force
```

The `--force` flag triggers unregistrars that drop schemas (CASCADE), remove NATS auth entries, and delete RustFS objects.

## Related

- [Exoskeleton Concepts](/tentacular-docs/concepts/exoskeleton/)
- [Exoskeleton Setup Guide](/tentacular-docs/guides/exoskeleton-setup/)
- [Glossary — Registrar, Workspace, Identity](/tentacular-docs/concepts/glossary/)
