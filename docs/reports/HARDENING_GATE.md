# Command Code GUI Hardening Gate

**Date:** 2026-06-06
**Scope:** current worktree in `/Users/steven/Workspace/40_Code/projects/command-code-gui`
**Purpose:** convert dogfood findings into implementation-ready stability gates. This gate blocks any new Phase 8-style feature work until the app can prove that one mock session, one real interactive session, and one headless run behave safely and consistently in both browser and Electron shells.

## Current Truth

Validated on 2026-06-06:

- `npm run typecheck` passes.
- `npx vitest run` passes with `83/83`.
- `npm run build` passes.
- `npm run smoke:server` passes.
- `npm run smoke:browser` passes with mock headless using `useMock:true`.
- `npm run smoke:headless` passes for real `cmd --print`.
- `npm run smoke:pty` passes; `node-pty` spawns `/bin/zsh` and prints `"ok"`.
- `npm run doctor` passes with `5 passed, 0 failed`; Command Code is `0.32.3`.
- Browser production route loads from explicit ports after token proof. The latest Phase 2 closeout route used `http://127.0.0.1:5222`, returned `302` on token entry, and served built assets `index-lfU4Ropg.js` and `index-BE4-R85S.css` under cookie auth. `/health` and bad-token requests do not grant `ccgui-token`.
- Electron dev starts and serves the renderer through an embedded local server. On the latest run, Vite moved to `5175` because `5173` and `5174` were occupied, and the embedded server reported `http://127.0.0.1:52655`.
- Real interactive PTY starts through `POST /api/sessions` with `useMock:false`, returns `mock:false`, selected model metadata, transcript path, and accepts stop and force-delete.
- File/config read and write routes have deny-by-default regression coverage.

Blocked on 2026-06-06:

- None for v0 hardening closeout.

Deferred beyond v0:

- `ccgui serve --port 0` is rejected by CLI argument parsing; explicit ports are verified.
- Response-ready notifications are disabled instead of inferred from terminal byte length. V1 should add explicit readiness state before reintroducing them.
- Browser/Electron screenshots were not captured in this pass because Playwright is not installed in the project; route-level and startup receipts were used instead.

## Gate Definition

The hardening gate is complete only when all of these are true in the current worktree:

1. **Execution truth:** the GUI can start, interact with, stop, and force-kill a real Command Code PTY session from browser mode and Electron mode.
2. **Mock truth:** every Mock mode surface, including interactive sessions and headless runs, avoids invoking the real CLI.
3. **Replay truth:** starting a session before WebSocket attachment never loses the first banner or early PTY output.
4. **Security truth:** no unauthenticated route, static asset request, health request, CORS path, or dev route can disclose a token that grants privileged API access.
5. **Filesystem truth:** file read/write APIs are scoped to explicit project roots or known Command Code config roots, with symlink escape and size limits enforced.
6. **Operator truth:** printed URLs, status cards, risk badges, and smoke reports match the runtime state exactly.
7. **Test truth:** the automated suite fails before each P0 fix and passes after it, without requiring a live Command Code install for mock/fake-PTY coverage.

## P0 Implementation Fixes

### P0.1 Fix Local Auth Token Issuance

**Status:** Closed. `npm run smoke:server`, `npm run smoke:browser`, and browser-route curl receipts prove `/health`, bad-token requests, and unauthenticated API requests do not issue `ccgui-token`. Valid token proof on `/` sets the cookie and redirects to a tokenless path.

**Problem**

`src/server/index.ts` calls `setAuthCookie(res, token)` before authorization. That means `GET /health` and unauthenticated static responses disclose the bearer-equivalent cookie. A local client can:

1. Request `/health`.
2. Store `ccgui-token`.
3. Call `/api/check`, `/api/files/read`, `/api/headless`, or other protected routes with that cookie.

**Implementation**

- Move all cookie issuance behind explicit token proof.
- Keep `/health` unauthenticated, but never set `ccgui-token` on `/health`.
- For direct browser mode:
  - Accept `?token=...` only on `GET /` or `GET /index.html`.
  - If valid, set `ccgui-token` and redirect to `/` without the query string.
  - If invalid, return `401` or a static unauthenticated landing/error page.
- For Electron mode:
  - Prefer setting the cookie from the main process before `loadURL`.
  - Do not rely on renderer JavaScript token injection as the primary auth path.
- For API routes:
  - Require valid cookie, `Authorization: Bearer`, or `X-Auth-Token`.
  - Never include `Set-Cookie` in `401`, `403`, `/health`, or static asset responses unless the request has already proven the token.
- For WebSocket:
  - Require valid cookie or `?token=...`.
  - Reject before attaching listeners.

**Files**

