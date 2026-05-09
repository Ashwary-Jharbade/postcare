#!/usr/bin/env bash
# =============================================================================
# AI Pipeline Git Hooks Setup
# Run: bash scripts/setup-hooks.sh
# =============================================================================

set -e

HOOKS_DIR=".git/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 Setting up AI Pipeline git hooks..."

# ─────────────────────────────────────────────
# pre-commit hook
# Runs lint check before every commit
# ─────────────────────────────────────────────
cat > "$HOOKS_DIR/pre-commit" << 'HOOK'
#!/usr/bin/env bash
# AI Pipeline — pre-commit hook

echo "🔍 Running pre-commit checks..."

# 1. ESLint
if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
  echo "  → ESLint..."
  npx eslint --ext .ts,.tsx src/ --max-warnings 0
  if [ $? -ne 0 ]; then
    echo "❌ ESLint failed. Fix errors before committing."
    exit 1
  fi
fi

# 2. TypeScript type check (if TS project)
if [ -f "tsconfig.json" ]; then
  echo "  → TypeScript type check..."
  npx tsc --noEmit
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Fix before committing."
    exit 1
  fi
fi

echo "✅ Pre-commit checks passed."
HOOK

chmod +x "$HOOKS_DIR/pre-commit"
echo "  ✅ pre-commit hook installed"

# ─────────────────────────────────────────────
# commit-msg hook
# Enforces conventional commit format
# ─────────────────────────────────────────────
cat > "$HOOKS_DIR/commit-msg" << 'HOOK'
#!/usr/bin/env bash
# AI Pipeline — commit-msg hook
# Enforces: type(scope): message
# Types: feat, fix, chore, docs, test, refactor, style, perf, ci

COMMIT_MSG=$(cat "$1")
PATTERN="^(feat|fix|chore|docs|test|refactor|style|perf|ci)(\([a-zA-Z0-9_-]+\))?: .{1,100}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "❌ Invalid commit message format."
  echo "   Expected: type(scope): description"
  echo "   Types: feat | fix | chore | docs | test | refactor | style | perf | ci"
  echo "   Example: feat(CUR-42): add user avatar upload component"
  echo ""
  echo "   Your message: $COMMIT_MSG"
  exit 1
fi

echo "✅ Commit message format valid."
HOOK

chmod +x "$HOOKS_DIR/commit-msg"
echo "  ✅ commit-msg hook installed"

# ─────────────────────────────────────────────
# pre-push hook
# Warns before pushing to develop or main
# ─────────────────────────────────────────────
cat > "$HOOKS_DIR/pre-push" << 'HOOK'
#!/usr/bin/env bash
# AI Pipeline — pre-push hook

PROTECTED_BRANCHES="develop main"
CURRENT_BRANCH=$(git branch --show-current)

for BRANCH in $PROTECTED_BRANCHES; do
  if [ "$CURRENT_BRANCH" = "$BRANCH" ]; then
    echo ""
    echo "⚠️  You are about to push directly to '$BRANCH'."
    echo "   The AI pipeline expects work to be done on feature branches."
    echo "   Are you sure? (y/N)"
    read -r CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "Push cancelled."
      exit 1
    fi
  fi
done

echo "✅ Pre-push check complete."
HOOK

chmod +x "$HOOKS_DIR/pre-push"
echo "  ✅ pre-push hook installed"

echo ""
echo "🎉 All git hooks installed successfully!"
echo "   - pre-commit: ESLint + TypeScript check"
echo "   - commit-msg: Conventional commit format"
echo "   - pre-push:   Protected branch guard"
