#!/usr/bin/env python3
"""Codex PostToolUse hook for failed test/build commands."""

from __future__ import annotations

import json
import re
import sys
from typing import Any


TESTISH_COMMAND = re.compile(
    r"(^|[\s'\"`])("
    r"npm\s+run\s+(test|lint|typecheck|build|security:all)"
    r"|npm\s+test"
    r"|vitest"
    r"|eslint"
    r"|tsc"
    r"|semgrep"
    r"|gitleaks"
    r")(?=$|[\s'\"`])"
)


def read_payload() -> dict[str, Any]:
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}


def nested_get(obj: Any, *path: str) -> Any:
    cur = obj
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


def extract_command(payload: dict[str, Any]) -> str:
    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return ""
    for key in ("command", "cmd"):
        value = tool_input.get(key)
        if isinstance(value, str):
            return value
    return ""


def extract_exit_code(payload: dict[str, Any]) -> int | None:
    candidates = (
        nested_get(payload, "tool_response", "exit_code"),
        nested_get(payload, "tool_response", "exitCode"),
        nested_get(payload, "tool_response", "output", "exit_code"),
        nested_get(payload, "tool_response", "output", "exitCode"),
    )
    for value in candidates:
        if isinstance(value, int):
            return value
    return None


def main() -> int:
    payload = read_payload()
    if payload.get("hook_event_name") != "PostToolUse":
        return 0

    if payload.get("tool_name") != "Bash":
        return 0

    command = extract_command(payload)
    if not command or not TESTISH_COMMAND.search(command):
        return 0

    exit_code = extract_exit_code(payload)
    if exit_code in (None, 0):
        return 0

    response = {
        "decision": "block",
        "reason": (
            "A validation command failed. Inspect the failure, fix the smallest safe issue, "
            "re-run the relevant checks first, then broaden validation if needed. Follow the "
            "workflow in .codex/hooks/on-test-failure.md."
        ),
        "continue": False,
        "stopReason": "validation_failed",
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                f"Failed validation command: {command}\n"
                "Prioritize failure triage before continuing with unrelated work."
            ),
        },
    }
    json.dump(response, sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
