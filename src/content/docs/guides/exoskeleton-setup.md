---
title: Exoskeleton Setup
description: Installing and configuring the Tentacular Exoskeleton backing services
---

The exoskeleton provides optional per-tentacle backing services: PostgreSQL, NATS messaging, and RustFS object storage. Each service is independently feature-flagged.

## Prerequisites

- Kubernetes cluster with the MCP server installed
- Helm 3+
- `kubectl` configured with cluster access

## Steps

### 1. Install PostgreSQL

Deploy a PostgreSQL instance for tentacle workspaces:

```bash
helm install tentacular-postgres oci://ghcr.io/randybias/tentacular-postgres \
  --namespace tentacular-system \
  --set auth.postgresPassword=$(openssl rand -hex 32)
```

Enable the Postgres registrar in the MCP server:

```bash
helm upgrade tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --set exoskeleton.postgres.enabled=true \
  --set exoskeleton.postgres.host=tentacular-postgres.tentacular-system.svc \
  --set exoskeleton.postgres.port=5432
```

### 2. Install NATS

Deploy NATS with SPIFFE-based mTLS:

```bash
helm install tentacular-nats nats/nats \
  --namespace tentacular-system \
  --values nats-values.yaml
```

Enable the NATS registrar:

```bash
helm upgrade tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --set exoskeleton.nats.enabled=true \
  --set exoskeleton.nats.url=nats://tentacular-nats.tentacular-system.svc:4222
```

See [NATS + SPIFFE Setup](/tentacular-docs/guides/nats-spiffe-setup/) for the full guide including SPIRE integration.

### 3. Install RustFS

Deploy RustFS (S3-compatible object storage):

```bash
helm install tentacular-rustfs oci://ghcr.io/randybias/tentacular-rustfs \
  --namespace tentacular-system \
  --set rootUser=admin \
  --set rootPassword=$(openssl rand -hex 32)
```

Enable the RustFS registrar:

```bash
helm upgrade tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --set exoskeleton.rustfs.enabled=true \
  --set exoskeleton.rustfs.endpoint=http://tentacular-rustfs.tentacular-system.svc:9000
```

### 4. Verify

Check which services are available:

```bash
# Via MCP exo_status tool
tntc cluster check
```

Deploy a tentacle with exoskeleton dependencies to verify:

```yaml
contract:
  version: "1"
  dependencies:
    tentacular-postgres:
```

```bash
tntc deploy
tntc status my-tentacle --detail
```

## Verification

- `exo_status` reports all installed services as available
- Tentacles with `tentacular-*` dependencies deploy successfully
- Deployed tentacles can connect to provisioned resources
- `tntc undeploy --force` cleans up backing-service resources

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `exoskeleton: postgres not enabled` | Feature flag not set | Set `exoskeleton.postgres.enabled=true` in MCP Helm values |
| Connection refused | Service not running | Check pod status in `tentacular-system` namespace |
| Permission denied | Registrar failed | Check MCP server logs for registrar errors |
| Stale credentials | Credentials rotated | Use `cred_rotate` MCP tool |

## Related

- [Exoskeleton Concepts](/tentacular-docs/concepts/exoskeleton/)
- [Exoskeleton Provisioning Cookbook](/tentacular-docs/cookbook/exoskeleton-provisioning/)
- [NATS + SPIFFE Setup](/tentacular-docs/guides/nats-spiffe-setup/)
