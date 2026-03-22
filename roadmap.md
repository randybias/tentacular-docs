# Tentacular Roadmap

Last updated: 2026-03-22

This is the consolidated roadmap for the tentacular system, spanning all repos
(tentacular, tentacular-mcp, tentacular-skill, tentacular-scaffolds, tentacular-docs).

Horizon key: **NOW** = active/near-term, **NEXT** = committed but not started,
**LATER** = future intent, revisit when real-world usage demands it.

## Multi-User Identity & Delegated Trust

The foundational theme for enabling a hardened Slack bot (The Kraken) to manage
tentacles on behalf of multiple end users in a team. Each user's operations must
use their own credentials with no cross-contamination.

| Item | Horizon | Status | Description |
|------|---------|--------|-------------|
| Slack user → Keycloak identity resolution | NOW | Needs Design | Map Slack user ID to Keycloak identity via shared email/SSO. One-time user authentication flow via bot. |
| Per-user token storage & lifecycle | NOW | Needs Design | Durable, encrypted token store keyed by Slack user ID. Auto-refresh, graceful re-auth on expiry. |
| Architectural credential isolation | NOW | Needs Design | Framework-enforced credential resolution per request. Agent never selects credentials — they are injected by the bot framework. |
| RFC 8693 token exchange (On-Behalf-Of) | NEXT | Needs Design | Bot exchanges user token + service token for delegated token via Keycloak. Audit trail shows actor (bot) and subject (user). |
| Delegated secrets management | LATER | Needs Design | Transitive trust for secrets: user → bot → tentacle → secrets vault (OpenBao, not HashiCorp Vault due to license). Tentacles access secrets on behalf of the originating user. Downstream of identity work. |

## Security & Compliance

Tentacular's key value proposition. Defense-in-depth across all layers of the system.

| Item | Horizon | Status | Description |
|------|---------|--------|-------------|
| Cluster security posture validation | NOW | Needs Design | Continuous checker that validates all security controls: NetworkPolicies, RBAC scoping, PSA labels, SPIRE entries, TLS certs, SA token mounts. Approach TBD (built-in, OPA/Kyverno, or hybrid). |
| Security architecture document | NEXT | Not Started | Living cross-cutting doc: threat model, trust boundaries, identity chain, network segmentation, credential lifecycle, SPIFFE/SPIRE, defense-in-depth layering. Audience: security reviewers. Lives in tentacular-docs. |

## Platform Operations

Core operational reliability for the MCP server and exoskeleton services.

| Item | Horizon | Status | Description |
|------|---------|--------|-------------|
| Per-tentacle operation locking | NOW | Needs Design | Per-tentacle mutex keyed on `namespace/workflow` in the MCP server. Retry-on-conflict for shared-state K8s writes (NATS authz ConfigMap, Postgres roles, RustFS IAM). Prevents 409 races under concurrent deploys. |
| Tentacle versioning & rollback | NEXT | Needs Design | Immutable versioned ConfigMaps (`{name}-code-{version}`), rollback command, version history. Broader question: how do tentacles get versioned (code + config) with clean rollback for non-technical users? |
| NATS max_payload increase to 8MB | NEXT | Not Started | Increase from 1MB default to 8MB (NATS recommended max) in exoskeleton Helm chart for webhook payload support. |

## Service Tentacles

Optional shared services deployed as tentacles that other tentacles can depend on.
A new pattern that needs design — how are service tentacles declared, deployed,
discovered, and depended upon?

| Item | Horizon | Status | Description |
|------|---------|--------|-------------|
| Service tentacle pattern | NEXT | Needs Design | Define how service tentacles work: dependency declaration, lifecycle, discovery. The webhook gateway is the first instance. |
| Webhook gateway | NEXT | Needs Design | Centralized webhook ingress with per-registration UUID routing, HMAC validation, NATS publishing. First service tentacle. |

## Observability

System-wide instrumentation across all layers: engine, MCP server, exoskeleton.
Subsumes provenance persistence, audit logging, credential rotation tracking,
deployment diff tracking, and the audit query API.

| Item | Horizon | Status | Description |
|------|---------|--------|-------------|
| System-wide OpenTelemetry | LATER | Needs Design | Phased instrumentation: per-workflow traces, per-node spans, MCP server operations, exoskeleton service calls, deployer provenance events, credential lifecycle events. Replaces bespoke audit/provenance Postgres approach. |

## Reliability & Messaging

NATS infrastructure evolution. All items are low priority — revisit when
real-world usage creates demand.

| Item | Horizon | Status | Description |
|------|---------|--------|-------------|
| NATS JetStream durable subscriptions | LATER | Not Started | Upgrade from core NATS to JetStream for queue triggers: durable subs, ack with redelivery, replay. Adds statefulness and management complexity — only pursue when needed. |
| Rate limiting / concurrency control | LATER | Not Started | Max concurrent executions, token bucket rate limiting, backpressure. May also be needed at MCP server level for multi-user bot scenarios. Depends on JetStream for NATS-level controls. |
| Dead letter queue | LATER | Not Started | Failed NATS-triggered executions publish to DLQ for retry and forensics. Depends on JetStream. |
| Multi-workflow namespace coordination | LATER | Not Started | Coordinating related tentacles as a group. Needs real-world usage data before designing. |

