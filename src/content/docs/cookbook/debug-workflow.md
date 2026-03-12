---
title: Debug a Tentacle
description: Diagnosing and fixing issues with deployed tentacles
---

## Goal

Diagnose and resolve issues with a tentacle that isn't working as expected.

## Prerequisites

- `tntc` CLI configured with MCP access
- A deployed tentacle exhibiting issues

## Steps

### 1. Check Health Status

```bash
tntc status my-tentacle --detail
```

This shows:
- Deployment readiness (replicas, conditions)
- Image and runtime class
- Pod status and recent events
- Health classification (Green/Amber/Red)

### 2. Read Logs

```bash
tntc logs my-tentacle --tail 50
```

Look for:
- Startup errors (missing modules, config issues)
- Runtime errors (network failures, auth errors, node crashes)
- Timeout messages

### 3. Trigger a Manual Run

```bash
tntc run my-tentacle --timeout 60s
```

The response includes execution results or error details.

### 4. Run Security Audit

```bash
tntc audit my-tentacle
```

Checks:
- **RBAC** — service account permissions
- **NetworkPolicy** — egress rules match contract
- **PSA** — Pod Security Admission labels

### 5. Check Health Endpoint

If the tentacle is running but producing wrong results, query the detailed health endpoint via MCP:

The `wf_health` tool classifies tentacles as:
- **Green** — running, low error rate
- **Amber** — running but elevated error rate or last run failed
- **Red** — not running or very high error rate

### 6. Validate Locally

```bash
tntc validate
tntc test
tntc dev  # test locally with hot-reload
```

## Verification

- Issue is identified in logs or health status
- Fix is applied and verified locally with `tntc test`
- Redeployment resolves the issue (`tntc deploy`)
- `tntc status` shows Green health

## Failure Modes

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| Pod `CrashLoopBackOff` | Node throws on startup | Check logs for the exception, fix node code |
| `connection refused` to external API | NetworkPolicy blocking | Verify dependency in contract, check `tntc audit` |
| `403 Forbidden` from API | Wrong or expired secret | Update `.secrets.yaml`, redeploy |
| Timeout errors | Slow external service | Increase `config.timeout`, add retries |
| `module not found` | Import path error | Check node paths in workflow.yaml |
| Stale code after deploy | ConfigMap not updated | Force a rollout: undeploy and redeploy |
| Health shows Amber/Red | Recent errors | Check detailed health for `lastError` and `errorRate` |

## Related

- [Deploy a Tentacle](/tentacular-docs/cookbook/deploy-tentacle/)
- [Update a Tentacle](/tentacular-docs/cookbook/update-tentacle/)
- [Testing Guide](/tentacular-docs/guides/testing/)
