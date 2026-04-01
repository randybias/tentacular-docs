# Design: Sidecar Support — tentacular-docs/

## Overview

Add sidecar documentation to the docs site: three architecture diagrams, a new guide, a reference page, and an update to the security concepts page.

---

## 1. Architecture Diagrams

### Diagram 1: Pod Architecture

**Location:** Embedded in the guide and reference pages (Mermaid or SVG).

**Shows:**
- A Kubernetes Pod boundary containing:
  - **Engine container** (Deno) with mounts: `/app/workflow` (ConfigMap), `/app/secrets` (Secret), `/tmp` (emptyDir), `/shared` (emptyDir)
  - **Sidecar container(s)** with mounts: `/tmp` (per-sidecar emptyDir), `/shared` (emptyDir — same volume as engine)
- `localhost:8080` arrow from outside to engine (health/trigger)
- `localhost:PORT` arrows from engine to each sidecar
- gVisor sandbox boundary drawn around the entire pod
- Pod-level SecurityContext annotation: `runAsNonRoot, runAsUser: 65534, seccomp: RuntimeDefault`
- Per-container SecurityContext annotation: `readOnlyRootFilesystem, no escalation, drop ALL`

### Diagram 2: Security Boundary (Defense-in-Depth)

**Location:** Update to `src/content/docs/concepts/security.md`.

**Shows layered security model with sidecars integrated:**

| Layer | Scope | Mechanism | Sidecar Impact |
|-------|-------|-----------|----------------|
| 0 | Cluster | RBAC / AuthZ (MCP server) | No change |
| 1 | Pod | NetworkPolicy | Covers all containers in pod |
| 2 | Pod | gVisor sandbox (`runtimeClassName`) | Covers all containers in pod |
| 3 | Engine only | Deno permission flags (`--allow-net`, etc.) | Engine-specific — sidecar runs its own runtime |
| 4 | Per-container | SecurityContext | Identical restrictions on engine + every sidecar |
| 5 | Per-container | Base image | Distroless (engine) / hardened (sidecar — user responsibility) |

Diagram is a nested box/onion diagram showing each layer. The key insight is that layers 0-2 are pod-scoped (sidecars inherit them for free) while layers 3-5 are per-container.

### Diagram 3: Data Flow

**Location:** Embedded in the guide.

**Shows the sidecar communication sequence:**

```
1. Workflow trigger (manual/cron/webhook)
        |
2. Engine container starts
        |
3. Sidecar container(s) start (parallel)
        |
4. Readiness probes pass (sidecar ready)
        |
5. Engine writes input to /shared/input/
        |
6. Engine POST to localhost:PORT/endpoint
        |
7. Sidecar processes request
   - Reads from /shared/input/ (if file-based)
   - Writes output to /shared/output/ (if file-based)
   - Returns JSON response
        |
8. Engine reads results (/shared/output/ or response body)
        |
9. Engine continues DAG execution
```

**Alternative flow** (no shared volume): Steps 5 and 8 are skipped — engine sends data in HTTP request body and receives results in response body. Suitable for small payloads.

---

## 2. Guide: "Adding Native Tools with Sidecars"

**Path:** `src/content/docs/guides/sidecars.md`

**Frontmatter:**
```yaml
---
title: Adding Native Tools with Sidecars
description: Run native binaries (ffmpeg, Chromium, ML models) alongside your Deno workflow engine
---
```

**Outline:**

### Introduction
- What sidecars solve: native binary execution without modifying the engine sandbox
- When to use: media processing, rendering, ML inference, any Docker image
- How it works: multi-container pod, localhost HTTP, shared volumes

### Prerequisites
- Tentacular v0.7.0+ (version TBD — whatever release includes this feature)
- A sidecar container image with an HTTP API and health endpoint

