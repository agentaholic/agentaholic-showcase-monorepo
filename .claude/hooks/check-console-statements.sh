#!/usr/bin/env bash

# Claude Hook: Check for console.* statements in TypeScript files
# Blocks Edit/Write operations that add console.* without the ignore comment

# Read JSON input from stdin
input=$(cat)

# Extract tool information
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

# Check if file is TypeScript
if [[ ! "$file_path" =~ \.(ts|tsx)$ ]]; then
  # Not a TypeScript file, allow it
  exit 0
fi

# Extract the content to check based on tool type
if [[ "$tool_name" == "Edit" ]]; then
  content=$(echo "$input" | jq -r '.tool_input.new_string')
elif [[ "$tool_name" == "Write" ]]; then
  content=$(echo "$input" | jq -r '.tool_input.content')
else
  # Unknown tool, allow it
  exit 0
fi

# Check if content is null or empty
if [[ -z "$content" || "$content" == "null" ]]; then
  exit 0
fi

# Search for console.* statements (including common methods)
console_pattern='console\.(log|debug|info|warn|error|trace|dir|table|time|timeEnd|group|groupEnd|groupCollapsed|count|countReset|assert|clear)'

# Check for ignore comment pattern
ignore_pattern='(//|/\*).*claude-hooks-ignore-logging-violation'

# Split content into lines and check each console.* statement
violations=()
line_num=0
prev_line=""

while IFS= read -r line; do
  line_num=$((line_num + 1))

  # Check if line contains console.*
  if echo "$line" | grep -qE "$console_pattern"; then
    # Check if current line itself has the ignore comment (inline)
    if echo "$line" | grep -qE "$ignore_pattern"; then
      # Inline ignore comment, skip this line
      prev_line="$line"
      continue
    fi

    # Check if previous line has the ignore comment
    if [[ -z "$prev_line" ]] || ! echo "$prev_line" | grep -qE "$ignore_pattern"; then
      # Extract just the relevant part of the line for display
      trimmed_line=$(echo "$line" | sed 's/^[[:space:]]*//')
      violations+=("Line $line_num: $trimmed_line")
    fi
  fi

  prev_line="$line"
done <<<"$content"

# If violations found, block the operation
if [[ ${#violations[@]} -gt 0 ]]; then
  {
    echo "⚠️  Console statements detected in TypeScript code!"
    echo ""
    echo "Please use the debug() function from the 'debug' package instead of console.* methods."
    echo ""
    echo "If you absolutely must use console.*, add this comment on the line before:"
    echo "  // claude-hooks-ignore-logging-violation"
    echo ""
    echo "Violations found in: $file_path"
    for violation in "${violations[@]}"; do
      echo "  $violation"
    done
    echo ""
  } >&2
  exit 2 # Block the operation
fi

# No violations, allow the operation
exit 0
