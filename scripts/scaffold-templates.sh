#!/usr/bin/env bash
set -euo pipefail

# scaffold-templates.sh
# Usage: scaffold-templates.sh TARGET_DIR [KEY=VALUE ...]
# Copies the templates/ directory into TARGET_DIR and optionally replaces {{KEY}} tokens.

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 TARGET_DIR [KEY=VALUE ...]"
  exit 2
fi
TARGET_DIR="$1"
shift

if [ ! -d "templates" ]; then
  echo "templates/ directory not found in $(pwd). Run this script from the repository root." >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
cp -R templates/ "$TARGET_DIR/"

# Optional token replacement: each extra arg should be KEY=VALUE
for kv in "$@"; do
  KEY="${kv%%=*}"
  VAL="${kv#*=}"
  echo "Replacing token {{${KEY}}} with ${VAL} in $TARGET_DIR..."
  # Use perl for portable in-place replacement
  find "$TARGET_DIR" -type f -name "*.md" -print0 | xargs -0 perl -0777 -pi -e "s/\{\{${KEY}\}\}/${VAL}/g"
done

echo "Templates copied to $TARGET_DIR"
