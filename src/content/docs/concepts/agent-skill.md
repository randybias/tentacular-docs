---
title: Agent Skill
description: How the Tentacular Agent Skill enables AI agents to build and manage tentacles
---

The Tentacular Agent Skill is the instruction set that teaches AI agents (Claude Code, Codex, Gemini, etc.) how to design, build, test, and deploy tentacles. It is the bridge between natural language instructions from humans and the structured workflow artifacts that Tentacular executes.

## What Is the Agent Skill?

The skill is a comprehensive markdown document (`SKILL.md`) that lives in the [tentacular-skill](https://github.com/randybias/tentacular-skill) repository. When loaded by an AI agent, it provides:

- **Architecture understanding** — how Tentacular works, the three components (CLI, MCP server, Deno engine)
- **CLI command reference** — every `tntc` command with flags and examples
- **MCP tool catalog** — all 32+ tools for cluster operations, organized by function
- **Node development patterns** — TypeScript conventions, Context API, auth patterns
- **Contract design** — how to declare dependencies, security implications
- **Testing workflow** — fixtures, mock context, pipeline tests, live tests
- **Deployment pipeline** — build, deploy, verify, iterate
- **Troubleshooting** — common issues and resolutions

## How an Agent Uses the Skill

When a human says "build me a tentacle that monitors our API endpoints and alerts Slack when they're down," the agent follows this workflow:

### 1. Requirements Gathering

The agent asks clarifying questions:
- What endpoints to monitor?
- What Slack channel?
- How often to check?
- What credentials are needed?

### 2. Cluster Profiling

The agent checks the target cluster's capabilities:
```
→ tntc cluster profile --env dev
```
This tells the agent what's available: gVisor, NetworkPolicy support, exoskeleton services, etc.

### 3. Contract Design

The agent creates the workflow contract first — declaring all external dependencies:
```yaml
contract:
  version: "1"
  dependencies:
    slack-webhook:
      protocol: https
      host: hooks.slack.com
      port: 443
      auth:
        type: webhook-url
        secret: slack.webhook_url
    probe-targets:
      type: dynamic-target
      protocol: https
      cidr: "0.0.0.0/0"
      dynPorts:
        - "443/TCP"
        - "80/TCP"
```

### 4. DAG Design and Node Implementation

The agent designs the node graph and writes TypeScript nodes:
- Each node is a single async function with typed input/output
- Nodes use `ctx.dependency()` for contract-declared services
- Data flows between nodes as JavaScript objects

### 5. Testing

```
→ tntc test                 # node-level fixture tests
→ tntc test --pipeline      # full DAG end-to-end
```

### 6. Deployment

```
→ tntc build --push
→ tntc deploy --env dev
→ tntc status <name> --detail
→ tntc run <name>
```

## CLI vs MCP: Two Interfaces

The skill teaches agents to use the right interface for each task:

| Task | Interface | Why |
|------|-----------|-----|
| Scaffold, validate, test, build | `tntc` CLI | Local operations, no cluster needed |
| Deploy, status, logs, run | `tntc` CLI (via MCP) | CLI wraps MCP calls |
| Query cluster, manage namespaces | MCP tools directly | Agent sessions with tool access |
| Health checks, audits | Either | Both work |

## Workspace Conventions

The skill establishes standard conventions for workspace layout. Tentacles are organized by enclave:

```
~/tentacles/                           # All tentacles, organized by enclave
├── mktg-team/                         #   enclave directory
│   ├── price-monitor/                 #     a tentacle
│   │   ├── workflow.yaml
│   │   ├── nodes/
│   │   ├── tests/fixtures/
│   │   ├── .secrets.yaml              #   local secrets (gitignored)
│   │   └── .secrets.yaml.example      #   secrets template (committed)
│   └── alert-dispatcher/              #     another tentacle
├── infra-alerts/                      #   another enclave
│   └── node-health/
└── .gitignore
```

When using `--enclave`, the scaffold command creates tentacles in the right place:
```bash
tntc scaffold init uptime-tracker my-monitor --enclave mktg-team
# Creates ~/tentacles/mktg-team/my-monitor/
```

## Contract-First Design

The skill emphasizes that the **contract drives everything**. Agents are taught to:

1. Design the contract before writing node code
2. Declare every external dependency explicitly
3. Understand that the contract becomes the security policy
4. Use `tentacular-*` prefixed dependencies for exoskeleton services
5. Use `dynamic-target` type when hosts are resolved at runtime

## Drift Detection

The skill teaches agents about contract drift — when node code accesses services not declared in the contract:

| Violation Type | Meaning |
|----------------|---------|
| `direct-fetch` | Node uses legacy `ctx.fetch()` instead of `ctx.dependency()` |
| `direct-secrets` | Node accesses `ctx.secrets` directly |
| `undeclared-dependency` | Node calls `ctx.dependency()` for a name not in the contract |
| `dead-declaration` | Contract declares a dependency no node uses |

Drift is detected during `tntc test` via the mock context which records all access patterns.

## The Skill as Documentation

The skill serves dual purposes:
1. **Agent instruction set** — loaded into agent context for workflow creation
2. **Living reference** — the most complete, up-to-date documentation of Tentacular's capabilities

The skill repository (`tentacular-skill/SKILL.md`) remains the canonical source. It is linked from, not duplicated in, this documentation site.

**Full skill reference:** [SKILL.md on GitHub](https://github.com/randybias/tentacular-skill/blob/main/SKILL.md)
