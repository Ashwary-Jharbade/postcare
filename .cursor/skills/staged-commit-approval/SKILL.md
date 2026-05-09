---
name: staged-commit-approval
description: >-
  Stages git changes, drafts a conventional commit message from the diff, and
  requires explicit human approval before running git commit. Use when the user
  wants to commit via the Commit Agent or /commit-approve workflow.
disable-model-invocation: true
---

# Staged commit with human approval

## Non-negotiables

1. **Never run `git commit` in the same assistant turn as staging or drafting the message.** Always stop and wait for the human’s **next message**.
2. **Never `git push`** unless the user explicitly asks in that follow-up.
3. **Never amend or force-push** unless the user explicitly requests it.
4. If there is **nothing to commit**, say so and do not run `git commit`.

## Workflow

### 1. Inspect

From the repository root:

```bash
git branch --show-current
git status -sb
git diff --stat
git diff          # if small; otherwise rely on --stat + sampled hunks
```

If useful: `git log -3 --oneline` for tone of recent messages.

### 2. Staging strategy

- **Default (safe):** stage **tracked** changes only:

  ```bash
  git add -u
  ```

- **Untracked files:** list them. Do **not** `git add` untracked files unless the user’s first message says **`all`**, **`include untracked`**, or names specific paths.
- If the user named **specific paths** in the chat, use `git add -- <paths>` only.

After staging:

```bash
git diff --staged --stat
git diff --staged     # when needed to refine the message
```

### 3. Draft commit message

Follow **Conventional Commits** and Postcare-style prefixes:

- `feat:` / `fix:` / `test:` / `chore:` / `docs:` / `refactor:` / `style:` / `ci:` as appropriate.
- **Subject:** imperative mood, ~50–72 characters, no trailing period.
- **Body (optional):** blank line after subject; explain *why* or notable tradeoffs if the diff is non-obvious.

Examples:

```
feat(requests): add cURL import warnings for unsupported flags

test: cover auth reset when applying imported cURL
```

Avoid leaking secrets, tokens, or internal-only URLs in the message.

### 4. Human approval (mandatory)

End the first response with a clear block:

- Staged summary (`git diff --staged --stat` or short bullet list).
- **Proposed commit message** in a fenced code block (subject + optional body).
- Untracked files left out (if any) and how to include them.
- **Exact instructions:** e.g. “Reply **`approve`** to run `git commit` with the message above, or paste an edited message, or **`cancel`** to unstage / do nothing.”

**Do not run `git commit` until** the user’s **next** message clearly approves (e.g. `approve`, `yes`, `lgtm`, or a full replacement message they want used verbatim).

If they **cancel**: offer `git restore --staged .` or path-specific unstaging; do not commit.

### 5. Commit (only after approval)

Use the **approved** subject/body. Single command:

```bash
git commit -m "<subject>" -m "<body>"
```

Or one `-m` if body is empty. If the user pasted a multi-line message, use `git commit -F -` with a here-doc or a temp file only if the environment allows; otherwise `-m` first line and `-m` second paragraph.

Confirm with `git status -sb` and show the new commit hash (`git log -1 --oneline`).

## Edge cases

- **Pre-commit hooks fail:** show stderr; leave commit undone; suggest fixes—do not `--no-verify` unless the user explicitly orders it.
- **Merge conflicts / rebase in progress:** stop; tell the human to resolve first.
- **Submodules / multiple repos:** only operate in the workspace root unless the user specifies otherwise.
