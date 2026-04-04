---
title: "Knowledge Base RAG"
description: "Ingest documents from Google Drive, generate embeddings, store in pgvector, and answer questions with source citations"
---

| Field | Value |
|-------|-------|
| **Name** | `knowledge-base-rag` |
| **Category** | automation |
| **Complexity** | advanced |
| **Tags** | rag, embeddings, pgvector, google-drive, document-processing, llm-generation, nats-events, s3-storage |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Ingest documents from Google Drive, generate embeddings, store in pgvector, and answer questions with source citations. The ingest pipeline runs on a daily schedule; the query path is an independent entry point triggered manually. Uses OpenAI for embeddings and Claude for answer generation.

## DAG Structure

```
Ingest pipeline:
poll-drive → store-originals → extract-and-chunk → generate-embeddings → store-vectors

Query path (independent):
answer-query
```

| Node | Purpose |
|------|---------|
| `poll-drive` | Poll Google Drive folders for new or updated documents |
| `store-originals` | Store original documents in S3 |
| `extract-and-chunk` | Extract text and split into chunks |
| `generate-embeddings` | Generate vector embeddings via OpenAI API |
| `store-vectors` | Store embeddings in pgvector |
| `answer-query` | Retrieve relevant chunks, generate answer with citations |

## Triggers

- `manual`
- `cron` — daily at 6:00 AM (`0 6 * * *`)

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Google Drive API | External | Yes |
| OpenAI API | External | Yes (embeddings) |
| Anthropic API | External | Yes (answer generation) |
| Slack webhook | External | Optional |
| tentacular-postgres | Exoskeleton | Yes (with pgvector extension) |
| tentacular-rustfs | Exoskeleton | Yes |
| tentacular-nats | Exoskeleton | Optional |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `300s` | Per-node timeout |
| `retries` | `1` | Retry count per node |
| `drive_folder_ids` | (placeholder) | Google Drive folder IDs to ingest |
| `query` | (empty) | Question to answer (for query path) |
| `top_k` | `5` | Number of nearest chunks to retrieve |

## Secrets

- `google.access_token` — Google API access token for Drive
- `openai.api_key` — OpenAI API key for embedding generation
- `anthropic.api_key` — Claude API key for answer generation
- `slack.webhook_url` — Slack webhook for notifications (optional)

## Usage

```bash
tntc scaffold init knowledge-base-rag
tntc scaffold init knowledge-base-rag my-custom-name
tntc scaffold info knowledge-base-rag
```

## Source

Scaffold source: [`quickstarts/knowledge-base-rag/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/knowledge-base-rag)
