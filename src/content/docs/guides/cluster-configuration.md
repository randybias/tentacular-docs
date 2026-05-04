---
title: Cluster Configuration
description: Configuring tntc to connect to your Kubernetes cluster and MCP server
---

Configuring your target Kubernetes cluster is a critical first step. The `tntc` CLI does not access the Kubernetes API directly — all cluster operations route through the MCP server. Configuration tells the CLI where to find the MCP server and how to authenticate.

## Prerequisites

- `tntc` CLI installed
- A Kubernetes cluster with the [MCP server installed](/tentacular-docs/guides/mcp-server-setup/)
- `kubectl` access (for initial MCP server setup only)

## Configuration Files

Configuration lives in two locations:

| File | Scope | Purpose |
|------|-------|---------|
| `~/.tentacular/config.yaml` | User-level | Global defaults, shared across all projects |
| `.tentacular/config.yaml` | Project-level | Per-project overrides (in your workspace) |

Resolution order: **CLI flags > project config > user config > defaults**.

## Steps

### 1. Initialize Configuration

```bash
# Set user-level defaults
tntc configure --registry ghcr.io/yourorg --default-namespace tentacular-dev

# Or set project-level defaults
tntc configure --registry ghcr.io/yourorg --default-namespace tentacular-dev --project
```

### 2. Configure Environments

Edit `~/.tentacular/config.yaml` (or `.tentacular/config.yaml`) to define your environments:

```yaml
registry: ghcr.io/yourorg
namespace: default
runtime_class: gvisor
default_env: dev

environments:
  dev:
    kubeconfig: ~/.kube/configs/dev-cluster.kubeconfig
    namespace: tentacular-dev
    image: ghcr.io/yourorg/tentacular-engine:latest
    runtime_class: gvisor
    mcp_endpoint: http://172.31.29.1:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token

  staging:
    kubeconfig: ~/.kube/configs/staging.kubeconfig
    namespace: tentacular-staging
    image: ghcr.io/yourorg/tentacular-engine:latest
    runtime_class: gvisor
    mcp_endpoint: http://staging-mcp.example.com:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token-staging

  prod:
    kubeconfig: ~/.kube/configs/prod.kubeconfig
    namespace: tentacular-prod
    image: ghcr.io/yourorg/tentacular-engine:latest
    runtime_class: gvisor
    mcp_endpoint: http://prod-mcp.internal:30080/mcp
    oidc_issuer: https://keycloak.example.com/realms/tentacular
    oidc_client_id: tentacular-mcp
    oidc_client_secret: your-client-secret

catalog:
  url: https://raw.githubusercontent.com/randybias/tentacular-scaffolds/main
  cacheTTL: 1h
```

### 3. Set Up Authentication

**Bearer token (default):**
```bash
# Save the token generated during MCP server installation
echo "your-mcp-token" > ~/.tentacular/mcp-token
chmod 600 ~/.tentacular/mcp-token
```

**OIDC/SSO (recommended for production):**

When `oidc_issuer`, `oidc_client_id`, and `oidc_client_secret` are configured for an environment:

```bash
# Authenticate via browser-based OIDC flow
tntc login --env prod

# Verify identity
tntc whoami --env prod

# Clear credentials
tntc logout --env prod
```

The CLI uses the OAuth 2.0 Device Authorization Grant — it displays a code, you authenticate in your browser, and the CLI polls until complete. Tokens are cached at `~/.tentacular/tokens/<env>.json` with restricted permissions (0600) and refresh automatically.

All auth methods can coexist — OIDC is tried first, bearer token is the fallback. OIDC enables deployer provenance tracking (who deployed what, when).

**Claude Code OAuth:**

If using Claude Code as an MCP client, configure `.mcp.json` in your workspace root:

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

When the MCP server has `externalURL` configured, Claude Code auto-discovers the authorization server via RFC 9728. On first connection, a browser opens for Keycloak login. Tokens are stored in the system keychain and refreshed automatically. See the [MCP Server Setup guide](/tentacular-docs/guides/mcp-server-setup/#claude-code-oauth) for details.

### 4. Validate the Configuration

```bash
# Check cluster connectivity
tntc cluster check --env dev

# Generate a cluster capability profile
tntc cluster profile --env dev --save

# Profile all environments
tntc cluster profile --all --save
```

## Full Configuration Reference

### Top-Level Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `workspace` | string | `~/tentacles` | Default workspace directory for tentacle projects |
| `registry` | string | — | Container registry URL for `tntc build --push` |
| `namespace` | string | `default` | Default Kubernetes namespace |
| `runtime_class` | string | `gvisor` | Default RuntimeClass (empty disables gVisor) |
| `default_env` | string | — | Environment used when `--env` is not specified |

### Per-Environment Fields

| Field | Type | Description |
|-------|------|-------------|
| `kubeconfig` | string | Path to kubeconfig file (supports `~` expansion) |
| `context` | string | kubectl context name within the kubeconfig |
| `namespace` | string | K8s namespace override for this environment |
| `image` | string | Engine container image |
| `runtime_class` | string | RuntimeClass override |
| `mcp_endpoint` | string | Full URL to MCP server `/mcp` path |
| `mcp_token_path` | string | Path to bearer token file (supports `~`) |
| `oidc_issuer` | string | OIDC provider issuer URL (e.g., Keycloak realm) |
| `oidc_client_id` | string | OIDC client ID |
| `oidc_client_secret` | string | OIDC client secret |
| `config_overrides` | map | Key-value pairs merged into workflow config at deploy time |
| `secrets_source` | string | Secrets backend (default: local `$shared` references) |
| `enforcement` | string | Contract enforcement mode: `strict` (default) or `audit` |

### MCP Resolution Order

1. Active environment's `mcp_endpoint` / `mcp_token_path` (from `--env` > `TENTACULAR_ENV` > `default_env`)
2. `TNTC_MCP_ENDPOINT` / `TNTC_MCP_TOKEN` environment variables

### Namespace Resolution Order

1. CLI `-n` flag
2. `workflow.yaml` `deployment.namespace`
3. Active environment's `namespace`
4. Top-level `namespace`
5. `default`

## Verification

- `tntc cluster check` passes all checks
- `tntc cluster profile` returns cluster capabilities
- `tntc whoami` shows authenticated identity (if using OIDC)
- `tntc list --env <name>` shows deployed tentacles (may be empty initially)

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `MCP not configured` | Missing `mcp_endpoint` | Add `mcp_endpoint` to the active environment |
| `connection refused` | Wrong MCP endpoint URL | Verify the MCP server is running and the URL is correct |
| `401 Unauthorized` | Wrong or expired token | Regenerate the bearer token or run `tntc login` |
| `OIDC flow timeout` | Browser not opening | Copy the URL manually and authenticate |
| `invalid_scope` in Claude Code | Keycloak client missing scopes | Add all discovery scopes as optional client scopes on the Keycloak client |
| Claude Code `Authentication Error` | MCP server not advertising auth | Set `externalURL` in Helm values, or add `authServerMetadataUrl` to `.mcp.json` oauth config |
| `environment not found` | Typo in `--env` | Check environment names in config file |
