#!/usr/bin/env bash

# Script to run tests for a specific workspace directory
# Called from workspace package.json test scripts
# Usage: workspace-test.sh <workspace-relative-path>
#
# Example: workspace-test.sh src/services/events/api
#
# When running inside Turbo (TURBO_HASH is set), this script runs tests directly.
# When running outside Turbo, it calls turbo to run the workspace test task
# so that results get cached.

set -e

WORKSPACE_PATH="$1"
shift # Remove first argument, leaving remaining args in $@

if [ -z "$WORKSPACE_PATH" ]; then
  echo "Error: workspace path required"
  echo "Usage: workspace-test.sh <workspace-relative-path> [vitest-args...]"
  exit 1
fi

# Always run from repo root (encore needs to be at project root)
cd "$AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH"

# Convert absolute path to relative path if needed
if [[ "$WORKSPACE_PATH" = /* ]]; then
  WORKSPACE_PATH="${WORKSPACE_PATH#$AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH/}"
fi

# If not running inside Turbo, call turbo to get caching benefits
if [ -z "$TURBO_HASH" ]; then
  # Get workspace name from package.json
  WORKSPACE_NAME=$(node -p "require('./${WORKSPACE_PATH}/package.json').name")

  echo "Not running inside Turbo - invoking turbo for caching..."
  exec turbo run test --filter="$WORKSPACE_NAME" -- "$@"
fi

# From here on, we're running inside Turbo (TURBO_HASH is set)

# Signal that this is a workspace test, so vitest uses the workspace config
export AGENTAHOLIC_SHOWCASE_WORKSPACE_TEST=1

if [ -n "$ENCORE_RUNTIME_LIB" ]; then
  # Already inside Encore environment (e.g., turbo was invoked by encore test).
  # Run vitest directly - no need to call encore test again.
  CHANGED_FLAG=""
  if [ -z "$CI" ]; then
    CHANGED_FLAG="--changed HEAD~1"
  fi
  ENCORE_LOG=${ENCORE_LOG-warn} vitest run $CHANGED_FLAG --config "${AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH}/vitest.workspace.config.ts" "${WORKSPACE_PATH}/__tests__/" "$@"
else
  # Inside Turbo but not in Encore environment - need to call encore test.
  # This path is taken when running a single workspace test directly via turbo.

  # Acquire lock if we don't have it
  if [ -z "$AGENTAHOLIC_SHOWCASE_TEST_LOCK_HELD" ]; then
    export AGENTAHOLIC_SHOWCASE_TEST_LOCK_HELD=1
    exec 200<>/tmp/agentaholic_showcase_test.lock
    echo "acquiring lock..."
    flock 200
    echo "acquired lock"
    trap 'exec 200>&-' EXIT
  fi

  # Set environment variable so bin/test.sh knows to run only this workspace
  export AGENTAHOLIC_SHOWCASE_SINGLE_WORKSPACE_PATH="$WORKSPACE_PATH"

  # Run encore test - it will invoke bin/test.sh which will detect
  # AGENTAHOLIC_SHOWCASE_SINGLE_WORKSPACE_PATH and run only this workspace's tests
  encore test "${WORKSPACE_PATH}/__tests__/" $*
fi
