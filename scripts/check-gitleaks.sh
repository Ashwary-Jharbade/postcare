#!/bin/sh

set -eu

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks is not installed. Install the open-source gitleaks CLI to run secret scanning."
  exit 1
fi

gitleaks detect --source . --no-banner
