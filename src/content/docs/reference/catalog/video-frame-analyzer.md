---
title: "Video Frame Analyzer"
description: "Extract frames from video using an ffmpeg sidecar and analyze with Claude Vision"
---

| Field | Value |
|-------|-------|
| **Name** | `video-frame-analyzer` |
| **Category** | data-pipeline |
| **Complexity** | moderate |
| **Tags** | sidecar, ffmpeg, video-processing, llm-synthesis, shared-volume |
| **Author** | randybias |
| **Min Version** | 0.7.0 |

## Description

Extract frames from a video using an ffmpeg sidecar and analyze them with Claude Vision. This is the simpler sidecar scaffold for video processing, demonstrating the **shared volume** data flow pattern. The engine stages the input video, the sidecar extracts frames, and the engine reads the results -- all via an emptyDir volume mounted at `/shared`.

## Sidecar

This scaffold includes a sidecar container:

| Field | Value |
|-------|-------|
| **Name** | `ffmpeg` |
| **Image** | `ghcr.io/randybias/tentacular-ffmpeg-sidecar:v1.0.0` |
| **Port** | `9000` |
| **Health check** | `GET /health` |
| **Communication** | Shared emptyDir volume at `/shared/` |

The ffmpeg sidecar uses a custom image that wraps ffmpeg with an HTTP API. The engine writes the input video to `/shared/input/video.mp4`, calls the sidecar's `/extract-frames` endpoint, and reads extracted JPEG frames from `/shared/output/`.

Contrast with `doc-converter` which uses pure HTTP body data flow for smaller text payloads.

## DAG Structure

```
ingest-video → extract-frames → analyze-frames
```

| Node | Purpose |
|------|---------|
| `ingest-video` | Fetch video from URL and stage to `/shared/input/video.mp4` |
| `extract-frames` | Call ffmpeg sidecar to extract frames at configured FPS |
| `analyze-frames` | Send frames to Claude Vision as base64-encoded images for analysis |

## Triggers

- `manual` only

## Dependencies

| Service | Type | Required |
|---------|------|----------|
| Anthropic API | External | Yes (Vision analysis) |
| Video source | External | Yes |

## Config

| Key | Default | Description |
|-----|---------|-------------|
| `timeout` | `300s` | Per-node timeout |
| `retries` | `0` | No retries |
| `video_url` | `https://example.com/sample.mp4` | URL of video to analyze |
| `fps` | `1` | Frames per second to extract |
| `output_format` | `jpg` | Frame output format |
| `max_frames` | `10` | Maximum number of frames to analyze |

## Secrets

- `anthropic.api_key` — Claude API key for Vision analysis

## Usage

```bash
tntc scaffold init video-frame-analyzer
tntc scaffold init video-frame-analyzer my-custom-name
tntc scaffold info video-frame-analyzer
```

## Source

Scaffold source: [`quickstarts/video-frame-analyzer/`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/video-frame-analyzer)
