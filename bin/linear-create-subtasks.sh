#!/usr/bin/env bash
# Create Linear documents for subtasks and update the issue checklist
# Usage: linear-create-subtasks.sh <payload.json>
#
# Payload schema:
# {
#   "issueId": "AGE-1658",
#   "subtasks": [
#     {
#       "identifier": "SUBTASK-001",
#       "title": "Add soft interrupt handler",
#       "contentPath": "cache/subtasks/SUBTASK-001.md"
#     }
#   ]
# }
#
# Output: JSON summary with created/failed counts and document details
set -e

PAYLOAD_PATH="${1:-}"

if [ -z "$PAYLOAD_PATH" ]; then
  echo "Usage: linear-create-subtasks.sh <payload.json>" >&2
  exit 1
fi

if [ ! -f "$PAYLOAD_PATH" ]; then
  echo "Error: Payload file not found: $PAYLOAD_PATH" >&2
  exit 1
fi

# Validate payload structure
ISSUE_ID=$(jq -r '.issueId // empty' "$PAYLOAD_PATH")
SUBTASK_COUNT=$(jq -r '.subtasks | length' "$PAYLOAD_PATH")

if [ -z "$ISSUE_ID" ]; then
  echo "Error: Missing issueId in payload" >&2
  exit 1
fi

if [ "$SUBTASK_COUNT" -eq 0 ]; then
  echo "Error: subtasks array is empty" >&2
  exit 1
fi

# Create temp files
TEMP_DESC=$(mktemp)
TEMP_UPDATED=$(mktemp)
TEMP_RESULTS=$(mktemp)
trap 'rm -f "$TEMP_DESC" "$TEMP_UPDATED" "$TEMP_RESULTS"' EXIT

# Initialize results array
echo "[]" >"$TEMP_RESULTS"

CREATED_COUNT=0
FAILED_COUNT=0

# Loop through each subtask
for i in $(seq 0 $((SUBTASK_COUNT - 1))); do
  IDENTIFIER=$(jq -r ".subtasks[$i].identifier" "$PAYLOAD_PATH")
  TITLE=$(jq -r ".subtasks[$i].title" "$PAYLOAD_PATH")
  CONTENT_PATH=$(jq -r ".subtasks[$i].contentPath" "$PAYLOAD_PATH")

  DOC_TITLE="$IDENTIFIER: $TITLE"
  STATUS="failed"
  ERROR=""

  if [ ! -f "$CONTENT_PATH" ]; then
    ERROR="Content file not found: $CONTENT_PATH"
    FAILED_COUNT=$((FAILED_COUNT + 1))
  else
    CONTENT=$(cat "$CONTENT_PATH")

    set +e
    DOC_OUTPUT=$(linearis documents create --title "$DOC_TITLE" --content "$CONTENT" --issue-id "$ISSUE_ID" 2>&1)
    DOC_EXIT_CODE=$?
    set -e

    if [ $DOC_EXIT_CODE -eq 0 ]; then
      STATUS="created"
      CREATED_COUNT=$((CREATED_COUNT + 1))
    else
      ERROR="$DOC_OUTPUT"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
  fi

  # Append result to results array
  UPDATED_RESULTS=$(jq \
    --arg identifier "$IDENTIFIER" \
    --arg title "$TITLE" \
    --arg status "$STATUS" \
    --arg error "$ERROR" \
    '. + [{
      "identifier": $identifier,
      "title": $title,
      "status": $status,
      "error": (if $error != "" then $error else null end)
    }]' "$TEMP_RESULTS")
  echo "$UPDATED_RESULTS" >"$TEMP_RESULTS"
done

# Build checklist from successfully created subtasks only
CHECKLIST_LINES=""
for i in $(seq 0 $((SUBTASK_COUNT - 1))); do
  STATUS=$(jq -r ".[$i].status" "$TEMP_RESULTS")
  if [ "$STATUS" = "created" ]; then
    IDENTIFIER=$(jq -r ".[$i].identifier" "$TEMP_RESULTS")
    TITLE=$(jq -r ".[$i].title" "$TEMP_RESULTS")
    CHECKLIST_LINES="${CHECKLIST_LINES}- [ ] ${IDENTIFIER}: ${TITLE}
"
  fi
done

# Update issue description with checklist (only if we created any documents)
CHECKLIST_STATUS="skipped"
CHECKLIST_ERROR=""

if [ "$CREATED_COUNT" -gt 0 ]; then
  if linearis issues read "$ISSUE_ID" 2>/dev/null | jq -r '.description // ""' >"$TEMP_DESC"; then
    EXISTING_DESC=$(cat "$TEMP_DESC")

    if grep -q "## Plan Subtasks" "$TEMP_DESC"; then
      # Append to existing section
      PLAN_SECTION="## Plan Subtasks"
      # Find the Plan Subtasks section and append new items
      {
        # Everything up to and including existing checklist items
        cat "$TEMP_DESC"
        echo ""
        echo "$CHECKLIST_LINES"
      } >"$TEMP_UPDATED"
    else
      # Create new section
      {
        cat "$TEMP_DESC"
        echo ""
        echo "## Plan Subtasks"
        echo ""
        echo "$CHECKLIST_LINES"
      } >"$TEMP_UPDATED"
    fi

    if linearis issues update "$ISSUE_ID" -d "$(cat "$TEMP_UPDATED")" >/dev/null 2>&1; then
      CHECKLIST_STATUS="updated"
    else
      CHECKLIST_STATUS="failed"
      CHECKLIST_ERROR="Failed to update issue description"
    fi
  else
    CHECKLIST_STATUS="failed"
    CHECKLIST_ERROR="Failed to fetch issue description"
  fi
fi

# Output JSON summary
jq -n \
  --arg issue_id "$ISSUE_ID" \
  --argjson created "$CREATED_COUNT" \
  --argjson failed "$FAILED_COUNT" \
  --argjson documents "$(cat "$TEMP_RESULTS")" \
  --arg checklist_status "$CHECKLIST_STATUS" \
  --arg checklist_error "$CHECKLIST_ERROR" \
  '{
    "issueId": $issue_id,
    "created": $created,
    "failed": $failed,
    "documents": $documents,
    "checklist": {
      "status": $checklist_status,
      "error": (if $checklist_error != "" then $checklist_error else null end)
    }
  }'
