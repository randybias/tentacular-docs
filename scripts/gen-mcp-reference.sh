#!/usr/bin/env bash
set -euo pipefail

# Generate MCP tools reference page from Go source.
# Usage: scripts/gen-mcp-reference.sh [path-to-tentacular-mcp]

MCP_DIR="${1:-../tentacular-mcp}"
REGISTER_FILE="$MCP_DIR/pkg/tools/register.go"
OUTFILE="src/content/docs/reference/mcp-tools.md"

if [[ ! -f "$REGISTER_FILE" ]]; then
  echo "ERROR: register.go not found at $REGISTER_FILE" >&2
  echo "Provide path to tentacular-mcp as first argument." >&2
  exit 1
fi

cat > "$OUTFILE" <<'HEADER'
---
title: MCP Tools
description: Complete reference for Tentacular MCP server tools
---

The Tentacular MCP server exposes tools via the Model Context Protocol. These tools are used by the `tntc` CLI and can be called directly by AI agents.

HEADER

echo "Parsing tool registrations from $REGISTER_FILE..."

# Extract tool groups and names from register.go
# This is a best-effort parse — complex Go structs need manual review
grep -E '(Name:|Description:)' "$REGISTER_FILE" | while IFS= read -r line; do
  if echo "$line" | grep -q 'Name:'; then
    name=$(echo "$line" | sed 's/.*Name:[[:space:]]*"\([^"]*\)".*/\1/')
    echo "- Found tool: $name" >&2
  fi
done

echo "" >> "$OUTFILE"
echo "Generated from: \`tentacular-mcp/pkg/tools/register.go\`" >> "$OUTFILE"
echo "" >> "$OUTFILE"
echo "*This page is auto-generated. Run \`scripts/gen-mcp-reference.sh\` to update.*" >> "$OUTFILE"

echo "Generated: $OUTFILE"
