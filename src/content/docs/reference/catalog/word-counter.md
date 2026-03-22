---
title: "Word Counter"
description: "Tokenize text, count words, and produce a report -- ideal for e2e testing"
---

| Field | Value |
|-------|-------|
| **Name** | `word-counter` |
| **Category** | starter |
| **Complexity** | simple |
| **Tags** | beginner-friendly, pure-transform, e2e-test |
| **Author** | randybias |
| **Min Version** | 0.1.0 |

## Description

Tokenize text, count words, and produce a report. This is the simplest scaffold — ideal for end-to-end testing and learning the Tentacular workflow model.

## DAG Structure

```
source → tokenize → report
```

| Node | Purpose |
|------|---------|
| `source` | Produce input text |
| `tokenize` | Split text into tokens |
| `report` | Count words and produce output |

## Triggers

- `manual` only

## Dependencies

None — this is a pure-transform tentacle with no external service dependencies.

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `10s` | Per-node timeout |

## Secrets

None required.

## Usage

```bash
tntc scaffold init word-counter
tntc scaffold init word-counter my-custom-name
tntc scaffold info word-counter
```

## Source

Scaffold source: [`quickstarts/word-counter/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/word-counter)
