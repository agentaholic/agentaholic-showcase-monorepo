#!/usr/bin/env bash
set -euo pipefail

# Slack OAuth helper script (with jq for cleaner JSON parsing)
# Requires: curl, openssl, jq

# Check for jq
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed" >&2
  echo "Install with: brew install jq (macOS) or apt install jq (Linux)" >&2
  exit 1
fi

# Check for required environment variables
if [ -z "${SLACK_CLIENT_ID:-}" ]; then
  echo "Error: SLACK_CLIENT_ID environment variable not set" >&2
  exit 1
fi

if [ -z "${SLACK_CLIENT_SECRET:-}" ]; then
  echo "Error: SLACK_CLIENT_SECRET environment variable not set" >&2
  exit 1
fi

# OAuth configuration
SLACK_AUTH_URL="https://slack.com/oauth/v2/authorize"
SLACK_TOKEN_URL="https://slack.com/api/oauth.v2.access"
REDIRECT_URI="https://localhost:8082/callback"
USER_SCOPES="chat:write,channels:read,groups:read,channels:history,groups:history,mpim:history,im:history,reminders:write,im:read,mpim:read,reactions:write"
# from slack-term: scope=read,client,identify,post

# Generate a random state token for CSRF protection
STATE=$(openssl rand -hex 16)

# URL-encode function
urlencode() {
  local string="${1}"
  local strlen=${#string}
  local encoded=""
  local pos c o

  for ((pos = 0; pos < strlen; pos++)); do
    c=${string:$pos:1}
    case "$c" in
      [-_.~a-zA-Z0-9]) o="${c}" ;;
      *) printf -v o '%%%02x' "'$c" ;;
    esac
    encoded+="${o}"
  done
  echo "${encoded}"
}

# Build authorization URL
CLIENT_ID_ENCODED=$(urlencode "$SLACK_CLIENT_ID")
STATE_ENCODED=$(urlencode "$STATE")
REDIRECT_URI_ENCODED=$(urlencode "$REDIRECT_URI")
USER_SCOPES_ENCODED=$(urlencode "$USER_SCOPES")

AUTH_URL="${SLACK_AUTH_URL}?response_type=code&client_id=${CLIENT_ID_ENCODED}&state=${STATE_ENCODED}&redirect_uri=${REDIRECT_URI_ENCODED}&user_scope=${USER_SCOPES_ENCODED}"

echo "=========================================="
echo "Slack OAuth Authentication"
echo "=========================================="
echo ""
echo "Opening your browser for Slack authentication..."
echo ""

# Try to open browser (cross-platform)
if command -v open &>/dev/null; then
  open "$AUTH_URL" 2>/dev/null || true
elif command -v xdg-open &>/dev/null; then
  xdg-open "$AUTH_URL" 2>/dev/null || true
elif command -v start &>/dev/null; then
  start "$AUTH_URL" 2>/dev/null || true
else
  echo "Visit this URL:"
  echo "$AUTH_URL"
fi

echo ""
echo "Instructions:"
echo "1. Authorize the app in your browser"
echo "2. Copy the callback URL from the browser's address bar"
echo "3. Paste it below"
echo ""

# Prompt for callback URL
read -p "Paste the callback URL: " CALLBACK_URL

# Parse URL parameters using bash parameter expansion
QUERY_STRING="${CALLBACK_URL#*\?}"
CODE=""
RECEIVED_STATE=""

# Parse query parameters
IFS='&' read -ra PARAMS <<<"$QUERY_STRING"
for param in "${PARAMS[@]}"; do
  key="${param%%=*}"
  value="${param#*=}"
  case "$key" in
    code) CODE="$value" ;;
    state) RECEIVED_STATE="$value" ;;
  esac
done

if [ -z "$CODE" ]; then
  echo "Error: Could not extract authorization code from URL" >&2
  exit 1
fi

# Verify CSRF token
if [ "$RECEIVED_STATE" != "$STATE" ]; then
  echo "Error: CSRF token mismatch" >&2
  exit 1
fi

echo ""
echo "Exchanging authorization code for access token..."

# Exchange code for access token
RESPONSE=$(curl -s -X POST "$SLACK_TOKEN_URL" \
  -d "code=$CODE" \
  -d "client_id=$SLACK_CLIENT_ID" \
  -d "client_secret=$SLACK_CLIENT_SECRET" \
  -d "redirect_uri=$REDIRECT_URI")

# Check if response is ok using jq
OK=$(echo "$RESPONSE" | jq -r '.ok')

if [ "$OK" != "true" ]; then
  ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
  echo "Error: Slack OAuth failed: $ERROR" >&2
  exit 1
fi

# Extract user token using jq
USER_TOKEN=$(echo "$RESPONSE" | jq -r '.authed_user.access_token')

if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" == "null" ]; then
  echo "Error: Could not extract user token from response" >&2
  exit 1
fi

echo ""
echo "=========================================="
echo "Authentication Successful!"
echo "=========================================="
echo ""

# Fetch channels to find #general-noisy
echo "Fetching channels..."
CHANNELS=$(curl -s -X GET \
  "https://slack.com/api/conversations.list?types=public_channel,private_channel" \
  -H "Authorization: Bearer $USER_TOKEN")

# Check if API call was successful
CHANNELS_OK=$(echo "$CHANNELS" | jq -r '.ok')
if [ "$CHANNELS_OK" != "true" ]; then
  CHANNELS_ERROR=$(echo "$CHANNELS" | jq -r '.error // "Unknown error"')
  echo "Error: Failed to fetch channels: $CHANNELS_ERROR" >&2
  exit 1
fi

# Find #general-noisy channel
CHANNEL_ID=$(echo "$CHANNELS" | jq -r '.channels[] | select(.name == "general-noisy") | .id')

if [ -z "$CHANNEL_ID" ] || [ "$CHANNEL_ID" == "null" ]; then
  echo "Error: Could not find #general-noisy channel" >&2
  echo "Available channels:" >&2
  echo "$CHANNELS" | jq -r '.channels[] | select(.is_member == true) | "  #\(.name) (ID: \(.id))"' >&2
  exit 1
fi

echo "Found #general-noisy channel (ID: $CHANNEL_ID)"
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
echo "# Slack configuration (added by setupSlack.sh)" >>"$ENV_FILE"
echo "SLACK_CHANNEL_ID=$CHANNEL_ID" >>"$ENV_FILE"
echo "SLACK_BEARER_TOKEN=$USER_TOKEN" >>"$ENV_FILE"

echo "=========================================="
echo "Configuration saved to $ENV_FILE"
echo "=========================================="
echo ""
echo "Added:"
echo "  SLACK_CHANNEL_ID=$CHANNEL_ID"
echo "  SLACK_BEARER_TOKEN=$USER_TOKEN"
echo ""
