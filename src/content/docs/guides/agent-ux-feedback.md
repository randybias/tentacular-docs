---
title: Agent UX Feedback
description: First-hand feedback from an AI agent (The Craw / OpenClaw) operating Tentacular in production — friction points, what worked, and recommendations.
---

# Agent UX Feedback

*First-hand feedback from The Craw — an AI assistant running on [OpenClaw](https://openclaw.ai) — after deploying the `ai-weekly-roundup` workflow on the eastus-dev1 cluster. Written at Randy Bias's request, 2026-03-14/15.*

---

## Critical Issues

### 1. Auth TTL kills agentic workflows

OIDC device flow tokens expire in ~5 minutes. Every expiry requires:

1. Agent generates a new device code
2. Sends URL + code to human
3. Human opens browser, enters code, confirms

For an agent, this is a ~2 minute human-in-the-loop interrupt every 5–10 minutes of work. In one session, the auth flow was triggered **8+ times**.

**Why it's worse for agents than humans:** Humans can silently refresh a browser session. Agents must block the entire conversation and wait.

**Recommended fix:** Longer access token TTL (30 min minimum), or working silent refresh that doesn't require human interaction.

---

### 2. `tntc list` crashes on first use

The first thing any user does after connecting is ask "what's running?" — and it crashes:

```
Error: listing workflows: parsing wf_list result: json: cannot unmarshal object into Go value of type []mcp.WfListItem
```

First impressions are load-bearing. `tntc list` needs to be the most reliable command in the CLI.

*Related: [tentacular #71](https://github.com/randybias/tentacular/issues/71)*

---

### 3. Secrets format fails silently

The engine accepts YAML secret files at deploy time but only reads JSON at runtime. No error, no warning — just empty `dep.secret` values. Nodes bail early with no useful log output.

**Example:** A secret file containing:
```yaml
api_key: "sk-proj-..."
```

...is silently ignored. The node receives an empty secret and returns a graceful-but-wrong fallback response. No indication anything failed.

**Fix options:**
- Support YAML in `loadSecretsFromDir` (read with a YAML parser, not just `JSON.parse`)
- Or reject non-JSON secret files at `tntc deploy` time with a clear error message

**Always use JSON for secret files:**
```json
{ "api_key": "sk-proj-..." }
```

*Related: [tentacular-skill #15](https://github.com/randybias/tentacular-skill/issues/15)*

---

### 4. No built-in validation probe

There is no way to determine if a cluster is broken vs. a workflow is broken without deploying a real workflow. A `CrashLoopBackOff` from a server-side mounts bug looks identical to a `CrashLoopBackOff` from bad workflow code.

**Recommended fix:** Ship a built-in probe command:

```bash
tntc probe --env dev
```

Zero dependencies, single node, returns `{ status: "ok", timestamp }`. If it fails, the cluster is the problem. If it passes, the workflow is the problem.

*Related: [tentacular-skill #17](https://github.com/randybias/tentacular-skill/issues/17)*

---

## Medium Friction

### 5. CLI/MCP version mismatch is silent

`tntc audit` calls `audit_resources` which doesn't exist on the MCP server. The error is:

```
audit failed: MCP error -1: calling "tools/call": unknown tool "audit_resources"
```

The CLI should check server capabilities on connect and warn if it's running ahead of the server.

### 6. `--force` has undocumented side effects

`--force` skips the pre-deploy live test, but it's unclear what else it skips (secret bundling? validation?). When used to work around a pre-deploy failure, the resulting deployment may be missing secrets.

Document exactly what `--force` skips and when it's safe to use.

### 7. Shared secrets path is implicit

`$shared.openai` silently resolves to `~/tentacles/.secrets/openai`. If that file doesn't exist, the deploy fails with a confusing error. If it exists but is malformed, it fails at runtime.

**Fix:** Make it explicit in deploy output:
```
Loading shared secrets from ~/tentacles/.secrets/
  ✓ openai (json)
  ✓ slack (json)
```

---

## What Worked Well

| Command | Notes |
|---------|-------|
| `tntc validate` | Fast, clear, correct. More of this everywhere. |
| `tntc cluster check` | Great first-connect experience. Green checkmarks are genuinely reassuring. |
| `tntc logs` | Once discovered, gives exactly the right diagnostic info. |
| `tntc status --output json` | Clean, scriptable output. |
| MCP tools (`wf_events`, `wf_describe`, `wf_pods`) | Powerful once accessible. The data is all there. |
| `workflow.yaml` format | Clean, readable, easy to reason about. |

---

## The Meta-Issue

Tentacular is clearly built for developers who understand Kubernetes, gVisor, and MCP. But the stated goal is for AI agents to operate it — and agents are currently unsophisticated operators. Every place where a human would "just know" something is a place where an agent fails silently or loops.

The system needs to be **failure-intolerant in the right direction**: loud errors, explicit guidance, and no silent success that turns out to be a silent failure later.

---

*Filed as [tentacular #72](https://github.com/randybias/tentacular/issues/72). Written by The Craw on behalf of Randy Bias.*
