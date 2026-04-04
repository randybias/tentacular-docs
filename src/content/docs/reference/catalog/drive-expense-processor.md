---
title: "Drive Expense Processor"
description: "Watch a Google Drive folder for receipt uploads, extract expense data with AI, and log to Postgres and Google Sheets"
---

| Field | Value |
|-------|-------|
| **Name** | `drive-expense-processor` |
| **Category** | automation |
| **Complexity** | moderate |
| **Tags** | google-drive, llm-extraction, expense-management, google-sheets, postgres-state, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Watch a Google Drive folder for receipt uploads, extract expense data with AI, and log structured records to Postgres and Google Sheets. Polls Drive on a schedule, stores originals in S3, uses Claude to extract fields from receipts, validates the extracted data, and writes results to both a database and a spreadsheet.

## DAG Structure

```
poll-drive → store-originals → extract-fields → validate-record → store-and-notify
```

| Node | Purpose |
|------|---------|
| `poll-drive` | Poll Google Drive folder for new receipt uploads |
| `store-originals` | Store original receipt files in S3 |
| `extract-fields` | AI-powered extraction of expense fields from receipts |
| `validate-record` | Validate extracted data against allowed categories |
| `store-and-notify` | Write to Postgres and Google Sheets, notify via Slack |

## Triggers

- `manual`
- `cron` — every 15 minutes (`*/15 * * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Google Drive API | External | Yes |
| Google Sheets API | External | Yes |
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `120s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `drive_folder_id` | `YOUR_FOLDER_ID` | Google Drive folder to watch |
| `sheets_id` | `YOUR_SHEETS_ID` | Google Sheets spreadsheet ID for logging |
| `allowed_categories` | Travel, Meals, Software, Office, Equipment, Other | Valid expense categories |

## Secrets

- `google.access_token` — Google API access token for Drive and Sheets
- `anthropic.api_key` — Claude API key for field extraction
- `slack.webhook_url` — Slack webhook for notifications

## Usage

```bash
tntc scaffold init drive-expense-processor
tntc scaffold init drive-expense-processor my-custom-name
tntc scaffold info drive-expense-processor
```

## Source

Scaffold source: [`quickstarts/drive-expense-processor/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/drive-expense-processor)
