---
description: Create subtasks from unresolved PR review comments
argument-hint: [linear-issue-id]
---

Process unresolved PR review comments and create Linear subtask documents with a checklist in the parent issue.

Arguments: $ARGUMENTS

## Plan Mode Handling

If plan mode is active when this command runs:

1. **Continue with read-only operations** - Loading skills and fetching data are read-only operations allowed in plan mode
2. **Write the plan** - Document the tasks to be created and checklist updates
3. **Exit plan mode** - Call ExitPlanMode to proceed with execution
4. **Execute** - Create documents and update the issue after plan mode exits

**Do NOT ask the user whether to exit plan mode** - this command always requires write operations (creating documents, updating issues), so plan mode must be exited to complete the workflow. Proceed through the read-only steps, write the plan, and exit plan mode automatically.

## Command Workflow

### 1. Load Required Skills

**Load these skills FIRST** (read-only operation, allowed in plan mode):

1. **`using-linear` skill** - For interacting with Linear API (teaches `linearis` CLI usage)
2. **`git-workflow` skill** - For git operations and branch naming conventions

### 2. Determine Linear Issue ID

**Parse Arguments:**

- **First argument ($1):** Optional Linear issue ID (e.g., "AGE-123")

**Issue ID Inference Logic:**

If no issue ID is provided as an argument:

1. Get the current branch name:

   ```bash
   git rev-parse --abbrev-ref HEAD
   ```

2. Extract Linear issue ID from branch name using pattern matching:
   - Look for pattern: `AGE-XXX` where XXX is a number
   - Branch formats to handle:
     - `feature/AGE-123-description`
     - `tenor/AGE-123-description`
     - `AGE-123-description`
     - `prefix/AGE-123`

3. If no issue ID found in branch name, ask user to provide it explicitly

Example extraction approach:

```bash
# From branch: age-1044-initial-orders-creation-endpoint
# Extract: AGE-1044 (case-insensitive match, normalize to uppercase)
# IMPORTANT: Use a pipeline to avoid nested command substitution issues in bash
git rev-parse --abbrev-ref HEAD | grep -oiE 'age-[0-9]+' | tr '[:lower:]' '[:upper:]'
```

### 3. Get PR Number for Current Branch

Use `gh pr view` to get the PR number associated with the current branch:

```bash
gh pr view --json number -q '.number'
```

**Error Handling:**

- If no PR exists for the current branch, inform the user and exit
- If `gh` command fails, check if user is authenticated: `gh auth status`

### 4. Fetch All Unresolved PR Review Comments

**Important:** GitHub's REST API does NOT expose the "resolved" status of review comment threads. You MUST use the GraphQL API to filter for unresolved comments.

**Use the dedicated script:**

```bash
# Fetch unresolved comments for the current branch's PR
bin/pr-get-unresolved-comments.sh

# Or specify a PR number explicitly
bin/pr-get-unresolved-comments.sh 370
```

The script (`bin/pr-get-unresolved-comments.sh`) handles:

- Getting the PR number for the current branch (if not provided)
- Querying GitHub's GraphQL API for unresolved review threads
- Filtering out resolved and outdated comments
- Returning formatted JSON with comment details

**Output format:**

```json
[
  {
    "id": 123456,
    "body": "Comment text...",
    "path": "src/file.ts",
    "line": 42,
    "commit_sha": "abc123def456...",
    "user": "reviewer-username",
    "created_at": "2024-01-01T12:00:00Z",
    "html_url": "https://github.com/..."
  }
]
```

### 5. Analyze Comments and Create Task List

**For each actionable comment:**

1. **Identify the nature of the requested change:**
   - Bug fix
   - Code improvement
   - Refactoring request
   - Documentation update
   - Test addition
   - Security concern
   - Other

2. **Create a concise task description:**
   - Start with action verb (Fix, Update, Add, Remove, Refactor)
   - Include file path if specific to one file
   - Keep it under 60 characters for readability
   - Examples:
     - "Fix error handling in paymentService.ts"
     - "Add validation for user input in signup form"
     - "Update type definitions for Trade aggregate"
     - "Refactor database query in getUserProfile"

