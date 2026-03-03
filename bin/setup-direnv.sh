#!/usr/bin/env bash

if command -v direnv >/dev/null 2>&1; then
  set -e
  direnv allow .
fi

exit 0