## Infrastructure & Housekeeping

Long-term infrastructure items. Low priority, revisit during production hardening.

| Item | Horizon | Status | Description |
|------|---------|--------|-------------|
| SPIRE HA (multi-replica) | LATER | Needs Design | Scale SPIRE server for production HA. Datastore should be etcd/K8s-native, not exoskeleton Postgres — SPIRE is cluster infrastructure. |
| SPIRE trust bundle auto-sync | LATER | Not Started | Automate JWKS→PEM sync from SPIRE to NATS. 10-year CA TTL makes this non-urgent. |
| Keycloak namespace evaluation | LATER | Not Started | Re-evaluate whether Keycloak should move from `tentacular-exoskeleton` to `tentacular-system`. Not causing pain today. |
| Istio ambient mode compatibility | LATER | Not Started | SPIFFE IDs as service mesh identity layer. Cool but unclear practical implications. |
| Deprecated Kubeconfig/Context field cleanup | LATER | Needs Investigation | Dead code from pre-MCP-separation era. Includes orphaned kind_test.go. Likely safe to remove. |

## Archive

Completed items, most recent first.

### 2026-03-10 — Exoskeleton Phase 1

| Item | Completed | Notes |
|------|-----------|-------|
| Identity compiler | 2026-03-10 | `(namespace, workflow)` to deterministic identifiers |
| Postgres registrar | 2026-03-10 | Role, schema, grants, cleanup lifecycle |
| NATS registrar (dual-mode) | 2026-03-10 | SPIFFE mTLS + token auth, scoped subjects |
| RustFS registrar | 2026-03-10 | Native admin API, prefix-scoped IAM |
| SPIRE registrar | 2026-03-10 | ClusterSPIFFEID provisioning |
| Credential injector | 2026-03-10 | K8s Secret with per-service keys |
| Controller + wf_apply/wf_remove | 2026-03-10 | Full registration lifecycle |
| Contract enrichment + Deployment patching | 2026-03-10 | Server-side ConfigMap enrichment |
| OIDC/SSO authentication | 2026-03-10 | Keycloak + Google SSO, dual auth |
| Deployer provenance annotations | 2026-03-10 | `tentacular.io/deployed-by` etc. |
| exo_status/exo_registration MCP tools | 2026-03-10 | Exoskeleton state and registration details |
| Guard namespace protection | 2026-03-10 | Prevents ops on system namespaces |
| Helm chart exoskeleton config | 2026-03-10 | `exoskeleton` and `exoskeletonAuth` values |
| Exoskeleton documentation | 2026-03-10 | Architecture diagram, reference doc, deploy guide |
| tntc login/logout/whoami | 2026-03-10 | OAuth 2.0 Device Auth Grant |
| OIDC token management | 2026-03-10 | Device auth, auto-refresh, expiry detection |
| NATS server TLS (cert-manager) | 2026-03-10 | Internal CA, auto-renewal, combined trust bundle |
| SPIRE CA TTL tuning | 2026-03-10 | 10-year CA lifetime, short-lived SVIDs |

### 2026-03 — CLI/MCP Separation

| Item | Completed | Notes |
|------|-----------|-------|
| CLI/MCP separation | 2026-03 | All cluster ops via MCP server. Per-environment config. |

### 2026-02 — Scaffolds & Init

| Item | Completed | Notes |
|------|-----------|-------|
| tntc init + scaffold init | 2026-02 | Scaffold-based quickstart initialization |
| Scaffold commands | 2026-02 | `tntc scaffold list`, `tntc scaffold init` |
| Release pipeline | 2026-02 | GoReleaser, install.sh, stable.txt |

### 2026-02 — Core Fixes

| Item | Completed | Notes |
|------|-----------|-------|
| Nested secrets YAML | 2026-02 | JSON serialization for nested maps |
| ImagePullPolicy | 2026-02 | `Always` in all generated manifests |
| Dockerfile --no-lock | 2026-02 | Matches ENTRYPOINT, no lockfile issues |
| tntc configure | 2026-02 | Registry, namespace, runtime class defaults |
| Per-workflow namespace | 2026-02 | `deployment.namespace` with layered resolution |
| Version tracking | 2026-02 | `app.kubernetes.io/version` label |
| Secrets management (Phase A+B) | 2026-02 | check, init, shared pool, $shared references |
| Fixture config/secrets | 2026-02 | Test fixtures with config and secrets |
| Pre-built base image | 2026-02 | ConfigMap-mounted code, fast deploys |
| Various bug fixes | 2026-02 | Preflight ordering, symlink, lockfile, allow-read, etc. |
