#!/usr/bin/env bash
set -e

# Script to convert a service subfolder into a turbo workspace
# Usage: convertToWorkspace.sh <service> <subfolder>
#
# Example: convertToWorkspace.sh marketTradingQuotes api
#
# This script:
# 1. Creates package.json and turbo.json in the subfolder
# 2. Moves test files to __tests__/ subdirectory if needed
# 3. Adds the workspace to root package.json
# 4. Adds the test dependency to root turbo.json
# 5. Adds exclude pattern to vitest.config.ts
#
# After running, you need to:
# - Run `npm install` to update package-lock.json
# - Manually update test imports if files were moved
# - Optionally add dependencies to the workspace turbo.json

SERVICE=$1
SUBFOLDER=$2

if [ -z "$SERVICE" ] || [ -z "$SUBFOLDER" ]; then
  echo "Usage: convertToWorkspace.sh <service> <subfolder>"
  exit 1
fi

WORKSPACE_PATH="src/services/${SERVICE}/${SUBFOLDER}"
PACKAGE_NAME="@agentaholic-showcase/${SERVICE}-${SUBFOLDER}"

cd "$AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH"

# Ensure path exists
mkdir -p "$WORKSPACE_PATH"

# Skip if already a workspace
if [ -f "$WORKSPACE_PATH/package.json" ]; then
  echo "Skipping: $WORKSPACE_PATH already has package.json"
  exit 0
fi

echo "Converting $WORKSPACE_PATH to workspace..."

# 1. Create __tests__ directory if needed
mkdir -p "$WORKSPACE_PATH/__tests__"

# 2. Move test files to __tests__/ (if not already there)
# Move from root of subfolder
find "$WORKSPACE_PATH" -maxdepth 1 -name "*.test.ts" -exec mv {} "$WORKSPACE_PATH/__tests__/" \; 2>/dev/null || true
find "$WORKSPACE_PATH" -maxdepth 1 -name "*.spec.ts" -exec mv {} "$WORKSPACE_PATH/__tests__/" \; 2>/dev/null || true

# For aggregates, find deep nested tests and move them
if [ "$SUBFOLDER" = "aggregates" ]; then
  find "$WORKSPACE_PATH" -name "*.test.ts" -path "*/events/*" | while read -r f; do
    if [ -n "$f" ]; then
      mv "$f" "$WORKSPACE_PATH/__tests__/$(basename "$f")"
      echo "Moved: $f -> $WORKSPACE_PATH/__tests__/$(basename "$f")"
    fi
  done
fi

# Determine test file extension based on what exists
TEST_EXT="test"
if ls "$WORKSPACE_PATH/__tests__/"*.spec.ts 1>/dev/null 2>&1; then
  TEST_EXT="spec"
fi

# 3. Create package.json
cat >"$WORKSPACE_PATH/package.json" <<EOF
{
  "name": "$PACKAGE_NAME",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "workspace-test.sh $WORKSPACE_PATH"
  }
}
EOF
echo "Created $WORKSPACE_PATH/package.json"

# 4. Create turbo.json (basic template - dependencies may need manual adjustment)
cat >"$WORKSPACE_PATH/turbo.json" <<EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "extends": ["//"],
  "tasks": {
    "test": {
      "dependsOn": [],
      "inputs": ["**/*.ts", "**/*.tsx"],
      "outputs": ["coverage/**"],
      "passThroughEnv": [
        "CI",
        "ENCORE_LOG",
        "ENCORE_RUNTIME_LIB",
        "ENCORE_APP_META",
        "ENCORE_APP_META_PATH",
        "ENCORE_RUNTIME_CONFIG",
        "ENCORE_APP_SECRETS",
        "ENCORE_LOG_LEVEL",
        "AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH",
        "AGENTAHOLIC_SHOWCASE_TEST_LOCK_HELD"
      ]
    }
  }
}
EOF
echo "Created $WORKSPACE_PATH/turbo.json"

# 5. Add to root package.json workspaces array
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const workspace = '$WORKSPACE_PATH';
if (!pkg.workspaces.includes(workspace)) {
  pkg.workspaces.push(workspace);
  pkg.workspaces.sort();
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log('Added workspace to package.json');
} else {
  console.log('Workspace already in package.json');
}
"

# 6. Add to root turbo.json dependsOn array
node -e "
const fs = require('fs');
const turbo = JSON.parse(fs.readFileSync('turbo.json', 'utf8'));
const dep = '$PACKAGE_NAME#test';
const testTask = turbo.tasks['//#test'];
if (testTask && testTask.dependsOn && !testTask.dependsOn.includes(dep)) {
  testTask.dependsOn.push(dep);
  testTask.dependsOn.sort();
  fs.writeFileSync('turbo.json', JSON.stringify(turbo, null, 2) + '\n');
  console.log('Added dependency to turbo.json');
} else {
  console.log('Dependency already in turbo.json or task not found');
}
"

# 7. Add exclude pattern to vitest.config.ts
PATTERN="$WORKSPACE_PATH/**/*.$TEST_EXT.ts"

# Check if pattern already in vitest.config.ts
if ! grep -q "$PATTERN" vitest.config.ts; then
  # Find the last exclude entry and add after it
  node -e "
const fs = require('fs');
let content = fs.readFileSync('vitest.config.ts', 'utf8');
const pattern = '$PATTERN';

// Find the exclude array and add the new pattern before the closing bracket
const excludeMatch = content.match(/(exclude:\\s*\\[)([\\s\\S]*?)(\\s*\\],)/);
if (excludeMatch) {
  const excludeContent = excludeMatch[2];
  // Add the new pattern at the end of the exclude array
  const newExcludeContent = excludeContent.trimEnd() + \"\\n      '\" + pattern + \"',\";
  content = content.replace(excludeMatch[0], excludeMatch[1] + newExcludeContent + excludeMatch[3]);
  fs.writeFileSync('vitest.config.ts', content);
  console.log('Added exclude pattern to vitest.config.ts');
} else {
  console.log('Could not find exclude array in vitest.config.ts');
}
"
else
  echo "Pattern already in vitest.config.ts"
fi

echo ""
echo "Done! Next steps:"
echo "  1. Run 'npm install' to update package-lock.json"
echo "  2. Check if test imports need updating (if files were moved)"
echo "  3. Optionally add dependencies to $WORKSPACE_PATH/turbo.json"
echo "  4. Run 'npm test' to verify tests pass"
