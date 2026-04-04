---
title: "Contract Clause Reviewer"
description: "Watch a Google Drive folder for new contracts, extract text, perform parallel AI clause analysis, and generate risk reports"
---

| Field | Value |
|-------|-------|
| **Name** | `contract-clause-reviewer` |
| **Category** | automation |
| **Complexity** | advanced |
| **Tags** | legal-review, google-drive, document-processing, fan-out-pattern, llm-analysis, risk-scoring, s3-storage, postgres-state |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Watch a Google Drive folder for new contracts, extract text, perform parallel AI clause analysis across four legal dimensions (liability, IP rights, termination, compliance), and generate consolidated risk reports. Uses a fan-out/fan-in DAG pattern for parallel review.

## DAG Structure

```
                                    ┌→ review-liability ───┐
poll-drive → store-originals → extract-text ─┼→ review-ip-rights ──┼→ synthesize-report → store-and-notify
                                    ├→ review-termination ─┤
                                    └→ review-compliance ──┘
```

| Node | Purpose |
|------|---------|
| `poll-drive` | Poll Google Drive folder for new contract documents |
| `store-originals` | Store original documents in S3 |
| `extract-text` | Extract text content from documents |
| `review-liability` | AI review of liability clauses |
| `review-ip-rights` | AI review of intellectual property clauses |
| `review-termination` | AI review of termination clauses |
| `review-compliance` | AI review against configured compliance frameworks |
| `synthesize-report` | Consolidate all reviews into a risk report |
| `store-and-notify` | Store report and notify via Slack |

## Triggers

- `manual`
- `cron` — every 30 minutes (`*/30 * * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Google Drive API | External | Yes |
| Anthropic API | External | Yes |
| Slack webhook | External | Yes |
| tentacular-postgres | Exoskeleton | Yes |
| tentacular-rustfs | Exoskeleton | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `300s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `drive_folder_id` | `YOUR_FOLDER_ID` | Google Drive folder to watch |
| `compliance_frameworks` | `[GDPR]` | Compliance frameworks to check against |

## Secrets

- `google.access_token` — Google API access token for Drive
- `anthropic.api_key` — Claude API key for clause analysis
- `slack.webhook_url` — Slack webhook for notifications

## Usage

```bash
tntc scaffold init contract-clause-reviewer
tntc scaffold init contract-clause-reviewer my-custom-name
tntc scaffold info contract-clause-reviewer
```

## Source

Scaffold source: [`quickstarts/contract-clause-reviewer/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/contract-clause-reviewer)
