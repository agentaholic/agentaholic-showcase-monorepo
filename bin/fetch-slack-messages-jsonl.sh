#!/usr/bin/env -S direnv exec . bash
set -euo pipefail

# Fetch the last 24 hours of Slack messages from a channel and output as JSONL
#
# Required environment variables:
#   SLACK_CHANNEL_ID    - The Slack channel ID to fetch messages from
#   SLACK_BEARER_TOKEN  - Slack API bearer token with conversations:history scope
#
# Usage:
#   ./bin/fetch-slack-messages.sh              # Output to stdout
#   ./bin/fetch-slack-messages.sh > output.jsonl  # Save to file

# Validate environment variables
if [[ -z "${SLACK_CHANNEL_ID:-}" ]] || [[ -z "${SLACK_BEARER_TOKEN:-}" ]]; then
  echo "required environment variables: SLACK_CHANNEL_ID and SLACK_BEARER_TOKEN" >&2
  echo "use ./bin/setupSlack.sh to set up Slack OAuth for this script" >&2
  exit 1
fi

# Calculate timestamp for 24 hours ago (cross-platform)
if [[ "$(uname)" == "Darwin" ]]; then
  # macOS
  OLDEST=$(date -v-24H +%s)
else
  # Linux
  OLDEST=$(date -d '24 hours ago' +%s)
fi

# Pagination loop
cursor=""
while true; do
  # Build URL with optional cursor parameter
  url="https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL_ID}&oldest=${OLDEST}&limit=1000"
  if [[ -n "$cursor" ]]; then
    url="${url}&cursor=${cursor}"
  fi

  # Fetch messages
  response=$(curl -s -X GET "$url" -H "Authorization: Bearer ${SLACK_BEARER_TOKEN}")

  # Check if the API call was successful
  ok=$(echo "$response" | jq -r '.ok')
  if [[ "$ok" != "true" ]]; then
    error=$(echo "$response" | jq -r '.error // "Unknown error"')
    echo "Error: Slack API returned error: $error" >&2
    exit 1
  fi

  # Output messages as JSONL (one JSON object per line)
  echo "$response" | jq -c '.messages[]'

  # Check if there are more pages
  has_more=$(echo "$response" | jq -r '.has_more')
  if [[ "$has_more" != "true" ]]; then
    break
  fi

  # Get next cursor for pagination
  cursor=$(echo "$response" | jq -r '.response_metadata.next_cursor')
  if [[ -z "$cursor" || "$cursor" == "null" ]]; then
    break
  fi
done
