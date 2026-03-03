---
description: Capture changes to an existing Linear ticket (create branch or commit)
argument-hint: [ticket-id] [scope]
---

Capture staged changes to an existing Linear ticket by creating a branch or commit.

Arguments: $ARGUMENTS

## Plan Mode Handling

If plan mode is active when this command runs:

1. **Continue with read-only operations** - Loading skills and analyzing changes are read-only operations that are allowed in plan mode
2. **Write the plan** - Document what action will be taken (branch or commit) and the proposed details
3. **Exit plan mode** - Call ExitPlanMode to proceed with execution
4. **Execute** - Create the branch or commit after plan mode exits

**Do NOT ask the user whether to exit plan mode** - this command always requires write operations (creating branches, commits), so plan mode must be exited to complete the workflow. Proceed through the read-only steps, write the plan, and exit plan mode automatically.

## Command Workflow

### 1. Load Required Skills

**Load these skills FIRST** (read-only operation, allowed in plan mode):

1. **`using-linear` skill** - For interacting with Linear API and fetching ticket details (teaches `linearis` CLI usage)
2. **`git-workflow` skill** - For following proper git commit and branch conventions

### 2. Parse Arguments

Parse the provided arguments:

- **First argument ($1):** Optional ticket ID (e.g., "AGE-123")
- **Remaining arguments ($2+):** Optional scope description (plain English or glob pattern)

**Ticket ID Inference Logic:**
If no ticket ID is provided as the first argument:

1. Check the current Claude session conversation for any recently mentioned Linear ticket IDs (format: AGE-XXX)
2. If not found in conversation, check the current git branch name
3. If branch name matches pattern `*/AGE-XXX-*` or `AGE-XXX-*`, extract the ticket ID
4. If no ticket ID can be determined, ask the user to provide one

**Scope Handling:**

- If no scope provided: Will stage all changes with `git add -A`
- If scope provided: Will use hybrid detection approach

### 3. Stage Files Based on Scope

**Hybrid Scope Detection:**

Analyze the scope parameter to determine if it's a glob pattern or natural language:

- **If scope contains glob characters** (`*`, `**`, `?`, `[`, `]`, `{`, `}`): treat as a glob pattern
  - Example: `src/**/*.ts` → Stage all TypeScript files in src/
  - Use: `git add <glob-pattern>`
- **If scope is plain English**: interpret intelligently to identify matching files
  - Example: "all service files" → Find and stage files in src/services/
  - Example: "frontend components" → Find and stage files in src/app/components/
  - Example: "test files" → Find and stage files matching \*_/_.test.ts
  - Example: "staged files" → Use what is already staged, and use `git diff --cached --stat` to get an overview of that
  - Use natural language understanding to build appropriate `git add` commands

**If no scope provided:**

- Stage all changes: `git add -A`

After staging, show what was staged with `git status --short`.

### 4. Fetch Linear Ticket Details

Using the ticket ID (provided or inferred):

1. Use the Linear API (via `linearis` CLI or Linear skill knowledge) to fetch the ticket details
2. Extract key information:
   - Ticket title
   - Ticket description
   - Ticket branch name (Linear provides a standardized branch name)
   - Ticket status

### 5. Determine Action: Branch or Commit

Check the current git branch name:

**Get current branch:**

```bash
git rev-parse --abbrev-ref HEAD
```

**Decision Logic:**

- If the current branch name matches the ticket's branch name pattern (contains the ticket ID like `AGE-XXX`):
  - **Action: CREATE A COMMIT**
  - This means we're already working on this ticket's branch
  - Skip to step 6b (Create Commit)
- Otherwise:
  - **Action: CREATE A BRANCH**
  - Continue to step 6a (Create Branch)

### 6a. Create Branch (If Not Already On Ticket Branch)

Using the ticket's branch name from Linear:

1. Create and checkout a new branch using the ticket branch name format
   - Format typically: `feature/AGE-XXX-short-title` or similar
2. Follow the `git-workflow` skill patterns for branch creation
3. Confirm branch creation with user

Example:

```bash
git checkout -b feature/AGE-123-implement-user-auth
```

**After creating branch, inform user:**

- Show branch name created
- Show files staged
- Suggest next steps (commit the changes)

### 6b. Create Commit (If Already On Ticket Branch)

If we determined we're already on the ticket's branch:

1. Use the `git-workflow` skill to create a properly formatted commit message
2. Incorporate information from:
   - The ticket title and description
   - The staged changes (git diff)
   - The scope description if provided
3. Create the commit with the standardized format

**Commit Message Format (from git-workflow):**

```
<type>(<ticket-id>): <description>

<optional body>

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

4. Show commit summary to user
5. Ask if they want to push to remote

### 7. Summary and Next Steps

After completing the branch creation or commit, provide:

- Summary of what was done
- Current git status
- Suggested next actions:
  - If branch was created: "Commit your changes with a descriptive message"
  - If commit was created: "Push your changes with `git push` or continue working"

## Error Handling

- If ticket ID cannot be determined: Ask user to provide it explicitly
- If Linear API fails: Show error and ask user to verify ticket ID and Linear access
- If git operations fail: Show error and suggest resolution
- If no changes are staged after scope application: Inform user and ask them to verify scope

## Examples

**Example 1: Explicit ticket ID, stage all**

```
/capture AGE-123
```

→ Stages all changes, fetches AGE-123 details, creates branch (or commit if already on branch)

**Example 2: Infer ticket from branch, specific scope**

```
/capture src/services/**/*.ts
```

→ Infers ticket ID from current branch, stages only TypeScript files in services/

**Example 3: Explicit ticket, natural language scope**

```
/capture AGE-456 all test files
```

→ Uses AGE-456, intelligently finds and stages test files

**Example 4: No arguments (infer ticket, stage all)**

```
/capture
```

→ Infers ticket ID from context/branch, stages all changes
