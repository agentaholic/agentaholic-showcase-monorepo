---
description: Find and work on the next unfinished task from the current Linear issue
argument-hint: [linear-issue-id]
---

Find the next unfinished task from the current Linear issue's checklist and start working on it.

Arguments: $ARGUMENTS

## Plan Mode Handling

If plan mode is active when this command runs:

1. **Continue with read-only operations** - Loading skills and fetching data are allowed
2. **Exit plan mode** - This command needs to work on tasks, so exit plan mode after gathering information
3. **Execute** - Start working on the identified task

**Do NOT ask the user whether to exit plan mode** - this command is meant to start work immediately. Gather the task information, exit plan mode if needed, and begin implementation.

## Command Workflow

### 1. Load Required Skills

**Load these skills FIRST** (read-only operation, allowed in plan mode):

1. **`using-linear` skill** - For interacting with Linear API
2. **`git-workflow` skill** - For git operations and branch naming conventions

### 2. Get Task Context (Single Command)

Run this single command to get all task information:

```bash
linear-get-next-task.sh [ISSUE_ID]
```

If `ISSUE_ID` argument was provided to `/next-pr-task`, pass it to the script. Otherwise, the script infers it from the current branch.

**Success response:**

```json
{
  "issue_id": "AGE-1450",
  "issue_title": "plan dollar settlement strategy",
  "subtask_id": "SUBTASK-003",
  "subtask_title": "Use switch-case for order selection",
  "document": {
    "content": "## Review Comment\n\n**File:** `src/services/...`",
    "url": "https://linear.app/..."
  },
  "prior_lessons": [
    {
      "commit_sha": "abc123...",
      "note": "The X pattern required Y adjustment..."
    }
  ]
}
```

**All tasks complete:**

```json
{
  "error": "All subtasks completed",
  "issue_id": "AGE-1450",
  "issue_title": "...",
  "all_complete": true
}
```

### 3. Present Task Information

Display the task to the user:

```
📋 Next Task: $subtask_id

**Title:** $subtask_title

**From Issue:** $issue_id ($issue_title)

**Task Details:**
$document.content (or "No document - working from checklist title")

**Prior Lessons from This Branch:**
$prior_lessons (each entry shows commit SHA + lesson note) — or "None recorded yet"

Ready to start working on this task!
```

### 4. Implement the Task

1. **Understand the context:**
   - If `prior_lessons` is present and non-null, review each note and factor relevant lessons into implementation
   - Read the files mentioned in the task
   - Review the specific lines referenced
   - Understand what change is being requested

2. **Implement the changes:**
   - Make the requested changes
   - Follow project code style and patterns

### 4b. Big Task Mode

If the document content contains multiple actionable items — such as numbered phases, step-by-step lists, tables with items to convert, or multi-part plans — this is a **big task**. The subtask represents the **entire plan**, not just the first item.

**Detection criteria** (any of these indicate a big task):

- Multiple numbered steps or phases (e.g., "Phase 1", "Phase 2", or "1.", "2.", "3.")
- Tables listing multiple items to process (e.g., functions to convert, files to update)
- Checklists with multiple entries
- Documents with more than ~3 distinct actionable items

**Big task behavior:**

1. **Work through ALL items** in the plan document before proceeding to step 5. Do not commit or mark complete after just the first item.
2. **Implement incrementally** — work through items one by one or in logical groups, but do NOT stop and commit partway through.
3. **Stage ALL changes** once every item in the plan is implemented.
4. **Call `linear-complete-task.sh` once** with a summary commit message covering all work done.

**Commit message format for big tasks:**

```
<type>(<ISSUE_ID>, <SUBTASK_ID>): <summary of all work done>
```

Example:

```bash
git add -A && linear-complete-task.sh "AGE-1588" "SUBTASK-007" "refactor(AGE-1588, SUBTASK-007): convert all orders utils to endpoints"
```

**Important:** The `SUBTASK_ID` must always be included in the commit message alongside the `ISSUE_ID`.

### 5. Complete the Task (Single Command)

After implementing, run this single command to stage + commit + mark complete + add comment:

```bash
git add <files> && linear-complete-task.sh "$ISSUE_ID" "$SUBTASK_ID" "<commit-message>"
```

The commit message should follow the git-workflow pattern:

```
<type>(<ISSUE_ID>, <SUBTASK_ID>): <description>
```

Example:

```bash
git add src/services/orders/api/createOrder.ts && linear-complete-task.sh "AGE-1450" "SUBTASK-003" "refactor(AGE-1450, SUBTASK-003): create outbox messages when orders are created"
```

The script will:

1. Create the commit with Co-Authored-By trailer
2. Mark the subtask as complete in Linear
3. Add a comment with the commit SHA

**Success response:**

```json
{
  "issue_id": "AGE-1450",
  "subtask_id": "SUBTASK-003",
  "commit": {
    "sha": "9e56960e",
    "message": "refactor(AGE-1450, SUBTASK-003): use switch-case...",
    "status": "created"
  },
  "mark_complete": {
    "status": "completed",
    "error": null
  },
  "add_comment": {
    "status": "created",
    "error": null
  }
}
```

**No staged changes error:**

```json
{
  "issue_id": "AGE-1450",
  "subtask_id": "SUBTASK-003",
  "commit": {
    "status": "no_staged_changes",
    "error": "No staged changes to commit"
  },
  "mark_complete": { "status": "skipped", "error": "No commit created" },
  "add_comment": { "status": "skipped", "error": "No commit created" }
}
```

## Helper Scripts Reference

| Script                                                         | Purpose                                          |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `linear-get-next-task.sh [ISSUE_ID]`                           | Get issue + next subtask + document in one call  |
| `linear-complete-task.sh <ISSUE_ID> <SUBTASK_ID> <COMMIT_MSG>` | Commit + mark complete + add comment in one call |

## Error Handling

- **No Linear issue ID:** Script returns `{"error": "No Linear issue ID found in branch name", ...}`
- **Issue not found:** Script returns `{"error": "Failed to fetch issue", ...}`
- **No unfinished tasks:** Script returns `{"all_complete": true, ...}`
- **No staged changes:** Script returns `{"commit": {"status": "no_staged_changes", ...}}`
- **Document not found:** `document` field will be `null` - proceed with checklist title
