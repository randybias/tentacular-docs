---
title: The Kraken Slack Bot
description: Deploying and configuring The Kraken — a Slack bot that provides a natural-language interface to Tentacular
---

The Kraken is a Slack bot that lets users interact with Tentacular through natural language in Slack channels and threads. Instead of running CLI commands or calling MCP tools directly, users talk to an AI assistant that handles cluster operations, tentacle management, scheduled tasks, and general-purpose work.

## Architecture

The Kraken runs as a single Node.js process that uses the Claude Agent SDK in-process — no Docker-in-Docker sidecar, no container builds, no cold-start latency. Slack messages flow through a polling loop into the agent manager, which calls the SDK's `query()` function directly.

```
Slack (Socket Mode)
        |
  Slack Bolt event handlers
        |
  Orchestrator (message loop, SQLite)
        |
  Agent Manager — Claude Agent SDK query()
        |
  +----------------+------------------+
  |                                   |
  MCP: kraken (stdio)          MCP: tentacular (HTTP)
  send_message, tasks          wf_list, ns_list, wf_run, ...
```

The agent has access to two MCP servers:

- **kraken** — a stdio-based server spawned per invocation, providing Slack-specific tools (send messages, schedule/manage tasks)
- **tentacular** — the in-cluster Tentacular MCP server over HTTP, providing all standard cluster operations

## Prerequisites

- A Kubernetes cluster with the [Tentacular MCP server](/tentacular-docs/guides/mcp-server-setup/) installed
- A Slack workspace where you can create a Slack app
- Claude authentication (Anthropic API key or Claude subscription OAuth token)

## Slack App Setup

1. Create a new Slack app at [api.slack.com/apps](https://api.slack.com/apps) using the "From an app manifest" option

2. Enable **Socket Mode** (Settings > Socket Mode > Enable)

3. Generate an **App-Level Token** with the `connections:write` scope — this is the `SLACK_APP_TOKEN` (`xapp-...`)

4. Under **OAuth & Permissions**, add these Bot Token Scopes:
   - `app_mentions:read` — detect @mentions
   - `channels:history` — read channel messages
   - `channels:read` — list channels
   - `chat:write` — send messages
   - `groups:history` — read private channel messages
   - `groups:read` — list private channels
   - `users:read` — resolve user names

5. Under **Event Subscriptions**, subscribe to these bot events:
   - `app_mention` — when someone @mentions the bot
   - `message.channels` — messages in public channels
   - `message.groups` — messages in private channels

6. Install the app to your workspace. Copy the **Bot User OAuth Token** — this is the `SLACK_BOT_TOKEN` (`xoxb-...`)

## Kubernetes Deployment

The Kraken deploys as a single pod with a PVC for persistent data (SQLite database, group folders, session transcripts).

### Using Helm

```bash
helm install thekraken2 ./charts/thekraken2 \
  --set secrets.slackBotToken=xoxb-... \
  --set secrets.slackAppToken=xapp-... \
  --set secrets.anthropicApiKey=sk-ant-... \
  --set mcp.url=http://tentacular-mcp:8080 \
  --set mcp.token=<bearer-token>
```

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SLACK_BOT_TOKEN` | Yes | — | Slack Bot User OAuth Token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | Yes | — | Slack App-Level Token for Socket Mode (`xapp-...`) |
| `ANTHROPIC_API_KEY` | One required | — | Anthropic API key for Claude |
| `CLAUDE_CODE_OAUTH_TOKEN` | One required | — | Claude subscription OAuth token |
| `ASSISTANT_NAME` | No | `Kraken` | Trigger word (users type `@Kraken`) |
| `TENTACULAR_MCP_URL` | No | — | URL of the in-cluster Tentacular MCP server |
| `TENTACULAR_MCP_TOKEN` | No | — | Bearer token for MCP server authentication |
| `MAX_CONCURRENT_AGENTS` | No | `5` | Maximum parallel agent invocations |
| `AGENT_IDLE_TIMEOUT` | No | `1800000` | Idle timeout before closing an agent session (ms) |
| `TZ` | No | system | Timezone for scheduled tasks |

Either `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` must be set. The MCP variables are optional but required for cluster operations.

### Persistent Storage

The Helm chart provisions a 1Gi PVC mounted at `/app/data` containing:

- `store/messages.db` — SQLite database (messages, sessions, tasks, groups)
- `groups/` — per-group folders with CLAUDE.md memory files
- `data/ipc/` — file-based IPC between agent tools and the host
- `data/sessions/` — Claude session transcripts (JSONL)

## Using The Kraken

### Trigger Word

Messages must start with the trigger word (default: `@Kraken`):

```
@Kraken list all deployed tentacles
@Kraken what's the health status of the ai-news-roundup tentacle?
@Kraken schedule a daily cluster health check at 9am
```

### Thread Support

The Kraken supports Slack threads with isolated conversation contexts. Each thread gets its own Claude session, so context from one thread does not leak into another. Reply in a thread and the bot responds in-thread. Threads run concurrently with channel-level conversations.

### Scheduled Tasks

The agent can schedule recurring or one-time tasks:

```
@Kraken remind me every Monday at 9am to review the weekly metrics
@Kraken at 5pm today, check cluster health and report any issues
@Kraken every hour, check if any tentacles have red health status
```

Tasks support three schedule types: `cron` (recurring at specific times), `interval` (recurring every N milliseconds), and `once` (run at a specific time). All times are in the configured local timezone.

### Group Registration

Invite the bot to a Slack channel, then register it from the main channel:

```
@Kraken add group "engineering" for channel C0123456789
```

Each registered group gets its own folder with isolated CLAUDE.md memory. The main group has elevated privileges — it can register new groups, schedule tasks for any group, and write to global memory.

## Memory System

The Kraken uses a hierarchical CLAUDE.md memory system:

| Level | Location | Scope |
|-------|----------|-------|
| Global | `groups/global/CLAUDE.md` | Loaded for all non-main groups |
| Group | `groups/{folder}/CLAUDE.md` | Per-channel memory |
| Files | `groups/{folder}/*.md` | Documents created by the agent |

When users say "remember this," the agent writes to the group's CLAUDE.md. Global memory (shared across all channels) can only be written by the main group.

## Verifying the Deployment

1. **Health check**: The pod exposes `/healthz` on port 3001 for Kubernetes liveness and readiness probes

2. **Slack connection**: After the pod starts, check logs for `Slack channel connected`

3. **Test message**: Send `@Kraken hello` in a registered channel — the bot should respond

4. **MCP connection**: Send `@Kraken list all deployed tentacles` — if the Tentacular MCP server is configured, the bot should return results from the cluster

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Bot not responding | Pod not running | Check `kubectl logs` and pod status |
| Bot not responding | Channel not registered | Register via main group |
| `session not found` in logs | MCP server restarted | Pod will reconnect automatically on next invocation |
| Agent timeout | Long-running task | Increase `AGENT_TIMEOUT` env var |
| Messages not triggering | Wrong trigger word | Verify `ASSISTANT_NAME` matches the @mention |
