#!/usr/bin/env bash

# Set AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH if not already set (needed for CI where direnv isn't available)
# Also add bin/ to PATH so workspace-test.sh can be found by workspace test tasks
if [ -z "$AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH" ]; then
  export AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH="$(cd "$(dirname "$0")/.." && pwd)"
  export PATH="$AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH/bin:$PATH"
fi

# Set TURBO_CONCURRENCY to number of CPUs if not already set.
# This prevents resource exhaustion when running many test workspaces in parallel,
# especially in CI where container memory may be limited even with many reported cores.
if [ -z "$TURBO_CONCURRENCY" ]; then
  if [ "$(uname)" = "Darwin" ]; then
    export TURBO_CONCURRENCY=$(sysctl -n hw.ncpu)
  else
    export TURBO_CONCURRENCY=$(nproc)
  fi
fi

# If we don't already have the test lock, acquire it and set the environment variable
if [ -z "$CI" ] && [ -z "$AGENTAHOLIC_SHOWCASE_TEST_LOCK_HELD" ]; then
  export AGENTAHOLIC_SHOWCASE_TEST_LOCK_HELD=1

  # Open lock file and acquire exclusive lock
  exec 200<>/tmp/agentaholic_showcase_test.lock

  echo "acquiring lock..."
  flock 200
  echo "acquired lock"

  # After acquiring lock, check if cache was created by another task
  if [ -n "$TURBO_HASH" ]; then
    # Check if cache artifact exists (adjust path based on your cache dir)
    CACHE_FILE=".turbo/cache/${TURBO_HASH}-meta.json"
    if [ -f "$CACHE_FILE" ]; then
      echo "Cache artifact found after acquiring lock, skipping test"
      # Let turbo restore from cache by exiting successfully
      exit 0
    fi
  fi

  # Set up trap to release lock on exit
  trap 'exec 200>&-' EXIT
fi

# If not in CI, handle local test execution
if [ -z "$CI" ]; then
  # Check if this script is being run by turborepo
  if [ -z "$TURBO_HASH" ]; then
    # Not running under turbo yet
    if [ -z "$ENCORE_RUNTIME_LIB" ]; then
      # Not in Encore environment yet - call encore test first.
      # This sets up the test infrastructure (databases, etc.) ONCE,
      # then re-invokes this script with ENCORE_RUNTIME_LIB set.
      if [ -z "$AGENTAHOLIC_SHOWCASE_TEST_SKIP_FORMAT" ]; then
        turbo run --log-prefix=none lint:base
      fi
      encore test "$@"
      exit $?
    else
      # Already in Encore environment
      if [ -n "$AGENTAHOLIC_SHOWCASE_SINGLE_WORKSPACE_PATH" ]; then
        # Running a single workspace test - run vitest directly for just that workspace
        export AGENTAHOLIC_SHOWCASE_WORKSPACE_TEST=1
        ENCORE_LOG=${ENCORE_LOG-warn} vitest run --changed HEAD~1 --config vitest.workspace.config.ts "${AGENTAHOLIC_SHOWCASE_SINGLE_WORKSPACE_PATH}/__tests__/" "$@"
        exit $?
      else
        # Running all tests - use turbo to execute workspace tests.
        # All workspace tests will see ENCORE_RUNTIME_LIB and run vitest directly,
        # avoiding multiple encore test invocations that would each trigger Recreate().
        turbo run --continue --log-prefix=none --output-logs=errors-only test -- "$@"
        exit $?
      fi
    fi
  fi

  # Running under turbo - execute vitest directly
  if [ -n "$ENCORE_RUNTIME_LIB" ]; then
    # Filter out the "run" argument that turbo passes
    if [ "$1" = "run" ]; then
      shift
    fi

    # Use workspace config for workspace tests (doesn't exclude workspace test dirs)
    if [ -n "$AGENTAHOLIC_SHOWCASE_WORKSPACE_TEST" ]; then
      ENCORE_LOG=${ENCORE_LOG-warn} vitest run --changed HEAD~1 --config vitest.workspace.config.ts "$@"
    else
      ENCORE_LOG=${ENCORE_LOG-warn} vitest run --changed HEAD~1 "$@"
    fi

    STATUS=$?
    exit $STATUS
  else
    # Fallback: not in Encore env and running under turbo - should not happen normally
    encore test "$@"
  fi
  exit $?
fi

if [ -z "$TURBO_HASH" ]; then
  set -e
  npm run cache:generate

  npm run lint
  turbo run --continue --log-prefix=none --output-logs=errors-only test

  exit
fi
