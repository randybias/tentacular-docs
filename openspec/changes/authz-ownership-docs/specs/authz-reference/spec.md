## ADDED Requirements

### Requirement: MCP tools reference includes permissions tools
The `reference/mcp-tools.md` page SHALL document the new permissions MCP tools.

#### Scenario: permissions_get tool is documented
- **WHEN** a user reads the MCP tools reference
- **THEN** a "Permissions" tool group SHALL list `permissions_get` with description: "Get owner, group, and mode for a deployed workflow"

#### Scenario: permissions_set tool is documented
- **WHEN** a user reads the MCP tools reference
- **THEN** the "Permissions" tool group SHALL list `permissions_set` with description: "Set owner, group, or mode for a deployed workflow"

#### Scenario: Tool count is updated
- **WHEN** a user reads the MCP tools reference header
- **THEN** the tool count SHALL be updated to reflect the two new permissions tools

### Requirement: CLI reference includes permissions commands
The `reference/cli.md` page SHALL document the new permissions CLI commands.

#### Scenario: Permissions subcommands are in CLI tree
- **WHEN** a user reads the CLI reference command tree
- **THEN** the tree SHALL include `permissions get`, `permissions set`, `permissions chmod`, and `permissions chgrp` subcommands

#### Scenario: Deploy flags are documented
- **WHEN** a user reads the deploy command documentation
- **THEN** the deploy command SHALL document `--group` flag (set group at deploy time) and `--share` flag (set mode to group-readable at deploy time)

#### Scenario: Whoami output is documented
- **WHEN** a user reads the whoami command documentation
- **THEN** the whoami command SHALL note that output includes group membership when OIDC authentication is used

### Requirement: MCP server setup documents authz configuration
The `guides/mcp-server-setup.md` page SHALL document authz-related Helm values and configuration.

#### Scenario: Default-mode and default-group configuration
- **WHEN** a user reads the MCP server setup guide
- **THEN** the guide SHALL document Helm values for `authz.defaultMode` and `authz.defaultGroup`

#### Scenario: Auth provider configuration
- **WHEN** a user reads the MCP server setup guide
- **THEN** the guide SHALL document the `authz.provider` Helm value and explain the difference between OIDC-based authz and bearer-token bypass

### Requirement: Annotation schema is documented
The authorization guide or reference SHALL include the complete list of authz annotations.

#### Scenario: All authz annotations listed
- **WHEN** a user looks for the annotation schema
- **THEN** the documentation SHALL list all `tentacular.io/*` authz annotations: owner-sub, owner-email, owner-name, group, mode, auth-provider, idp-provider, default-mode, default-group, created-at, updated-at, updated-by-sub, updated-by-email