### Step-by-Step: Adding an ffmpeg Sidecar
1. Declare the sidecar in `workflow.yaml`
2. Write a node that calls the sidecar
3. Test locally with `tntc dev` (note: sidecar won't run locally — mock or skip)
4. Deploy and verify with `tntc deploy`

### Sidecar YAML Reference (brief)
- Link to the full reference page
- Show the minimal required fields: `name`, `image`, `port`

### Communication Patterns
- **Pattern A: Shared volume file handoff** — for large data (video, images, documents)
- **Pattern B: HTTP request/response** — for small payloads (text, JSON, URLs)
- When to use which: threshold is ~1MB (larger = shared volume)

### Security Considerations
- All sidecars inherit pod-level gVisor + PSA restrictions
- `readOnlyRootFilesystem` requires `/tmp` emptyDir (automatic)
- Sidecar external network access requires a contract dependency
- Image trust is the user's responsibility

### Troubleshooting
- Sidecar not becoming ready
- Connection refused from engine to sidecar
- Permission errors on shared volume
- Memory/CPU resource tuning

### Pod Architecture Diagram (Diagram 1)
### Data Flow Diagram (Diagram 3)

---

## 3. Reference: Sidecar YAML Specification

**Path:** `src/content/docs/reference/sidecar-spec.md`

**Frontmatter:**
```yaml
---
title: Sidecar Specification
description: YAML schema reference for workflow sidecar containers
---
```

**Outline:**

### Overview
- Where `sidecars:` goes in workflow.yaml (top-level, alongside `contract:`, `nodes:`, etc.)
- Backwards compatible — omitting `sidecars:` preserves existing behavior

### Field Reference

Table format:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | — | Sidecar identifier, must match `[a-z][a-z0-9_-]*`, unique per workflow |
| `image` | string | Yes | — | Container image reference |
| `command` | string[] | No | Image ENTRYPOINT | Override container entrypoint |
| `args` | string[] | No | Image CMD | Override container arguments |
| `env` | map[string]string | No | — | Environment variables |
| `port` | int | Yes | — | Service port (1024-65535, not 8080) |
| `protocol` | string | No | `"http"` | `"http"` or `"grpc"` |
| `healthPath` | string | No | `"/health"` | Readiness probe HTTP path |
| `resources.requests.cpu` | string | No | — | CPU request (e.g., `"500m"`) |
| `resources.requests.memory` | string | No | — | Memory request (e.g., `"256Mi"`) |
| `resources.limits.cpu` | string | No | — | CPU limit (e.g., `"1000m"`) |
| `resources.limits.memory` | string | No | — | Memory limit (e.g., `"512Mi"`) |

### Validation Rules
- List all validation rules with exact error messages (from parse.go)

### Complete Example
- Full workflow.yaml with sidecar, contract, nodes, edges, triggers

### Generated Kubernetes Resources
- What the builder produces: multi-container Deployment with shared volumes
- Show the generated pod spec (abbreviated) so users understand what they're deploying

### Pod Architecture Diagram (Diagram 1)

---

## 4. Security Page Update

**Path:** `src/content/docs/concepts/security.md` (existing file)

**Change:** Update the defense-in-depth section to include sidecar coverage at each layer. Add Security Boundary Diagram (Diagram 2). Key additions:

- Layer 1 (NetworkPolicy): "Covers all containers in the pod — sidecar external access requires a contract dependency"
- Layer 2 (gVisor): "Pod-level runtimeClassName applies to all containers including sidecars"
- Layer 3 (Deno permissions): "Engine-specific — sidecars run their own runtime but are constrained by layers 1, 2, and 4"
- Layer 4 (SecurityContext): "Identical restrictions applied to every container: readOnlyRootFilesystem, no privilege escalation, drop ALL capabilities"
- New subsection: "Sidecar Image Trust" — images are user-specified, not curated. Users should pin digests, scan images, use minimal base images.

---

## 5. File Changes Summary

| File | Action |
|------|--------|
| `src/content/docs/guides/sidecars.md` | Create — ~200 lines, step-by-step guide |
| `src/content/docs/reference/sidecar-spec.md` | Create — ~150 lines, YAML schema reference |
| `src/content/docs/concepts/security.md` | Edit — add sidecar layer descriptions + diagram |
