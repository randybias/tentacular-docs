---
title: "ADR-003: Exoskeleton Optional"
description: Backing services (Postgres, NATS, RustFS) are optional and feature-flagged
---

## Status

Accepted

## Context

Many tentacles need backing services — databases for state, messaging for events, object storage for artifacts. Two approaches were considered:

1. **Required infrastructure** — all clusters must have Postgres, NATS, and object storage installed
2. **Optional, feature-flagged** — backing services are available when installed but not required

## Decision

The exoskeleton is **optional and feature-flagged**. Tentacles that don't need backing services work without them. Tentacles that need them declare `tentacular-*` dependencies in their contract, and the exoskeleton provisions scoped resources automatically.

## Rationale

- **Low barrier to entry:** Simple tentacles (news digests, health checks) need zero infrastructure beyond a K8s cluster and the MCP server.
- **Progressive complexity:** Teams add backing services as they need them, not upfront.
- **Agent awareness:** Agents check `exo_status` to discover what's available on the target cluster, then design tentacles accordingly. No capability = no dependency.
- **Clean separation:** The exoskeleton is a set of registrars that hook into the deploy pipeline. Without the exoskeleton, the deploy pipeline works identically — it just skips the registration step.

## Consequences

- Each backing service has independent feature flags. A cluster can have Postgres but not NATS, or NATS but not RustFS.
- Agents must check `exo_status` before declaring `tentacular-*` dependencies. Deploying a tentacle with an exoskeleton dependency on a cluster without that service will fail at deploy time.
- The `tentacular-*` prefix convention cleanly separates exoskeleton-managed dependencies from manual ones. No ambiguity about what the platform provisions vs. what the user must configure.
- Cleanup of exoskeleton resources is off by default and requires explicit `--force` confirmation to prevent accidental data loss.

## Related

- [Exoskeleton Concepts](/tentacular-docs/concepts/exoskeleton/)
- [Exoskeleton Setup Guide](/tentacular-docs/guides/exoskeleton-setup/)
- [Exoskeleton Provisioning Cookbook](/tentacular-docs/cookbook/exoskeleton-provisioning/)
