---
title: "Slack Channel Archiver"
description: "Archive Slack channel messages and file attachments to Postgres and S3 with incremental sync"
---

| Field | Value |
|-------|-------|
| **Name** | `slack-channel-archiver` |
| **Category** | data-pipeline |
| **Complexity** | moderate |
| **Tags** | slack-api, incremental-sync, postgres-state, s3-storage, checkpoint-pattern |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Archive Slack channel messages and file attachments to Postgres and S3 with incremental sync. Uses a checkpoint pattern to track the last-synced timestamp per channel, fetching only new messages on each run. File attachments are stored in S3 with metadata in Postgres.

## DAG Structure

```
fetch-messages → store-messages → store-attachments → update-checkpoint
```

| Node | Purpose |
|------|---------|
| `fetch-messages` | Fetch new messages from Slack API since last checkpoint |
| `store-messages` | Store message content and metadata in Postgres |
| `store-attachments` | Download and store file attachments in S3 |
| `update-checkpoint` | Update the sync checkpoint timestamp |

## Triggers

- `manual`
- `cron` — hourly (`0 * * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Slack API | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `120s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `channels` | `[C0123456789]` | List of Slack channel IDs to archive |

## Secrets

- `slack.bot_token` — Slack bot token with channel read and file access permissions

## Usage

```bash
tntc scaffold init slack-channel-archiver
tntc scaffold init slack-channel-archiver my-custom-name
tntc scaffold info slack-channel-archiver
```

## Source

Scaffold source: [`quickstarts/slack-channel-archiver/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/slack-channel-archiver)
