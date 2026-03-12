---
title: Node Contract
description: TypeScript node interface, Context API, and testing patterns
---

Every node in a tentacle is a TypeScript file with a single default export.

## Node Signature

```typescript
import type { Context } from "tentacular";

export default async function run(ctx: Context, input: unknown): Promise<unknown> {
  // Node implementation
}
```

- **`ctx`** — The Context object providing dependency access, logging, config, and secrets
- **`input`** — Output from upstream nodes. Single dependency: passed directly. Multiple dependencies: merged into keyed object.
- **Return value** — Passed as input to downstream nodes

## Context API

| Member | Type | Description |
|--------|------|-------------|
| `ctx.dependency(name)` | `(string) => DependencyConnection` | **Primary API.** Returns connection metadata and resolved secret for a declared contract dependency. HTTPS deps include `fetch(path, init?)` URL builder. |
| `ctx.log` | `Logger` | Structured logging (`info`, `warn`, `error`, `debug`) prefixed with `[nodeId]` |
| `ctx.config` | `Record<string, unknown>` | Workflow-level config from `config:` in workflow.yaml |
| `ctx.fetch(service, path, init?)` | `Promise<Response>` | **Legacy.** Flagged as contract violation when contract is present. Use `ctx.dependency()` instead. |
| `ctx.secrets` | `Record<string, Record<string, string>>` | **Legacy.** Flagged as contract violation when contract is present. Use `ctx.dependency().secret` instead. |

## DependencyConnection

The object returned by `ctx.dependency(name)`:

| Field | Type | Description |
|-------|------|-------------|
| `protocol` | `string` | Protocol from the contract (e.g., `https`, `postgres`) |
| `host` | `string` | Resolved hostname |
| `port` | `number` | Resolved port |
| `secret` | `string` | The resolved secret value |
| `authType` | `string` | Auth type from contract (e.g., `bearer-token`, `api-key`) |
| `fetch(path, init?)` | `Promise<Response>` | URL builder for HTTPS deps. Does NOT inject auth headers. |

## Auth Pattern

`dep.fetch()` builds the URL but does not inject auth. Nodes handle auth explicitly using `dep.secret` and `dep.authType`:

```typescript
const gh = ctx.dependency("github-api");
const resp = await gh.fetch!("/repos/owner/repo", {
  headers: { "Authorization": `Bearer ${gh.secret}` },
});
const data = await resp.json();
```

## Node Patterns

### Simple Transform

```typescript
export default async function run(ctx: Context, input: { items: string[] }) {
  ctx.log.info(`Processing ${input.items.length} items`);
  return {
    processed: input.items.map(item => item.toUpperCase()),
    count: input.items.length,
  };
}
```

### Fetch with Contract Dependency

```typescript
export default async function run(ctx: Context, input: unknown) {
  const gh = ctx.dependency("github-api");
  const resp = await gh.fetch!("/user/repos?per_page=100", {
    headers: { "Authorization": `Bearer ${gh.secret}` },
  });
  if (!resp.ok) throw new Error(`GitHub API error: ${resp.status}`);
  return { repos: await resp.json() };
}
```

### Fan-In (Multiple Inputs)

When a node has multiple incoming edges, input is a keyed object:

```typescript
export default async function run(ctx: Context, input: {
  "code-scan": { issues: Issue[] };
  "dep-review": { vulnerabilities: Vuln[] };
}) {
  const issues = input["code-scan"].issues;
  const vulns = input["dep-review"].vulnerabilities;
  // Synthesize results from both upstream nodes
}
```

### Using Config

```typescript
export default async function run(ctx: Context, input: unknown) {
  const topN = (ctx.config.top_links_count as number) ?? 20;
  const timeout = ctx.config.timeout as string;
  // Use config values
}
```

## Testing Nodes

### Fixtures

Create a JSON fixture at `tests/fixtures/<node-name>.json`:

```json
{
  "input": { "query": "test" },
  "expected": { "results": [] }
}
```

Optional fields for testing nodes that use config or secrets:

```json
{
  "input": { "alert": true },
  "config": { "endpoints": ["https://example.com"] },
  "secrets": { "slack": { "webhook_url": "https://hooks.slack.com/test" } },
  "expected": { "delivered": false }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | any | Yes | Value passed as `input` to the node function |
| `config` | `Record<string, unknown>` | No | Injected as `ctx.config` |
| `secrets` | `Record<string, Record<string, string>>` | No | Injected as `ctx.secrets` |
| `expected` | any | No | Expected return value (JSON deep equality) |

### Running Tests

```bash
tntc test                          # all node fixtures
tntc test my-tentacle/fetch-data   # single node
tntc test --pipeline               # full DAG end-to-end
```

### Mock Context

The engine provides a mock context for testing (`engine/testing/mocks.ts`). Mock `ctx.dependency()` returns metadata with mock secret values and records access for drift detection. HTTPS mock deps return `{ mock: true, dependency, path }` from `fetch()`.

## Import Map

Nodes import types via:

```typescript
import type { Context } from "tentacular";
```

This is resolved through the `deno.json` import map:

```json
{
  "imports": {
    "tentacular": "./mod.ts",
    "std/": "https://deno.land/std@0.224.0/"
  }
}
```

At deploy time, jsr and deno.land/std URLs are rewritten through the in-cluster ESM module proxy for supply-chain security.
