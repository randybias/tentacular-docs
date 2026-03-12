# Tentacular Documentation

Unified documentation site for [Tentacular](https://github.com/randybias/tentacular) — a security-first, agent-centric workflow engine for Kubernetes.

**Live site:** [randybias.github.io/tentacular-docs](https://randybias.github.io/tentacular-docs)

## Source Repositories

| Repository | Description |
|------------|-------------|
| [tentacular](https://github.com/randybias/tentacular) | Go CLI (`tntc`) + Deno workflow engine |
| [tentacular-mcp](https://github.com/randybias/tentacular-mcp) | In-cluster MCP server (Go, Helm chart) |
| [tentacular-skill](https://github.com/randybias/tentacular-skill) | Agent skill definition |
| [tentacular-catalog](https://github.com/randybias/tentacular-catalog) | Workflow template catalog |

## Development

```bash
npm install
npm run dev       # local preview at localhost:4321/tentacular-docs
npm run build     # production build to dist/
```

## Deployment

The site deploys automatically to GitHub Pages on push to `main`.

## License

Copyright (c) 2025-2026 Mirantis, Inc. All rights reserved. See [LICENSE](LICENSE).
