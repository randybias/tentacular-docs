---
title: Exoskeleton Setup
description: Installing and configuring the Tentacular Exoskeleton backing services
---

The exoskeleton provides optional per-tentacle backing services: PostgreSQL, NATS messaging, and RustFS object storage. Each service is independently feature-flagged. The backing services themselves are installed independently, then connected to the MCP server via its Helm chart values.

## Prerequisites

- Kubernetes cluster with the MCP server installed (`tentacular-mcp`)
- Helm 3+
- `kubectl` configured with cluster access

## Steps

### 1. Install Backing Services

Install whichever services you need. These are standard deployments — use your preferred method:

**PostgreSQL:**
```bash
# Example using Bitnami Helm chart
helm install postgres oci://registry-1.docker.io/bitnamicharts/postgresql \
  --namespace tentacular-exoskeleton --create-namespace \
  --set auth.postgresPassword=$(openssl rand -hex 32)
```

**NATS:**
```bash
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm install nats nats/nats \
  --namespace tentacular-exoskeleton
```

See [NATS + SPIFFE Setup](/tentacular-docs/guides/nats-spiffe-setup/) for SPIRE integration.

**RustFS (S3-compatible):**
```bash
# Install RustFS or MinIO in your cluster
```

### 2. Enable the Exoskeleton in the MCP Server

Upgrade the MCP server Helm release with exoskeleton configuration:

```bash
helm upgrade tentacular-mcp ./tentacular-mcp/charts/tentacular-mcp \
  --namespace tentacular-system \
  --set auth.token="${TOKEN}" \
  --set exoskeleton.enabled=true \
  --set exoskeleton.postgres.host=postgres-postgresql.tentacular-exoskeleton.svc \
  --set exoskeleton.postgres.port=5432 \
  --set exoskeleton.postgres.database=tentacular \
  --set exoskeleton.postgres.user=postgres \
  --set exoskeleton.postgres.password=<your-password> \
  --set exoskeleton.nats.url=nats://nats.tentacular-exoskeleton.svc:4222 \
  --set exoskeleton.nats.token=<your-token> \
  --set exoskeleton.rustfs.endpoint=http://rustfs.tentacular-exoskeleton.svc:9000 \
  --set exoskeleton.rustfs.accessKey=<your-key> \
  --set exoskeleton.rustfs.secretKey=<your-secret>
```

Or use existing Kubernetes Secrets:

```bash
helm upgrade tentacular-mcp ./tentacular-mcp/charts/tentacular-mcp \
  --namespace tentacular-system \
  --set auth.token="${TOKEN}" \
  --set exoskeleton.enabled=true \
  --set exoskeleton.postgres.existingSecret=my-postgres-creds \
  --set exoskeleton.nats.existingSecret=my-nats-creds \
  --set exoskeleton.rustfs.existingSecret=my-rustfs-creds
```

Only configure the services you've installed — the exoskeleton handles each independently.

### 3. Verify

```bash
# Check which services the exoskeleton reports as available
# (agents use enclave_info MCP tool to check exo_services availability)
tntc cluster check
```

Deploy a tentacle with an exoskeleton dependency:

```yaml
contract:
  version: "1"
  dependencies:
    tentacular-postgres:
```

```bash
tntc deploy -n my-namespace
tntc status my-tentacle -n my-namespace --detail
```

## Helm Values Reference

| Value | Default | Description |
|-------|---------|-------------|
| `exoskeleton.enabled` | `false` | Enable the exoskeleton control plane |
| `exoskeleton.cleanupOnUndeploy` | `false` | Delete backing-service data on undeploy |
| `exoskeleton.postgres.existingSecret` | `""` | Existing Secret with keys: host, port, database, user, password |
| `exoskeleton.postgres.host` | `""` | Postgres host (inline config) |
| `exoskeleton.postgres.port` | `"5432"` | Postgres port |
| `exoskeleton.postgres.database` | `"tentacular"` | Postgres database |
| `exoskeleton.postgres.sslMode` | `"disable"` | SSL mode (disable, require, verify-ca, verify-full) |
| `exoskeleton.nats.existingSecret` | `""` | Existing Secret with keys: url, token |
| `exoskeleton.nats.url` | `""` | NATS URL (inline config) |
| `exoskeleton.rustfs.existingSecret` | `""` | Existing Secret with keys: endpoint, access_key, secret_key, bucket, region |
| `exoskeleton.rustfs.endpoint` | `""` | RustFS endpoint (inline config) |

## Verification

- `enclave_info` reports installed services as available via `exo_services`
- Tentacles with `tentacular-*` dependencies deploy successfully
- Deployed tentacles can connect to provisioned resources
- `tntc undeploy --force` cleans up backing-service resources

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `exoskeleton: postgres not enabled` | Feature flag not set | Set `exoskeleton.enabled=true` in MCP Helm values |
| Connection refused | Service not running | Check pod status in `tentacular-exoskeleton` namespace |
| Permission denied | Registrar failed | Check MCP server logs for registrar errors |
| Stale credentials | Credentials rotated | Undeploy and redeploy to re-run registrars |

## Related

- [Exoskeleton Concepts](/tentacular-docs/concepts/exoskeleton/)
- [Exoskeleton Provisioning Cookbook](/tentacular-docs/cookbook/exoskeleton-provisioning/)
- [NATS + SPIFFE Setup](/tentacular-docs/guides/nats-spiffe-setup/)
