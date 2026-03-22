---
title: Quickstart
description: Get up and running with Tentacular in minutes
---

## Prerequisites

- **Kubernetes cluster** 1.28+ — any distribution (EKS, GKE, AKS, k0s, k3s, kind)
- **kubectl** 1.28+ — configured to access your cluster
- **Docker** 20+ — for building tentacle images
- **Deno** 2.x — for running the engine locally and tests
- **Helm** 3+ — for installing the MCP server

## Install the CLI

### Recommended

```bash
curl -fsSL https://raw.githubusercontent.com/randybias/tentacular/main/install.sh | sh
```

This installs the `tntc` binary to `~/.local/bin` and the Deno engine to `~/.tentacular/engine`.

### Build from Source

```bash
git clone git@github.com:randybias/tentacular.git
cd tentacular
make install        # builds with version info, installs to ~/.local/bin/
tntc version        # verify
```

> **Note:** `make install` embeds version, commit, and build date via ldflags. A bare `go build ./cmd/tntc` produces a dev build with `version=dev`. Building from source requires Go 1.22+.

## Install the MCP Server (One-Time Per Cluster)

The MCP server is the in-cluster control plane. The CLI routes all cluster operations through it.

```bash
# Clone the MCP server repo
git clone git@github.com:randybias/tentacular-mcp.git

# Generate a token and install via Helm
TOKEN=$(openssl rand -hex 32)
kubectl create namespace tentacular-support
helm install tentacular-mcp ./tentacular-mcp/charts/tentacular-mcp \
  --namespace tentacular-system --create-namespace \
  --set auth.token="${TOKEN}"
```

Save the token for CLI configuration:

```bash
mkdir -p ~/.tentacular
echo "${TOKEN}" > ~/.tentacular/mcp-token
chmod 600 ~/.tentacular/mcp-token
```

See [MCP Server Setup](/tentacular-docs/guides/mcp-server-setup/) for full details and Helm values.

## Configure the CLI

```bash
# Set defaults (registry, namespace, runtime class)
tntc configure --registry registry.example.com

# Add MCP endpoint to ~/.tentacular/config.yaml:
```

Edit `~/.tentacular/config.yaml` to add your environment:

```yaml
environments:
  dev:
    kubeconfig: ~/.kube/config
    namespace: tentacular-dev
    image: registry.example.com/tentacular-engine:latest
    runtime_class: gvisor
    mcp_endpoint: http://<node-ip>:30080/mcp
    mcp_token_path: ~/.tentacular/mcp-token
```

See [Cluster Configuration](/tentacular-docs/guides/cluster-configuration/) for the full config reference.

```bash
# Verify cluster connectivity
tntc cluster check

# Generate a cluster profile (helps agents design tentacles)
tntc cluster profile --save
```

## Initialize the Workspace

```bash
tntc init-workspace      # creates ~/tentacles with shared secrets pool
cd ~/tentacles
```

## Create Your First Tentacle

### From Scratch

```bash
tntc init my-first-tentacle
cd my-first-tentacle
```

This scaffolds:
- `workflow.yaml` — tentacle definition
- `nodes/hello.ts` — a starter node
- `tests/fixtures/hello.json` — test fixture

### From a Scaffold

```bash
# Browse available scaffolds
tntc scaffold list

# Create a tentacle from a scaffold
tntc scaffold init word-counter my-first-tentacle --no-params
cd my-first-tentacle
```

## Develop Locally

```bash
# Validate the workflow spec
tntc validate

# Run the local dev server with hot-reload
tntc dev

# In another terminal, trigger the tentacle
curl -X POST http://localhost:8080/run

# Run tests
tntc test
```

## Deploy to Kubernetes

```bash
# Set up secrets (if the tentacle needs them)
tntc secrets init
# Edit .secrets.yaml with your values

# Build the engine image
tntc build -r registry.example.com --push

# Deploy
tntc deploy -n my-namespace -r registry.example.com

# Verify
tntc status my-first-tentacle -n my-namespace
tntc logs my-first-tentacle -n my-namespace --tail 20
```

## Trigger and Monitor

```bash
# Trigger manually
tntc run my-first-tentacle -n my-namespace

# List all deployed tentacles
tntc list -n my-namespace

# Check health
tntc status my-first-tentacle -n my-namespace --detail

# Security audit
tntc audit my-first-tentacle -n my-namespace
```

## Clean Up

```bash
tntc undeploy my-first-tentacle -n my-namespace --yes
```

## Next Steps

- [Your First Tentacle](/tentacular-docs/guides/first-tentacle/) — detailed walkthrough of building a tentacle from scratch
- [Cluster Configuration](/tentacular-docs/guides/cluster-configuration/) — full config.yaml reference
- [MCP Server Setup](/tentacular-docs/guides/mcp-server-setup/) — detailed MCP server installation
- [CLI Reference](/tentacular-docs/reference/cli/) — complete command reference
- [Security](/tentacular-docs/concepts/security/) — understand the defense-in-depth model
- [Catalog Templates](/tentacular-docs/guides/catalog-usage/) — browse and use pre-built templates
