---
title: "Document Converter"
description: "Convert documents between formats using a pandoc sidecar and summarize with Claude"
---

| Field | Value |
|-------|-------|
| **Name** | `doc-converter` |
| **Category** | data-pipeline |
| **Complexity** | moderate |
| **Tags** | sidecar, pandoc, document-conversion, llm-synthesis, http-body |
| **Author** | randybias |
| **Min Version** | 0.7.0 |

## Description

Convert documents between formats using a pandoc sidecar, then summarize the output with Claude. This scaffold demonstrates the **HTTP body** sidecar data flow pattern -- content travels as JSON in the request and response body, with no shared volume required.

## Sidecar

This scaffold includes a sidecar container:

| Field | Value |
|-------|-------|
| **Name** | `pandoc` |
| **Image** | `pandoc/core:3.6` |
| **Port** | `3030` |
| **Health check** | `GET /version` |
| **Communication** | HTTP body (JSON request/response to `localhost:3030`) |

The pandoc sidecar runs `pandoc-server --port 3030` using the official pandoc image. No custom Docker image is needed. The engine node sends document content via HTTP POST and receives the converted output in the response body.

## DAG Structure

```
fetch-document → convert-document → summarize-output
```

| Node | Purpose |
|------|---------|
| `fetch-document` | Fetch a document from a URL, auto-detecting format |
| `convert-document` | POST content to the pandoc sidecar for format conversion |
| `summarize-output` | Send a preview to Claude for a brief summary |

## Triggers

- `manual` only

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Anthropic API | External | Optional (mock fallback if absent) |
| Document source URL | External | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `120s` | Per-node timeout |
| `retries` | `0` | Retry count per node |
| `document_url` | Tentacular README | URL of document to fetch |
| `input_format` | `markdown` | pandoc input format |
| `output_format` | `html` | pandoc output format |
| `max_summary_chars` | `2000` | Max chars sent to Claude for summarization |

Pandoc supports 40+ input and output formats. Common pairs: markdown to HTML, HTML to markdown, RST to markdown, markdown to LaTeX.

## Secrets

- `anthropic.api_key` — Claude API key for summarization (optional; mock fallback used if absent)

## Usage

```bash
tntc scaffold init doc-converter
tntc scaffold init doc-converter my-custom-name
tntc scaffold info doc-converter
```

## Notes

- The pandoc sidecar starts `pandoc-server --port 3030` -- no custom image needed
- `/version` is used as the readiness probe (returns pandoc version JSON)
- PDFs cannot be produced by pandoc-server (pandoc limitation in server mode)
- Contrast with `video-frame-analyzer` which uses a shared emptyDir volume for large file handoff

## Source

Scaffold source: [`quickstarts/doc-converter/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/doc-converter)
