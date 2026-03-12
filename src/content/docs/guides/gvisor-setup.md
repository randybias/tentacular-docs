---
title: gVisor Setup
description: Installing and configuring gVisor kernel isolation for tentacles
---

gVisor provides kernel-level syscall interception for defense-in-depth container sandboxing. It is recommended but optional.

## Prerequisites

- Kubernetes cluster with node access (SSH or shell)
- `kubectl` configured to access the cluster
- Root access on cluster nodes for installation

## Steps

### 1. Install gVisor on Cluster Nodes

For clusters without gVisor (e.g., k0s):

```bash
# SSH to each node and run:
sudo bash deploy/gvisor/install.sh
```

This installs `runsc` (the gVisor binary) and `containerd-shim-runsc-v1`, then configures containerd to use gVisor as a runtime handler.

### 2. Apply the RuntimeClass

```bash
kubectl apply -f deploy/gvisor/runtimeclass.yaml
```

This creates a Kubernetes RuntimeClass named `gvisor` with handler `runsc`.

### 3. Verify Installation

```bash
kubectl apply -f deploy/gvisor/test-pod.yaml
kubectl logs gvisor-test
```

The test pod runs `dmesg` — if gVisor is active, you'll see gVisor kernel messages instead of the host kernel's.

### 4. Clean Up Test Pod

```bash
kubectl delete pod gvisor-test
```

## Usage

gVisor is enabled by default during deployment:

```bash
tntc deploy my-tentacle                     # uses gVisor by default
tntc deploy my-tentacle --runtime-class ""   # deploy without gVisor
```

## Verification

Run `tntc cluster check` to validate the gVisor RuntimeClass exists. Missing gVisor is a warning, not a hard failure — tentacles will still deploy but without kernel-level sandboxing.

```bash
tntc cluster check
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Pod stuck in `ContainerCreating` | gVisor not installed on node | Run `install.sh` on the node |
| `RuntimeClass "gvisor" not found` | RuntimeClass not applied | Run `kubectl apply -f deploy/gvisor/runtimeclass.yaml` |
| `cluster check` warns about gVisor | RuntimeClass missing | Apply the RuntimeClass or deploy with `--runtime-class ""` |
| Performance degradation | gVisor syscall overhead | Expected; gVisor adds ~5-15% overhead for security |

See [Security](/tentacular-docs/concepts/security/) for details on how gVisor fits into the five-layer defense-in-depth model.
