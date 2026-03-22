---
title: "Cluster Health Collector"
description: "Collect K8s cluster health data every 5 minutes and store in Postgres"
---

| Field | Value |
|-------|-------|
| **Name** | `cluster-health-collector` |
| **Category** | monitoring |
| **Complexity** | moderate |
| **Tags** | k8s-monitoring, in-cluster, db-persistence, health-metrics |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Collect Kubernetes cluster health data every 5 minutes and store in Postgres. Designed to work with the [Cluster Health Reporter](/tentacular-docs/reference/catalog/cluster-health-reporter/) template for trend analysis.

## DAG Structure

```
fetch-cluster-state → store-health-data
```

| Node | Purpose |
|------|---------|
| `fetch-cluster-state` | Query cluster health metrics |
| `store-health-data` | Write metrics to Postgres |

## Triggers

- `manual`
- `cron` (`collect-health`): every 5 minutes (`*/5 * * * *`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `postgres` | `postgres-postgresql.postgres.svc.cluster.local:5432` | `password` |

## Secrets

| Secret | Description |
|--------|-------------|
| `postgres.password` | Postgres database password |

## Usage

```bash
tntc scaffold init cluster-health-collector
tntc scaffold init cluster-health-collector my-collector
tntc scaffold info cluster-health-collector
```

## Source

Scaffold source: [`quickstarts/cluster-health-collector/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/cluster-health-collector)