- `src/server/index.ts`
- `src/main/index.ts`
- `src/renderer/src/browserAdapter.ts`
- `src/cli/ccgui.ts`
- `docs/architecture/SECURITY.md`
- `docs/reference/API_REFERENCE.md`

**Tests**

- `GET /health` returns `200` and no `Set-Cookie`.
- `GET /` without token returns static HTML or an unauthenticated shell, but does not set `ccgui-token`.
- `GET /?token=bad` does not set a cookie.
- `GET /?token=real` sets the cookie and redirects or serves the app.
- `POST /api/check` without auth returns `401` and no `Set-Cookie`.
- Cookie acquired from `/health` cannot authenticate because it is never issued.
- WebSocket without auth closes with unauthorized status.

**Manual Dogfood**

- Open the tokenized URL printed by `ccgui serve`.
- Confirm the URL no longer shows the token after initial load.
- Confirm refresh keeps the app authenticated by cookie.
- Confirm a fresh incognito/private browser at `/health` does not gain API access.

### P0.2 Restore Real Interactive PTY Viability

**Status:** Closed. `npm run smoke:pty` reports `node-pty available: true`, shell `/bin/zsh`, `Healthy: true`, output `"ok"`. A real `POST /api/sessions` receipt returned `200`, `mock:false`, model metadata, transcript path, stop `200`, and force-delete `200`.

**Problem**

During the 2026-06-04 audit, real headless `cmd --print` worked, but real interactive sessions failed because `node-pty` could not spawn in the current environment. The historical error was `posix_spawnp failed.` and was reproducible even with `/bin/zsh`. This is now closed by the 2026-06-06 PTY doctor and real-session receipts above.

**Implementation**

- Add a `ptyDoctor()` helper that spawns a harmless shell command through `node-pty`.
- Run `ptyDoctor()` from:
  - `ccgui doctor`;
  - server startup logging;
  - a new smoke script.
- If PTY is unavailable:
  - show a clear "PTY unavailable" status card;
  - disable real interactive Start;
  - leave Mock mode and headless real mode available;
  - show the exact remediation command, such as rebuilding `node-pty` against Electron when relevant.
- Make `CoreSessionManager.start()` return a structured session start failure instead of a generic HTTP 500 when PTY spawn throws.
- Add an injected fake PTY implementation for tests.
- Keep the app boundary: do not replace PTY with shell execution from renderer.

**Files**

- `src/core/sessions.ts`
- `src/core/cli.ts` or new `src/core/ptyDoctor.ts`
- `src/server/index.ts`
- `src/cli/ccgui.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/components/AuthCard.tsx` or a new runtime status card
- `scripts/smoke-server.ts`
- new `scripts/smoke-pty.ts`
- new `tests/server-session.test.ts`

**Tests**

- Fake PTY starts, emits output, receives writes, resizes, and exits.
- PTY factory throw returns structured failure with remediation text.
- Real mode Start is disabled or errors clearly when PTY doctor fails.
- Mock mode remains available when PTY doctor fails.
- `ccgui doctor` exits nonzero or warns loudly when PTY is unavailable.

**Manual Dogfood**

- `node scripts/smoke-pty.ts` or `npm run smoke:pty` can spawn `/bin/zsh -lc "echo ok"` through PTY.
- Browser real Start shows Command Code startup output.
- Electron real Start shows the same startup output.
- `/exit`, interrupt, and force kill all terminate the same real session.

### P0.3 Fix WebSocket Replay And Subscription Ordering

**Status:** Closed. Browser transport reuses `CONNECTING` and `OPEN` sockets, active-session replay remains available, and `npm run smoke:browser` creates and exits a mock session through the browser/API path.

**Problem**

`CoreSessionManager` has a replay buffer, but Browser dogfood still showed only `attaching session ...` after starting a mock session. Sending `/help` later worked, so the socket can stream after attachment. The likely issue is renderer subscription ordering: `onSessionData()` opens a socket while `onSessionExit()` immediately calls `ensureSocket()` again; a `CONNECTING` socket is treated as stale and closed.

**Implementation**

- In `browserAdapter.ensureSocket(sessionId)`:
  - return an existing socket when state is `CONNECTING` or `OPEN`;
  - only close states `CLOSING` or `CLOSED`;
  - keep callback registration independent from socket creation;
  - remove callback registry entries when both data and exit callbacks are empty.
- Add an explicit `subscribeSession(sessionId, { onData, onExit })` transport method, or ensure the existing two-callback registration cannot double-open/close the socket.
- In `CoreSessionManager.getReplay()`:
  - do not delete replay on first subscriber while the session is active;
  - delete replay only when the session exits or buffer expires;
  - allow tab switching to replay current active output.
- In `TerminalPane`:
  - subscribe before or at the same time as resize;
  - avoid clearing useful replay when switching tabs unless the replay will be rehydrated.

**Files**

