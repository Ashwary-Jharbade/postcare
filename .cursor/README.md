# AI-Driven Development Pipeline for Cursor IDE

A fully automated, agent-powered development workflow for React projects inside Cursor. Developers describe a feature at a high level, provide a ticket number, and the AI handles planning, implementation, testing, and review — with proper git hygiene throughout.

---

## Quick Start

### 1. Copy pipeline files into your project
```
.cursor/
  agents/
    plan-agent.mdc
    develop-agent.mdc
    test-agent.mdc
    review-agent.mdc
  rules/
    project.mdc
  settings.json
ai-dev/
  .gitignore
scripts/
  setup-hooks.sh
```

### 2. Install git hooks
```bash
bash scripts/setup-hooks.sh
```

### 3. Update `project.mdc` for your project
Open `.cursor/rules/project.mdc` and update:
- Project stack details (state management library, styling approach, test runner)
- Any project-specific coding standards

### 4. Start using slash commands in Cursor Agent mode

---

## Slash Commands

| Command | Trigger | What it does |
|---------|---------|--------------|
| `/plan <ticket> <description>` | Plan Agent | Git hygiene + plan.md + control.md |
| `/replan <ticket> <changes>` | Plan Agent | Update plan after requirement changes |
| `/develop <ticket>` | Develop Agent | Implement approved plan |
| `/test <ticket>` | Test Agent | Write + run tests, update testcases.md |
| `/review <ticket>` | Review Agent | Full code review against plan & standards |

---

## The Full Pipeline Flow

```
Developer types: /plan CUR-42 Add user profile avatar upload with crop support

┌─────────────────────────────────────────────────────────────┐
│  PLAN AGENT                                                 │
│  1. Check current branch                                    │
│  2. Stash uncommitted changes (if any)                      │
│  3. Checkout develop + pull latest                          │
│  4. Create feature/CUR-42-user-avatar-upload                │
│  5. Read project structure                                  │
│  6. Write ai-dev/CUR-42/plan.md                             │
│  7. Write ai-dev/CUR-42/control.md                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
          👤 Developer reviews plan.md
          👤 Team discusses and approves
          👤 Sets control.md Plan Approved → "approved"
                          ↓
Developer types: /develop CUR-42

┌─────────────────────────────────────────────────────────────┐
│  DEVELOP AGENT                                              │
│  1. Check control.md — must be approved                     │
│  2. Read plan.md fully                                      │
│  3. Create development.md with task tracker                 │
│  4. Implement each slice (commits after each)               │
│  5. Update task statuses as completed                       │
│  6. Run lint check                                          │
│  7. Update control.md development → done                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
Developer types: /test CUR-42

┌─────────────────────────────────────────────────────────────┐
│  TEST AGENT                                                 │
│  1. Read plan.md + development.md                           │
│  2. Write unit tests for hooks/utils                        │
│  3. Write integration tests for components                  │
│  4. Run test suite                                          │
│  5. Write testcases.md with stats                           │
│  6. Update control.md testing → done/failed                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
Developer types: /review CUR-42

┌─────────────────────────────────────────────────────────────┐
│  REVIEW AGENT                                               │
│  1. Read all ticket artefacts                               │
│  2. Get git diff vs develop                                 │
│  3. Check plan completeness                                 │
│  4. Review: React patterns, TS, a11y, perf, security        │
│  5. Output structured review report                         │
│  6. Update control.md review → done                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
          👤 Developer raises PR
```

---

## Folder Structure per Ticket

```
ai-dev/
  CUR-42/
    plan.md           ← Architecture, scope, slices, assumptions
    control.md        ← Pipeline status board (the source of truth)
    development.md    ← Task-by-task implementation tracker
    testcases.md      ← Test results and stats
```

All four files are committed to the feature branch and travel with the PR — giving reviewers full context on the decision-making process.

---

## control.md — The Pipeline Gate

`control.md` is the single source of truth for a ticket's progress. **Only one field requires human input**: `Plan Approved`.

```markdown
| Phase          | Status          |
|----------------|-----------------|
| Planning       | done            |
| Plan Approved  | approved        |  ← Human changes this
| Development    | done            |
| Testing        | done            |
| Review         | done            |
```

Agents enforce these gates:
- `/develop` will not run unless `Plan Approved = approved`
- `/test` will not run unless `Development = done`
- `/review` always runs but warns if testing hasn't passed

---

## Handling Requirement Changes

### Before development starts → `/replan`
```
/replan CUR-42 Product changed — crop feature is out of scope, keep avatar upload only
```
- Updates plan.md
- Resets Plan Approved to `not-approved`
- Requires re-approval before `/develop`

### During development → Agent detects drift
If the develop agent notices the current code doesn't match the plan (because the dev team told it requirements changed), it:
- Logs the drift in `development.md`'s Requirement Drift Log
- Adjusts remaining tasks
- Recommends running `/replan` to keep plan.md in sync

---

## Git Conventions

**Branch naming**: `feature/<ticket>-<short-slug>`
```
feature/CUR-42-user-avatar-upload
feature/CUR-99-fix-login-redirect
```

**Commit format** (enforced by commit-msg hook):
```
feat(CUR-42): add AvatarUploader component — Slice 1 of 3
fix(CUR-99): handle null session on redirect
test(CUR-42): unit tests for useAvatarCrop hook
```

**Auto-stash message format**:
```
[AI-PIPELINE] CUR-42 — auto-stash before branch switch
```

---

## Git Hooks (installed by `setup-hooks.sh`)

| Hook | Runs | Checks |
|------|------|--------|
| `pre-commit` | Before every commit | ESLint, TypeScript |
| `commit-msg` | On commit | Conventional commit format |
| `pre-push` | Before push | Warns on direct push to develop/main |

---

## Customising the Pipeline

### Adding project-specific rules
Edit `.cursor/rules/project.mdc` — the agents read this file and incorporate your stack details, naming conventions, and standards into every decision.

### Changing the test runner
In `.cursor/agents/test-agent.mdc`, update the test run command in Phase 4 to match your setup (Vitest, CRA, custom Jest config, etc.).

### Changing the branch base
By default the pipeline uses `develop`. If your project uses `main` as the integration branch, update the git commands in `plan-agent.mdc` Phase 1.

---

## Requirements

- **Cursor** with Agent mode enabled
- **Node.js** 18+
- **Git** 2.23+
- A React project with Jest (or Vitest) configured
- ESLint configured in the project root
