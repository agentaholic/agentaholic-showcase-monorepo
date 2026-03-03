#!/usr/bin/env bash

# Claude Hook: Notify user when Claude needs attention
# Triggered by: PermissionRequest, AskUserQuestion, ExitPlanMode

cd "$CLAUDE_PROJECT_DIR" || exit 0

if [[ -f "$CLAUDE_PROJECT_DIR/.claude-post-stop.local.sh" ]]; then
  bash "$CLAUDE_PROJECT_DIR/.claude-post-stop.local.sh"
fi

exit 0
