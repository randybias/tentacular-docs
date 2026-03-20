---
title: Security
description: Defense-in-depth security model and contract-driven zero-trust architecture
---

## Contract-Driven Security

The workflow contract is the central design primitive and the enforceable security policy. A single `contract.dependencies` block in the workflow YAML declares every external service a tentacle needs — protocol, host, port, and authentication type. From this one declaration, the system automatically derives multiple independent security layers.

### What the Contract Drives

- **Deno runtime permissions** — The TypeScript engine is locked to `--allow-net=<declared hosts:ports>` only. No undeclared network access is possible at the runtime level.
- **Kubernetes NetworkPolicy** — Default-deny ingress/egress is applied to every tentacle namespace. Egress rules are generated per-dependency (HTTPS on :443, PostgreSQL on :5432, NATS on :4222, etc.). Only declared destinations are reachable at the network level.
- **Secrets validation** — Every secret referenced in the contract must exist in the secrets file before deployment proceeds. No dangling references, no missing credentials at runtime.
- **Dynamic targets** — For dependencies resolved at runtime (e.g., RSS feeds from multiple hosts), the contract supports CIDR-based rules with explicit port constraints, providing controlled flexibility without opening the network wide.

The contract is not documentation — it is the enforceable security policy. An agent authors a contract, and the platform enforces it at multiple independent layers. There is no way to access a resource that wasn't declared, even if the node code attempts to.

## Five Layers of Defense-in-Depth

Security boundaries from innermost to outermost:

### Layer 1: Distroless Base Image

Container uses `denoland/deno:distroless` — no shell, no package manager, no debugging tools. Attack surface is limited to the Deno runtime binary.

### Layer 2: Deno Permission Locking

When a tentacle declares `contract.dependencies`, the K8s Deployment manifest overrides the ENTRYPOINT with scoped flags. The `DeriveDenoFlags()` function generates:

```
--allow-net=api.openai.com:443,hooks.slack.com:443,0.0.0.0:8080
--allow-read=/app,/var/run/secrets
--allow-write=/tmp
--allow-env=DENO_DIR,HOME,TELEMETRY_SINK
```

No subprocess, FFI, or unrestricted file system access beyond the declared paths.

### Layer 3: gVisor Sandbox

Pods run with `runtimeClassName: gvisor`. gVisor intercepts syscalls via its application kernel (Sentry), preventing direct host kernel access. Even if a container escape is achieved, the attacker lands in gVisor's sandbox, not the host.

gVisor provides **pod-level isolation**, not per-node isolation. All nodes in a tentacle execute within the same Deno process and share this gVisor boundary.

### Layer 4: Kubernetes SecurityContext

```yaml
automountServiceAccountToken: false  # No SA token exposed

securityContext:                    # Pod level
  runAsNonRoot: true
  runAsUser: 65534                  # nobody
  seccompProfile:
    type: RuntimeDefault

securityContext:                    # Container level
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

The service account token is not mounted, preventing compromised pods from authenticating to the K8s API. The `/tmp` emptyDir volume has `sizeLimit: 512Mi` to prevent disk exhaustion.

### Layer 5: Network Policy

Default-deny ingress and egress is applied to every tentacle namespace. Egress rules are generated per-dependency from the contract. Only declared destinations are reachable. Control-plane ingress from the MCP server (10.0.0.0/8:8080) is allowed for trigger execution.

## Secrets Model

Secrets are mounted as **read-only files** at `/app/secrets` from a K8s Secret resource. They are never exposed as environment variables — env vars are visible in `kubectl describe pod`, process listings, and crash dumps.

See [Secrets guide](/tentacular-docs/guides/secrets/) for the full cascade and provisioning model.

## ESM Module Proxy

Nodes cannot access public TypeScript module repositories. All imports route through a local, in-cluster ESM module proxy (`esm.sh` via the `tentacular-support` namespace). This:

- Prevents supply-chain attacks via compromised modules
- Enables package pinning and version control
- Sets the stage for air-gapped deployment in the future

## Multi-Tenancy and RBAC

When multiple teams share a Kubernetes cluster, contract-driven sandboxing protects tentacles from the outside world — but it doesn't control which *users* can access which *tentacles*. That's where multi-tenancy and RBAC come in.

Tentacular implements a POSIX-like permission model where namespaces are directories and tentacles are files. Every namespace and every tentacle has an owner (from OIDC identity), a group (from the IdP), and a mode string (e.g., `rwxr-x---`) controlling read, write, and execute access for owner, group members, and others.

### The AAA Framework

- **Authentication** — OIDC via Keycloak (with brokered IdPs like Google SSO). JWT carries cryptographic identity and group membership. Bearer-token path for admin automation.
- **Authorization** — Two-layer RBAC enforcement at the MCP server. Namespace permissions gate access to the tenant boundary; tentacle permissions gate individual resources. Five presets from `private` (owner-only) to `public-read` (visible to all tenants).
- **Accounting** — Every deploy stamps identity (who, when, via which agent). Every permission change is auditable through Kubernetes annotations. Structured logging captures every authorization decision.

### How It Integrates with Defense-in-Depth

Multi-tenancy adds a **Layer 0** to the defense-in-depth model above. Before a tentacle's contract-driven sandboxing even comes into play, the RBAC layer determines whether the caller is allowed to see, modify, or execute the tentacle at all. The layers work independently — a user who passes the RBAC check still faces all five sandbox layers.

For the full permission model, evaluator rules, CLI commands, and Kubernetes admin guide, see the [Multi-Tenancy and Access Control guide](/tentacular-docs/guides/authorization/).

## Audit Capabilities

`tntc audit <name>` runs three security checks via the MCP server:

- **RBAC audit** — verifies the tentacle's service account has minimal permissions
- **NetworkPolicy audit** — verifies default-deny is in place with contract-derived rules
- **PSA audit** — verifies Pod Security Admission labels are set to `restricted`

## Why This Matters for Agents

Agents creating and deploying code present unique security challenges. Without a structured security model:

- Prompt injection could cause an agent to write code that accesses unauthorized resources
- Data exfiltration through seemingly innocent network calls becomes trivial
- There's no way to audit what a deployed workflow is permitted to do

The contract model means that even if an agent is compromised, the deployed tentacle can only do what the contract declares. The straight jacket is applied at deployment time and cannot be modified at runtime.
