---
title: "E2E Exoskeleton Test"
description: "Smoke test that validates all exoskeleton services: Postgres, RustFS, NATS, and SPIRE identity"
---

| Field | Value |
|-------|-------|
| **Name** | `e2e-exoskeleton-test` |
| **Category** | monitoring |
| **Complexity** | advanced |
| **Tags** | smoke-test, exoskeleton, postgres, nats, rustfs, spire, self-test, ci-integration |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Smoke test that validates all exoskeleton services: Postgres, RustFS, NATS, and SPIRE identity. Runs each service test sequentially, collects results, renders a report, and notifies via Slack. Useful for CI integration and cluster validation after upgrades.

## DAG Structure

```
test-postgres → test-rustfs → test-nats → test-spire → collect-results → render-report → notify
```

| Node | Purpose |
|------|---------|
| `test-postgres` | Validate Postgres connectivity and basic operations |
| `test-rustfs` | Validate RustFS (S3-compatible) storage operations |
| `test-nats` | Validate NATS messaging connectivity |
| `test-spire` | Validate SPIRE identity and certificate issuance |
| `collect-results` | Aggregate pass/fail results from all tests |
| `render-report` | Render a human-readable test report |
| `notify` | Deliver report to Slack |

## Triggers

- `manual` only

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |
| tentacular-nats | Exoskeleton | Yes |
| Slack webhook | External | Optional |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `120s` | Per-node timeout |
| `retries` | `0` | No retries (smoke test) |

## Secrets

- `slack.webhook_url` — Slack webhook for report delivery (optional)

## Usage

```bash
tntc scaffold init e2e-exoskeleton-test
tntc scaffold init e2e-exoskeleton-test my-custom-name
tntc scaffold info e2e-exoskeleton-test
```

## Source

Scaffold source: [`quickstarts/e2e-exoskeleton-test/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/e2e-exoskeleton-test)
