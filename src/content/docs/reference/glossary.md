---
title: Glossary
description: Definitions of Tentacular-specific terms across the platform
---

Unified glossary of terms used across Tentacular, the MCP server, and the Agent Skill.

| Term | Definition |
|------|-----------|
| **Auth provider** | The authentication backend used at deploy time (e.g., `keycloak`, `bearer-token`). Recorded in the `tentacular.io/auth-provider` annotation on Deployments. Determines how deployer identity was resolved. |
| **Cleanup** | Destructive removal of exoskeleton backing-service data (Postgres schema CASCADE, RustFS object deletion, NATS authz entry removal). Off by default. Requires explicit confirmation via `--force`. |
| **ClusterSPIFFEID** | A Kubernetes CRD that tells the SPIRE controller which pods should receive SVIDs. The SPIRE registrar creates one per tentacle. |
| **Contract** | The `contract:` section of workflow.yaml declaring external dependencies and network requirements. Drives NetworkPolicy generation, Deno permission flags, and exoskeleton provisioning. |
| **Contract enrichment** | The MCP server filling in host/port/database/user fields on `tentacular-*` dependencies in the workflow.yaml ConfigMap at deploy time. |
| **Credential injection** | The MCP server building a K8s Secret with per-service credentials (flat `<dep>.<field>` keys) and appending it to the deployment manifests. |
| **Default mode** | The permission mode automatically assigned to newly deployed tentacles. Defaults to `group-read` (`rwxr-x---`): owner has full access, group members can read and execute. A namespace can override this via the `tentacular.io/default-mode` annotation. |
| **Dependency** | A service declared in `contract.dependencies`. Manual deps require all fields; `tentacular-*` deps are auto-provisioned by the exoskeleton. |
| **Deploy gate** | Pre-deployment validation that checks contract drift, secret availability, and namespace readiness. |
| **Deployer provenance** | Kubernetes annotations (`tentacular.io/deployed-by`, `deployed-at`, `deployed-via`) on Deployment resources recording who deployed a tentacle. Requires SSO authentication. |
| **Device Authorization Grant** | The OAuth 2.0 flow used by `tntc login`. The CLI displays a code, the user authenticates in a browser, the CLI polls until complete. Works for headless/agent scenarios. |
| **Dual auth** | The MCP server's authentication model: OIDC tokens (from Keycloak/Google SSO) are tried first, bearer tokens are the fallback. Both always work. |
| **Edge** | A directed connection between two nodes defining execution order and data flow. |
| **Environment** | A named configuration context (e.g., `eastus-dev`, `prod`) with MCP endpoint, namespace, and optional OIDC settings. |
| **Exoskeleton** | Optional, feature-flagged extension that provisions per-tentacle workspaces. Manages registration lifecycle for Postgres, NATS, RustFS, and SPIRE. |
| **Group** | A named collection of users for authorization purposes. Each tentacle belongs to one group. Group members receive the group-level permissions defined by the tentacle's mode. Set at deploy time via `--group` or defaulted by the MCP server. |
| **Identity** | The deterministic set of identifiers derived from `(namespace, workflow)`. Includes SPIFFE URI, Postgres role/schema, NATS user/prefix, S3 user/prefix. Computed by the identity compiler. |
| **MCP tool** | A tool exposed by the MCP server via the Model Context Protocol. Agents call these to manage clusters and tentacles. |
| **Mode** | A 9-character permission string (e.g., `rwxr-x---`) controlling access to a namespace or tentacle, following POSIX conventions. Three groups of three characters represent owner, group, and others permissions. Each position is either the permission letter (r, w, x) or a dash (-) for denied. |
| **Namespace** | A Kubernetes namespace managed by Tentacular. In the authorization model, namespaces act as directories: they have their own owner, group, and mode. Namespace Read is required to list tentacles; namespace Write is required to create new tentacles. Namespaces can set `default-mode` and `default-group` annotations that new tentacles inherit. |
| **Node** | A single TypeScript function within a tentacle. Nodes are connected by edges to form a DAG. |
| **Owner** | The OIDC-authenticated user who deployed a tentacle. Recorded as three annotations: `tentacular.io/owner-sub` (subject ID), `tentacular.io/owner-email`, and `tentacular.io/owner-name`. The owner has full control over the tentacle's permissions. |
| **Permission bits** | The individual read (r), write (w), and execute (x) flags within a mode. In Tentacular, read = list/status/describe, write = deploy/update/remove, execute = run/restart. |
| **Presets** | Named permission configurations for common access patterns: `private` (rwx------), `group-read` (rwxr-x---), `group-run` (rwx--x---), `group-edit` (rwxrwx---), `public-read` (rwxr--r--). |
| **Profile** | Cluster-specific configuration resolved at deploy time (registry, runtime class, namespace). |
| **Registrar** | A component that provisions scoped access for a tentacle in a specific backing service. Four registrars exist: Postgres (role+schema), NATS (authorization entry), RustFS (IAM user+policy), SPIRE (ClusterSPIFFEID). |
| **Skill** | The instruction set that teaches AI agents how to use `tntc` and MCP tools to build, test, and deploy tentacles. |
| **SVID** | SPIFFE Verifiable Identity Document. An X.509 certificate issued by SPIRE that proves a workload's identity. Contains the SPIFFE URI in the Subject Alternative Name (SAN). |
| **Tentacle** | A deployed workflow managed by Tentacular. The unit of work — a DAG of nodes with a contract, triggers, and configuration. Identified by `(namespace, workflow name)`. |
| **Trigger** | What initiates a tentacle run: `manual`, `cron`, `webhook`, or `queue`. |
| **Trust bundle** | The set of CA certificates needed to verify SVIDs. Published by SPIRE in the `spire-bundle` ConfigMap. |
| **wf_apply** | The MCP tool that applies workflow manifests to the cluster. The exoskeleton controller intercepts this to run registrars, enrich contracts, and inject credentials. |
| **wf_remove** | The MCP tool that removes a tentacle's K8s resources. When cleanup is enabled, also runs unregistrars to destroy backing-service data. |
| **Workspace** | The exoskeleton-provisioned bundle of scoped resources for a tentacle (Postgres schema, NATS subjects, S3 prefix, SPIFFE identity). Deterministically derived from the tentacle's identity. |
