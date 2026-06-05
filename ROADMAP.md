# Roadmap

## Current Status — 2026-06-04 Hardening Audit

The app is not ready to claim daily-driver or end-to-end real-session readiness yet.

Verified in the current worktree:

- `npm run typecheck` passes.
- `npx vitest run` passes with `26/26`.
- `npm run build` passes.
- `npm run smoke:server`, `npm run smoke:browser`, and `npm run smoke:headless` pass, with coverage caveats.
- Browser production mode loads from a tokenized localhost URL.
- Electron dev starts and serves the renderer through an embedded local server.

Blocked in the current worktree:

- Real interactive PTY launch fails with `posix_spawnp failed.`.
- Initial mock session output is not replayed into xterm after session start.
- Mock mode is not propagated to headless runs from the renderer.
- `/health` and other unauthenticated responses can set `ccgui-token`, allowing protected API access afterward.
- File/config write routes need stricter root allowlists.
- Runtime receipts print misleading ports when binding to `0` or when default ports are occupied.

**Active execution contract:** [docs/reports/HARDENING_GATE.md](docs/reports/HARDENING_GATE.md)

---

## Phase 1: Stabilize the Starter

**Goal**: Make the existing Electron scaffold robust enough for a real local smoke test.

- [x] **1.1** Run `npm install`, fix dependency/API mismatches
- [x] **1.2** Run `npm run typecheck`, fix all TypeScript errors
- [x] **1.3** Run the app in Mock mode, verify `/help`, `/plan`, `/design`, `/exit`
- [x] **1.4** Run `npm run doctor` against a real Command Code install
- [ ] **1.5** Start a real session in a disposable repo — blocked in current worktree by `node-pty` `posix_spawnp failed.`
- [ ] **1.6** Verify `/exit` handling; add Stop / Interrupt / Force Kill ladder — routes exist, but PTY path and UI escalation still need proof
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

- [x] **3.1** Add `src/server/` with a minimal Node HTTP server + `ws`
- [x] **3.2** Implement REST endpoints:
  - `GET /health`
  - `POST /api/check`
  - `POST /api/status`
  - `POST /api/models`
  - `POST /api/headless`
  - `POST /api/sessions`
  - `POST /api/sessions/:id/write`
  - `POST /api/sessions/:id/resize`
  - `DELETE /api/sessions/:id`
- [x] **3.3** Implement WebSocket path `/ws/sessions/:id` for PTY data and exit events
- [x] **3.4** Bind to `127.0.0.1` by default
- [ ] **3.5** Generate a random token on startup, require it on every privileged request — blocked because unauthenticated responses currently set the auth cookie
- [ ] **3.6** Print the local URL with token at startup — blocked for `port=0` and port-collision receipts

**Acceptance**: Browser can connect to localhost mode and run a mock PTY session.

**Current audit note:** Localhost mode loads, but the auth-cookie bypass and replay loss block completion.

---

## Phase 4: CLI Entry Point

**Goal**: Ship a `ccgui` CLI command for serve/doctor/open.

- [x] **4.1** Create `src/cli/ccgui.ts`
- [x] **4.2** `serve` — starts local server, serves built web app when available
- [x] **4.3** `doctor` — checks node, platform, Command Code binary, `cmd status --json`, Windows/WSL hints
- [x] **4.4** `open` — launches the default browser pointing at the local server

---

## Phase 5: Electron as Client Shell

**Goal**: Make Electron a thin shell that loads the local server URL (same path as browser).

- [x] **5.1** Electron starts the local server internally on launch
- [x] **5.2** Renderer loads `http://127.0.0.1:{port}` (token via cookie, not URL query param)
- [x] **5.3** Keep IPC for window management only (not session transport)

**Acceptance**: Electron and browser mode share the same transport, exercised identically.

**Current audit note:** Electron starts and serves the renderer, but the embedded server inherits the same auth-cookie, PTY, and replay blockers.

---

## Phase 6: Package Scripts & Build

**Goal**: Support all run modes via npm scripts.

