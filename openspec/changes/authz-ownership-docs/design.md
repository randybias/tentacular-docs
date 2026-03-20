## Context

Tentacular's documentation site (Starlight/Astro) currently documents the system without any authorization model. The MCP server setup guide references `tentacular.dev/*` annotations and bearer-token auth, but has no concept of owner/group/mode permissions. The authz-ownership feature being added to tentacular-mcp and tentacular CLI requires corresponding documentation updates.

Key docs that need changes: `architecture.md`, `mcp-server-setup.md`, `mcp-tools.md`, `glossary.md`, `cli.md`. A new authorization guide page may be needed.

## Goals / Non-Goals

**Goals:**
- Document the POSIX-like authz model clearly enough that users can configure and operate it
- Update all existing pages that reference old annotation names or auth behavior
- Add new MCP tool and CLI command references
- Provide a conceptual overview of the permission model
- Document the annotation migration path

**Non-Goals:**
- Writing implementation code (this is docs-only)
- Documenting internal MCP server implementation details (pkg/authz internals)
- Creating a migration tool or script (that belongs in tentacular-mcp)
- Documenting IdP setup (Keycloak, Google, etc.) beyond what's needed for authz config

## Decisions

### 1. Add a dedicated authorization guide page rather than only updating existing pages

**Rationale:** The authz model is a cross-cutting concept that touches deploy, permissions, MCP setup, and identity. A standalone `guides/authorization.md` provides a single entry point. Existing pages link to it for details rather than duplicating content.

**Alternative considered:** Inline all authz content into existing pages. Rejected because it would bloat `mcp-server-setup.md` and scatter the conceptual model across multiple pages.

### 2. Update annotation references inline rather than creating a migration guide page

**Rationale:** The `tentacular.dev/*` to `tentacular.io/*` migration is a one-time event. A callout/admonition on each affected page (mcp-server-setup, architecture) is sufficient. A standalone migration page would become stale quickly.

### 3. Add authz terms to the existing glossary rather than creating a separate authz glossary

**Rationale:** The glossary is already the canonical term reference. Adding owner, group, mode, permission bits there keeps a single source of truth.

### 4. Document new CLI commands in the existing CLI reference page

**Rationale:** The CLI reference already lists all commands in a tree. Adding `permissions` subcommands there maintains consistency. The authorization guide links to the CLI reference for syntax details.

## Risks / Trade-offs

- **[Docs written before code is final]** Documentation depends on finalized annotation names, tool schemas, and CLI flag names from tentacular-mcp and tentacular implementations. -> Mitigation: Write docs against the implementation plan; update when implementations land.
- **[Annotation migration confusion]** Users may see old `tentacular.dev/*` annotations in existing clusters. -> Mitigation: Add clear admonitions noting the migration and that old annotations are no longer recognized.
- **[Permission model complexity]** POSIX permission bits may be unfamiliar to users who only know RBAC. -> Mitigation: The authorization guide should include concrete examples (e.g., "mode 0750 means owner can read/write/execute, group can read/execute, others have no access").
