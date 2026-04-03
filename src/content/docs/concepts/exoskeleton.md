---
title: Exoskeleton
description: Enclave-provisioned backing services with per-tentacle isolation
---

The Tentacular Exoskeleton is the set of shared infrastructure services that are automatically provisioned when an enclave is created. Every enclave receives a Postgres database and RustFS (S3-compatible) storage at provision time. NATS messaging and SPIRE workload identity are optional add-ons, auto-provisioned when a tentacle contract declares a dependency on them.

Exoskeleton services are scoped to the enclave — services from one enclave are not reachable from another. Within an enclave, individual tentacles get isolated sub-resources (schemas, prefixes, subjects) to prevent cross-tentacle data leakage.

## Available Services

- **PostgreSQL** (baseline) — Provisioned with every enclave. Each tentacle gets a scoped database schema and role. Declare `tentacular-postgres` in your contract, and the exoskeleton injects isolated credentials and connection details. No shared schema access between tentacles.
- **RustFS (S3-compatible object storage)** (baseline) — Provisioned with every enclave. Scoped prefixes and credentials per tentacle. Useful for tentacles that generate reports, store artifacts, or publish HTML.
- **NATS messaging** (optional) — One subject hierarchy per enclave. Auto-provisioned when a tentacle contract declares a NATS dependency. Enables event-driven architectures where tentacles communicate through well-defined message channels.
- **SPIRE** (optional) — One trust domain per enclave. Auto-provisioned when a tentacle contract declares an identity dependency.

## How It Works

1. **Enclave provisioning** — when `enclave_provision` runs, Postgres and RustFS are created and scoped to the enclave. NATS and SPIRE are not provisioned yet.
2. **Tentacle deployment** — when a tentacle contract declares a `tentacular-*` dependency, the MCP server:
   - Computes a deterministic **identity** from `(enclave, workflow-name)`
   - Runs **registrars** for each declared service, creating isolated sub-resources
   - Optionally provisions NATS or SPIRE for the enclave if not already present
   - **Enriches the contract** with connection details
   - **Injects credentials** into a K8s Secret
   - **Patches the NetworkPolicy** with egress rules for each registered service
3. **Undeploy** — cleanup is configurable (retain data by default, destroy with explicit `--force`)

This means tentacles can use databases, messaging, and object storage without the agent or human needing to provision, configure, or manage any infrastructure.

## Identity Compiler

The identity compiler derives a deterministic set of identifiers from `(enclave, workflow-name)`. The enclave name maps directly to the Kubernetes namespace name.

| Service | Identity | Format |
|---------|----------|--------|
| SPIFFE | URI | `spiffe://trust-domain/ns/<enclave>/wf/<name>` |
| Postgres | Role + Schema | `tent_<enclave>_<name>` |
| NATS | User + Subject prefix | `<enclave>.<name>.*` |
| RustFS | IAM User + S3 prefix | `<enclave>/<name>/` |

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
  user: tent_my-enclave_myworkflow
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
