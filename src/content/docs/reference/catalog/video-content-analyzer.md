---
title: "Video Content Analyzer"
description: "Extract frames from video via ffmpeg sidecar, deduplicate with perceptual hashing, analyze with batched Claude Vision, and compile templated reports"
---

| Field | Value |
|-------|-------|
| **Name** | `video-content-analyzer` |
| **Category** | data-pipeline |
| **Complexity** | advanced |
| **Tags** | sidecar, ffmpeg, video-processing, llm-synthesis, shared-volume, nunjucks, templates, perceptual-hash, reporting |
| **Author** | randybias |
| **Min Version** | 0.7.0 |

## Description

Extract frames from a video using an ffmpeg sidecar, deduplicate with perceptual hashing, analyze with batched Claude Vision, and compile rich HTML/Markdown reports with optional editorial audit. This is the most full-featured sidecar scaffold, demonstrating shared-volume data flow, batched Vision API calls, Nunjucks templating, and quality auditing.

## Sidecar

This scaffold includes a sidecar container:

| Field | Value |
|-------|-------|
| **Name** | `ffmpeg` |
| **Image** | `linuxserver/ffmpeg:latest` |
| **Port** | `9000` |
| **Health check** | `GET /health` |
| **Communication** | Shared emptyDir volume at `/shared/` |

The ffmpeg sidecar uses a public image with an inline Perl HTTP server injected via `command:`/`args:` (base64-encoded). This is the Tier 2 hook pattern -- no custom Docker image needed. The sidecar also downloads yt-dlp at startup for YouTube URL support.

**Endpoints:**
- `GET /health` -- Readiness probe
- `POST /download-youtube` -- Download video from YouTube URL to shared volume
- `POST /extract-frames` -- Extract frames from video on shared volume

Video and frame files flow through the `/shared/` emptyDir volume mounted in both the engine and sidecar containers. This contrasts with `doc-converter` which uses pure HTTP body data flow.

## DAG Structure

```
ingest-video → extract-frames → deduplicate-frames → analyze-frames → compile-report → audit-and-publish
```

| Node | Purpose |
|------|---------|
| `ingest-video` | Fetch video from URL (YouTube or direct MP4) to shared volume |
| `extract-frames` | Call ffmpeg sidecar to extract frames at configured FPS |
| `deduplicate-frames` | Remove near-duplicate frames using blockhash perceptual hashing |
| `analyze-frames` | Batched Claude Vision API calls with rolling context |
| `compile-report` | Render HTML, Markdown, and Slack reports via Nunjucks templates |
| `audit-and-publish` | Optional editorial audit, then store to RustFS and notify Slack |

## Triggers

- `manual` only

## Runtime Input (per-run)

Every run analyzes a different video. These fields are passed at runtime via `tntc run --input`:

| Field | Required | Description |
|-------|----------|-------------|
| `video_url` | Yes | YouTube URL or direct MP4 URL |
| `title` | No | Report title (default: YouTube title or "Video Analysis Report") |
| `context_prompt` | No | Context hint for Vision model |

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Anthropic API | External | Yes (Vision analysis + synthesis) |
| Video source | External | Yes |
| tentacular-postgres | Exoskeleton | Optional (metadata storage) |
| tentacular-rustfs | Exoskeleton | Optional (report storage) |
| Slack webhook | External | Optional (notifications) |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `600s` | Per-node timeout |
| `retries` | `0` | No retries |
| `fps` | `1` | Frames per second to extract |
| `max_frames` | `100` | Max frames for Vision API (cost control) |
| `dedup.hamming_threshold` | `10` | Dedup sensitivity (0-256, lower = more aggressive) |
| `analysis.batch_size` | `10` | Frames per Vision API call |
| `report.author` | `Tentacular` | Author name in report |
| `report.style` | `narrative` | "narrative" or "structured" |
| `audit.enabled` | `true` | Enable editorial audit |
| `audit.min_quality_score` | `7` | Minimum quality score (1-10) |

## Secrets

- `anthropic.api_key` — Claude API key for Vision analysis and report synthesis
- `slack.webhook_url` — Slack webhook for notifications (optional)

## Cost Estimate

For a 1-hour video at 1 FPS, approximately 60 unique frames after dedup:

| Operation | Estimated Cost |
|-----------|---------------|
| Frame analysis (Sonnet, 6 batches) | ~$0.24 |
| Report synthesis | ~$0.02 |
| Editorial audit | ~$0.05 |
| **Total per run** | **~$0.31** |

## Usage

```bash
tntc scaffold init video-content-analyzer my-video-analyzer
cd ~/tentacles/my-video-analyzer
tntc deploy
tntc run --input '{"video_url": "https://example.com/talk.mp4", "title": "GTC Keynote"}'
```

## Source

Scaffold source: [`quickstarts/video-content-analyzer/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/video-content-analyzer)
