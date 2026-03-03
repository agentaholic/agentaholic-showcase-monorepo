#!/usr/bin/env bash

# Usage: current-linear-ticket.sh

set -euo pipefail

TICKET_ID=$(git rev-parse --abbrev-ref HEAD | grep -oiE 'age-[0-9]+' | tr '[:lower:]' '[:upper:]')

if [[ -z "$TICKET_ID" ]]; then
  echo "Error: Could not determine ticket ID from current branch name"
  exit 1
fi

linearis issues read "$TICKET_ID"
