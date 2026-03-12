---
title: Cluster Setup
description: Setting up a Kubernetes cluster for Tentacular
---

## Goal

Prepare a Kubernetes cluster to run tentacles.

## Prerequisites

- A Kubernetes cluster (EKS, GKE, AKS, k0s, k3s, kind)
- `kubectl` configured with cluster access
- `helm` installed
- Container registry accessible from the cluster

## Steps

### 1. Install the MCP Server

```bash
helm install tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --create-namespace \
  --set auth.bearerToken=$(openssl rand -hex 32)
```

Save the bearer token for CLI configuration.

### 2. (Optional) Install gVisor

For kernel-level sandboxing:

```bash
# On each cluster node:
sudo bash deploy/gvisor/install.sh

# Apply RuntimeClass:
kubectl apply -f deploy/gvisor/runtimeclass.yaml

# Verify:
kubectl apply -f deploy/gvisor/test-pod.yaml
kubectl logs gvisor-test
kubectl delete pod gvisor-test
```

See [gVisor Setup](/tentacular-docs/guides/gvisor-setup/) for details.

### 3. Configure the CLI

```bash
tntc configure --project \
  --registry ghcr.io/yourorg \
  --namespace tentacular-dev
```

Then add MCP endpoint to `.tentacular/config.yaml`:

```yaml
environments:
  dev:
    mcp_endpoint: http://<node-ip>:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token
```

Save the bearer token:
```bash
echo "<your-token>" > ~/.tentacular/mcp-token
```

### 4. Validate Cluster Readiness

```bash
tntc cluster check
```

This validates:
- MCP server connectivity
- Namespace creation capability
- gVisor RuntimeClass (warning if missing)
- NetworkPolicy support (CNI dependent)

### 5. Generate Cluster Profile

```bash
tntc cluster profile --save
```

This creates a capability snapshot at `.tentacular/envprofiles/dev.md` that agents use to inform tentacle design decisions.

### 6. (Optional) Set Up Exoskeleton

For backing services (Postgres, NATS, RustFS), see [Exoskeleton Setup](/tentacular-docs/guides/exoskeleton-setup/).

## Verification

- `tntc cluster check` passes all checks
- `tntc cluster profile` shows expected capabilities
- `tntc deploy` succeeds for a simple tentacle (e.g., word-counter)
- `tntc audit <name>` shows clean security results

## Failure Modes

| Failure | Cause | Resolution |
|---------|-------|------------|
| `MCP server unreachable` | Wrong endpoint or server not running | Check Helm release: `helm status tentacular-mcp -n tentacular-system` |
| `NetworkPolicy not supported` | CNI doesn't support it | Use a CNI with NetworkPolicy support (Calico, Cilium, kube-router) |
| `gVisor RuntimeClass not found` | gVisor not installed | Install gVisor or deploy with `--runtime-class ""` |
| `image pull error` | Registry not accessible from cluster | Check registry credentials and network access |

## Related

- [Quickstart](/tentacular-docs/guides/quickstart/)
- [gVisor Setup](/tentacular-docs/guides/gvisor-setup/)
- [Exoskeleton Setup](/tentacular-docs/guides/exoskeleton-setup/)
- [Deploy a Tentacle](/tentacular-docs/cookbook/deploy-tentacle/)
