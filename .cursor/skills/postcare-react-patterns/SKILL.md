---
name: postcare-react-patterns
description: >-
  React 19 patterns for Postcare—state choice (useState, useReducer, Context,
  store), composition (compound components, render props, slots), hooks and
  custom hooks, memoization discipline, error boundaries, and feature vs
  shared folder layout. Use when building or refactoring UI, data flow,
  performance, or file placement in src/.
disable-model-invocation: true
---

# Postcare React patterns

Postcare is React 19 + TypeScript, Vite, Dexie, Vitest. **There is no Redux/global store in this repo today**—`App` and feature hooks own coordination; add a store only for a clear cross-cutting need and team agreement.

---

## State: useState vs useReducer vs Context vs global store

| Tool | Prefer when | Postcare examples / notes |
|------|-------------|---------------------------|
| **useState** | A few independent values; updates are simple setters; no intertwined transitions. | Modal open flags, selected IDs, local form fields. `App.tsx` selection state. |
| **useReducer** | Several related fields; **next state depends on previous**; multiple event types; you want one update function and testable transitions. | Multi-step wizards, complex editors with undo-style actions, request composer state if it grows past ~3 coupled setters. |
| **Context** | Many consumers need the **same** read-mostly or moderately updated value; avoid prop drilling **without** turning every leaf into a re-render hotspot. | `ConfirmProvider` / `ConfirmContext` pattern (`src/hooks/`). Theme or “current collection” only if profiling shows prop drilling pain—then split contexts (state vs actions) or use selectors. |
| **Global store (e.g. Redux)** | Very large app, time-travel debugging, middleware, or state truly shared across distant trees **and** Context becomes unmaintainable. | **Not used** here; default is feature hooks + Dexie + lifted state in `App` or a feature root. |

**Rules of thumb**

- Start with **useState**; reach for **useReducer** when you name three+ “if we change A we must also change B” rules.
- **Context** for cross-cutting **services** (confirm, future auth shell)—not for every feature’s database row.
- **Derived data:** compute with **useMemo** (or plain variables in render), not duplicate state—see Memo section.
- **Server/local persistence:** state that must survive reloads belongs in **Dexie** (`src/lib/storage/`) and thin **feature hooks** (`useCollections`, `useEnvironments`), not a giant client store.

---

## Component composition

### Compound components

Use when a parent concept has **named subparts** that share implicit state (tabs, menus, composer panels).

- Parent holds state or context; children are **static properties** on the parent component (`Panel.Header`, `Panel.Body`).
- Good for consistent a11y wiring (one id/aria owner).

### Render props / children-as-function

Use when the **parent supplies data or behaviour** and the **caller customises rendering** without forking the parent.

- Prefer **`children` function** only when it measurably reduces duplication; otherwise a normal **component prop** (`renderFooter={<Foo />}`) is often clearer in TS.

### Slots (prop injection)

Use **optional ReactNode props** (`header`, `footer`, `emptyState`) for layout shells—matches Postcare’s pragmatic style (`src/components/`, feature list views).

- Prefer **named slots** over a single `children` when order and semantics matter.

**Postcare bias:** favour **named exports**, small feature components under `src/features/<feature>/`, and **composition in the feature** before adding a generic compound abstraction.

---

## Hook rules and custom hooks

### Rules (React)

- Only call hooks at the **top level** of function components or custom hooks—never in loops, conditions, or nested non-hook functions.
- **Custom hooks** must start with **`use`**.
- Dependencies: **exhaustive deps** for `useEffect` / `useMemo` / `useCallback` unless you have a documented exception (eslint suppression + comment).

### Custom hook structure in this repo

| Location | Purpose |
|----------|---------|
| `src/features/<feature>/use*.ts(x)` | Feature-specific data + UI orchestration (e.g. `useRequestComposer`, `useCollections`). |
| `src/hooks/` | **App-wide** primitives reused by multiple features (`useConfirm`, providers). |
| `src/lib/**` | **Pure logic**—no hooks unless the module is explicitly a hook module; prefer keeping IO and React separate. |

**Shape**

- **One main concern per hook**; return a **small object or tuple** with stable names.
- **Async:** expose `status` / `error` / `data`; use `useEffect` only for subscriptions or IO that must mount/unmount—do not sync derived state in effects.
- **Data from Dexie:** encapsulate subscribe/load in the hook; components stay declarative.

---

## memo, useMemo, useCallback — when and when not

### React.memo

- **Use** for components that **often re-render with the same props** when parents update, and profiling shows cost (lists, heavy subtrees, charts).
- **Skip** for cheap leaf components—memo has its own comparison cost.
- **Don’t** wrap everything by default.

### useMemo

- **Use** for **expensive pure computations** (large transforms, sorting, building maps) and **referential stability** when a **memoised child** or effect depends on object/array identity.
- **Skip** for trivial work (concatenating two strings, simple filters on tiny arrays)—readability wins.
- **Not** a semantic guarantee of “cache forever”—assume React may discard.

### useCallback

- **Use** when passing callbacks to **memoised children** or **effect dependencies** need a **stable** function reference.
- **Skip** when the child is not memoised and no dependency array requires stability—creates noise.

**Postcare:** `App.tsx` uses `useMemo` for derived lists from hook outputs—good pattern when parent state churns but collections array identity matters.

---

## Error boundary placement

There is **no error boundary in the repo yet**; add them deliberately.

| Layer | Role |
|-------|------|
| **Root (`main.tsx` / `App`)** | Last-resort **shell**: “Something went wrong” + reload; log to console; never leave a blank screen. |
| **Heavy feature** | Wrap **risky** subtrees (AI panel, import/export, code generation) so one failure **does not** unmount the whole app. |
| **Route-like panes** | If the app gains routes, one boundary **per major section** balances isolation vs surface area. |

**Implementation:** React still expects a **class component** (or a small dependency like `react-error-boundary`) for `getDerivedStateFromError` / `componentDidCatch`. **Do not** try to implement boundaries with hooks alone.

**Children:** boundaries catch **render** errors in the tree below, not async errors inside event handlers—those need `try/catch` or error state in the feature.

---

## Folder structure: feature-first vs shared

**Actual layout (follow it for new code):**

| Path | Put here |
|------|----------|
| `src/domain/` | Shared **types/models** (`models.ts`)—no React. |
| `src/lib/` | **Pure** utilities, storage, codegen, redaction, AI clients—minimal React. |
| `src/features/<feature>/` | Feature UI, feature-specific hooks, feature CSS colocated when small. |
| `src/components/` | **Reusable presentational** pieces (dialogs, buttons) used by **multiple** features. |
| `src/hooks/` | Cross-feature hooks and **providers**. |

**Heuristics**

- **New screen or workflow** → start under **`src/features/<name>/`**.
- **Second feature needs the same UI** → lift to **`src/components/`** or **`src/hooks/`** only when the abstraction is clear.
- **Avoid** `components/` for business rules—keep domain logic in **`lib/`** or feature hooks.

---

## Quick checklist before a PR

- [ ] State choice justified (not redundant derived state).
- [ ] Hooks: top-level, `use` prefix, deps honest.
- [ ] Memoization only where it buys measurable clarity or performance.
- [ ] Feature files live under `src/features/…`; shared pieces in `components/` or `hooks/` intentionally.
- [ ] Async and user-visible failures have **loading/error** UI (project standard).