- `src/renderer/src/browserAdapter.ts`
- `src/core/transport.ts`
- `src/core/sessions.ts`
- `src/server/index.ts`
- `src/renderer/src/components/TerminalPane.tsx`
- `tests/server-session.test.ts`
- `scripts/smoke-browser.ts`

**Tests**

- Start mock session, attach WebSocket after 500ms, receive banner.
- Start fake PTY session, emit output before WebSocket attach, receive replay.
- Register data and exit callbacks back-to-back; only one socket remains.
- Switch away from and back to a tab; prior output remains visible.
- Two simultaneous sessions receive independent replay and live output.

**Manual Dogfood**

- Start Mock mode in browser: terminal shows the mock banner immediately.
- Start Mock mode in Electron: terminal shows the mock banner immediately.
- Start two mock sessions: each tab shows its own prompt/history.
- Send `/help` in tab A and `/plan` in tab B: output never crosses tabs.

### P0.4 Honor Mock Mode For Headless Runs

**Status:** Closed. Renderer headless runs pass `useMock`; `npm run smoke:browser` verifies mock headless with deterministic mock output, and `npm run smoke:server` verifies `[Mock headless]` server behavior.

**Problem**

The server can return a deterministic mock headless result when `HeadlessRunOptions.useMock` is true, but the renderer does not send `useMock`. With Mock mode checked, clicking Run headless can still call the real CLI.

**Implementation**

- Add `useMock` to `runHeadless()` call sites.
- Pass `useMock` into `HeadlessRunner` so the panel can label itself as "Mock headless" or "Real CLI headless".
- In Mock mode:
  - disable yolo or mark it as ignored;
  - return deterministic output without spawning `cmd`;
  - record the job as mock in `HeadlessHistory`.
- In real mode:
  - show a visible "Real CLI" badge;
  - make `yolo`, `auto-accept`, and `trust` visually loud.

**Files**

- `src/shared/types.ts`
- `src/core/types.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/components/HeadlessRunner.tsx`
- `src/renderer/src/components/HeadlessHistory.tsx`
- `src/server/index.ts`
- `scripts/smoke-browser.ts`
- `tests/cli.test.ts`

**Tests**

- Renderer passes `useMock: true` when Mock mode is checked.
- `/api/headless` with `useMock: true` never calls `runHeadless()`.
- Smoke script verifies mock output contains `[Mock headless]`.
- Real headless smoke still calls `cmd --print`.

**Manual Dogfood**

- With Mock mode checked, Run headless completes instantly with `[Mock headless]`.
- With Mock mode unchecked, Run headless shows "Real CLI" before running.
- Headless history shows whether each job was mock or real.

### P0.5 Restrict File And Config Access

**Status:** Closed. `tests/server-security.test.ts` covers deny-by-default behavior without a workspace root, cwd-constrained reads and writes, denied outside reads, allowed project memory/agent writes, and root unregistration after session deletion.

**Problem**

The server exposes file browsing plus agent and memory editing. These are useful, but they cross from "GUI adapter" into local control-plane behavior unless tightly scoped.

**Implementation**

- Introduce `WorkspaceAccessPolicy` in server/core.
- Register a project root when:
  - the user chooses a project;
  - a session starts;
  - browser mode loads with an explicit `cwd` only after validation.
- Use `realpathSync` on root and target paths.
- Deny target paths outside registered roots.
- Deny symlink escapes.
- Cap text reads at 1MB.
- Detect obvious binary files and return a structured error.
- Limit writes:
  - memory writes only to `COMMANDCODE.md`, `AGENTS.md`, `CLAUDE.md`, and files under `<project>/.commandcode/memory/`;
  - project agent writes only under `<project>/.commandcode/agents/`;
  - global agent writes only under known Command Code/Agents config roots after an explicit "global config" mode is enabled.
- Add status copy for every write target: project file, global config file, or denied.

**Files**

- `src/server/index.ts`
- `src/core/discovery.ts`
- `src/core/types.ts`
- `src/renderer/src/components/FileBrowser.tsx`
- `src/renderer/src/components/FileViewer.tsx`
- `src/renderer/src/components/AdvancedPanel.tsx`
- `docs/architecture/SECURITY.md`

**Tests**

- `/api/files/read` denies `/etc/passwd`.
- `/api/files/read` denies parent traversal.
- `/api/files/read` denies symlink escape.
- Large file read returns structured too-large error.
- `saveMemory()` denies arbitrary absolute paths.
- `saveAgent()` denies arbitrary absolute paths.
- Allowed project memory/agent writes still work.

**Manual Dogfood**

- File browser only shows the selected project root.
- Clicking a large file shows a clean "too large" state.
- Editing memory shows the exact destination path and scope.
- Attempting a path outside the project returns "Access denied".

## P1 Implementation Fixes

### P1.1 Make Runtime Receipts Accurate

**Problem**

