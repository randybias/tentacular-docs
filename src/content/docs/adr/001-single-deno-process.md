---
title: "ADR-001: Single Deno Process"
description: All nodes in a tentacle execute within a single Deno process
---

## Status

Accepted

## Context

Tentacular needs to execute multiple TypeScript nodes within a DAG. Two approaches were considered:

1. **Single process** — all nodes share the same Deno runtime and memory space
2. **Multi-process** — each node runs in its own Deno process with IPC for data passing

## Decision

All nodes in a tentacle execute within a **single Deno process**. Parallelism is achieved via async/await and `Promise.all()`, not separate processes.

## Rationale

- **Simplicity:** Direct TypeScript execution with full Deno ecosystem access. No serialization overhead between nodes.
- **Performance:** Lower overhead than inter-process communication. Data passes between nodes as in-memory JavaScript objects.
- **Debugging:** Simplified debugging and development workflow — single process, single log stream.
- **Security model alignment:** Pod-level isolation via gVisor is the security boundary, not per-node isolation. One compromised node means the entire workflow process is accessible, but the gVisor sandbox prevents host escape.

## Consequences

- One compromised node = entire workflow process accessible. This is acceptable because:
  - Workflow code is authored by trusted agents following the contract model
  - Security boundaries exist at the pod level (gVisor, SecurityContext, NetworkPolicy)
  - The Deno permission model restricts what the entire process can access
- For multi-tenant scenarios where untrusted code must execute, additional isolation layers (separate pods, namespaces, or clusters) should be added at the orchestration level
- Memory usage is shared across all nodes — a memory leak in one node affects the entire workflow

## Related

- [Architecture — Execution Isolation Model](/tentacular-docs/concepts/architecture/)
- [Security — Defense-in-Depth](/tentacular-docs/concepts/security/)
