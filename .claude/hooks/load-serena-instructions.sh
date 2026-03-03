#!/bin/bash
# Load Serena system prompt instructions into Claude context

# Check if serena MCP is enabled
if ! claude mcp get serena &>/dev/null; then
  # Serena MCP is not enabled, exit silently
  exit 0
fi

# Run serena command and capture output
OUTPUT=$(uvx --from git+https://github.com/oraios/serena serena print-system-prompt --only-instructions --context claude-code 2>&1)
EXIT_CODE=$?

# Only output to Claude if successful
if [ $EXIT_CODE -eq 0 ]; then
  echo "$OUTPUT"
  exit 0
else
  # Log error to stderr (won't be added to context)
  echo "Warning: Failed to load Serena instructions" >&2
  exit 0 # Exit 0 anyway so hook doesn't block session
fi
