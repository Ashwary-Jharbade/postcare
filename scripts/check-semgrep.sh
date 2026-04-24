#!/bin/sh

set -eu

if ! command -v semgrep >/dev/null 2>&1; then
  echo "semgrep is not installed. Install the open-source Semgrep CLI to run static security checks."
  exit 1
fi

semgrep scan --config auto .
