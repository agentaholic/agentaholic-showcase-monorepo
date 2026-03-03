#!/usr/bin/env bash

# Claude Hook: Check for incorrect test command usage
# Blocks Bash operations that use workspace-test.sh directly instead of npm test -w

# Read JSON input from stdin
input=$(cat)

# Extract command
command=$(echo "$input" | jq -r '.tool_input.command')

# Check if command is null or empty
if [[ -z "$command" || "$command" == "null" ]]; then
  exit 0
fi

# Array of incorrect test command patterns
incorrect_patterns=(
  "workspace-test.sh"
)

# Check each pattern
for pattern in "${incorrect_patterns[@]}"; do
  if echo "$command" | grep -qF "$pattern"; then
    {
      echo "⚠️  Incorrect test command detected!"
      echo ""
      echo "Do not use $pattern directly."
      echo "Use: npm test -w @agentaholic-showcase/<package>"
      echo ""
      echo "Examples:"
      echo "  npm test -w @agentaholic-showcase/hangman-api"
      echo "  npm test -w @agentaholic-showcase/events-api"
      echo ""
      echo "See CLAUDE.md \"Running Tests\" section for full details."
    } >&2
    exit 2
  fi
done

exit 0
