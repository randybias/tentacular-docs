#!/usr/bin/env bash
set -euo pipefail

# Generate one Markdown page per scaffold quickstart.
# Usage: scripts/gen-catalog-pages.sh [path-to-scaffolds-index.yaml]

CATALOG="${1:-scaffolds-index.yaml}"
OUTDIR="src/content/docs/reference/catalog"

if ! command -v yq &>/dev/null; then
  echo "ERROR: yq is required. Install from https://github.com/mikefarah/yq" >&2
  exit 1
fi

if [[ ! -f "$CATALOG" ]]; then
  echo "ERROR: scaffolds index file not found: $CATALOG" >&2
  exit 1
fi

mkdir -p "$OUTDIR"

count=$(yq '.scaffolds | length' "$CATALOG")

for i in $(seq 0 $((count - 1))); do
  name=$(yq ".scaffolds[$i].name" "$CATALOG")
  display_name=$(yq ".scaffolds[$i].displayName" "$CATALOG")
  description=$(yq ".scaffolds[$i].description" "$CATALOG")
  category=$(yq ".scaffolds[$i].category" "$CATALOG")
  complexity=$(yq ".scaffolds[$i].complexity" "$CATALOG")
  author=$(yq ".scaffolds[$i].author" "$CATALOG")
  min_version=$(yq ".scaffolds[$i].minTentacularVersion" "$CATALOG")
  tags=$(yq -o=json ".scaffolds[$i].tags" "$CATALOG" | tr -d '[]"' | sed 's/,/, /g' | xargs)

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
# Scaffold from this quickstart
tntc scaffold init $name

# With custom name
tntc scaffold init $name my-custom-name

# View scaffold details
tntc scaffold info $name
\`\`\`

## Source

Scaffold source: [\`quickstarts/$name/\`](https://github.com/randybias/tentacular-scaffolds/tree/main/quickstarts/$name)
EOPAGE

  echo "Generated: $outfile"
done

echo "Done: $count scaffold pages generated in $OUTDIR/"
