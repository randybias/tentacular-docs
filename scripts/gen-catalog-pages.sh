#!/usr/bin/env bash
set -euo pipefail

# Generate one Markdown page per catalog template.
# Usage: scripts/gen-catalog-pages.sh [path-to-catalog.yaml]

CATALOG="${1:-catalog.yaml}"
OUTDIR="src/content/docs/reference/catalog"

if ! command -v yq &>/dev/null; then
  echo "ERROR: yq is required. Install from https://github.com/mikefarah/yq" >&2
  exit 1
fi

if [[ ! -f "$CATALOG" ]]; then
  echo "ERROR: catalog file not found: $CATALOG" >&2
  exit 1
fi

mkdir -p "$OUTDIR"

count=$(yq '.templates | length' "$CATALOG")

for i in $(seq 0 $((count - 1))); do
  name=$(yq ".templates[$i].name" "$CATALOG")
  display_name=$(yq ".templates[$i].displayName" "$CATALOG")
  description=$(yq ".templates[$i].description" "$CATALOG")
  category=$(yq ".templates[$i].category" "$CATALOG")
  complexity=$(yq ".templates[$i].complexity" "$CATALOG")
  author=$(yq ".templates[$i].author" "$CATALOG")
  min_version=$(yq ".templates[$i].minTentacularVersion" "$CATALOG")
  tags=$(yq -o=json ".templates[$i].tags" "$CATALOG" | tr -d '[]"' | sed 's/,/, /g' | xargs)

  outfile="$OUTDIR/$name.md"

  cat > "$outfile" <<EOPAGE
---
title: "$display_name"
description: "$description"
---

| Field | Value |
|-------|-------|
| **Name** | \`$name\` |
| **Category** | $category |
| **Complexity** | $complexity |
| **Tags** | $tags |
| **Author** | $author |
| **Min Version** | $min_version |

## Description

$description

## Usage

\`\`\`bash
# Scaffold from this template
tntc catalog init $name

# With custom name
tntc catalog init $name my-custom-name

# View template details
tntc catalog info $name
\`\`\`

## Source

Template source: [\`templates/$name/\`](https://github.com/randybias/tentacular-catalog/tree/main/templates/$name)
EOPAGE

  echo "Generated: $outfile"
done

echo "Done: $count catalog pages generated in $OUTDIR/"
