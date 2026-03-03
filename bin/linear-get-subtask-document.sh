#!/usr/bin/env bash
# Find and fetch the document for a subtask from a Linear issue
# Usage: linear-get-subtask-document.sh <ISSUE_ID> <SUBTASK_ID>
# Output: Document content (JSON) or error message
set -e

ISSUE_ID="${1:-}"
SUBTASK_ID="${2:-}"

if [ -z "$ISSUE_ID" ] || [ -z "$SUBTASK_ID" ]; then
  echo "Usage: linear-get-subtask-document.sh <ISSUE_ID> <SUBTASK_ID>" >&2
  exit 1
fi

# Fetch issue to get documents array
ISSUE_JSON=$(linearis issues read "$ISSUE_ID")

# Find document ID where title contains the subtask ID (case-insensitive)
DOCUMENT_ID=$(echo "$ISSUE_JSON" | jq -r --arg subtask "$SUBTASK_ID" \
  '.documents[] | select(.title | ascii_downcase | contains($subtask | ascii_downcase)) | .id' | head -1)

if [ -z "$DOCUMENT_ID" ]; then
  echo '{"error": "No document found for subtask", "subtask_id": "'"$SUBTASK_ID"'"}'
  exit 0
fi

# Fetch and output the document
linearis documents read "$DOCUMENT_ID"
