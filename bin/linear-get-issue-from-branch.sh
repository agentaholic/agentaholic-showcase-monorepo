#!/usr/bin/env bash
# Extract Linear issue ID (AGE-XXX) from current git branch name
# Usage: linear-get-issue-from-branch.sh
# Output: AGE-XXX (uppercase) or empty if not found
set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ -z "$BRANCH" ]; then
  echo "Error: Not in a git repository" >&2
  exit 1
fi

# Extract AGE-XXX pattern (case-insensitive), normalize to uppercase
ISSUE_ID=$(echo "$BRANCH" | grep -oiE 'age-[0-9]+' | tr '[:lower:]' '[:upper:]' | head -1)

if [ -z "$ISSUE_ID" ]; then
  echo "Error: No Linear issue ID found in branch name: $BRANCH" >&2
  exit 1
fi

echo "$ISSUE_ID"
