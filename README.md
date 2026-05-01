<div align="center">
  <img src="assets/postcare-logo.png" alt="Postcare logo" width="120" />

  <h1>Postcare</h1>

  <p><strong>A local-first, offline-capable API client built for developers who care about privacy, speed, and simplicity.</strong></p>

  <p>
    <a href="https://ashwary-jharbade.github.io/postcare/"><img src="https://img.shields.io/badge/demo-live-1d4ed8?style=for-the-badge" alt="Live Demo" /></a>
    <a href="#getting-started"><img src="https://img.shields.io/badge/setup-5_min-0f766e?style=for-the-badge" alt="Setup Time" /></a>
    <a href="https://github.com/Ashwary-Jharbade/postcare/fork"><img src="https://img.shields.io/badge/fork-this_repo-6366f1?style=for-the-badge" alt="Fork" /></a>
    <a href="#contributing"><img src="https://img.shields.io/badge/PRs-welcome-22c55e?style=for-the-badge" alt="PRs Welcome" /></a>
  </p>
</div>

---

## Why Postcare?

Most API clients send your data through cloud servers, require accounts, or lock features behind paywalls. **Postcare takes a different approach:**

- 🔒 **Your data stays on your device** — everything is stored in IndexedDB, never uploaded.
- 📶 **Works offline** — installable as a PWA with service-worker caching.
- 🧠 **AI-assisted, privacy-safe** — suggestions use redacted request previews, so secrets never leak into prompts.
- ⚡ **Zero backend required** — open the app and start building requests immediately.
- 🆓 **100% open source** — no accounts, no telemetry, no paywalls.

---

## Features

### 🚀 Request Composer
Build and send HTTP requests with a full-featured editor.
- **All major HTTP methods** — GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Query parameters** — key-value editor with enable/disable toggles
- **Custom headers** — add, edit, toggle, or remove headers per request
- **Request body modes** — JSON (with format/beautify), plain text, form-data, and raw with custom Content-Type
- **Auto-save** — every change is persisted to local IndexedDB in real time

### 🔐 Authentication
First-class auth support without exposing credentials.
- **Bearer token** — attach `Authorization: Bearer <token>` headers
- **API key** — custom header name + value
- **Basic auth** — username/password with Base64 encoding
- **OAuth 2.0** — contract defined, UI planned

### 📁 Collections
Organize requests into logical groups.
- Create, rename, and delete collections
- Drag requests between collections
- Filter and search across all collections
- Import/export entire collection bundles as JSON

### 🌍 Environments & Variable Substitution
Switch contexts without editing individual requests.
- **Multiple environments** — create Local, Staging, Production, etc.
- **Color-coded indicators** — quickly identify the active environment
- **`{{variable}}` syntax** — use placeholders in URLs, headers, query params, and body
- **Secret variables** — values marked as secret are masked in the UI
- **Variable info panel** — real-time resolution status showing which variables are found vs. missing

### 📊 Response Viewer
Inspect API responses with a tabbed, multi-format viewer.
- **Pretty view** — auto-formatted JSON with syntax highlighting
- **Raw view** — unprocessed payload for debugging malformed responses
- **HTML preview** — rendered HTML output for web endpoints
- **Response metadata** — status code, duration, response headers, and body size

### 🧪 Mock Simulation
Test client error handling without touching a real backend.
- **Network error** — simulate connection failures
- **Timeout** — test timeout handling logic
- **HTTP error** — force specific status codes (e.g. 500, 404)
- **Malformed JSON** — test parser resilience
- **Empty body / Large payload** — edge-case testing
- **Configurable delay** — add artificial latency in milliseconds

### 🔍 Diagnostics & Tracing
Debug request lifecycle with structured execution traces.
- Unique trace ID per execution
- Severity classification (info, warning, error)
- Step-by-step execution log (start → prepared → response → complete)
- Duration, response size, error category, and simulation mode tracking

### 🔄 Response Comparison
Compare API responses across environments side-by-side.
- Header diff counts and removed header indicators
- Payload and JSON structure diff blocks
- Visual side-by-side comparison cards per environment

### 💻 Code Generator
Export requests as runnable code snippets in four languages.
- **cURL** — ready-to-paste terminal commands
- **JavaScript Fetch** — modern async/await style
- **Axios** — promise-based HTTP client
- **Python requests** — complete Python script with headers, auth, and body

### 🤖 AI Assistant
Get intelligent request improvement suggestions locally.
- Redaction-safe request previews — secrets are stripped before analysis
- Edge-case and best-practice recommendations
- Manual-apply workflow so you stay in control

### 📦 Import & Export
Move your work between machines or share with teammates.
- Export collections with all requests as portable JSON
- Import and validate collection bundles before use
- Versioned export format for forward compatibility

### 📴 Offline & PWA
Install and use Postcare like a native app.
- Installable from browser UI (Chrome, Edge, Safari)
- Service worker caches app shell for offline access
- Launches from OS app list in standalone mode

### 🛡️ Security Posture
Security by design, documented transparently.
- Data stored locally in browser IndexedDB — never auto-uploaded
- Secret variables masked in UI (stored locally, substituted at runtime)
- AI flows use redacted previews — raw credentials never reach prompt text
- Open-source-only dependencies, reviewed and documented
- Security tooling: `npm audit`, `gitleaks`, `Semgrep`