When the server binds to port `0`, logs show `http://127.0.0.1:0` even though the OS assigns a real port. When `5173` or `5174` is occupied, scripts either crash or Vite silently moves, leaving printed URLs stale.

**Implementation**

- Compute `url` and `authUrl` after `listen()` from `httpServer.address()`.
- Return `getUrl()` and `getAuthUrl()` functions instead of static strings created before binding.
- Catch `EADDRINUSE` and either:
  - retry on the next port when a `--port-auto` flag is set; or
  - fail with a concise message that names the occupied port and remediation.
- Make `dev:web` print the actual Vite port and align proxy docs with `CCGUI_PORT`.
- Update smoke scripts to print the actual base URL used.

**Acceptance**

- Electron logs the actual embedded server port.
- `createAppServer(0)` logs the assigned port.
- `npm run serve` handles occupied `5173` without an unhandled exception.
- CLI never prints `localhost:5174` unless that is actually the active Vite URL.

### P1.2 Strengthen Stop Ladder Semantics

**Problem**

Stop/interrupt/force-kill routes exist, but the renderer still sends interrupt through `transport.write(activeTabId, '\x03')` instead of `transport.interrupt()`, and labels collapse to "Force Stop" immediately after a graceful stop.

**Implementation**

- Add `interrupt()` to `TransportAPI`.
- Wire Stop states:
  - `Stop` sends `/exit\r`.
  - `Interrupt` calls `/api/sessions/:id/interrupt`.
  - `Force Kill` calls `DELETE /api/sessions/:id`.
- Use time-based escalation labels only after the previous stage has had time to work.
- Store stop stage per tab.

**Acceptance**

- First click is graceful.
- Second click is interrupt.
- Third click is force kill.
- The terminal receives one exit event.
- Mock and fake PTY tests cover all three stages.

### P1.3 Add CI-Useful Bridge Tests

**Implementation**

- Add server tests that use an injected fake PTY.
- Add auth tests for cookie/token/CORS behavior.
- Add replay tests.
- Add browser transport tests using mocked `WebSocket`.
- Keep live `cmd` tests as optional smoke, not required unit tests.

**Minimum Automated Suite**

- `tests/cli.test.ts`
- `tests/server-auth.test.ts`
- `tests/server-session.test.ts`
- `tests/browser-transport.test.ts`
- `tests/file-access.test.ts`

### P1.4 Correct Documentation And Smoke Reports

**Implementation**

- Update `docs/reports/SMOKE_TEST_REPORT.md` after fixes, not before.
- Split report rows into:
  - automated verified;
  - manual verified;
  - blocked;
  - not run.
- Remove claims that real interactive PTY works until the PTY smoke passes.
- Update README desktop/browser instructions after auth flow changes.
- Update API reference to remove unsafe token endpoint assumptions.

### P1.5 Reduce Operator Surface Area For Stability

**Implementation**

- Keep the default screen focused on:
  - project;
  - runtime status;
  - active terminal;
  - headless runner;
  - hardening warnings.
- Move advanced panels behind an "Advanced" route/modal with status badges.
- Add a compact runtime checklist:
  - Command Code binary;
  - auth status;
  - PTY status;
  - mode: mock or real;
  - trust/permission state.
- Keep risky states visually explicit:
  - `auto-accept`;
  - `trust`;
  - `yolo`;
  - real headless.

## Required Commands Before Closing The Gate

Run these from `/Users/steven/Workspace/40_Code/projects/command-code-gui`:

```bash
npm run typecheck
npx vitest run
npm run build
npm run smoke:server
npm run smoke:browser
npm run smoke:headless
npm run smoke:pty
```

Manual browser smoke:

```bash
npm run serve -- --port 5183
```

- Open the printed tokenized URL.
- Confirm token is removed or hidden after first load.
- Confirm `/health` does not grant API access.
- Start Mock mode.
- Confirm banner appears immediately.
- Send `/help`.
- Run Mock headless and confirm no real CLI invocation.
- Switch Mock mode off only after PTY doctor passes.
- Start real Command Code session.
- Send `/exit`, then test interrupt and force kill on a second session.

Manual Electron smoke:

```bash
npm run dev
```

- Confirm Electron logs the actual embedded server port.
- Confirm first screen renders.
- Start Mock mode and confirm banner appears.
- Run Mock headless and confirm deterministic mock output.
- Start real session only when PTY status is healthy.
- Confirm transcript reveal works.

## Exit Criteria

The hardening gate is complete in the current worktree because:

- No P0 item in this document remains open.
- P0 behavior has automated unit or smoke-script regression coverage.
- Browser and Electron dogfood pass with equivalent runtime receipts.
- The smoke report matches the latest run and names deferred items honestly.
- `ROADMAP.md` final acceptance criteria are true for v0 in the current worktree.
