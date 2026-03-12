---
title: Exoskeleton
description: Optional backing services with per-tentacle isolation
---

The Tentacular Exoskeleton is an optional set of backing services that can be auto-provisioned for individual tentacles. When enabled on a cluster, tentacles can declare dependencies on platform services using the `tentacular-` prefix in their contract, and the system handles provisioning automatically.

## Available Services

- **PostgreSQL** — Each tentacle gets a scoped database schema and role. Declare `tentacular-postgres` in your contract, and the exoskeleton provisions isolated credentials and schema. No shared database access between tentacles.
- **NATS messaging** — Scoped subjects and credentials per tentacle, with SPIFFE-based mTLS as the preferred authentication mode. Enables event-driven architectures where tentacles communicate through well-defined message channels.
- **RustFS (S3-compatible object storage)** — Scoped prefixes and credentials for blob storage. Useful for tentacles that generate reports, store artifacts, or publish HTML.

## How It Works

1. An agent checks `exo_status` to see what backing services are available on the target cluster
2. The agent adds `tentacular-postgres` (or `tentacular-nats`, `tentacular-rustfs`) to the contract dependencies — no host, port, or auth configuration needed
3. On deploy, the exoskeleton:
   - Computes a deterministic **identity** from `(namespace, workflow-name)`
   - Runs **registrars** for each declared service
   - **Enriches the contract** with connection details
   - **Injects credentials** into a K8s Secret
4. On undeploy, cleanup is configurable (retain data by default, destroy with explicit `--force`)

This means tentacles can use databases, messaging, and object storage without the agent or human needing to provision, configure, or manage any infrastructure.

## Identity Compiler

The identity compiler derives a deterministic set of identifiers from `(namespace, workflow-name)`:

| Service | Identity | Format |
|---------|----------|--------|
| SPIFFE | URI | `spiffe://trust-domain/ns/<namespace>/wf/<name>` |
| Postgres | Role + Schema | `tent_<namespace>_<name>` |
| NATS | User + Subject prefix | `<namespace>.<name>.*` |
| RustFS | IAM User + S3 prefix | `<namespace>/<name>/` |

## Registrars

Four registrars handle service provisioning:

| Registrar | Provisions | Cleans Up |
|-----------|-----------|-----------|
| **Postgres** | Role with login, schema owned by role, grants | DROP ROLE CASCADE, DROP SCHEMA CASCADE |
| **NATS** | Authorization entry with scoped subjects | Remove authorization entry |
| **RustFS** | IAM user with bucket policy scoped to prefix | Delete IAM user, remove objects under prefix |
| **SPIRE** | ClusterSPIFFEID CRD for pod identity | Delete ClusterSPIFFEID |

## Contract Enrichment

When the MCP server processes `wf_apply`, it intercepts `tentacular-*` dependencies and fills in the actual connection details:

```yaml
# Before enrichment (what the agent writes)
tentacular-postgres:

# After enrichment (what the deployment sees)
tentacular-postgres:
  protocol: postgres
  host: postgres.tentacular-system.svc
  port: 5432
  database: tentacular
  user: tent_myns_myworkflow
```

## Credential Injection

The MCP server builds a K8s Secret with flat `<dep>.<field>` keys:

```
tentacular-postgres.password = <generated>
tentacular-nats.token = <generated>
tentacular-rustfs.access_key = <generated>
tentacular-rustfs.secret_key = <generated>
```

This Secret is appended to the deployment manifests and mounted at `/app/secrets`.

## Feature Flags

Each backing service has independent feature flags. A cluster can have Postgres but not NATS, or NATS but not RustFS. Agents check `exo_status` to discover availability before declaring dependencies.

![Exoskeleton Architecture](/tentacular-docs/diagrams/exoskeleton-architecture.svg)

## Related

- [Exoskeleton Setup Guide](/tentacular-docs/guides/exoskeleton-setup/)
- [Exoskeleton Provisioning Cookbook](/tentacular-docs/cookbook/exoskeleton-provisioning/)
- [ADR-003: Exoskeleton Optional](/tentacular-docs/adr/003-exoskeleton-optional/)
- [Glossary](/tentacular-docs/concepts/glossary/)
