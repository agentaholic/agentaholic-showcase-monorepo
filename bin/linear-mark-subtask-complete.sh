#!/usr/bin/env bash
# Mark a subtask as complete in a Linear issue's description
# Usage: linear-mark-subtask-complete.sh <ISSUE_ID> <SUBTASK_ID>
# Output: Updated issue JSON or error
set -e

ISSUE_ID="${1:-}"
SUBTASK_ID="${2:-}"

if [ -z "$ISSUE_ID" ] || [ -z "$SUBTASK_ID" ]; then
  echo "Usage: linear-mark-subtask-complete.sh <ISSUE_ID> <SUBTASK_ID>" >&2
  exit 1
fi

# Create temp files
TEMP_DESC=$(mktemp)
TEMP_UPDATED=$(mktemp)
trap 'rm -f "$TEMP_DESC" "$TEMP_UPDATED"' EXIT

# Fetch current description
linearis issues read "$ISSUE_ID" | jq -r '.description' >"$TEMP_DESC"

# Check if subtask exists and is unchecked
if ! grep -q "- \[ \] $SUBTASK_ID:" "$TEMP_DESC"; then
  if grep -q "- \[x\] $SUBTASK_ID:" "$TEMP_DESC" || grep -q "- \[X\] $SUBTASK_ID:" "$TEMP_DESC"; then
    echo "Subtask $SUBTASK_ID is already marked as complete" >&2
    exit 0
  else
    echo "Error: Subtask $SUBTASK_ID not found in issue description" >&2
    exit 1
  fi
fi

# Replace unchecked with checked for this specific subtask
sed "s/- \[ \] $SUBTASK_ID:/- [x] $SUBTASK_ID:/" "$TEMP_DESC" >"$TEMP_UPDATED"

# Update the issue
linearis issues update "$ISSUE_ID" -d "$(cat "$TEMP_UPDATED")"
