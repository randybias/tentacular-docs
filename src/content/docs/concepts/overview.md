---
title: Overview
description: What Tentacular is, why it exists, and how it differs from other systems
---

## What Is Tentacular?

Tentacular is a **Secure Workflows as a Service** platform for agentic teams. It lets AI agents build, deploy, and manage secure, durable, autonomic workflows — called **tentacles** — inside team-scoped workspaces called **enclaves**. Think of it as enshrining AI agent work into a sort of "muscle memory": once an agent builds a tentacle, it runs autonomously, efficiently, and safely — without burning tokens on repetitive tasks.

An **enclave** is the primary organizational unit. Each enclave is a self-contained workspace that binds a Slack channel, a Kubernetes namespace, shared infrastructure services, and team membership into a single governed unit. Teams work in their Slack channel; Tentacular handles the cluster underneath.

Traditional workflow systems are not agentic-friendly. AI agents performing repetitive tasks are extremely token-inefficient, using large amounts of tokens to perform the same work over and over. Most importantly, AI agents building reusable flows and enshrining them into long-term muscle memory provide unique opportunities in terms of hardening and securing those flows to make them highly resistant to prompt injection and data exfiltration attacks.

## How It Works

Tentacular provides five key components:

1. **Enclaves** — team-scoped workspaces with automatic provisioning of shared infrastructure (Postgres, S3, and optionally NATS/SPIRE)
2. **A hardened workflow plane** for hosting and running tentacles on Kubernetes
3. **An in-cluster secure control plane** (MCP server) for managing deployed tentacles
4. **A set of reusable scaffold templates**, including common patterns as starting points
5. **An Agent Skill** that allows a general-purpose agent such as Claude Code, Codex, or Gemini to design, build, and deploy tentacles to the workflow plane

Another way to think of this is a mechanism for agents to dynamically build their own n8n-style workflows, without the n8n cognitive overhead or framework. The outcome is a more secure, agentic-friendly workflow system with high levels of reusability and a tiny attack surface.

## How It Differs from Workflow Systems

This system is designed for AI agents, not humans. Prior workflow systems are human-centric, focusing on GUIs and dashboards, interactive management, and providing a library of "nodes" that provide specific functionality such as HTTP, SQL, or Email actions. Tentacular provides no nodes by default. Instead, agents code up a directed acyclic graph (DAG), building their own custom nodes each time as needed to provide a custom workflow. This means that a workflow can be any kind of structured workflow, without constraint. It also means that the only code in the workflow is the code that you need, dramatically reducing the code attack surface.

The process works like this:

- A human instructs an agent using natural language what kind of tentacle they wish to build
- The agent, using the Tentacular Agent Skill, works through a process of guiding the human through details of the workflow, including credentials necessary for it to work, similarly to how AI-assisted ("vibe") coding works today
- Once a plan is in place, the agent creates a **workflow contract** that describes the DAG, its nodes, their dependencies, and all of the components necessary to build the tentacle
- It then builds, tests, and deploys the new tentacle to the target Kubernetes cluster
- The workflow contract, having all of the information necessary about what resources are being accessed, has a dynamic "straight jacket" applied to it on deployment such that it can only access the resources that were specified — all other access is locked down completely in a "zero trust" manner

A tentacle can then be iterated on (updated and re-deployed), managed, and audited.

## How It Differs from Programmatic Workflow Systems

Systems like Dagger, Tekton, and ArgoCD/Flux are designed for CI/CD pipelines authored by human DevOps engineers. They assume a human is writing and maintaining pipeline definitions, and they optimize for that workflow: YAML/CUE authoring, manual debugging, and integration with git-based deployment flows.

Tentacular differs in three fundamental ways:

1. **Agent-authored, not human-authored.** Tentacles are designed to be created, modified, and maintained by AI agents. The contract-first model gives agents a structured artifact to reason about, rather than requiring them to navigate complex configuration schemas.
2. **Security-constrained by contract.** CI/CD systems generally run with broad permissions (cluster-admin, registry write, artifact push). Tentacles are sealed at deployment — each runs with only the permissions its contract declares, enforced at runtime, network, and kernel levels.
3. **Purpose-built business logic, not build pipelines.** Tentacular workflows are durable, long-running business automations (news digests, PR reviews, health monitors), not ephemeral build-and-deploy jobs. They persist, run on schedules, respond to events, and maintain state.

## How It Differs from AI Assistants

General AI assistants such as OpenClaw provide high levels of value by having no straight jacket at all. Responding to natural language instructions from their human owners, they can build their own jobs, triggered by cron, a heartbeat, or webhooks, in a very similar manner to a traditional n8n workflow. The primary difference is that both traditional code ("events" in OpenClaw parlance) or sandboxed agents (an "agent turn") can be triggered. An agent turn is an arbitrary usage of an AI agent without a straight jacket and little or no oversight. Because we don't know in advance what that agent might be doing, hardening or locking down its process is impossible.

Tentacular is, in fact, an ideal companion for a hardened AI assistant system. A future "openclaw for enterprise" might restrict the creation of workflows to tentacles only, allowing for durable workflows to be deployed with confidence that you are complying with proper governance and oversight rules.

## Key Terminology

Throughout the Tentacular documentation, **tentacle** is used in favor of "workflow." The term "workflow" may appear when contrasting with traditional systems, but the Tentacular-native term is always **tentacle**. See the [Glossary](/tentacular-docs/concepts/glossary/) for all platform-specific terms.
