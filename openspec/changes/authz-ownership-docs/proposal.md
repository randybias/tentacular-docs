## Why

Tentacular is adding POSIX-like owner/group/mode authorization enforced at the MCP server layer. The documentation site must be updated to explain the authorization model, new annotations, new CLI commands, and new MCP tools so users can configure and operate authz correctly. Without docs, users cannot adopt the feature.

## What Changes

- Update architecture page to describe the authz enforcement layer in the MCP server
- Update MCP server setup guide with authz configuration (default-mode, default-group, auth-provider, idp-provider Helm values)
- Add new MCP tools (`permissions_get`, `permissions_set`) to the tools reference
- Update glossary with authz terms: owner, group, mode, permission bits, auth provider
- **BREAKING**: Document annotation namespace migration from `tentacular.dev/*` to `tentacular.io/*`
- Document new CLI commands: `permissions get`, `permissions set`, `permissions chmod`, `permissions chgrp`
- Document `--group` and `--share` flags on `tntc deploy`
- Document extended `tntc whoami` output showing group membership

## Capabilities

### New Capabilities
- `authz-concepts`: New conceptual documentation covering the POSIX-like owner/group/mode model, permission bit semantics, and how authz integrates with existing dual-auth
- `authz-reference`: Reference documentation for new MCP tools (permissions_get, permissions_set), new CLI commands (permissions get/set/chmod/chgrp), and annotation schema
- `annotation-migration`: Documentation of the tentacular.dev to tentacular.io annotation namespace migration and any backwards compatibility notes

### Modified Capabilities
<!-- No existing spec-level capabilities to modify in this repo -->

## Impact

- **Docs pages modified**: `architecture.md`, `mcp-server-setup.md`, `mcp-tools.md`, `glossary.md`, `cli.md`
- **New docs pages**: Potentially a new `guides/authorization.md` or `concepts/authorization.md` page
- **Cross-repo dependency**: Content depends on finalized annotation names and MCP tool schemas from tentacular-mcp implementation
- **Site navigation**: Sidebar config may need updates if new pages are added
