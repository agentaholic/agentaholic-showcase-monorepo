#!/usr/bin/env bash
# Complete a subtask: commit staged changes + mark checkbox as done + add commit comment
# Combines: git commit + mark-subtask-complete + add-commit-comment
#
# Usage: linear-complete-task.sh <ISSUE_ID> <SUBTASK_ID> <COMMIT_MESSAGE>
#
# The script will:
#   1. Commit staged changes with the provided message (+ Co-Authored-By trailer)
#   2. Mark the subtask as complete in the Linear issue
#   3. Add a comment to the Linear issue with the commit SHA
#
# Output: JSON with results of all operations
set -e

ISSUE_ID="${1:-}"
SUBTASK_ID="${2:-}"
COMMIT_MESSAGE="${3:-}"

if [ -z "$ISSUE_ID" ] || [ -z "$SUBTASK_ID" ] || [ -z "$COMMIT_MESSAGE" ]; then
  echo "Usage: linear-complete-task.sh <ISSUE_ID> <SUBTASK_ID> <COMMIT_MESSAGE>" >&2
  exit 1
fi

# Create temp files
TEMP_DESC=$(mktemp)
TEMP_UPDATED=$(mktemp)
trap 'rm -f "$TEMP_DESC" "$TEMP_UPDATED"' EXIT

# Step 1: Check for staged changes and commit
COMMIT_RESULT="failed"
COMMIT_ERROR=""
SHORT_SHA=""
FULL_COMMIT_MSG=""

# Check if there are staged changes
if git diff --cached --quiet 2>/dev/null; then
  COMMIT_RESULT="no_staged_changes"
  COMMIT_ERROR="No staged changes to commit"
else
  # Create commit with heredoc to avoid shell escaping issues
  FULL_COMMIT_MSG="$COMMIT_MESSAGE

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

  set +e
  COMMIT_OUTPUT=$(git commit -m "$FULL_COMMIT_MSG" 2>&1)
  COMMIT_EXIT_CODE=$?
  set -e

  if [ $COMMIT_EXIT_CODE -eq 0 ]; then
    COMMIT_RESULT="created"
    SHORT_SHA=$(git rev-parse --short HEAD)
  else
    COMMIT_ERROR="$COMMIT_OUTPUT"
  fi
fi

# If commit failed or no changes, output error and exit
if [ "$COMMIT_RESULT" != "created" ]; then
  jq -n \
    --arg issue_id "$ISSUE_ID" \
    --arg subtask_id "$SUBTASK_ID" \
    --arg commit_result "$COMMIT_RESULT" \
    --arg commit_error "$COMMIT_ERROR" \
    '{
      "issue_id": $issue_id,
      "subtask_id": $subtask_id,
      "commit": {
        "status": $commit_result,
        "error": $commit_error
      },
      "mark_complete": {"status": "skipped", "error": "No commit created"},
      "add_comment": {"status": "skipped", "error": "No commit created"}
    }'
  exit 1
fi

# Step 2: Mark subtask as complete
MARK_RESULT="skipped"
MARK_ERROR=""

if linearis issues read "$ISSUE_ID" 2>/dev/null | jq -r '.description' >"$TEMP_DESC"; then
  if grep -q -- "- \[ \] $SUBTASK_ID:" "$TEMP_DESC"; then
    sed "s/- \[ \] $SUBTASK_ID:/- [x] $SUBTASK_ID:/" "$TEMP_DESC" >"$TEMP_UPDATED"

    if linearis issues update "$ISSUE_ID" -d "$(cat "$TEMP_UPDATED")" >/dev/null 2>&1; then
      MARK_RESULT="completed"
    else
      MARK_RESULT="failed"
      MARK_ERROR="Failed to update issue description"
    fi
  elif grep -q -- "- \[x\] $SUBTASK_ID:" "$TEMP_DESC" || grep -q -- "- \[X\] $SUBTASK_ID:" "$TEMP_DESC"; then
    MARK_RESULT="already_complete"
  else
    MARK_RESULT="not_found"
    MARK_ERROR="Subtask $SUBTASK_ID not found in issue description"
  fi
else
  MARK_RESULT="failed"
  MARK_ERROR="Failed to fetch issue description"
fi

# Step 3: Add commit comment
COMMENT_RESULT="failed"
COMMENT_ERROR=""

if [ "${RALPH_REPORT_COMMITS_AS_COMMENTS:-true}" = "false" ]; then
  COMMENT_RESULT="skipped"
else
  COMMENT_BODY="Claude committed \`$SHORT_SHA\`:

- \`$COMMIT_MESSAGE\`"

  if linearis comments create "$ISSUE_ID" --body "$COMMENT_BODY" >/dev/null 2>&1; then
    COMMENT_RESULT="created"
  else
    COMMENT_ERROR="Failed to create comment"
  fi
fi

# Output combined result
jq -n \
  --arg issue_id "$ISSUE_ID" \
  --arg subtask_id "$SUBTASK_ID" \
  --arg commit_sha "$SHORT_SHA" \
  --arg commit_msg "$COMMIT_MESSAGE" \
  --arg commit_result "$COMMIT_RESULT" \
  --arg mark_result "$MARK_RESULT" \
  --arg mark_error "$MARK_ERROR" \
  --arg comment_result "$COMMENT_RESULT" \
  --arg comment_error "$COMMENT_ERROR" \
  '{
    "issue_id": $issue_id,
    "subtask_id": $subtask_id,
    "commit": {
      "sha": $commit_sha,
      "message": $commit_msg,
      "status": $commit_result
    },
    "mark_complete": {
      "status": $mark_result,
      "error": (if $mark_error != "" then $mark_error else null end)
    },
    "add_comment": {
      "status": $comment_result,
      "error": (if $comment_error != "" then $comment_error else null end)
    }
  }'

# Print lessons-learned prompt for Claude (plain text after JSON)
cat <<'LESSONS_PROMPT'

---

Reflect on the work you just completed for this subtask. Did you encounter anything unexpected — deviations from the plan, surprising behavior, approaches that didn't work, patterns or constraints you discovered mid-task, or anything that would help a future session working on this codebase?

If yes, record a concise lesson-learned note (1-4 sentences) on the commit:

  git notes add HEAD -m "<your note here>"

If nothing noteworthy happened, skip this step entirely.
LESSONS_PROMPT
