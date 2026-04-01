## Why

The Tentacular documentation site is the primary resource for users learning to build workflows. Adding sidecar support is a significant capability expansion that needs user-facing documentation: a conceptual explanation in the security page, a step-by-step guide, a YAML schema reference, and architecture diagrams showing how sidecars fit into the pod structure and security model.

## What Changes

### Security Page Update

Update the defense-in-depth section in `src/content/docs/concepts/security.md` to include sidecar containers as part of the security layer description. Sidecars share the pod's gVisor sandbox and SecurityContext, adding no new attack surface.

### New Guide: Adding Native Tools with Sidecars

Create `src/content/docs/guides/sidecars.md` covering:
- When to use sidecars (native binaries, performance-critical processing)
- Step-by-step: declaring a sidecar in workflow YAML
- Communication patterns (localhost HTTP, shared volume)
- Resource configuration
- Health checks and readiness probes
- Example: ffmpeg sidecar for video frame extraction

### New Reference: Sidecar YAML Schema

Create `src/content/docs/reference/sidecar-spec.md` with:
- Complete SidecarSpec field reference table
- Validation rules for each field
- ResourceSpec and ResourceValues sub-schemas
- Full annotated example YAML

### Architecture Diagrams

Create three diagrams (Mermaid or similar):

1. **Pod Architecture Diagram** -- Multi-container pod structure: engine + sidecar containers, shared emptyDir at `/shared`, per-container `/tmp`, localhost:PORT communication, gVisor sandbox boundary
2. **Security Boundary Diagram** -- Defense-in-depth layers with sidecars: RBAC, NetworkPolicy, gVisor, Deno permissions, SecurityContext, base images
3. **Data Flow Diagram** -- Sidecar communication pattern: trigger, engine start, sidecar ready, shared volume I/O, HTTP request/response, result processing

## Requirements

1. Security page must describe how sidecars fit into the existing defense-in-depth model
2. Guide must walk through declaring and using a sidecar from scratch
3. Guide must cover both communication patterns: direct HTTP and shared volume file handoff
4. Reference must document every SidecarSpec field with type, default, and validation rules
5. All three architecture diagrams must be created
6. Diagrams must accurately reflect the implementation (gVisor covers all containers, shared emptyDir, etc.)

## Acceptance Criteria

- [ ] `concepts/security.md` updated with sidecar defense-in-depth description
- [ ] `guides/sidecars.md` exists with step-by-step sidecar guide
- [ ] Guide includes working example workflow YAML
- [ ] Guide covers both HTTP and shared-volume communication patterns
- [ ] `reference/sidecar-spec.md` exists with complete field reference
- [ ] Reference includes validation rules for each field
- [ ] Pod Architecture diagram created showing multi-container structure
- [ ] Security Boundary diagram created showing defense-in-depth layers
- [ ] Data Flow diagram created showing sidecar communication pattern
- [ ] Documentation site builds successfully (`npm run build`)
- [ ] All internal links resolve correctly

## Scope

### In Scope

- Security page update (defense-in-depth section)
- New sidecar guide page
- New sidecar YAML schema reference page
- Three architecture diagrams
- Sidebar/navigation updates to include new pages

### Out of Scope

- Changes to existing guides unrelated to sidecars
- API reference updates (no new MCP tools)
- Scaffold-specific documentation (lives in tentacular-scaffolds)
- Video tutorials or interactive examples

## Dependencies

- `tentacular/openspec/changes/sidecar-support/` -- spec schema must be finalized for accurate reference docs
- `tentacular-skill/openspec/changes/sidecar-support/` -- skill docs inform the reference style
- `tentacular-scaffolds/openspec/changes/sidecar-scaffolds/` -- scaffold examples referenced in the guide