### ❓ In-App Help Center
Comprehensive, searchable documentation built into the app.
- Feature-by-feature usage guides with step-by-step instructions
- Covers every section: collections, environments, variables, execution, diagnostics, code generation, AI, import/export, security, and offline use

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 6 |
| **Storage** | IndexedDB via Dexie |
| **Styling** | Vanilla CSS with custom design tokens |
| **Testing** | Vitest + Testing Library |
| **Linting** | ESLint 9 + TypeScript ESLint |
| **Deployment** | GitHub Pages via `gh-pages` |
| **Security** | npm audit, gitleaks, Semgrep |
| **PWA** | Manual service worker + web app manifest |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Ashwary-Jharbade/postcare.git
cd postcare

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Type-check and produce production build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint checks |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run deploy` | Build and deploy to GitHub Pages |
| `npm run security:all` | Run all security checks (audit + secrets + static) |

---

## Project Structure

```
postcare/
├── src/
│   ├── components/          # Shared UI components (ConfirmDialog, etc.)
│   ├── domain/              # Core data models and type definitions
│   ├── features/
│   │   ├── collections/     # Collection list, request list, CRUD, import/export
│   │   ├── environments/    # Environment management and variable editor
│   │   ├── help/            # In-app Help Center modal
│   │   ├── requests/        # Request Composer, execution, diagnostics, code gen
│   │   └── storage/         # IndexedDB bootstrap and storage hooks
│   ├── hooks/               # Shared React hooks
│   ├── lib/
│   │   ├── ai/              # AI assistant with redaction-safe prompting
│   │   ├── body/            # Request body state utilities
│   │   ├── codegen/         # Code snippet generators (cURL, fetch, axios, Python)
│   │   ├── comparison/      # Response diff and comparison engine
│   │   ├── importexport/    # Collection/request import and export
│   │   ├── redaction/       # Secret redaction for safe logging and AI
│   │   ├── storage/         # Dexie database schema and operations
│   │   └── variables/       # {{variable}} substitution engine
│   ├── types/               # TypeScript type declarations
│   └── test/                # Test setup and utilities
├── docs/                    # Project plan, tracker, ADRs, and templates
├── scripts/                 # Security check scripts (gitleaks, Semgrep)
├── public/                  # Static assets and PWA manifest
└── assets/                  # Images and fixtures
```

---

## Contributing

**Contributions are welcome and encouraged!** Whether it's a bug fix, a new feature, improved documentation, or a design suggestion — every contribution makes Postcare better.

### How to Contribute

1. **Fork the repository**
   
   Click the [Fork](https://github.com/Ashwary-Jharbade/postcare/fork) button at the top-right of this page.

2. **Clone your fork**
   ```bash
   git clone https://github.com/<your-username>/postcare.git
   cd postcare
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

4. **Make your changes**
   - Follow the coding style (2-space indentation, ESLint + TypeScript strict mode)
   - Add tests for new behavior
   - Update documentation if applicable

5. **Run checks before committing**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

6. **Commit with a descriptive message**
   ```bash
   git commit -m "feat: add request duplication support"
   ```

7. **Push and open a Pull Request**
   ```bash
   git push origin feat/your-feature-name
   ```
   Then open a PR against `main` on the [upstream repository](https://github.com/Ashwary-Jharbade/postcare).

### Contribution Guidelines

- **Open-source dependencies only** — no proprietary packages
- **No secrets in code** — use environment variables or secret-scoped fields
- **Tests required** — new features and bug fixes must include automated tests
- **Small, focused PRs** — easier to review, test, and merge
- **Scoped commit messages** — use `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` prefixes

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/Ashwary-Jharbade/postcare/labels/good%20first%20issue) — these are beginner-friendly tasks that are well-scoped and documented.

---

## Collaboration

Want to collaborate more closely? Here are ways to get involved:

- 🐛 **Report bugs** — [Open an issue](https://github.com/Ashwary-Jharbade/postcare/issues/new) with reproduction steps
- 💡 **Suggest features** — Start a [discussion](https://github.com/Ashwary-Jharbade/postcare/discussions) or open an issue
- 🎨 **Design contributions** — UI/UX improvements, accessibility enhancements, and theme ideas are welcome
- 📖 **Documentation** — Help improve guides, add examples, or translate docs
- 🔒 **Security** — Found a vulnerability? Please report it responsibly via [GitHub Security Advisories](https://github.com/Ashwary-Jharbade/postcare/security)

---

## Roadmap

- [ ] OAuth 2.0 authentication flow UI
- [ ] Request history timeline with replay
- [ ] WebSocket and GraphQL support
- [ ] Collection-level shared auth and headers
- [ ] Playwright end-to-end tests
- [ ] Theme customization (dark mode, accent colors)
- [ ] Keyboard shortcuts and command palette

---

## License

This project is open source. See the repository for license details.

---

<div align="center">
  <p><strong>Built with care, for developers who care.</strong></p>
  <p>
    <a href="https://ashwary-jharbade.github.io/postcare/">Try the Live Demo</a> · 
    <a href="https://github.com/Ashwary-Jharbade/postcare/fork">Fork this Repo</a> · 
    <a href="https://github.com/Ashwary-Jharbade/postcare/issues">Report a Bug</a>
  </p>
</div>
