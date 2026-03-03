#!/usr/bin/env bash
# Add a comment to a Linear issue with the latest commit info
# Usage: linear-add-commit-comment.sh <ISSUE_ID> [COMMIT_SHA]
# If COMMIT_SHA is not provided, uses HEAD
# Output: Created comment JSON
set -e

ISSUE_ID="${1:-}"
COMMIT_SHA="${2:-HEAD}"

if [ -z "$ISSUE_ID" ]; then
  echo "Usage: linear-add-commit-comment.sh <ISSUE_ID> [COMMIT_SHA]" >&2
  exit 1
fi

# Get commit info
SHORT_SHA=$(git rev-parse --short "$COMMIT_SHA")
COMMIT_MSG=$(git log -1 --format=%s "$COMMIT_SHA")

# Create comment
linearis comments create "$ISSUE_ID" --body "Claude committed \`$SHORT_SHA\`:

- \`$COMMIT_MSG\`"
