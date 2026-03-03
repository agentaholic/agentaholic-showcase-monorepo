#!/usr/bin/env bash
set -euo pipefail

# Linear API configuration helper script
# Requires: linearis, jq

# Check for jq
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed" >&2
  echo "Install with: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

# Check for linearis
if ! command -v linearis &>/dev/null; then
  echo "Error: linearis is required but not installed" >&2
  echo "Install from: https://github.com/ifiokjr/linearis" >&2
  exit 1
fi

echo "=========================================="
echo "Linear API Configuration"
echo "=========================================="
echo ""
echo "To get your Linear API token:"
echo "  1. Go to Settings → Security & Access → Personal API keys"
echo "  2. Click 'Create Key'"
echo "  3. Copy the generated token"
echo ""

# Prompt for API token
read -sp "Paste your Linear API token: " API_TOKEN
echo ""

if [ -z "$API_TOKEN" ]; then
  echo "Error: API token cannot be empty" >&2
  exit 1
fi

echo ""
echo "Validating token and fetching teams..."

# Export token for linearis to use
export LINEAR_API_TOKEN="$API_TOKEN"

# Fetch teams using linearis
TEAMS_OUTPUT=$(linearis teams list 2>&1) || {
  echo "Error: Failed to fetch teams with linearis" >&2
  echo "$TEAMS_OUTPUT" >&2
  exit 1
}

# Parse teams into array
TEAMS_ARRAY=$(echo "$TEAMS_OUTPUT" | jq -c '.')
TEAM_COUNT=$(echo "$TEAMS_OUTPUT" | jq 'length')

if [ "$TEAM_COUNT" -ne 1 ]; then
  echo "Error: Expected exactly 1 team, but found $TEAM_COUNT teams" >&2
  echo "Available teams:" >&2
  echo "$TEAMS_OUTPUT" | jq -r '.[] | "  \(.name) (ID: \(.id))"' >&2
  exit 1
fi

TEAM_ID=$(echo "$TEAMS_OUTPUT" | jq -r '.[0].id')
TEAM_NAME=$(echo "$TEAMS_OUTPUT" | jq -r '.[0].name')

echo "Found team '$TEAM_NAME' (ID: $TEAM_ID)"
echo ""

# Path to .env.local
ENV_FILE=".env.local"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: $ENV_FILE does not exist, creating it..."
  touch "$ENV_FILE"
fi

# Append to .env.local
echo "" >>"$ENV_FILE"
echo "# Linear configuration (added by setupLinear.sh)" >>"$ENV_FILE"
echo "LINEAR_API_TOKEN=$API_TOKEN" >>"$ENV_FILE"
echo "LINEAR_TEAM_ID=$TEAM_ID" >>"$ENV_FILE"

echo "=========================================="
echo "Configuration saved to $ENV_FILE"
echo "=========================================="
echo ""
echo "Added:"
echo "  LINEAR_API_TOKEN=$API_TOKEN"
echo "  LINEAR_TEAM_ID=$TEAM_ID"
echo ""
