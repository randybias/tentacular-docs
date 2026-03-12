#!/usr/bin/env bash
set -euo pipefail

# Compare source doc SHAs against tracked versions.
# Outputs a staleness report. Sets GitHub Actions output if stale content found.
# Usage: scripts/staleness-check.sh

VERSIONS_FILE=".source-versions.json"
REPORT_FILE="/tmp/staleness-report.md"
stale=false

if [[ ! -f "$VERSIONS_FILE" ]]; then
  echo "WARNING: $VERSIONS_FILE not found. Cannot check staleness." >&2
  echo "stale=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

echo "# Content Staleness Report" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "The following source files have changed since the docs were last synced:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Source File | Tracked SHA | Current SHA |" >> "$REPORT_FILE"
echo "|-------------|------------|-------------|" >> "$REPORT_FILE"

check_file() {
  local key="$1"
  local repo="$2"
  local path="$3"

  tracked_sha=$(jq -r ".[\"$key\"] // \"unknown\"" "$VERSIONS_FILE")

  if [[ -d "../$repo" ]]; then
    current_sha=$(git -C "../$repo" log -1 --format='%H' -- "$path" 2>/dev/null || echo "unknown")
  else
    current_sha="repo-not-found"
  fi

  if [[ "$tracked_sha" != "$current_sha" && "$current_sha" != "unknown" && "$current_sha" != "repo-not-found" ]]; then
    echo "| \`$repo/$path\` | \`${tracked_sha:0:8}\` | \`${current_sha:0:8}\` |" >> "$REPORT_FILE"
    stale=true
  fi
}

# Key source files to track
check_file "architecture" "tentacular" "docs/architecture.md"
check_file "cli" "tentacular" "docs/cli.md"
check_file "workflow-spec" "tentacular" "docs/workflow-spec.md"
check_file "node-contract" "tentacular" "docs/node-contract.md"
check_file "secrets" "tentacular" "docs/secrets.md"
check_file "testing" "tentacular" "docs/testing.md"
check_file "gvisor-setup" "tentacular" "docs/gvisor-setup.md"
check_file "glossary-core" "tentacular" "docs/glossary.md"
check_file "exoskeleton" "tentacular-mcp" "docs/exoskeleton.md"
check_file "exoskeleton-deployment" "tentacular-mcp" "docs/exoskeleton-deployment.md"
check_file "nats-spiffe" "tentacular-mcp" "docs/nats-spiffe-deployment.md"
check_file "glossary-mcp" "tentacular-mcp" "docs/glossary.md"
check_file "glossary-skill" "tentacular-skill" "docs/glossary.md"
check_file "catalog" "tentacular-catalog" "catalog.yaml"
check_file "mcp-tools" "tentacular-mcp" "pkg/tools/register.go"

if [[ "$stale" == "true" ]]; then
  echo ""
  echo "Stale content detected. See $REPORT_FILE"
  cat "$REPORT_FILE"
else
  echo "All tracked content is up to date."
fi

echo "stale=$stale" >> "${GITHUB_OUTPUT:-/dev/null}"
