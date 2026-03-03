---
name: git-workflow
description: Use when performing any git operations including commit, branch, checkout, push, pull, merge, rebase, stash, tag, or when working with git status, git add, git rm. Also use when creating branches, making PRs, working with Linear tickets (AGE-*), or managing version control workflows with Graphite (gt).
---

## Commit Message Guidelines

When creating git commit messages, the description/first line should follow this pattern: `<type>(<subject>): <action>`

### Commit Types

`<type>` should be one of these values:

- **feat** - for features or changes that would create a minor version bump in semantic versioning
- **fix** - for changes that fix behavior and would create a patch version bump in semantic versioning
- **docs** - for changes that pertain to documentation, or changes to comments and information
- **style** - for changes that only adjust the formatting of code, like whitespace
- **refactor** - for refactor-like changes that preserve the existing behavior of the code
- **test** - for changes that only modify test files
- **chore** - for all miscellaneous changes that don't directly affect the behavior of the application

### Commit Subject

`<subject>` can be a reference (name) to a specific file, or service or endpoint or the abstract name of something where it is implied that the action is acting upon.

When referencing a service endpoint, always use the format `{service name}.{endpoint name}` for the subject instead of just the endpoint name, so that we know which service the endpoint belongs to.

### Linear Ticket Integration

When writing a git commit, check the current branch name. If the branch name matches the Linear-recommended pattern of `age-<number>-<title>`, then ensure that the ticket ID of `AGE-<number>` is incorporated into the `<subject>` of the first line of the commit message.

For example, if you're planning on using the subject of "router", but you also notice that the branch name is `-ge-82-initial-react-router-setup`, then write a commit message that looks like `feat(AGE-82, router): setup react-router v7 with placeholder routes...`

### Commit Action

`<action>` is where the real description of the change will go. Always use imperative tense. Don't capitalize the first letter. Don't put a '.' at the end.

### Special Cases

- When asked to "commit", check the git status before concluding that there are no staged changes to commit
- When committing changes that are only changes to comments, use "docs" as the type prefix for the commit message
- When linking to a linear ticket in a TypeScript comment, instead of writing "// <url>" you should write "// TODO: <url>"

## Creating Branches with Graphite

This project uses **Graphite** via the `gt` CLI command for branch management.

### Step 1: Identify a Linear Ticket ID

Before creating a new branch, you should have a specific Linear ticket ID in mind.

If you don't have a ticket yet, create one with `linearis`:

```bash
linearis issues create --self-assigned --team AGE --description "{description}" --status "In Progress" "{title}"
```

### Step 2: Check Staged Files

Use `git status` to check for staged files.

**If there are staged files:**

- Ask the user to clarify if they want those files included in the first commit of the branch
- If yes: proceed to Step 4
- If no: unstage the files before proceeding

**If there are no staged files:**

- Decide what files to stage and propose options to the user:
  - Proceed without staging any files (create empty branch)
  - Stage all unstaged files
  - Stage specific files hand-picked by Claude (list them)

### Step 3: Stage Files (if necessary)

Use `git add` to stage the appropriate files based on the user's decision.

### Step 4: Prepare Commit Message (if necessary)

Use the commit message guidelines from this skill to prepare an appropriate commit message.

### Step 5: Get the Branch Name from Linear

Retrieve the branch name from the Linear ticket in a separate command:

```bash
linearis issues read {ticket-id} | jq -r '.branchName'
```

### Step 6: Create the Branch

Use the branch name from Step 5 in the `gt create` command.

**With staged files (includes initial commit):**

```bash
gt create --no-interactive {branch-name-from-step-5} -m "$(
  cat << 'EOF'
{commit-message}
EOF
)"
```

**Without staged files (empty branch):**

```bash
gt create --no-interactive {branch-name-from-step-5}
```

**Note:** Separating the branch name retrieval into its own step helps avoid shell parsing errors with nested command substitution. Use a heredoc for multi-line commit messages to avoid issues with special characters.

### Branch Naming Principles

- Always use the Linear-recommended branch name format: `age-{number}-{title-slug}`
- Never create branches without a specified name
- The `gt create` command accepts a branch name as the first positional argument

## Linear Integration

- When given a prompt that simply includes "AGE-<number>", for example "AGE-123", you should fetch the latest details for that ticket from Linear and try to follow the instructions included in the "prompt" section of the ticket description
- When referencing a Linear ticket by URL, prefer to use the full URL instead of the short URL
- Remember to use the team identified as 'AGE' when creating Linear tickets

## Development Tools

- **GraphiteAI** for git workflow management
- **Linear** integration for ticket management
