---
title: Deploy a Tentacle
description: Step-by-step guide for deploying a tentacle to Kubernetes
---

## Goal

Deploy a tentacle from local development to a running Kubernetes cluster.

## Prerequisites

- `tntc` CLI installed and configured with an MCP endpoint
- A tentacle project that passes `tntc validate`
- Docker installed (for image builds)
- Secrets configured (`.secrets.yaml` or `.secrets/`)

## Steps

### 1. Validate the Tentacle

```bash
tntc validate
tntc test
tntc secrets check
```

Ensure no validation errors, all tests pass, and all secrets are provisioned.

### 2. Check Cluster Readiness

```bash
tntc cluster check
```

This validates:
- MCP server is reachable
- Namespace can be created
- gVisor RuntimeClass exists (warning if missing)
- NetworkPolicy support is available

### 3. Build the Image

**Option A: Full build + push**
```bash
tntc build --push
```

Creates a workflow-specific image with the Deno engine embedded and pushes to your configured registry.

**Option B: Reuse existing image**
```bash
tntc deploy --image ghcr.io/yourorg/tentacular-engine:latest
```

Skips the build step — only updates the ConfigMap with code changes. ~5-10 second deployment.

### 4. Deploy

```bash
tntc deploy
```

This:
1. Parses and validates `workflow.yaml`
2. Resolves the base image
3. Generates ConfigMap with `workflow.yaml` + `nodes/*.ts`
4. Generates K8s manifests (Deployment, Service, NetworkPolicy)
5. Provisions secrets to K8s
6. Ensures namespace exists (via MCP `ns_create`)
7. Applies all manifests (via MCP `wf_apply`)

### 5. Verify Deployment

```bash
# Check deployment status
tntc status my-tentacle --detail

# View logs
tntc logs my-tentacle --tail 20

# Trigger a manual run
tntc run my-tentacle

# Security audit
tntc audit my-tentacle
```

## Verification

- `tntc status` shows healthy deployment with ready replicas
- `tntc logs` shows clean startup with no errors
- `tntc run` returns expected output
- `tntc audit` shows clean RBAC, NetworkPolicy, and PSA

## Failure Modes

| Failure | Cause | Resolution |
|---------|-------|------------|
| `MCP not configured` | Missing endpoint in config | Run `tntc configure` with `--env` |
| `image pull error` | Wrong registry or tag | Check `--image` flag or `.tentacular/base-image.txt` |
| `secret not found` | Secrets not provisioned | Run `tntc secrets check` and fix |
| `NetworkPolicy deny` | Contract missing dependency | Add dependency to `contract.dependencies` |
| `RuntimeClass not found` | gVisor not installed | Deploy with `--runtime-class ""` or install gVisor |
| `namespace not ready` | MCP server permissions | Check MCP server RBAC |

## Related

- [Quickstart](/tentacular-docs/guides/quickstart/)
- [Update a Tentacle](/tentacular-docs/cookbook/update-tentacle/)
- [Debug a Tentacle](/tentacular-docs/cookbook/debug-workflow/)
- [CLI Reference — Deploy](/tentacular-docs/reference/cli/)
