---
title: Testing
description: Testing tentacles at every level — unit, integration, and end-to-end
---

## Prerequisites

- `tntc` CLI installed
- Deno runtime for engine tests
- Go 1.22+ for Go tests (if contributing to Tentacular itself)

## Workflow Tests (tntc test)

The primary way to test tentacles:

```bash
tntc test                          # all node fixtures
tntc test my-tentacle/fetch-data   # single node
tntc test --pipeline               # full DAG end-to-end
```

### Creating Fixtures

Each node needs a fixture at `tests/fixtures/<node-name>.json`:

```json
{
  "input": { "query": "test" },
  "expected": { "results": [] }
}
```

For nodes that use config or secrets, include those in the fixture:

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

### Mock Context

The engine provides a mock context (`engine/testing/mocks.ts`) that:

- Stubs `ctx.dependency()` with mock secret values
- Records dependency access for drift detection
- Returns `{ mock: true, dependency, path }` from HTTPS mock `fetch()`
- Provides `ctx.log` that captures output

### Pipeline Tests

`tntc test --pipeline` runs the full DAG end-to-end using fixture chain:
1. Root nodes receive their fixture `input`
2. Each node's output feeds into downstream nodes
3. Leaf node output is compared against its `expected`

## Steps

1. Create fixtures for each node in `tests/fixtures/`
2. Run `tntc test` to validate individual nodes
3. Run `tntc test --pipeline` to validate the full DAG
4. Fix any assertion failures — check node logic and fixture expectations

## Deno Engine Tests

If contributing to the Tentacular engine itself:

```bash
cd engine && deno test --allow-read --allow-write=/tmp --allow-net --allow-env
```

| Module | Tests | Coverage |
|--------|-------|----------|
| `compiler` | 9 | DAG compilation: chains, fan-out, fan-in, cycles |
| `context` | 12 | Context: fetch, auth injection, logging, config |
| `secrets` | 6 | Secret loading: YAML, directory, cascade |
| `cascade` | 7 | Cascade: precedence, merging, fallback |
| `executor` | 7 | Execution: chains, parallel, retry, timeout |
| `nats` | 7 | NATS: options validation, triggers |

## Go Tests

If contributing to the `tntc` CLI:

```bash
go test ./pkg/...
```

| Package | Tests | Coverage |
|---------|-------|----------|
| `pkg/spec` | 17 | Parser: valid spec, naming, cycles, edges, triggers |
| `pkg/builder` | 38 | K8s manifests: security, probes, RuntimeClass, NetworkPolicy |
| `pkg/cli` | 42 | Secret provisioning, config loading, secrets check/init |
| `pkg/k8s` | 3 | Preflight checks |

## Verification

- All `tntc test` fixtures pass with no errors
- Pipeline test runs the full DAG successfully
- No auth errors in logs when running with mock context
- Deployed tentacles return expected results via `tntc run`

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `fixture not found` | Missing test fixture | Create `tests/fixtures/<node-name>.json` |
| `expected X but got Y` | Node logic or fixture mismatch | Check node implementation and fixture expected value |
| `dependency not found` | Node uses undeclared dependency | Add dependency to contract in workflow.yaml |
| Pipeline test hangs | Node timeout | Check `config.timeout` value or add timeout to fixture |
