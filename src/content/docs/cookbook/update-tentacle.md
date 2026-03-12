---
title: Update a Tentacle
description: How to update and redeploy an existing tentacle
---

## Goal

Update a deployed tentacle with code changes, config changes, or contract changes.

## Prerequisites

- A tentacle already deployed via `tntc deploy`
- Updated source files locally

## Steps

### 1. Make Changes

Edit any of:
- `nodes/*.ts` — node logic
- `workflow.yaml` — config, triggers, DAG structure, contract
- `.secrets.yaml` — secrets

### 2. Validate and Test

```bash
tntc validate
tntc test
```

### 3. Redeploy

**Fast iteration (code-only changes):**
```bash
tntc deploy
```

This updates the ConfigMap with new code and triggers a rollout restart. ~5-10 seconds.

**With image rebuild:**
```bash
tntc build --push
tntc deploy
```

### 4. Verify

```bash
tntc status my-tentacle --detail
tntc run my-tentacle
tntc logs my-tentacle --tail 20
```

## Verification

- `tntc status` shows the updated deployment rolling out
- `tntc run` produces expected output with new logic
- `tntc audit` still shows clean security audit (especially after contract changes)

## Failure Modes

| Failure | Cause | Resolution |
|---------|-------|------------|
| Rollout stuck | New code crashes on startup | Check `tntc logs` for errors, fix and redeploy |
| NetworkPolicy blocks | New dependency not in contract | Add to `contract.dependencies` and redeploy |
| Secret errors | New node uses undeclared secret | Update `.secrets.yaml` and redeploy |
| Config key missing | Node reads config not in workflow.yaml | Add key to `config:` block |

## Related

- [Deploy a Tentacle](/tentacular-docs/cookbook/deploy-tentacle/)
- [Debug a Tentacle](/tentacular-docs/cookbook/debug-workflow/)
