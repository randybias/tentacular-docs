---
title: Secrets
description: Managing secrets for local development and Kubernetes deployment
---

## Prerequisites

- `tntc` CLI installed
- A tentacle project with `workflow.yaml`

## Local Development

Copy the generated template and fill in values:

```bash
tntc secrets init my-tentacle
# Or manually:
cp .secrets.yaml.example .secrets.yaml
```

```yaml
# .secrets.yaml (gitignored)
github:
  token: "ghp_..."
slack:
  webhook_url: "https://hooks.slack.com/services/..."
anthropic:
  api_key: "sk-ant-..."
```

The engine loads `.secrets.yaml` at startup. Values are available via `ctx.dependency().secret` in nodes.

## Check Secret Provisioning

```bash
tntc secrets check my-tentacle
```

Output:
```
Secrets check for my-tentacle:
  github  provisioned (shared)
  slack   provisioned (shared)
  All 2 required secret(s) provisioned.
```

`secrets check` scans `nodes/*.ts` for `ctx.secrets` references and reports which are provisioned locally.

## Shared Secrets Pool

To avoid duplicating secrets across tentacles, place shared secret files at the repo root:

```
.secrets/
  slack      # contains: {"webhook_url": "https://hooks.slack.com/..."}
  postgres   # contains: {"password": "..."}
```

Reference shared secrets from a tentacle's `.secrets.yaml` using `$shared.<name>`:

```yaml
# my-tentacle/.secrets.yaml
slack: $shared.slack
postgres: $shared.postgres
```

During `tntc deploy`, `$shared.<name>` references are resolved by reading `<repo-root>/.secrets/<name>`. The file content is parsed as JSON if possible, otherwise used as a plain string. Path traversal is prevented — names containing `..` are rejected.

## Cascade Precedence

Secrets are resolved in order, with later sources merging on top:

| Priority | Source | Description |
|----------|--------|-------------|
| 1 (highest) | `--secrets <path>` | Explicit flag — skips all other sources |
| 2 | `/app/secrets` | K8s Secret volume mount (always checked last, merges on top) |
| 3 | `.secrets.yaml` | YAML file in tentacle directory |
| 4 (base) | `.secrets/` | Directory of files (K8s volume mount format) |

## Production (Kubernetes)

`tntc deploy` automatically provisions secrets to Kubernetes from:
1. `.secrets/` directory (files as secret entries), or
2. `.secrets.yaml` file (YAML keys as secret entries)

Nested YAML maps in `.secrets.yaml` are JSON-serialized into K8s Secret `stringData` entries.

The K8s Secret is mounted **read-only** at `/app/secrets` inside the container. Secrets are never exposed as environment variables.

## K8s Secret Value Format

K8s Secret values must be JSON objects. The contract reference `secret: openai.api_key` maps to:
- K8s Secret key = `openai`
- K8s Secret value = `{"api_key":"sk-..."}`

At runtime the engine performs a `secrets[serviceName][keyName]` lookup.

## Manual Secret Management

To manage secrets manually:

```bash
kubectl create secret generic my-tentacle-secrets \
  -n my-namespace \
  --from-file=github=./github-token.json \
  --from-file=slack=./slack-config.json
```

Convention: secrets are named `<tentacle-name>-secrets`.

## Verification

After deploying, verify secrets are mounted:

```bash
tntc status my-tentacle --detail
tntc run my-tentacle  # trigger and check logs for auth errors
tntc logs my-tentacle --tail 20
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `secret not found: github` | Missing `.secrets.yaml` entry | Run `tntc secrets check` to see what's missing |
| `$shared.slack: file not found` | Missing shared secret file | Create `.secrets/slack` at repo root |
| Auth errors after deploy | Secret format mismatch | Ensure K8s Secret values are JSON objects |
| `EACCES` on secret mount | Wrong container permissions | Secrets are mounted read-only by design |
