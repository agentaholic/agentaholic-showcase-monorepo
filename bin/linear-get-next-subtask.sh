#!/usr/bin/env bash
# Find the next unchecked subtask from a Linear issue's description
# Usage: linear-get-next-subtask.sh <ISSUE_ID>
# Output: JSON with subtask_id and title, or error message
set -e

ISSUE_ID="${1:-}"

if [ -z "$ISSUE_ID" ]; then
  echo "Usage: linear-get-next-subtask.sh <ISSUE_ID>" >&2
  exit 1
fi

# Fetch issue description
DESCRIPTION=$(linearis issues read "$ISSUE_ID" | jq -r '.description // ""')

if [ -z "$DESCRIPTION" ]; then
  echo '{"error": "Issue has no description", "all_complete": false}'
  exit 0
fi

# Find first unchecked subtask: - [ ] SUBTASK-XXX: description
# Using grep with perl regex for better pattern matching
UNCHECKED_LINE=$(echo "$DESCRIPTION" | grep -E '^\s*- \[ \] SUBTASK-[0-9]{3}:' | head -1 || true)

if [ -z "$UNCHECKED_LINE" ]; then
  # Check if there are any subtasks at all
  HAS_SUBTASKS=$(echo "$DESCRIPTION" | grep -E 'SUBTASK-[0-9]{3}:' | head -1 || true)

  if [ -z "$HAS_SUBTASKS" ]; then
    echo '{"error": "No subtasks found in issue description", "all_complete": false}'
  else
    echo '{"error": "All subtasks completed", "all_complete": true}'
  fi
  exit 0
fi

# Extract subtask ID (SUBTASK-XXX)
SUBTASK_ID=$(echo "$UNCHECKED_LINE" | grep -oE 'SUBTASK-[0-9]{3}' | head -1)

# Extract title (everything after "SUBTASK-XXX: ")
TITLE=$(echo "$UNCHECKED_LINE" | sed -E 's/.*SUBTASK-[0-9]{3}: //' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

# Output as JSON
jq -n \
  --arg subtask_id "$SUBTASK_ID" \
  --arg title "$TITLE" \
  '{"subtask_id": $subtask_id, "title": $title}'
