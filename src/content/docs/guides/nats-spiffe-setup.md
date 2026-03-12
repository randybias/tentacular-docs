---
title: NATS + SPIFFE Setup
description: Setting up NATS messaging with SPIFFE-based workload identity
---

NATS provides event-driven messaging between tentacles. Combined with SPIFFE/SPIRE, it enables mTLS-authenticated communication with per-tentacle identity.

## Prerequisites

- Kubernetes cluster with the MCP server installed
- Helm 3+
- The exoskeleton Postgres registrar (for NATS authorization storage)
- SPIRE server and agent deployed (for workload identity)

## Steps

### 1. Install SPIRE

Deploy the SPIRE server and agent:

```bash
# Install SPIRE CRDs
kubectl apply -f https://github.com/spiffe/spire/releases/latest/download/spire-crds.yaml

# Install SPIRE via Helm
helm install spire spire/spire \
  --namespace spire-system \
  --create-namespace \
  --set global.spire.trustDomain=tentacular.local
```

### 2. Install NATS with Auth

Deploy NATS with resolver-based authorization:

```bash
helm install tentacular-nats nats/nats \
  --namespace tentacular-system \
  --set auth.enabled=true \
  --set auth.resolver.type=full \
  --set config.jetstream.enabled=true
```

### 3. Configure the MCP Server

Enable NATS and SPIRE registrars:

```bash
helm upgrade tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --set exoskeleton.nats.enabled=true \
  --set exoskeleton.nats.url=nats://tentacular-nats.tentacular-system.svc:4222 \
  --set exoskeleton.spire.enabled=true \
  --set exoskeleton.spire.trustDomain=tentacular.local
```

### 4. Verify SPIRE

```bash
# Check SPIRE agent health
kubectl -n spire-system exec -it spire-agent-0 -- \
  /opt/spire/bin/spire-agent healthcheck

# List registered entries
kubectl -n spire-system exec -it spire-server-0 -- \
  /opt/spire/bin/spire-server entry show
```

### 5. Deploy a Tentacle with NATS

```yaml
# workflow.yaml
triggers:
  - type: queue
    subject: events.incoming

contract:
  version: "1"
  dependencies:
    tentacular-nats:
```

```bash
tntc deploy
```

The exoskeleton:
1. Creates a SPIRE registration (ClusterSPIFFEID) for the tentacle pod
2. Provisions NATS authorization with scoped subject permissions
3. Injects NATS credentials and trust bundle into the deployment

## How SPIFFE Identity Works

Each tentacle gets a SPIFFE identity:
```
spiffe://tentacular.local/ns/<namespace>/wf/<workflow-name>
```

This identity is:
- Encoded in an X.509 SVID (SPIFFE Verifiable Identity Document)
- Automatically rotated by the SPIRE agent
- Used for mTLS between the tentacle and NATS server
- Used for authorization decisions (subject access control)

## NATS Subject Scoping

NATS subjects are **scoped per-tentacle** by the exoskeleton using a deterministic naming convention. You cannot pick arbitrary subject names — they are derived from the tentacle's identity.

### Subject Naming Convention

Each tentacle receives a subject prefix based on its `(namespace, workflow-name)`:

```
tentacular.<namespace>.<workflow-name>.>
```

For example, a tentacle named `hn-digest` in namespace `tent-dev` gets:
- **Subject prefix:** `tentacular.tent-dev.hn-digest.>`
- **NATS user:** `tentacle.tent-dev.hn-digest`

The `>` suffix is a NATS wildcard — the tentacle can publish and subscribe to any subject under its prefix (e.g., `tentacular.tent-dev.hn-digest.events`, `tentacular.tent-dev.hn-digest.results`).

### Authorization Modes

| Mode | Isolation | How It Works |
|------|-----------|-------------|
| **SPIFFE (recommended)** | Cryptographically enforced | Per-workflow mTLS certificates via SPIRE SVIDs. Authorization ConfigMap contains explicit allow lists per SPIFFE principal. |
| **Token (fallback)** | Convention-only | Shared token for all workflows. Subject isolation is by naming convention, not enforced. |

In SPIFFE mode, each tentacle's authorization entry looks like:

```
User: spiffe://tentacular/ns/tent-dev/tentacles/hn-digest
PublishAllow: [tentacular.tent-dev.hn-digest.>]
SubscribeAllow: [tentacular.tent-dev.hn-digest.>]
```

### Queue Triggers

Tentacles with queue triggers subscribe to NATS subjects matching their scoped prefix:

```yaml
triggers:
  - type: queue
    subject: tentacular.tent-dev.hn-digest.events
```

- **Connection:** TLS + token auth via `config.nats_url` and `secrets.nats.token`
- **Request-reply:** If a message has a reply subject, the execution result is sent back
- **Graceful shutdown:** SIGTERM/SIGINT drain subscriptions before exit

### Cross-Tentacle Communication

Tentacles can communicate through NATS by publishing to another tentacle's subject prefix. In SPIFFE mode, explicit authorization entries must be added to allow cross-tentacle publish/subscribe.

## Verification

- SPIRE agents are healthy on all nodes
- Tentacles receive SVIDs (check pod logs for SPIFFE handshake)
- NATS queue triggers receive and process messages
- `tntc logs my-tentacle` shows successful NATS connection

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `NATS connection refused` | NATS not running or wrong URL | Check NATS pod status and service endpoint |
| `TLS handshake failed` | SVID not issued | Check SPIRE agent logs, verify ClusterSPIFFEID exists |
| `authorization violation` | Wrong subject permissions | Check NATS auth config, re-register via MCP |
| Queue trigger not firing | Subject mismatch | Verify `subject` in trigger matches publisher |
| `nats_url missing` | Config not set | Add `nats_url` to workflow config |

## Related

- [Exoskeleton Concepts](/tentacular-docs/concepts/exoskeleton/)
- [Exoskeleton Setup](/tentacular-docs/guides/exoskeleton-setup/)
- [Architecture — Queue Triggers](/tentacular-docs/concepts/architecture/)
