#!/usr/bin/env python3
"""Codex Stop hook that asks for one review/validation pass after code edits."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any


RELEVANT_SUFFIXES = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".css",
    ".py",
    ".sh",
    ".yml",
    ".yaml",
}

RELEVANT_NAMES = {
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "eslint.config.js",
}

SKIP_PREFIXES = (
    "docs/",
    "assets/",
)


def read_payload() -> dict[str, Any]:
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}


def git_root(cwd: str) -> Path | None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    return Path(result.stdout.strip())


def changed_files(root: Path) -> list[str]:
    try:
        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return []

    files: list[str] = []
    for line in result.stdout.splitlines():
        if len(line) < 4:
            continue
        path = line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1].strip()
        files.append(path)
    return files


def is_relevant(path: str) -> bool:
    if any(path.startswith(prefix) for prefix in SKIP_PREFIXES):
        return False
    file_name = Path(path).name
    if file_name in RELEVANT_NAMES:
        return True
    return Path(path).suffix in RELEVANT_SUFFIXES


def main() -> int:
    payload = read_payload()
    if payload.get("hook_event_name") != "Stop":
        return 0

    if payload.get("stop_hook_active"):
        return 0

    cwd = payload.get("cwd")
    if not isinstance(cwd, str) or not cwd:
        return 0

    root = git_root(cwd)
    if root is None:
        return 0

    relevant_changes = [path for path in changed_files(root) if is_relevant(path)]
    if not relevant_changes:
        return 0

    response = {
        "decision": "block",
        "reason": (
            "Code or config changes are present. Before ending this turn, run the relevant "
            "validation path and do a findings-first review pass. Follow .codex/hooks/"
            "on-build-complete.md."
        ),
        "systemMessage": (
            "Stop hook requested one extra validation/review pass because the worktree contains "
            "relevant code changes."
        ),
    }
    json.dump(response, sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
