---
title: "ADR-002: MCP-Only Cluster Access"
description: The CLI has no direct Kubernetes API access — all cluster operations route through the MCP server
---

## Status

Accepted

## Context

The `tntc` CLI needs to perform cluster operations: deploying tentacles, checking status, reading logs, running audits. Two approaches were considered:

1. **Direct access** — CLI uses a kubeconfig to talk directly to the K8s API
2. **MCP proxy** — CLI routes all cluster operations through an in-cluster MCP server

## Decision

The CLI has **no direct Kubernetes API access**. All cluster-facing commands route through the MCP server using JSON-RPC 2.0 over Streamable HTTP.

## Rationale

- **Security:** The MCP server has scoped RBAC — it can only manage tentacular-related resources. Users and agents never need cluster-admin or broad K8s credentials.
- **Authentication:** The MCP server supports dual auth (OIDC + bearer token), enabling SSO integration and deployer provenance tracking. Direct K8s access would require distributing kubeconfigs.
- **Abstraction:** The MCP server provides a domain-specific API (deploy tentacle, check health, run audit) rather than raw K8s operations. This is more efficient for agents — fewer tokens, less cognitive load.
- **Agent compatibility:** MCP (Model Context Protocol) is the standard for AI agent tool invocation. The same tools the CLI calls are directly callable by agents via MCP.

## Consequences

- A running MCP server is required for all cluster operations. If the MCP server is down, no deploys or status checks are possible.
- Local development (`tntc dev`, `tntc test`, `tntc build`) works without MCP — only cluster-facing commands need it.
- The CLI must be configured with an MCP endpoint per environment.
- Some operations have reduced fidelity through MCP (e.g., log streaming is not supported — only snapshots).

## Related

- [Architecture — CLI-to-MCP Architecture](/tentacular-docs/concepts/architecture/)
- [CLI Reference — MCP Resolution](/tentacular-docs/reference/cli/)
- [MCP Tools Reference](/tentacular-docs/reference/mcp-tools/)
