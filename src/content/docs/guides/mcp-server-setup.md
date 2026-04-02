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

# Install the MCP server (token auto-generated if not provided)
kubectl create namespace tentacular-support
helm install tentacular-mcp ./tentacular-mcp/charts/tentacular-mcp \
  --namespace tentacular-system --create-namespace
```

> **Note:** If `auth.token` is not specified, the Helm chart auto-generates a secure 64-character token. The token is preserved across `helm upgrade`. To provide your own token, add `--set auth.token="$(openssl rand -hex 32)"`. To retrieve the auto-generated token:
> ```bash
> kubectl get secret -n tentacular-system tentacular-mcp-auth -o jsonpath='{.data.token}' | base64 -d
> ```

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

Add the MCP endpoint to your CLI configuration. If using OIDC, `mcp_token_path` is optional (used as admin fallback). If using bearer-token only, point it at a file containing the token:

```yaml
# ~/.tentacular/config.yaml
environments:
  dev:
    mcp_endpoint: http://<node-ip>:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token  # optional with OIDC
```

### 4. Test Connectivity

```bash
tntc cluster check --env dev
```

## Authentication

The MCP server supports three authentication paths:

| Method | Client | Deployer Provenance | Flow |
|--------|--------|-------------------|------|
| **CLI OIDC** | `tntc` CLI | Yes — records who deployed | Device-code grant (browser) |
| **Claude Code OAuth** | Claude Code | Yes — records who deployed | Authorization-code + PKCE (browser) |
| **Bearer tokens** | Any HTTP client | No — anonymous deploys | Static token file |

All OIDC-authenticated requests carry deployer identity (email, subject, display name) which is recorded as ownership annotations on namespaces and tentacles. Bearer-token requests have no identity and bypass authorization.

### Setting Up OIDC (Optional)

For deployer provenance and SSO, configure OIDC via the Helm chart. When using the `tentacular-platform` chart, the Keycloak realm and client are created automatically via `--import-realm` — no manual Keycloak configuration is needed.

```bash
helm upgrade tentacular-mcp oci://ghcr.io/randybias/tentacular-mcp \
  --namespace tentacular-system \
  --set auth.bearerToken="$MCP_TOKEN" \
  --set exoskeletonAuth.enabled=true \
  --set exoskeletonAuth.existingSecret=tentacular-mcp-exoskeleton-auth \
  --set externalURL=https://mcp.example.com
```

The `externalURL` value enables RFC 9728 Protected Resource Metadata — the server advertises its authorization server at `/.well-known/oauth-protected-resource`, allowing OAuth clients to auto-discover how to authenticate. When `externalURL` is not set, clients must be configured with the auth server URL manually.

The default Keycloak realm configuration sets access token lifetime to **12 hours**, SSO session idle timeout to 12 hours, and SSO session max lifetime to 24 hours. This allows agents to operate for extended sessions without requiring human re-authentication via the device flow.

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

### Claude Code OAuth

Claude Code connects to the MCP server as a remote HTTP MCP server and authenticates via OAuth 2.0. When `externalURL` is configured (see above), auth discovery is automatic. Configure `.mcp.json` in your workspace:

```json
{
  "mcpServers": {
    "tentacular-mcp": {
      "type": "http",
      "url": "http://<mcp-endpoint>/mcp",
      "oauth": { "clientId": "tentacular-mcp" }
    }
  }
}
```

On first connection, Claude Code:
1. Fetches `/.well-known/oauth-protected-resource` from the MCP server
2. Discovers the Keycloak authorization server URL
3. Opens a browser for Keycloak login
4. Stores the resulting tokens in the macOS system keychain
5. Attaches the JWT to all subsequent MCP requests

The JWT carries the same OIDC identity as `tntc login` — namespaces and tentacles created via Claude Code have proper ownership annotations.

If `externalURL` is not configured, add `authServerMetadataUrl` to the OAuth config as a manual fallback:

```json
{
  "mcpServers": {
    "tentacular-mcp": {
      "type": "http",
      "url": "http://<mcp-endpoint>/mcp",
      "oauth": {
        "clientId": "tentacular-mcp",
        "authServerMetadataUrl": "https://keycloak.example.com/realms/tentacular/.well-known/openid-configuration"
      }
    }
  }
}
```

> **Note:** The Keycloak client must have all scopes that Claude Code requests as optional client scopes. Claude Code requests all scopes listed in the Keycloak discovery document. If scopes are missing, you will see an `invalid_scope` error during authentication.

### Verifying RFC 9728 Metadata

After deploying with `externalURL`, verify the discovery endpoint:

```bash
# Check the well-known endpoint returns correct metadata
curl -s http://<mcp-endpoint>/.well-known/oauth-protected-resource | jq .

# Check that 401 responses include WWW-Authenticate header
curl -sv http://<mcp-endpoint>/mcp 2>&1 | grep WWW-Authenticate
```

Expected metadata response:
```json
{
  "resource": "https://mcp.example.com/mcp",
  "authorization_servers": ["https://keycloak.example.com/realms/tentacular"],
  "scopes_supported": ["openid", "email", "profile"],
  "bearer_methods_supported": ["header"],
  "resource_name": "Tentacular MCP Server"
}
```

## How It Works

The MCP server exposes 31 tools via the Model Context Protocol (JSON-RPC 2.0 over Streamable HTTP). These tools are organized into functional groups:

| Group | Tools | Purpose |
|-------|-------|---------|
| Namespace | `ns_create`, `ns_get`, `ns_list`, `ns_update`, `ns_delete` | Namespace lifecycle |
| Workflow | `wf_apply`, `wf_remove`, `wf_list`, `wf_status`, `wf_run`, etc. | Tentacle lifecycle |
| Workflow Health | `wf_health`, `wf_health_ns` | Per-tentacle health |
| Health | `health_cluster_summary`, `health_nodes`, `health_ns_usage` | Cluster monitoring |
| Audit | `audit_rbac`, `audit_netpol`, `audit_psa` | Security validation |
| Cluster | `cluster_preflight`, `cluster_profile` | Cluster capabilities + exoskeleton service discovery |
| Exoskeleton | `exo_status`, `exo_registration`, `exo_list` | Backing services |
| Permissions | `permissions_get`, `permissions_set`, `ns_permissions_get`, `ns_permissions_set` | RBAC |
| Module Proxy | `proxy_status` | ESM proxy |

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
| `invalid_scope` during Claude Code auth | Keycloak client missing scopes | Claude Code requests all scopes from discovery; add missing ones as optional client scopes |
| Claude Code `Authentication Error` | No auth discovery endpoint | Set `externalURL` in Helm values, or add `authServerMetadataUrl` to `.mcp.json` |
| `resource has no owner` | Resource created via bearer-token | Bearer-token creates ownerless resources; re-create with OIDC identity |
| `permission denied` on workflow operations | Authz mode too restrictive | Check `permissions_get`, adjust with `permissions_set`. Or set `TENTACULAR_AUTHZ_ENABLED=false` to disable |