- [x] **6.1** `dev` — Electron dev mode
- [ ] **6.2** `dev:web` — Vite only (browser UI) — works only with caveats; port auto-shift and auth/dev-token behavior need cleanup
- [x] **6.3** `dev:server` — local server only
- [ ] **6.4** `serve` — built localhost mode — blocked on unhandled `EADDRINUSE` and inaccurate port receipts
- [x] **6.5** `doctor` — environment check script
- [ ] **6.6** `smoke:pty` — prove `node-pty` can spawn a harmless shell before real interactive sessions are enabled

---

## Phase 7: Headless & Browser Integration

**Goal**: Full parity between Electron and browser paths.

- [ ] **7.1** Browser can run headless mock tasks — blocked because renderer does not pass `useMock`
- [x] **7.2** Browser can run headless real `cmd --print` tasks
- [ ] **7.3** Browser can run interactive PTY sessions (mock + real) — mock streams after attach, but initial replay is lost; real PTY fails
- [ ] **7.4** Security token required for all HTTP and WebSocket calls — blocked by auth-cookie issuance on unauthenticated responses
- [x] **7.5** Verify typecheck passes after all changes
- [ ] **7.6** Browser transport keeps one socket per session without closing `CONNECTING` sockets during callback registration
- [ ] **7.7** Active session replay remains available for late attach and tab switching

---

## Phase 8: Enhanced Daily Features

**Goal**: Improve daily usefulness (Kickoff second pass).

- [x] **8.1** Multiple session tabs — tab bar above terminal, start/switch/kill per tab
- [x] **8.2** Recent projects
- [x] **8.3** Command history and favorites palette
- [x] **8.4** Visible permission-mode rail
- [x] **8.5** Headless job history table
- [x] **8.6** Model dropdown (from `cmd --list-models`) with star-to-favorite persistence
- [x] **8.7** `cmd status --json` parsed into a clear auth card
- [x] **8.8** `/ide` and `--ide-setup` diagnostics panel (marked experimental) — parses `cmd --ide-status` output, green highlights for OK lines, refresh button in side rail
- [x] **8.9** In-app docs sidecar — render `commandcode.ai/docs` in an iframe overlay with back/forward/home navigation. Opens from a Docs button in the top bar
- [x] **8.10** Project file browser + MD preview side rail — left rail shows project file tree (expandable dirs, file type icons, sizes), clicking any file opens it in an overlay viewer with syntax-aware rendering: raw text for most files, ANSI preserved for `.ansi` files, markdown rendered inline for `.md` files
- [x] **8.11** Configurable toast notifications — session start/exit, headless complete/error. Per-category toggle in side rail
- [x] **8.12** Configurable audio cues — chirp on start, chime on complete, alert on error. Per-category enable, master volume. Zero sound by default
- [x] **8.13** Project folder bookmarks — auto-tracked via recent projects (same localStorage mechanism)
- [x] **8.14** Session discovery & resume — scan `~/.commandcode/sessions/` and `~/.commandcode/transcripts/` for `.ansi`/`.jsonl`/`.log` files, show timestamp/size, reveal in Finder
- [x] **8.15** Usage dashboard — fires a headless `/usage --json` session inside the CLI, parses JSON or regex-fallbacks total tokens/cost/runs into stat cards, shows raw output
- [x] **8.16** Taste profile manager — scan `.commandcode/taste/` and `.commandcode/taste-profiles/` directories, parse `taste.md` files into categories with confidence scores and learnings
- [x] **8.17** Agent config editor — list agents from `.commandcode/agents/` and `.agents/agents/`, show name/description, inline textarea edit and save (YAML/MD)
- [x] **8.18** MCP server panel — runs `cmd mcp list`, displays per-server status (connected/disconnected/error), tool counts, connect/disconnect buttons
- [x] **8.19** Skills browser — scan `.commandcode/skills/` and `.agents/skills/` for `SKILL.md` files, show name/description, expand to preview full content
- [x] **8.20** Memory viewer — read `COMMANDCODE.md`, `AGENTS.md`, `CLAUDE.md`, and `.commandcode/memory/*` from project root, inline markdown edit and save
- [ ] **8.21** Harden file, memory, and agent write scopes with explicit workspace/global config allowlists
- [ ] **8.22** Add operator-visible runtime status for PTY health, auth state, mock/real mode, and risky permission state
- [ ] **8.23** Move advanced local-control surfaces behind clearer risk/status boundaries

