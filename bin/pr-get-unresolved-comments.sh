#!/usr/bin/env bash
set -euo pipefail

# Get PR number for the current branch
PR_NUMBER="${1:-$(gh pr view --json number -q '.number' 2>/dev/null || echo '')}"

if [ -z "$PR_NUMBER" ]; then
  echo "Error: No PR found for current branch and no PR number provided" >&2
  echo "Usage: $0 [pr-number]" >&2
  exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
OWNER=$(echo "$REPO" | cut -d'/' -f1)
NAME=$(echo "$REPO" | cut -d'/' -f2)

# Initialize variables for pagination
ALL_THREADS="[]"
HAS_NEXT_PAGE=true
CURSOR="null"

# Fetch all unresolved review threads using GraphQL with pagination
while [ "$HAS_NEXT_PAGE" = "true" ]; do
  # Build the after parameter conditionally
  if [ "$CURSOR" = "null" ]; then
    AFTER_PARAM=""
  else
    AFTER_PARAM=", after: \"$CURSOR\""
  fi

  # Fetch one page of review threads
  RESPONSE=$(gh api graphql -f query="
query {
  repository(owner: \"$OWNER\", name: \"$NAME\") {
    pullRequest(number: $PR_NUMBER) {
      reviewThreads(first: 50$AFTER_PARAM) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          isResolved
          isOutdated
          comments(first: 10) {
            nodes {
              id
              databaseId
              body
              path
              line
              originalCommit {
                oid
              }
              author {
                login
              }
              createdAt
              url
            }
          }
        }
      }
    }
  }
}")

  # Extract page info
  HAS_NEXT_PAGE=$(echo "$RESPONSE" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  CURSOR=$(echo "$RESPONSE" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor')

  # Extract and accumulate unresolved threads from this page
  PAGE_THREADS=$(echo "$RESPONSE" | jq '[.data.repository.pullRequest.reviewThreads.nodes | map(select(.isResolved == false)) | .[] | .comments.nodes[0] | {id: .databaseId, body: .body, path: .path, line: .line, commit_sha: .originalCommit.oid, user: .author.login, created_at: .createdAt, html_url: .url}]')
  ALL_THREADS=$(echo "$ALL_THREADS" | jq --argjson page "$PAGE_THREADS" '. + $page')
done

# Output accumulated results
echo "$ALL_THREADS"
