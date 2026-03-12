---
title: "Uptime Prober"
description: "Probe HTTP endpoints on a cron schedule and alert when any are down"
---

| Field | Value |
|-------|-------|
| **Name** | `uptime-prober` |
| **Category** | monitoring |
| **Complexity** | moderate |
| **Tags** | monitoring, health-check, frequent-polling, dynamic-targets |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Probe HTTP endpoints on a cron schedule and alert when any are down. Uses dynamic-target networking to reach arbitrary endpoints. Configurable endpoint list via workflow config.

## DAG Structure

```
probe-endpoints → analyze-results → format-report → notify-slack
```

| Node | Purpose |
|------|---------|
| `probe-endpoints` | HTTP GET/HEAD each configured endpoint |
| `analyze-results` | Classify results (up/down/degraded) |
| `format-report` | Format into human-readable report |
| `notify-slack` | Send alert to Slack |

## Triggers

- `manual`
- `cron` (`scheduled-probe`): every 5 minutes (`*/5 * * * *`)

## Dependencies

| Dependency | Host | Auth |
|-----------|------|------|
| `slack` | `hooks.slack.com:443` | `webhook-url` |
| `probe-targets` | dynamic-target (`0.0.0.0/0:443,80`) | None |

## Config

| Key | Description |
|-----|-------------|
| `endpoints` | List of URLs to probe |
| `cluster_id` | Cluster identifier for reports |

## Secrets

| Secret | Description |
|--------|-------------|
| `slack.webhook_url` | Slack incoming webhook URL |

## Usage

```bash
tntc catalog init uptime-prober
tntc catalog init uptime-prober my-prober
tntc catalog info uptime-prober
```

## Source

Template source: [`templates/uptime-prober/`](https://github.com/randybias/tentacular-catalog/tree/main/templates/uptime-prober)
