---
title: MCP Server Setup
description: Installing and configuring the in-cluster MCP server
---

The MCP (Model Context Protocol) server is the control plane for Tentacular. It runs inside your Kubernetes cluster and provides a secure API that the `tntc` CLI and AI agents use to manage tentacles. The CLI has no direct Kubernetes API access — all cluster operations route through this server.

## What the MCP Server Does

- **Deploys tentacles** — applies workflow manifests (Deployment, Service, ConfigMap, NetworkPolicy, Secret)
- **Manages namespaces** — creates namespaces with Pod Security Admission labels and default-deny NetworkPolicy
- **Runs tentacles** — triggers execution via HTTP POST to workflow `/run` endpoints
- **Schedules cron** — internal cron scheduler reads deployment annotations and fires triggers
- **Health monitoring** — queries workflow health endpoints, classifies as Green/Amber/Red
- **Security audit** — validates RBAC, NetworkPolicy, and PSA for deployed tentacles
- **Exoskeleton provisioning** — runs registrars for Postgres, NATS, RustFS when enabled
- **Cluster profiling** — generates capability snapshots for agent-informed design

## Prerequisites

- Kubernetes cluster (any distribution: EKS, GKE, AKS, k0s, k3s, kind)
- `kubectl` configured with cluster access
- Helm 3+

## Steps

### 1. Install via Helm

```bash
# Clone the MCP server repo
git clone git@github.com:randybias/tentacular-mcp.git

# Generate a bearer token for CLI authentication
MCP_TOKEN=$(openssl rand -hex 32)
mkdir -p ~/.tentacular
echo "$MCP_TOKEN" > ~/.tentacular/mcp-token
chmod 600 ~/.tentacular/mcp-token

# Install the MCP server
kubectl create namespace tentacular-support
helm install tentacular-mcp ./tentacular-mcp/charts/tentacular-mcp \
  --namespace tentacular-system --create-namespace \
  --set auth.token="$MCP_TOKEN"
```

### 2. Verify Installation

```bash
# Check the pod is running
kubectl get pods -n tentacular-system

# Check the service
kubectl get svc -n tentacular-system
```

The MCP server exposes its API on port 8080. Access depends on your cluster setup:
- **NodePort**: `http://<node-ip>:30080/mcp` (default)
- **LoadBalancer**: `http://<lb-ip>:8080/mcp`
- **Port-forward**: `kubectl port-forward -n tentacular-system svc/tentacular-mcp 8080:8080`

### 3. Configure the CLI

Add the MCP endpoint to your CLI configuration:

```yaml
# ~/.tentacular/config.yaml
environments:
  dev:
    mcp_endpoint: http://<node-ip>:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token
```

### 4. Test Connectivity

```bash
tntc cluster check --env dev
```

## Authentication

The MCP server supports **dual authentication**:

| Method | When Used | Deployer Provenance |
|--------|-----------|-------------------|
| **OIDC tokens** | Tried first when configured | Yes — records who deployed |
| **Bearer tokens** | Always available as fallback | No — anonymous deploys |

### Setting Up OIDC (Optional)

For deployer provenance and SSO, configure OIDC via the Helm chart:

```bash
helm upgrade tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --set auth.bearerToken="$MCP_TOKEN" \
  --set auth.oidc.issuer=https://keycloak.example.com/realms/tentacular \
  --set auth.oidc.clientId=tentacular-mcp \
  --set auth.oidc.audience=tentacular
```

Then configure the CLI environment:

```yaml
environments:
  prod:
    mcp_endpoint: http://prod-mcp:30080/mcp
    oidc_issuer: https://keycloak.example.com/realms/tentacular
    oidc_client_id: tentacular-cli
    oidc_client_secret: your-secret
```

```bash
tntc login --env prod
tntc whoami --env prod
```

## How It Works

The MCP server exposes 26+ tools via the Model Context Protocol (JSON-RPC 2.0 over Streamable HTTP). These tools are organized into functional groups:

| Group | Tools | Purpose |
|-------|-------|---------|
| Namespace | `ns_create`, `ns_get`, `ns_list`, `ns_update`, `ns_delete` | Namespace lifecycle |
| Workflow | `wf_apply`, `wf_remove`, `wf_list`, `wf_status`, `wf_run`, etc. | Tentacle lifecycle |
| Health | `wf_health`, `wf_health_ns`, `health_cluster_summary` | Monitoring |
| Audit | `audit_rbac`, `audit_netpol`, `audit_psa` | Security validation |
| Cluster | `cluster_preflight`, `cluster_profile` | Cluster capabilities |
| Exoskeleton | `exo_status`, `exo_registration` | Backing services |

See [MCP Tools Reference](/tentacular-docs/reference/mcp-tools/) for the complete list.

### Cron Scheduling

The MCP server includes an internal cron scheduler (`robfig/cron/v3`). When a tentacle is deployed with cron triggers, the schedule is stored as a `tentacular.io/cron-schedule` annotation on the Deployment. The scheduler reads these annotations and fires HTTP POST to the tentacle's `/run` endpoint on schedule. No CronJob resources are created.

### RBAC

The MCP server operates with scoped RBAC — it can only manage tentacular-related resources (Deployments, Services, ConfigMaps, Secrets, NetworkPolicies, Namespaces with specific labels). It cannot access resources outside its scope.

### Authorization

When OIDC authentication is configured, the MCP server enforces POSIX-like permissions on workflow operations. Authorization is enabled by default. The default mode for new deployments is `group-read` (`rwxr-x---`): owner has full access, group members can read and execute.

To disable authorization entirely (kill switch), set the environment variable on the MCP server:

```bash
TENTACULAR_AUTHZ_ENABLED=false
```

Bearer-token requests always bypass authorization regardless of this setting -- permissions are only evaluated for OIDC-authenticated requests.

> **Note:** The `tentacular.dev/*` annotation namespace has been replaced by `tentacular.io/*`. Existing deployments using old annotations will not have authorization enforced until redeployed.

See the [Authorization guide](/tentacular-docs/guides/authorization/) for the full permission model documentation.

## Verification

- `kubectl get pods -n tentacular-system` shows the MCP pod running
- `tntc cluster check` passes all checks
- `tntc list` returns successfully (may show empty list)
- `tntc cluster profile --save` generates a cluster profile

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Pod not starting | Missing RBAC or configuration | Check `kubectl logs -n tentacular-system` |
| `connection refused` | Wrong endpoint URL or pod not ready | Verify service and endpoint URL |
| `401 Unauthorized` | Token mismatch | Ensure CLI token matches Helm `auth.bearerToken` |
| Cron triggers not firing | Annotation missing | Check `tentacular.io/cron-schedule` annotation on Deployment |
| OIDC errors | Wrong issuer or client config | Verify OIDC settings match your identity provider |
| `permission denied` on workflow operations | Authz mode too restrictive | Check `permissions_get`, adjust with `permissions_set`. Or set `TENTACULAR_AUTHZ_ENABLED=false` to disable |