**Commit**: `feat: add session tabs and recent projects`

---

## Phase 9: Hardening Gate

**Goal**: Prove the GUI adapter is stable, scoped, and honest before adding more product surface.

Detailed contract: [docs/reports/HARDENING_GATE.md](docs/reports/HARDENING_GATE.md)

- [ ] **9.1** Fix auth-cookie issuance so `/health`, unauthenticated static routes, `401`, and `403` never grant `ccgui-token`
- [ ] **9.2** Add strict Origin/CORS handling for browser mode, dev mode, and Electron mode
- [ ] **9.3** Add PTY doctor and `smoke:pty`; disable real interactive Start when PTY is unavailable
- [ ] **9.4** Convert PTY spawn failures into structured user-facing errors, not generic HTTP 500s
- [ ] **9.5** Fix WebSocket replay and subscription ordering so mock banners and early PTY output always appear
- [ ] **9.6** Keep replay available for active sessions and tab switching
- [ ] **9.7** Pass `useMock` through renderer headless runs and label mock vs real headless history
- [ ] **9.8** Add file read allowlists, symlink escape protection, binary/large-file guards, and structured errors
- [ ] **9.9** Restrict memory and agent writes to known project/global config roots with visible destination scope
- [ ] **9.10** Add fake-PTY server/session tests that do not require Command Code to be installed
- [ ] **9.11** Add auth regression tests for tokenized initial load, `/health`, cookies, headers, WebSocket auth, and unexpected origins
- [ ] **9.12** Add browser transport tests for per-session sockets, `CONNECTING` socket reuse, replay, and cleanup
- [ ] **9.13** Make runtime receipts print actual bound ports and handle occupied default ports cleanly
- [ ] **9.14** Update smoke scripts so "mock" checks actually use mock semantics
- [ ] **9.15** Dogfood browser and Electron end to end: mock interactive, mock headless, real headless, real interactive, stop ladder, transcript reveal

**Acceptance**:

- No P0 item remains open in `docs/reports/HARDENING_GATE.md`.
- Every P0 item has an automated regression test.
- Browser and Electron dogfood both pass with fresh screenshots or equivalent runtime receipts.
- `docs/reports/SMOKE_TEST_REPORT.md` reflects current verified behavior.

---

## Phase 10: Documentation & Platform Notes

**Goal**: Clear cross-platform guidance.

- [ ] **10.1** `README.md` — explain desktop vs localhost browser modes
- [x] **10.2** `docs/CROSS_PLATFORM_STRATEGY.md` — architecture decisions and rationale
- [ ] **10.3** `docs/SECURITY.md` — update after token/origin hardening lands
- [x] **10.4** `docs/TEST_PLAN.md` — macOS, Linux, WSL, native Windows smoke checks
- [ ] **10.5** `docs/SMOKE_TEST_REPORT.md` — update after hardening gate validation
- [ ] **10.6** README explains Windows `cmd` binary ambiguity
- [ ] **10.7** README states native Windows is experimental if Command Code is alpha there; WSL is recommended
- [ ] **10.8** API reference documents tokenized initial load, cookie behavior, denied routes, and file/write boundaries

---

## Final Acceptance Criteria

- User can choose a project and start/stop a Command Code session from the GUI — blocked until PTY smoke passes
- Terminal behaves like a real terminal for interactive sessions — blocked until real PTY starts and replay works
- User can run one-shot headless prompts and see stdout/stderr/exit code
- App works without Command Code installed via Mock mode — blocked for headless until `useMock` propagates
- Renderer cannot run arbitrary shell commands
- Risky modes (trust, auto-accept, yolo) are visually obvious
- Electron mock mode still works — requires replay validation
- Browser can connect to localhost and run mock PTY sessions — blocked by initial replay loss
- Browser can run headless mock or real `cmd --print` tasks
- Security token is required for HTTP and WebSocket calls — blocked by auth-cookie bypass
- Typecheck passes
- No claim is made that structured Command Code state exists unless from documented JSON or official API
