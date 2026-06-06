# Smoke Test Report

**Date:** 2026-06-06
**Scope:** current worktree in `/Users/steven/Workspace/40_Code/projects/command-code-gui`
**Related gate:** [HARDENING_GATE.md](HARDENING_GATE.md)

## Environment

| Item | Value |
|---|---|
| OS | macOS / darwin-arm64 |
| Node.js | v22.22.2 |
| Command Code binary | `cmd` |
| Command Code version | `0.32.3` |
| Default repo path | `/Users/steven/Workspace/40_Code/projects/command-code-gui` |

## Automated Results

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `41/41` |
| Build | Pass | `npm run build` |
| Server smoke | Pass | `npm run smoke:server` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Real headless | Pass | `npm run smoke:headless` -> `cmd --print` exit `0` |
| PTY doctor | Pass | `npm run smoke:pty` -> `/bin/zsh` through `node-pty`, output `"ok"` |
| CLI doctor | Pass | `npm run doctor` -> `5 passed, 0 failed` |

## Runtime Receipts

| Surface | Result | Notes |
|---|---:|---|
| Browser production route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5183` served `out/renderer`; authenticated `/` returned built HTML with title `Command Code` |
| Browser auth redirect | Pass | `GET /?token=real` returned `302`, set `ccgui-token`, and redirected to `/` |
| Browser bad token | Pass | `GET /?token=bad` returned `401` and no token grant |
| Browser health | Pass | `GET /health` returned `200 {"ok":true}` and no `Set-Cookie` |
| Electron route | Pass | `npm run dev` started Electron; Vite used `5175` after `5173` and `5174` were occupied; embedded app server reported `http://127.0.0.1:58801` |
| Mock interactive | Pass | `npm run smoke:browser` created a mock session and exited it through `/exit` |
| Mock headless | Pass | `npm run smoke:browser` sent `useMock:true` and received deterministic mock output |
| Real headless | Pass | `npm run smoke:headless` ran `cmd --print` with exit `0` |
| Real interactive PTY | Pass | One-off server receipt: `POST /api/sessions` with `useMock:false` returned `200`, `mock:false`, model `deepseek/deepseek-v4-pro`, transcript path, and args; stop and force-delete both returned `200` |
| Stop ladder | Pass | UI routes call `stop`, `interrupt`, then `forceKill`; server stop and force-delete were verified against a real session |
| Transcript route | Pass | `npm run smoke:server` read a discovered transcript through `/api/sessions/transcript` |
| Scoped file/config access | Pass | `tests/server-security.test.ts` denies file and write routes without a workspace root, constrains reads/writes by explicit cwd, and unregisters roots when sessions are deleted |

## Dogfood Issues

| Issue | Status | Evidence |
|---|---:|---|
| False response-ready notifications on attach/open/return | Fixed for v0 | Terminal byte-length response notifications were removed; lifecycle notifications remain explicit |
| Multi-session terminal restore/input contention | Fixed for v0 | Browser socket reuse handles `CONNECTING`/`OPEN`; terminal prompt-detection state resets on session switch; tab switching uses active session replay |
| Per-session model identity display | Fixed | `SessionStartResult` now carries trimmed launch-time `model`; active tab/header/composer use that stored value instead of the current global dropdown |

## Failed Or Limited Attempts

| Check | Result | Notes |
|---|---:|---|
| `tsx -e ...` one-off real-session script | Command failed | `tsx` is not directly on PATH outside npm/npx |
| `npx tsx -e ...` with top-level await | Command failed | `tsx -e` used CJS output and rejected top-level await |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dev dependency was added for this report |
| `ccgui serve --port 0` | Deferred | CLI argument parsing rejects `0`; explicit port `5183` was used for browser route verification |

## Current Release Blockers

None for the v0 hardening gate.

Deferred to v1:

- Reintroduce response-ready notifications only after explicit session lifecycle/readiness state exists.
- Add screenshot automation if the project adopts Playwright or another browser test dependency.
- Decide whether `ccgui serve --port 0` should be accepted as an OS-assigned-port mode.

## V1 Handoff

V1 Phase 1 can begin after this report, [HARDENING_GATE.md](HARDENING_GATE.md), and the root [ROADMAP.md](../../ROADMAP.md) are treated as the v0 closeout contract.

## V1 Incremental Receipts

### 2026-06-06 Phase 1 shell/sidebar extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5186`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:60751` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this architecture-only extraction |

Scope: behavior-preserving renderer extraction of shell chrome and sidebar presentation into `src/renderer/src/layout/ShellLayout.tsx`. Real CLI interactive path was not retested for this slice because PTY/session lifecycle and command builders were unchanged.

### 2026-06-06 Phase 1 home/composer extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5187`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:60942` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this architecture-only extraction |

Scope: behavior-preserving renderer extraction of shared composer presentation into `src/renderer/src/components/ComposerBar.tsx` and home workspace presentation into `src/renderer/src/workspaces/HomeWorkspace.tsx`. Real CLI interactive path was not retested for this slice because PTY/session lifecycle and command builders were unchanged.

### 2026-06-06 Phase 1 session workspace extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5188`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:61091` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this architecture-only extraction |

Scope: behavior-preserving renderer extraction of active session workbench presentation, tab/terminal layout, bottom terminal presentation, and workbench tool rail into `src/renderer/src/workspaces/SessionWorkspace.tsx`. Real CLI interactive path was not retested for this slice because PTY/session lifecycle and command builders were unchanged.

### 2026-06-06 Phase 1 settings workspace extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5189`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:61272` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this architecture-only extraction |

Scope: behavior-preserving renderer extraction of existing settings workspace presentation into `src/renderer/src/workspaces/SettingsWorkspace.tsx`. Phase 2 settings expansion was not started. Real CLI interactive path was not retested for this slice because PTY/session lifecycle and command builders were unchanged.

### 2026-06-06 Phase 1 popovers and release notes extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5190`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:61482` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this architecture-only extraction |

Scope: behavior-preserving renderer extraction of existing popover presentation into `src/renderer/src/components/AppPopovers.tsx` and release-note presentation into `src/renderer/src/components/ReleaseNotesModal.tsx`. Command execution, update checks, release-note state, and popover state transitions remain owned by `App.tsx`.
