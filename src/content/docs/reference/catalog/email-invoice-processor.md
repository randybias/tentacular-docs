---
title: "Email Invoice Processor"
description: "Poll Gmail for invoice emails, extract structured data from PDF attachments with AI, validate, and store"
---

| Field | Value |
|-------|-------|
| **Name** | `email-invoice-processor` |
| **Category** | automation |
| **Complexity** | moderate |
| **Tags** | gmail-api, pdf-processing, llm-extraction, invoice-management, postgres-state, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Poll Gmail for invoice emails, extract structured data from PDF attachments with AI, validate totals, and store results. Searches for emails matching a configurable query, stores original attachments in S3, uses Claude to extract invoice fields, validates the extracted totals, and persists records to Postgres.

## DAG Structure

```
poll-email → store-originals → extract-fields → validate-totals → store-and-notify
```

| Node | Purpose |
|------|---------|
| `poll-email` | Poll Gmail for invoice emails matching the configured query |
| `store-originals` | Store original PDF attachments in S3 |
| `extract-fields` | AI-powered extraction of invoice fields from PDFs |
| `validate-totals` | Validate extracted line items against totals |
| `store-and-notify` | Persist records to Postgres and notify via Slack |

## Triggers

- `manual`
- `cron` — every 10 minutes (`*/10 * * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Gmail API | External | Yes |
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `120s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `gmail_query` | `label:invoices has:attachment` | Gmail search query for invoice emails |
| `checkpoint_table` | `email_invoice_checkpoints` | Postgres table for sync checkpoints |

## Secrets

- `google.access_token` — Google API access token for Gmail
- `anthropic.api_key` — Claude API key for field extraction
- `slack.webhook_url` — Slack webhook for notifications

## Usage

```bash
tntc scaffold init email-invoice-processor
tntc scaffold init email-invoice-processor my-custom-name
tntc scaffold info email-invoice-processor
```

## Source

Scaffold source: [`quickstarts/email-invoice-processor/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/email-invoice-processor)
