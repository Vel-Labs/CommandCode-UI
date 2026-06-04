# Roadmap

---

## Phase 1: Stabilize the Starter

**Goal**: Make the existing Electron scaffold robust enough for a real local smoke test.

- [x] **1.1** Run `npm install`, fix dependency/API mismatches
- [x] **1.2** Run `npm run typecheck`, fix all TypeScript errors
- [x] **1.3** Run the app in Mock mode, verify `/help`, `/plan`, `/design`, `/exit`
- [x] **1.4** Run `npm run doctor` against a real Command Code install
- [x] **1.5** Start a real session in a disposable repo
- [x] **1.6** Verify `/exit` handling; add Stop / Force Stop (Ctrl-C first, then kill PTY)
- [x] **1.7** Add a session transcript viewer (ANSI path from main process metadata)
- [x] **1.8** Add unit tests for `buildInteractiveArgs` and `buildHeadlessArgs`
- [x] **1.9** Create `docs/SMOKE_TEST_REPORT.md`

**Commit**: `chore: verify starter build and typecheck`  
**Commit**: `test: cover command code argument builders`  
**Commit**: `feat: add real session smoke path and transcript metadata`

---

## Phase 2: Core Extraction & Event Model

**Goal**: Split CLI logic out of the Electron main process into a transport-agnostic `src/core`.

- [x] **2.1** Create `src/core/cli.ts` — argument builders, binary resolution, no Electron imports
- [x] **2.2** Create `src/core/sessions.ts` — `SessionManager` as an event emitter
- [x] **2.3** Create `src/core/types.ts` — shared types
- [x] **2.4** Make `SessionManager.start(options)` return `{ id, command, args, cwd, mock }`
- [x] **2.5** Expose `data`, `exit`, `error` events for consumers
- [x] **2.6** Wire Electron IPC to consume the core `SessionManager` directly

**Acceptance**: Existing Electron mock mode still works after extraction.

---

## Phase 3: Local Server

**Goal**: Add a localhost HTTP + WebSocket server that uses the same core.

- [ ] **3.1** Add `src/server/` with a minimal Node HTTP server + `ws`
- [ ] **3.2** Implement REST endpoints:
  - `GET /health`
  - `POST /api/check`
  - `POST /api/status`
  - `POST /api/models`
  - `POST /api/headless`
  - `POST /api/sessions`
  - `POST /api/sessions/:id/write`
  - `POST /api/sessions/:id/resize`
  - `DELETE /api/sessions/:id`
- [ ] **3.3** Implement WebSocket path `/ws/sessions/:id` for PTY data and exit events
- [ ] **3.4** Bind to `127.0.0.1` by default
- [ ] **3.5** Generate a random token on startup, require it on every request
- [ ] **3.6** Print the local URL with token at startup

**Acceptance**: Browser can connect to localhost mode and run a mock PTY session.

---

## Phase 4: CLI Entry Point

**Goal**: Ship a `ccgui` CLI command for serve/doctor/open.

- [ ] **4.1** Create `src/cli/ccgui.ts`
- [ ] **4.2** `serve` — starts local server, serves built web app when available
- [ ] **4.3** `doctor` — checks node, platform, Command Code binary, `cmd status --json`, Windows/WSL hints
- [ ] **4.4** `open` — launches the default browser pointing at the local server

---

## Phase 5: Electron as Client Shell

**Goal**: Make Electron a thin shell that loads the local server URL (same path as browser).

- [ ] **5.1** Electron starts the local server internally on launch
- [ ] **5.2** Renderer loads `http://127.0.0.1:{port}?token={token}` instead of direct IPC for session data
- [ ] **5.3** Keep IPC for window management only (not session transport)

**Acceptance**: Electron and browser mode share the same transport, exercised identically.

---

## Phase 6: Package Scripts & Build

**Goal**: Support all run modes via npm scripts.

- [x] **6.1** `dev` — Electron dev mode
- [ ] **6.2** `dev:web` — Vite only (browser UI)
- [ ] **6.3** `dev:server` — local server only
- [ ] **6.4** `serve` — built localhost mode
- [x] **6.5** `doctor` — environment check script

---

## Phase 7: Headless & Browser Integration

**Goal**: Full parity between Electron and browser paths.

- [ ] **7.1** Browser can run headless mock tasks
- [ ] **7.2** Browser can run headless real `cmd --print` tasks
- [ ] **7.3** Browser can run interactive PTY sessions (mock + real)
- [ ] **7.4** Security token required for all HTTP and WebSocket calls
- [ ] **7.5** Verify typecheck passes after all changes

---

## Phase 8: Enhanced Daily Features

**Goal**: Improve daily usefulness (Kickoff second pass).

- [ ] **8.1** Multiple session tabs
- [ ] **8.2** Recent projects
- [ ] **8.3** Command history and favorites palette
- [ ] **8.4** Visible permission-mode rail
- [ ] **8.5** Headless job history table
- [ ] **8.6** Model dropdown (from `cmd --list-models`) with star-to-favorite persistence
- [ ] **8.7** `cmd status --json` parsed into a clear auth card
- [ ] **8.8** `/ide` and `--ide-setup` diagnostics panel (marked experimental)
- [ ] **8.9** In-app docs sidecar — render `commandcode.ai/docs` and any linked docs in an internal `BrowserView`/`webview` panel instead of opening external browser

**Commit**: `feat: add session tabs and recent projects`

---

## Phase 9: Documentation & Platform Notes

**Goal**: Clear cross-platform guidance.

- [ ] **9.1** `README.md` — explain desktop vs localhost browser modes
- [x] **9.2** `docs/CROSS_PLATFORM_STRATEGY.md` — architecture decisions and rationale
- [x] **9.3** `docs/SECURITY.md` — local server token/origin requirements
- [x] **9.4** `docs/TEST_PLAN.md` — macOS, Linux, WSL, native Windows smoke checks
- [x] **9.5** `docs/SMOKE_TEST_REPORT.md` — OS, terminal, Command Code version, results
- [ ] **9.6** README explains Windows `cmd` binary ambiguity
- [ ] **9.7** README states native Windows is experimental if Command Code is alpha there; WSL is recommended

---

## Final Acceptance Criteria

- User can choose a project and start/stop a Command Code session from the GUI
- Terminal behaves like a real terminal for interactive sessions
- User can run one-shot headless prompts and see stdout/stderr/exit code
- App works without Command Code installed via Mock mode
- Renderer cannot run arbitrary shell commands
- Risky modes (trust, auto-accept, yolo) are visually obvious
- Electron mock mode still works
- Browser can connect to localhost and run mock PTY sessions
- Browser can run headless mock or real `cmd --print` tasks
- Security token is required for HTTP and WebSocket calls
- Typecheck passes
- No claim is made that structured Command Code state exists unless from documented JSON or official API
