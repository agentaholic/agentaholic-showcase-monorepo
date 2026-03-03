#!/usr/bin/env bash
# Get all information needed to work on the next subtask from a Linear issue
# Combines: get-issue-from-branch + get-next-subtask + get-subtask-document
#
# Usage: linear-get-next-task.sh [ISSUE_ID]
#   If ISSUE_ID not provided, extracts from current branch name
#
# Output: Single JSON object with all task context
set -e

ISSUE_ID="${1:-}"

# Step 1: Get issue ID from branch if not provided
if [ -z "$ISSUE_ID" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  if [ -z "$BRANCH" ]; then
    jq -n '{"error": "Not in a git repository", "step": "get_issue_id"}'
    exit 1
  fi

  ISSUE_ID=$(echo "$BRANCH" | grep -oiE 'age-[0-9]+' | tr '[:lower:]' '[:upper:]' | head -1)
  if [ -z "$ISSUE_ID" ]; then
    jq -n --arg branch "$BRANCH" '{"error": "No Linear issue ID found in branch name", "branch": $branch, "step": "get_issue_id"}'
    exit 1
  fi
fi

# Step 2: Fetch issue details
ISSUE_JSON=$(linearis issues read "$ISSUE_ID" 2>/dev/null) || {
  jq -n --arg id "$ISSUE_ID" '{"error": "Failed to fetch issue", "issue_id": $id, "step": "fetch_issue"}'
  exit 1
}

ISSUE_TITLE=$(echo "$ISSUE_JSON" | jq -r '.title // ""')
DESCRIPTION=$(echo "$ISSUE_JSON" | jq -r '.description // ""')

# Step 3: Find next unchecked subtask
UNCHECKED_LINE=$(echo "$DESCRIPTION" | grep -E '^\s*- \[ \] SUBTASK-[0-9]{3}:' | head -1 || true)

if [ -z "$UNCHECKED_LINE" ]; then
  # Check if there are any subtasks at all
  HAS_SUBTASKS=$(echo "$DESCRIPTION" | grep -E 'SUBTASK-[0-9]{3}:' | head -1 || true)

  if [ -z "$HAS_SUBTASKS" ]; then
    jq -n --arg id "$ISSUE_ID" --arg title "$ISSUE_TITLE" \
      '{"error": "No subtasks found in issue description", "issue_id": $id, "issue_title": $title, "all_complete": false}'
  else
    jq -n --arg id "$ISSUE_ID" --arg title "$ISSUE_TITLE" \
      '{"error": "All subtasks completed", "issue_id": $id, "issue_title": $title, "all_complete": true}'
  fi
  exit 0
fi

# Extract subtask ID and title
SUBTASK_ID=$(echo "$UNCHECKED_LINE" | grep -oE 'SUBTASK-[0-9]{3}' | head -1)
SUBTASK_TITLE=$(echo "$UNCHECKED_LINE" | sed -E 's/.*SUBTASK-[0-9]{3}: //' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

# Step 4: Try to find document for subtask
DOCUMENT_ID=$(echo "$ISSUE_JSON" | jq -r --arg subtask "$SUBTASK_ID" \
  '.documents[] | select(.title | ascii_downcase | contains($subtask | ascii_downcase)) | .id' 2>/dev/null | head -1 || true)

DOCUMENT_CONTENT=""
DOCUMENT_URL=""

if [ -n "$DOCUMENT_ID" ]; then
  DOC_JSON=$(linearis documents read "$DOCUMENT_ID" 2>/dev/null) || true
  if [ -n "$DOC_JSON" ]; then
    DOCUMENT_CONTENT=$(echo "$DOC_JSON" | jq -r '.content // ""')
    DOCUMENT_URL=$(echo "$DOC_JSON" | jq -r '.url // ""')
  fi
fi

# Step 5: Collect prior lessons from git notes on branch commits
PRIOR_LESSONS_JSON="[]"

set +e
PARENT_REF=$(gt parent 2>/dev/null)
GT_EXIT=$?
set -e

if [ $GT_EXIT -eq 0 ] && [ -n "$PARENT_REF" ]; then
  BRANCH_SHAS=$(git log "${PARENT_REF}..HEAD" --format="%H" 2>/dev/null || true)
else
  # Fallback: commits since merge-base with main
  FALLBACK_BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || true)
  if [ -n "$FALLBACK_BASE" ]; then
    BRANCH_SHAS=$(git log "${FALLBACK_BASE}..HEAD" --format="%H" 2>/dev/null || true)
  else
    BRANCH_SHAS=""
  fi
fi

if [ -n "$BRANCH_SHAS" ]; then
  LESSONS_ARRAY="[]"
  while IFS= read -r sha; do
    [ -z "$sha" ] && continue
    NOTE_CONTENT=$(git notes show "$sha" 2>/dev/null || true)
    if [ -n "$NOTE_CONTENT" ]; then
      LESSONS_ARRAY=$(echo "$LESSONS_ARRAY" | jq \
        --arg sha "$sha" \
        --arg note "$NOTE_CONTENT" \
        '. + [{"commit_sha": $sha, "note": $note}]')
    fi
  done <<<"$BRANCH_SHAS"
  PRIOR_LESSONS_JSON="$LESSONS_ARRAY"
fi

# Output combined result
jq -n \
  --arg issue_id "$ISSUE_ID" \
  --arg issue_title "$ISSUE_TITLE" \
  --arg subtask_id "$SUBTASK_ID" \
  --arg subtask_title "$SUBTASK_TITLE" \
  --arg document_content "$DOCUMENT_CONTENT" \
  --arg document_url "$DOCUMENT_URL" \
  --argjson prior_lessons "$PRIOR_LESSONS_JSON" \
  '{
    "issue_id": $issue_id,
    "issue_title": $issue_title,
    "subtask_id": $subtask_id,
    "subtask_title": $subtask_title,
    "document": (if $document_content != "" then {
      "content": $document_content,
      "url": $document_url
    } else null end),
    "prior_lessons": (if ($prior_lessons | length) > 0 then $prior_lessons else null end)
  }'
