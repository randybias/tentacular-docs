---
title: Your First Tentacle
description: Step-by-step walkthrough of building a tentacle from scratch
---

This guide walks through building a tentacle from scratch — from defining the workflow to deploying it on Kubernetes.

## Prerequisites

- `tntc` CLI installed and configured
- A Kubernetes cluster with the MCP server installed
- Docker (for building images)

## Steps

### 1. Scaffold the Project

```bash
tntc init my-digest
cd my-digest
```

This creates:
```
my-digest/
├── workflow.yaml
├── nodes/
│   └── hello.ts
└── tests/
    └── fixtures/
        └── hello.json
```

### 2. Define the Workflow

Edit `workflow.yaml` to describe your tentacle's DAG:

```yaml
name: my-digest
version: "1.0"
description: "Fetch data and create a summary digest"

triggers:
  - type: manual
  - type: cron
    name: daily
    schedule: "0 9 * * *"

nodes:
  fetch:
    path: ./nodes/fetch.ts
    description: "Fetches recent repos from the GitHub API"
  summarize:
    path: ./nodes/summarize.ts
    description: "Summarizes repo metadata into a digest"
  notify:
    path: ./nodes/notify.ts
    description: "Sends the digest to Slack via webhook"

edges:
  - from: fetch
    to: summarize
  - from: summarize
    to: notify

config:
  timeout: 60s
  retries: 2
  max_items: 20

contract:
  version: "1"
  dependencies:
    github-api:
      protocol: https
      host: api.github.com
      port: 443
      auth:
        type: bearer-token
        secret: github.token
    slack-webhook:
      protocol: https
      host: hooks.slack.com
      port: 443
      auth:
        type: bearer-token
        secret: slack.webhook_url
```

### 3. Write the Nodes

**`nodes/fetch.ts`** — Fetch data from GitHub:

```typescript
import type { Context } from "tentacular";

export default async function run(ctx: Context, input: unknown) {
  const gh = ctx.dependency("github-api");
  const resp = await gh.fetch!("/users/randybias/repos?per_page=10&sort=updated", {
    headers: { "Authorization": `Bearer ${gh.secret}` },
  });
  if (!resp.ok) throw new Error(`GitHub API: ${resp.status}`);
  const repos = await resp.json();
  ctx.log.info(`Fetched ${repos.length} repos`);
  return { repos };
}
```

**`nodes/summarize.ts`** — Process the data:

```typescript
import type { Context } from "tentacular";

export default async function run(ctx: Context, input: { repos: any[] }) {
  const maxItems = (ctx.config.max_items as number) ?? 20;
  const summary = input.repos.slice(0, maxItems).map((r: any) => ({
    name: r.name,
    description: r.description,
    stars: r.stargazers_count,
    updated: r.updated_at,
  }));
  ctx.log.info(`Summarized ${summary.length} repos`);
  return { summary, generated: new Date().toISOString() };
}
```

**`nodes/notify.ts`** — Send the result:

```typescript
import type { Context } from "tentacular";

export default async function run(ctx: Context, input: { summary: any[]; generated: string }) {
  const slack = ctx.dependency("slack-webhook");
  const text = `*Repo Digest (${input.generated})*\n` +
    input.summary.map((r: any) => `- *${r.name}*: ${r.description ?? "no description"}`).join("\n");

  const resp = await slack.fetch!("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${slack.secret}`,
    },
    body: JSON.stringify({ text }),
  });
  ctx.log.info(`Slack notification: ${resp.status}`);
  return { delivered: resp.ok };
}
```

### 4. Create Test Fixtures

**`tests/fixtures/fetch.json`:**
```json
{
  "input": {},
  "expected": { "repos": [] }
}
```

**`tests/fixtures/summarize.json`:**
```json
{
  "input": { "repos": [{"name": "test", "description": "A test repo", "stargazers_count": 5, "updated_at": "2026-01-01"}] },
  "config": { "max_items": 20 },
  "expected": { "summary": [{"name": "test", "description": "A test repo", "stars": 5, "updated": "2026-01-01"}] }
}
```

**`tests/fixtures/notify.json`:**
```json
{
  "input": { "summary": [{"name": "test", "description": "A test"}], "generated": "2026-01-01" },
  "expected": { "delivered": true }
}
```

### 5. Set Up Secrets

```bash
tntc secrets init
```

Edit `.secrets.yaml`:
```yaml
github:
  token: "ghp_your_token_here"
slack:
  webhook_url: "https://hooks.slack.com/services/your/webhook/url"
```

### 6. Test Locally

```bash
tntc validate
tntc test
tntc dev  # starts local server
```

### 7. Deploy

```bash
tntc build --push
tntc deploy
tntc status my-digest
```

### 8. Run

```bash
tntc run my-digest
tntc logs my-digest --tail 20
```

## Verification

- `tntc validate` reports no errors
- `tntc test` passes all fixtures
- `tntc status my-digest` shows healthy deployment
- `tntc run my-digest` returns expected JSON output
- `tntc audit my-digest` shows clean security audit

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `cycle detected` | Edges form a loop | Check edge definitions for circular dependencies |
| `node not found: X` | Edge references undefined node | Ensure node names match between `nodes:` and `edges:` |
| Auth errors on deploy | Missing or incorrect secrets | Run `tntc secrets check` |
| `NetworkPolicy deny` | Contract missing dependency | Add the dependency to `contract.dependencies` |
