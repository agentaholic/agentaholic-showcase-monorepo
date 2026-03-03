#!/usr/bin/env bash

if [[ "$AGENTAHOLIC_SHOWCASE_DEV_ENFORCE_SESSION_CHECKS" = "false" ]]; then
  echo "ℹ️ Session checks disabled, skipping..."
  exit 0
fi

# Claude Hook: Format and Test on Stop
# Runs formatting and tests when Claude completes its work

# Change to project directory
cd "$CLAUDE_PROJECT_DIR" || exit 1

echo "🔧 Running post-completion checks..."
echo ""

# Track failures
has_failure=0

# Run formatting
echo "🎨 Running formatter..."
format_output=$(npm run format 2>&1)
format_exit_code=$?

if [[ $format_exit_code -eq 0 ]]; then
  echo "✅ Formatting passed"
else
  echo "❌ Formatting failed (exit code: $format_exit_code)" >&2
  has_failure=1
fi

echo ""

# Run tests
echo "🧪 Running tests..."
test_output=$(npm test 2>&1)
test_exit_code=$?

if [[ $test_exit_code -eq 0 ]]; then
  echo "✅ All tests passed"
else
  echo "❌ Tests failed (exit code: $test_exit_code)" >&2
  has_failure=1
fi

# If any failures, report them and exit
if [[ $has_failure -eq 1 ]]; then
  echo ""
  echo "❌ Post-completion checks failed" >&2

  if [[ $format_exit_code -ne 0 ]]; then
    echo ""
    echo "=== Formatting output ===" >&2
    echo "$format_output" >&2
  fi

  if [[ $test_exit_code -ne 0 ]]; then
    echo ""
    echo "=== Test output ===" >&2
    echo "$test_output" >&2
  fi

  exit 2
fi

echo ""

# Run local post-stop hook if it exists
if [[ -f "$CLAUDE_PROJECT_DIR/.claude-post-stop.local.sh" ]]; then
  echo "🔗 Running local post-stop hook..."
  bash "$CLAUDE_PROJECT_DIR/.claude-post-stop.local.sh"
fi

echo "✨ Post-completion checks finished"

# exit 0 (non-blocking)
exit 0
