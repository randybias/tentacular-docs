---
title: "The Three Layers: How Tentacular Stores State"
description: Tentacular manages state across three synchronized layers — Git, Disk, and Kubernetes. Understanding this model is key to disaster recovery, agent continuity, and debugging.
---

Tentacular manages state across three synchronized layers. Understanding this model is key to disaster recovery, agent continuity, and debugging.

## The Three Layers

### 1. Git (System of Record)

An enterprise-owned monorepo holds the authoritative state for every tentacle: its source code, enclave metadata snapshots, design intent (`CONTEXT.md`), and optionally SOPS-encrypted secrets. Git provides durable, versioned history. If the cluster is lost, everything can be rebuilt from this repo.

```
enclaves/
  mktg-team/
    enclave.yaml               # enclave metadata snapshot
    price-monitor/
      workflow.yaml            # tentacle spec (source of record)
      nodes/                   # TypeScript node implementations
      CONTEXT.md               # design intent
      .secrets/*.enc.yaml      # SOPS-encrypted secrets (optional)
```

### 2. Disk (Working Copy)

The agent's local workspace at `~/tentacles/<enclave-name>/<tentacle-name>/` is where tentacles are built, modified, and tested before being committed to Git and deployed to the cluster. On The Kraken, this is a PVC mount that persists across pod restarts.

```
~/tentacles/
  mktg-team/
    price-monitor/
      workflow.yaml
      nodes/
      CONTEXT.md
      .secrets/
```

The disk copy is the agent's scratch space. Changes here are not live until committed to Git and deployed via `tntc deploy`.

### 3. Kubernetes (Deployed Runtime)

The live cluster state — namespaces (enclaves), Deployments (tentacles), ConfigMaps (workflow source), Secrets (credentials), and annotations (metadata) — is the runtime environment. Kubernetes is where tentacles execute, but it is **not** the source of truth for source code.

```
namespace: mktg-team
  deployment: price-monitor
    configmap: price-monitor-code      # deployed copy of workflow.yaml + nodes/
    configmap: price-monitor-import-map
    secret: price-monitor-secrets
    annotations:
      tentacular.io/owner: alice@company.com
      tentacular.io/scaffold: price-monitor-scaffold@1.0
```

## Layer Mapping

| Git path | Disk path | Kubernetes resource |
|----------|-----------|---------------------|
| `enclaves/mktg-team/` | `~/tentacles/mktg-team/` | namespace: `mktg-team` |
| `enclaves/mktg-team/price-monitor/` | `~/tentacles/mktg-team/price-monitor/` | deployment: `price-monitor` |
| `enclave.yaml` | (no disk equivalent) | namespace annotations |
| `workflow.yaml` | `workflow.yaml` | configmap: `price-monitor-code` |
| `tentacle.yaml` | (generated at deploy) | deployment annotations |
| `.secrets/*.enc.yaml` | (never on disk unencrypted) | secret: `price-monitor-secrets` |

## When Each Layer Is Authoritative

| Situation | Authoritative Layer |
|-----------|---------------------|
| Source code | Git — ConfigMaps in K8s are deployed copies |
| Runtime state (pod status, logs, events) | Kubernetes |
| Enclave/tentacle metadata | Kubernetes annotations (Git mirrors as backup) |
| Disaster recovery | Git — the entire system can be rebuilt from it |
| Secrets at rest | Git (SOPS-encrypted) or Kubernetes Secrets — never plain-text on disk |

## The Deploy Flow

Changes move from disk to Git to Kubernetes in a defined sequence:

```
Agent modifies source
  → tntc validate
  → write CONTEXT.md
  → git commit
  → tntc deploy
  → Kubernetes updated
```

The Git commit is the gate. `tntc deploy` reads the committed state and reconciles it with the cluster. Uncommitted changes are not deployed.

## Disaster Recovery

If the cluster is lost:

1. The Git repo is the sole source — all tentacle source, enclave layout, and metadata snapshots are there.
2. Provision a new cluster and install the MCP server.
3. Replay `tntc enclave provision` for each enclave, then `tntc deploy` for each tentacle.
4. Encrypted secrets are recovered via SOPS key recovery.

This is why maintaining the Git state repo is a prerequisite for production use. See the [Workspace Layout guide](/tentacular-docs/guides/workspace-layout/) and [Enclaves](/tentacular-docs/concepts/enclaves/) for setup details.