3. **Create detailed task content for the Linear document:**

   ```markdown
   ## Review Comment

   **File:** `{path}:{line}` ([view at comment time](https://github.com/{owner}/{repo}/blob/{commit_sha}/{path}#L{line}))
   **Commit:** `{commit_sha}` (code state when comment was made)
   **Reviewer:** @{username}
   **Date:** {created_at}

   > {comment_body}

   ## Action Items

   - [ ] {specific action 1}
   - [ ] {specific action 2}

   ## Notes

   {any additional context or considerations}
   ```

### 6. Fetch Existing Linear Issue Details

Before creating new tasks, check what already exists:

```bash
linearis issues read "$ISSUE_ID" > /tmp/issue-details.json
```

**Extract:**

1. Current description (to check for existing checklist)
2. Parse description for existing SUBTASK items: `- [ ] SUBTASK-XXX:`

**Also check for existing documents:**

```bash
# Search for documents with SUBTASK prefix in title, attached to this issue
# Note: This may require iterating through issue relations or documents
# For now, we'll rely on checklist parsing to avoid duplicates
```

### 7. Determine Task Numbering

**Task number format:** `SUBTASK-XXX` where XXX is a 3-digit number (001, 002, etc.)

**Logic:**

1. Parse existing checklist items from issue description
2. Extract all existing SUBTASK numbers (e.g., SUBTASK-001, SUBTASK-002)
3. Find the highest number used
4. Start new tasks from (highest + 1)

**Example:**

- Existing: SUBTASK-001, SUBTASK-002, SUBTASK-005
- Highest: 005
- Next task: SUBTASK-006

```bash
# Extract existing SUBTASK numbers from description
EXISTING_NUMS=$(echo "$DESCRIPTION" | grep -oE 'SUBTASK-[0-9]{3}' | sed 's/SUBTASK-//' | sort -n)
MAX_NUM=$(echo "$EXISTING_NUMS" | tail -1)
NEXT_NUM=$((MAX_NUM + 1))
```

### 8. Check for Duplicate Tasks

Before creating each task, check if a similar task already exists:

**Comparison criteria:**

1. Similar task title (fuzzy match, >70% similarity)
2. Same file path mentioned in content
3. Similar comment text

**Simple approach:**

- Extract keywords from new task
- Compare against existing task titles
- If high similarity, skip creation and note it in summary

### 9. Create Linear Documents

For each new task:

```bash
TASK_NUM=$(printf "%03d" $NEXT_NUM)
TASK_ID="SUBTASK-$TASK_NUM"

# Create document with human-readable title
linearis documents create \
  --title="$TASK_ID: {Task Description}" \
  --content="{Detailed markdown content}" \
  --issue-id="$ISSUE_ID"
```

**Example:**

```bash
linearis documents create \
  --title="SUBTASK-006: Fix error handling in payment service" \
  --content="## Review Comment..." \
  --issue-id="AGE-1044"
```

**Increment counter** for next task.

### 10. Update Linear Issue Checklist

After creating all documents, update the issue description with a checklist.

**Approach:**

1. Read current description
2. Look for existing checklist section (marked by `## Subtasks` or `## Review Tasks`)
3. If checklist exists: append new items
4. If no checklist exists: create new section at the end

**Checklist format:**

```markdown
## Review Tasks

- [ ] SUBTASK-001: Fix error handling in payment service
- [ ] SUBTASK-002: Add validation for user input
- [ ] SUBTASK-003: Update type definitions
```

**Update command:**

```bash
# Read current description
CURRENT_DESC=$(linearis issues read "$ISSUE_ID" | jq -r '.description')

# Append or create checklist section
if echo "$CURRENT_DESC" | grep -q "## Review Tasks"; then
  # Append to existing section
  NEW_DESC=$(echo "$CURRENT_DESC" | sed "/## Review Tasks/a\\
- [ ] $TASK_ID: $TASK_TITLE")
else
  # Create new section
  NEW_DESC="$CURRENT_DESC

## Review Tasks

- [ ] $TASK_ID: $TASK_TITLE"
fi

# Update issue
linearis issues update "$ISSUE_ID" --description "$NEW_DESC"
```

