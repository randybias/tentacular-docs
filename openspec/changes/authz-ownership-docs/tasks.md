## 1. Annotation Migration

- [ ] 1.1 Update `concepts/architecture.md`: replace all `tentacular.dev/` references with `tentacular.io/`
- [ ] 1.2 Update `guides/mcp-server-setup.md`: replace `tentacular.dev/cron-schedule` with `tentacular.io/cron-schedule`, add migration admonition
- [ ] 1.3 Update `reference/glossary.md`: replace any `tentacular.dev/` references with `tentacular.io/`
- [ ] 1.4 Search all docs for remaining `tentacular.dev/` references and update them

## 2. Authorization Guide Page

- [ ] 2.1 Create `guides/authorization.md` with frontmatter and overview
- [ ] 2.2 Write permission model section: owner/group/mode, three scopes, three permission types (read/write/execute)
- [ ] 2.3 Write permission bit examples section with at least two concrete numeric mode examples
- [ ] 2.4 Write section explaining authz integration with dual-auth (bearer bypass, OIDC identity)
- [ ] 2.5 Write section documenting the complete annotation schema (all tentacular.io/* authz annotations)
- [ ] 2.6 Write section documenting dropped annotations (owner -> owner-sub/email/name, team -> group)
- [ ] 2.7 Add authorization guide to site sidebar navigation config

## 3. Architecture Page Update

- [ ] 3.1 Add authz enforcement layer to security boundaries section in `concepts/architecture.md`

## 4. MCP Tools Reference Update

- [ ] 4.1 Add Permissions tool group to `reference/mcp-tools.md` with permissions_get and permissions_set
- [ ] 4.2 Update tool count in the page header
- [ ] 4.3 Add Permissions group to the Tool Groups summary list

## 5. CLI Reference Update

- [ ] 5.1 Add `permissions get/set/chmod/chgrp` subcommands to the CLI command tree in `reference/cli.md`
- [ ] 5.2 Document `--group` and `--share` flags on the deploy command
- [ ] 5.3 Update whoami command to note group membership output

## 6. MCP Server Setup Guide Update

- [ ] 6.1 Add authz configuration section to `guides/mcp-server-setup.md` documenting `authz.defaultMode`, `authz.defaultGroup`, and `authz.provider` Helm values
- [ ] 6.2 Document the relationship between auth provider config and authz behavior

## 7. Glossary Update

- [ ] 7.1 Add authz terms to `reference/glossary.md`: owner, group, mode, permission bits, auth provider, default-mode, default-group
