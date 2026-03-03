---
description: Create a new Linear issue from changes and create a branch
argument-hint: [scope]
---

Create a new Linear issue by analyzing staged changes and current context, then create a branch for it.

Arguments: $ARGUMENTS

## Plan Mode Handling

If plan mode is active when this command runs:

1. **Continue with read-only operations** - Loading skills and analyzing changes are read-only operations that are allowed in plan mode
2. **Write the plan** - Document the proposed Linear issue title, description, and branch name in the plan file
3. **Exit plan mode** - Call ExitPlanMode to proceed with execution
4. **Execute** - Create the Linear issue and branch after plan mode exits

**Do NOT ask the user whether to exit plan mode** - this command always requires write operations (creating issues, branches), so plan mode must be exited to complete the workflow. Proceed through the read-only steps, write the plan, and exit plan mode automatically.

## Command Workflow

### 1. Load Required Skills

**Load these skills FIRST** (read-only operation, allowed in plan mode):

1. **`using-linear` skill** - For creating the Linear issue via API (teaches `linearis` CLI usage)
2. **`git-workflow` skill** - For following proper git branch conventions

### 2. Parse Arguments

Parse the provided arguments:

- **All arguments ($ARGUMENTS):** Optional scope description (plain English or glob pattern)

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

### 4. Analyze Changes and Context

Before creating the Linear issue, gather comprehensive context:

**A. Analyze Staged Changes:**

```bash
git diff --cached --stat
git diff --cached
```

Review the git diff to understand:

- What files were modified/added/deleted
- What the changes accomplish
- The scope and nature of the work

**B. Review Claude Session Context:**

- Look back through the current conversation
- Identify what work was discussed or performed
- Note any user requirements or intentions expressed
- Consider any problems being solved or features being added

**C. Consider Scope Description:**

- If scope was provided as an argument, use it as additional context
- The scope description may hint at the purpose or category of changes

**D. Synthesize Information:**
Combine all three sources to understand:

- **What** was changed (technical details)
- **Why** it was changed (purpose/motivation)
- **Impact** of the changes (what it enables or fixes)

### 5. Generate Issue Title and Description

**Generate Linear Issue Content:**

Based on your analysis, create a concise but descriptive Linear issue:

**Title Format:**

- Keep it short (5-10 words)
- Use imperative mood (e.g., "Add", "Fix", "Update", "Implement")
- Be specific about what's being done
- Example: "Add authentication middleware to API services"
- Example: "Fix race condition in payment processing"

**Description Format:**

```markdown
## Summary

[1-2 sentence overview of what this issue addresses]

## Changes Made

- [Key change 1]
- [Key change 2]
- [Key change 3]

## Context

[Brief explanation of why these changes are needed]

## Technical Details

[Any relevant technical notes or considerations]
```

**Confidence Check:**

- If you feel confident about the title and description based on clear context: Proceed to create the issue
- If you feel uncertain or the context is ambiguous: Ask the user for clarification

**When to Ask for User Input:**

- Changes are unclear or seem unrelated
- Multiple possible interpretations of the work
- Scope is very broad or very minimal
- No clear purpose can be determined from context

**If asking user:**
Use a concise question like:

> "I've analyzed the changes [brief summary]. I'm considering creating an issue titled '[proposed title]' about [brief description]. Does this accurately capture what you're working on, or would you like to provide your own title/description?"

### 6. Create Linear Issue

Using the `using-linear` skill context and Linear API:

**Create the issue in Linear:**

- Use the `linearis` CLI tool or Linear API
- Target team: **AGE** (default)
- Provide generated title and description

Example command:

```bash
linearis issues create --title="[Generated Title]" --description="[Generated Description]" --team=AGE
```

**Capture the Response:**

- Extract the newly created ticket ID (e.g., AGE-XXX)
- Extract the ticket's branch name
- Note the ticket URL for reference

### 7. Create Branch for New Issue

Using the new ticket's information:

**Create and checkout branch:**

1. Use the branch name format from Linear or construct one following conventions
2. Branch name format typically: `feature/AGE-XXX-short-title`
3. Follow the `git-workflow` skill patterns

Example:

```bash
git checkout -b feature/AGE-789-add-auth-middleware
```

**Verify branch creation:**

```bash
git branch --show-current
```

### 8. Summary and Next Steps

Provide a comprehensive summary:

**Show the user:**

```
✓ Created Linear issue: AGE-XXX - [Title]
  URL: [Linear issue URL]

✓ Created and checked out branch: [branch-name]

✓ Staged changes:
  [List of staged files from git status]

Next steps:
- Review the staged changes
- Commit your work with a descriptive message
- Push the branch when ready: git push -u origin [branch-name]
```

### 9. Error Handling

- If staging produces no changes: Inform user and ask them to verify scope
- If Linear API fails: Show error and verify Linear access/credentials
- If issue creation succeeds but branch creation fails: Show ticket URL and allow manual branch creation
- If analysis is too ambiguous: Ask user for explicit title/description

## Examples

**Example 1: Stage all, auto-generate issue**

```
/itemize
```

→ Stages all changes, analyzes context, creates issue with auto-generated title/description, creates branch

**Example 2: Specific scope with glob pattern**

```
/itemize src/services/**/*.ts
```

→ Stages TypeScript files in services/, analyzes them, creates focused issue, creates branch

**Example 3: Natural language scope**

```
/itemize all authentication related files
```

→ Intelligently finds and stages auth-related files, creates issue about authentication work, creates branch

**Example 4: Scope provides context for issue**

```
/itemize payment processing bugfix
```

→ Uses scope as context hint, stages relevant files, creates issue about payment bug, creates branch

## Advanced Usage Tips

- The more context in your Claude session, the better the issue generation will be
- If you've been discussing implementation details, those will inform the issue description
- Use descriptive scope parameters to guide both file selection and issue generation
- You can run multiple /itemize commands for different logical chunks of work