**Better approach using script:**

Since bash string manipulation can be fragile, consider writing the logic in a small TypeScript/Node script or using `jq` for JSON manipulation:

```bash
# Store tasks in JSON array
TASKS_JSON='[]'
for task in "${TASKS[@]}"; do
  TASKS_JSON=$(echo "$TASKS_JSON" | jq --arg id "$TASK_ID" --arg title "$TASK_TITLE" '. + [{id: $id, title: $title}]')
done

# Update description with jq and linearis
CURRENT_DESC=$(linearis issues read "$ISSUE_ID" | jq -r '.description')

# Generate new checklist items
NEW_ITEMS=$(echo "$TASKS_JSON" | jq -r '.[] | "- [ ] \(.id): \(.title)"')

# Append to description
if echo "$CURRENT_DESC" | grep -q "## Review Tasks"; then
  # Insert after "## Review Tasks" header
  NEW_DESC=$(echo "$CURRENT_DESC" | awk -v items="$NEW_ITEMS" '
    /## Review Tasks/ {print; print items; next}
    {print}
  ')
else
  # Append new section
  NEW_DESC="$CURRENT_DESC

## Review Tasks

$NEW_ITEMS"
fi

# Update issue with new description
echo "$NEW_DESC" | linearis issues update "$ISSUE_ID" --description "$(cat -)"
```

### 11. Summary and Output

After completing all operations, provide a clear summary:

```
✓ Processed PR #{pr_number} for issue {ISSUE_ID}

✓ Found {N} actionable review comments

✓ Created {M} new subtask documents:
  - SUBTASK-{XXX}: {Task title}
  - SUBTASK-{YYY}: {Task title}
  ...

✓ Skipped {K} duplicate tasks:
  - {Task title} (similar to SUBTASK-{XXX})

✓ Updated {ISSUE_ID} with checklist

View issue: {Linear issue URL}

Next steps:
- Review the created subtasks
- Check off items as you complete them
- Update PR with fixes
```

## Error Handling

- **No PR found:** "No PR found for current branch. Push your branch and create a PR first."
- **No Linear issue ID:** "Could not determine Linear issue ID. Provide it as an argument: /pr-tasks AGE-XXX"
- **No review comments:** "No review comments found on PR. The PR may not have been reviewed yet."
- **API failures:** Show specific error and suggest checking auth: `gh auth status` or `linearis whoami`
- **Duplicate detection:** Log skipped tasks but don't fail

## Edge Cases

1. **Empty PR comments:** Inform user, don't fail
2. **All comments resolved:** Detect and inform user
3. **Very long comment body:** Truncate in title, keep full text in document
4. **Existing checklist with different format:** Preserve existing format, append new items
5. **Missing line numbers:** Use file path only
6. **Multi-file changes in one comment:** Create one task referencing all files

## Examples

**Example 1: Auto-infer issue from branch**

```
/pr-tasks
```

→ Extracts AGE-1044 from branch `age-1044-...`, processes PR comments, creates subtasks

**Example 2: Explicit issue ID**

```
/pr-tasks AGE-456
```

→ Uses AGE-456, fetches PR for current branch, creates subtasks

**Example 3: Re-running command**

```
/pr-tasks
```

→ Detects existing SUBTASK-001 through SUBTASK-003, creates new tasks starting from SUBTASK-004

## Advanced Features

### Smart Comment Categorization

When analyzing comments, categorize by type:

- **Critical:** Security issues, bugs, blocking concerns
- **Important:** Code quality, best practices, maintainability
- **Nice-to-have:** Style preferences, minor optimizations

Include category in task title or content.

### Comment Grouping

If multiple comments relate to the same concern:

- Group them into one subtask
- List all related comments in the document

### Linking

Include links in the subtask document:

- Link to specific PR comment (GitHub URL)
- Link to relevant code files
- Link back to parent issue
