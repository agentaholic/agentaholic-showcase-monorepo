#!/usr/bin/env bash

# regenerate the encore.gen files, but ignore failures in case an unrelated type error is blocking
encore check

set -e

# Create temporary files for the new API clients
TEMP_FILE=$(mktemp).ts
TARGET_FILE="./src/utils/api/generated/ApiClient.ts"

# Regenerate the API client to temporary file
encore gen client --output="$TEMP_FILE" --ts:shared-types

# Track if any updates were made
UPDATED=false

# Check and update main target file
if [ -f "$TARGET_FILE" ] && cmp -s "$TEMP_FILE" "$TARGET_FILE"; then
  echo "No changes detected in $TARGET_FILE"
else
  echo "Changes detected - updating $TARGET_FILE"
  cp "$TEMP_FILE" "$TARGET_FILE"
  UPDATED=true
fi

# Clean up
rm "$TEMP_FILE"

if [ "$UPDATED" = true ]; then
  echo "API client generation complete - files updated"
else
  echo "API client generation complete - no changes needed"
fi
