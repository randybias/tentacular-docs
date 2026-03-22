---
title: Local Development
description: Setting up a local development environment for building tentacles
---

## Prerequisites

- **Deno** 2.x — for running the engine locally and tests
- **Docker** 20+ — for building container images
- **kubectl** 1.28+ — configured for cluster access
- **Go 1.22+** — only if building `tntc` from source

## Steps

### 1. Install the CLI

```bash
# Recommended: install script
curl -fsSL https://raw.githubusercontent.com/randybias/tentacular/main/install.sh | sh
tntc version
```

Or build from source:

```bash
git clone git@github.com:randybias/tentacular.git
cd tentacular
make install        # builds with version info, installs to ~/.local/bin/
tntc version
```

### 2. Initialize the Workspace

Tentacular uses `~/tentacles/` as the default workspace for tentacle projects:

```bash
# Initialize the workspace (creates ~/tentacles with .secrets/ and .gitignore)
tntc init-workspace

# Or specify a custom location
tntc init-workspace /path/to/my/workspace
```

This creates:
```
~/tentacles/
├── .secrets/           # Shared secrets pool (for all tentacles)
└── .gitignore          # Auto-generated: ignores .secrets.yaml, scratch/, .secrets/
```

### 3. Configure Your Environment

```bash
# Set project-level defaults
tntc configure --registry ghcr.io/yourorg --default-namespace dev --project

# This creates .tentacular/config.yaml and profiles your cluster
```

See [Cluster Configuration](/tentacular-docs/guides/cluster-configuration/) for the full config reference.

### 4. Scaffold a Tentacle

```bash
cd ~/tentacles
tntc init my-tentacle
cd my-tentacle
```

Or use a scaffold:

```bash
cd ~/tentacles
tntc scaffold init word-counter my-tentacle --no-params
cd my-tentacle
```

### 5. Local Dev Server

```bash
# Start with hot-reload
tntc dev

# In another terminal, trigger execution
curl -X POST http://localhost:8080/run -d '{"key": "value"}'

# Check health
curl http://localhost:8080/health
curl http://localhost:8080/health?detail=1
```

The dev server watches for file changes and reloads automatically.

### 6. Set Up Secrets

```bash
tntc secrets init
# Edit .secrets.yaml with your values
tntc secrets check
```

### 7. Run Tests

```bash
# Test individual nodes against fixtures
tntc test

# Test the full pipeline
tntc test --pipeline
```

### 8. Validate

```bash
tntc validate
```

## Verification

- `tntc dev` starts without errors
- `curl localhost:8080/health` returns `{"status":"ok"}`
- `tntc test` passes all fixtures
- `tntc validate` reports no errors

## Workspace and Project Structure

```
~/tentacles/                        # Workspace root
├── .secrets/                       # Shared secrets pool
│   ├── slack                       # Used by multiple tentacles
│   └── github
├── .gitignore                      # Auto-generated
├── my-tentacle/                    # A tentacle project
│   ├── workflow.yaml               # Tentacle definition
│   ├── nodes/                      # TypeScript node files
│   │   ├── fetch-data.ts
│   │   └── process.ts
│   ├── tests/
│   │   └── fixtures/               # Test fixtures per node
│   │       ├── fetch-data.json
│   │       └── process.json
│   ├── .secrets.yaml               # Local secrets (gitignored)
│   ├── .secrets.yaml.example       # Secrets template (committed)
│   └── scratch/                    # Temporary files (gitignored)
└── uptime-prober/                  # Another tentacle
    └── ...
```

Workspace-level shared secrets (`.secrets/`) are referenced from individual tentacles via `$shared.<name>` in their `.secrets.yaml`.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `deno: command not found` | Deno not installed | Install from https://deno.land |
| Hot-reload not working | File watcher issue | Restart `tntc dev` |
| Port 8080 in use | Another process on port | Kill the process or use `--port` flag |
| Import errors in nodes | Missing import map | Ensure `deno.json` exists in engine directory |
