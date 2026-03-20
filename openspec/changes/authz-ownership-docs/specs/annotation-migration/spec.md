## ADDED Requirements

### Requirement: Annotation migration is documented
All documentation pages referencing `tentacular.dev/*` annotations SHALL be updated to use `tentacular.io/*` and SHALL note the migration.

#### Scenario: Architecture page uses new annotation namespace
- **WHEN** a user reads `concepts/architecture.md`
- **THEN** all annotation references SHALL use `tentacular.io/` prefix instead of `tentacular.dev/`

#### Scenario: MCP server setup uses new annotation namespace
- **WHEN** a user reads `guides/mcp-server-setup.md`
- **THEN** the cron scheduling section SHALL reference `tentacular.io/cron-schedule` instead of `tentacular.dev/cron-schedule`

#### Scenario: Glossary uses new annotation namespace
- **WHEN** a user reads `reference/glossary.md`
- **THEN** any annotation references SHALL use `tentacular.io/` prefix

#### Scenario: Migration admonition on affected pages
- **WHEN** a user reads any page that previously referenced `tentacular.dev/*` annotations
- **THEN** the page SHALL include an admonition (note/warning) stating that `tentacular.dev/*` annotations have been replaced by `tentacular.io/*`

### Requirement: Dropped annotations are documented
The documentation SHALL note that `tentacular.dev/owner` and `tentacular.dev/team` annotations have been replaced by the new authz annotations.

#### Scenario: Replacement mapping is clear
- **WHEN** a user searches for the old owner/team annotations
- **THEN** the authorization guide SHALL explain that `tentacular.dev/owner` is replaced by `tentacular.io/owner-sub`, `tentacular.io/owner-email`, and `tentacular.io/owner-name`
- **THEN** the authorization guide SHALL explain that `tentacular.dev/team` is replaced by `tentacular.io/group`
