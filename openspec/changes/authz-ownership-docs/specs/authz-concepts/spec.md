## ADDED Requirements

### Requirement: Authorization guide page exists
The documentation site SHALL include a `guides/authorization.md` page that explains the POSIX-like owner/group/mode authorization model.

#### Scenario: Guide explains the permission model
- **WHEN** a user navigates to the authorization guide
- **THEN** the page SHALL explain that every tentacle has an owner (sub/email/name), a group, and a mode (numeric permission bits)
- **THEN** the page SHALL explain the three permission scopes: owner, group, others
- **THEN** the page SHALL explain the three permission types: read (list/status), write (deploy/update/remove), execute (run/restart)

#### Scenario: Guide includes permission bit examples
- **WHEN** a user reads the authorization guide
- **THEN** the page SHALL include at least two concrete examples mapping numeric modes to access patterns (e.g., 0750 = owner rwx, group rx, others none)

#### Scenario: Guide explains authz integration with dual-auth
- **WHEN** a user reads the authorization guide
- **THEN** the page SHALL explain that bearer-token mode bypasses authz entirely
- **THEN** the page SHALL explain that OIDC tokens provide identity for authz evaluation

### Requirement: Architecture page describes authz layer
The `concepts/architecture.md` page SHALL describe the authorization enforcement layer in the MCP server.

#### Scenario: Architecture page includes authz in security boundaries
- **WHEN** a user reads the architecture page
- **THEN** the security boundaries section SHALL list authorization as a layer (MCP server evaluates owner/group/mode before executing tool operations)

### Requirement: Glossary includes authz terms
The `reference/glossary.md` page SHALL define all authorization-related terms.

#### Scenario: All authz terms are defined
- **WHEN** a user looks up authz terms in the glossary
- **THEN** the glossary SHALL include definitions for: owner, group, mode, permission bits, auth provider, default-mode, default-group

### Requirement: Sidebar navigation includes authorization guide
The site navigation SHALL include a link to the authorization guide under the Guides section.

#### Scenario: Authorization guide is discoverable
- **WHEN** a user browses the site sidebar
- **THEN** the Guides section SHALL include an "Authorization" entry linking to the authorization guide
