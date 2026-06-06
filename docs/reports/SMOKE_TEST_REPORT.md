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

### 2026-06-06 Phase 10 validation scaffold

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Docs index | Pass | `docs/INDEX.md` links `docs/reports/V1_VALIDATION_TEMPLATE.md` |

Scope: documentation-only scaffold. `docs/reports/V1_VALIDATION_TEMPLATE.md` defines reusable package receipts, hard-gate checks, route receipts, and commit notes for V1 work.

### 2026-06-06 Phase 10 settings registry validation

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `46/46` |
| Build | Pass | `npm run build` |

Scope: test-only validation package. `tests/settings-registry.test.ts` covers the Settings Center registry section list, duplicate prevention, group order, search filtering by label/description/search text, defensive fallback metadata, and implemented route coverage. No renderer output, server routes, persistence behavior, IPC, runtime/session lifecycle, or Command Code settings behavior changed.

### 2026-06-06 Phase 2 settings persistence gate

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |

Scope: gate and validation package. `docs/reports/SETTINGS_PERSISTENCE_GATE.md` defines GUI-owned app/project preference files, Command Code-owned `settings.json` scope, and the write gates required before editable Settings sections expand. `tests/server-security.test.ts` now covers invalid project preference paths and sanitized temp-project GUI preference writes. No config writes, persistence fields, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 read-only Integrations hub

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5198`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-rbvZ9UTu.js` and `index-C732M7fy.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:64131` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: read-only Integrations hub package. The Integrations Settings page now routes to existing MCP, Hooks, Agents, Skills, Design, Memory, and Taste Settings sections and keeps local/CLI docs links visible. No connect, edit, save, auth, config mutation, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 actionable Profile dashboard

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5199`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-drvw5pEk.js` and `index-DfzWLTVF.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:64302` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: read-only Profile dashboard package. Profile now includes shortcut tiles to General, Runtime, Usage, Project state, and Integrations while preserving runtime receipts. No config writes, persistence fields, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 AdvancedPanel removal gate

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Docs index | Pass | `docs/INDEX.md` links `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md` |

Scope: documentation-only removal gate. `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md` records Settings replacement coverage for AdvancedPanel tabs and the remaining advanced-only blockers: session resume/reveal, agent writes, memory writes, and MCP connect/disconnect. No runtime behavior, renderer IPC, server routes, config writes, persistence fields, transport/session lifecycle, or Command Code settings mutation changed.

### 2026-06-06 Phase 2 editable destination labels

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5201`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-C9uXx3kB.js` and `index-BYVIKPDb.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:64697` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: presentation-only destination-label package. Existing editable Settings controls now show GUI app/project preference destinations for command binary, onboarding, permissions, trust, model, project model routing, and appearance. No config writes, persistence fields, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings Usage parity

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5202`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-BPpYzr6e.js` and `index-BTMwzmHR.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:64883` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: read-only Settings Usage parity package. Usage now includes Command Code usage summary refresh through the existing `transport.usage(commandExecutable, cwd)` capability alongside local headless history. No server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings Skills preview parity

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5203`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-B_DFSZxk.js` and `index-BqRtUuyX.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:65069` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: read-only Settings Skills preview package. Skills now support expandable content previews using the existing `transport.listSkills()` payload. No insert/use actions, server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings Sessions discovery

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5204`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-BnErYJXZ.js` and `index-DO-_k7ll.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:65255` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: read-only Settings Sessions discovery package. Settings now includes a Sessions section backed by existing `transport.discoverSessions(cwd)` and shows discovered sessions without resume or reveal actions. No server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, file reveal actions, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings MCP command previews

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `48/48` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5205`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DT8fCY9s.js` and `index-C8jcetpd.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:65482` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: read-only Settings MCP command preview package. MCP Settings now shows connect/disconnect command previews for discovered servers. No server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, MCP actions, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 settings registry and search

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `41/41` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5193`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:62462` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: read-only Settings Center registry/search package. Added searchable settings taxonomy and placeholder pages for new sections without config writes, persistence changes, server routes, or Command Code settings mutation.

### 2026-06-06 Phase 2 read-only advanced settings migration

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `41/41` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5194`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:62843` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: Settings-hosted read-only Project state, MCP, Agents, Skills, Memory, and Taste views. Advanced modal remains available. No connect/disconnect/edit/save actions, config writes, persistence changes, server routes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 read-only reference settings pages

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `41/41` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5195`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:63129` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: Settings-hosted read-only reference pages for Keyboard, Notifications, Terminal, Models, Design, Hooks, and About. No preference writes, config writes, persistence changes, server routes, runtime/session changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 core settings presentation extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `41/41` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5196`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-CmL9yZwl.js` and `index-B2ORLVyZ.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:63392` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: behavior-preserving extraction of existing Profile, General, Runtime, Appearance, Usage, Integrations, and Advanced settings presentation into `src/renderer/src/settings/CoreSettings.tsx`. Existing callbacks remain owned by `App.tsx` and `SettingsWorkspace`; no config writes, persistence changes, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 settings route dispatcher extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `41/41` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5197`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DeifEuJL.js` and `index-B2ORLVyZ.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:63628` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this settings package |

Scope: behavior-preserving extraction of Settings section routing, shared section frames, and placeholder fallback into `src/renderer/src/settings/SettingsRoutes.tsx`. Removed stale headless settings props from `SettingsWorkspace`; headless preferences remain owned by the existing command popover and app preference path. No config writes, persistence changes, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 1 closeout

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `41/41` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| PTY doctor | Pass | `npm run smoke:pty` -> `/bin/zsh` through `node-pty`, output `"ok"` |
| Real headless | Pass | `npm run smoke:headless` -> `cmd --print` exit `0` |
| Built browser route | Pass | Latest Phase 1 route receipt used `npx tsx src/cli/ccgui.ts serve --port 5192`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | Latest Phase 1 Electron receipt used `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:61897` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added during Phase 1 |

Scope: Phase 1 Renderer Architecture Foundation is complete. Runtime health, session lifecycle, app preference, and project preference hook extractions remain deferred behind hard gates because they affect runtime truth, transport/session lifecycle, or shared settings persistence.

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

### 2026-06-06 Phase 1 command constants and popover hook extraction

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5191`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:61625` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this architecture-only extraction |

Scope: behavior-preserving extraction of command palette/release-note constants into `src/renderer/src/commandPalette.ts` and outside-click/Escape popover dismissal into `src/renderer/src/hooks/useDismissiblePopover.ts`. Runtime health, session lifecycle, app preference, and project preference hooks remain deferred behind hard gates because they affect runtime truth, transport/session lifecycle, or shared settings persistence.

### 2026-06-06 Phase 1 dead UI cleanup

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5192`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:61897` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; no new dependency was added for this cleanup |

Scope: removed documented unreferenced legacy components, the unreachable `mode` popover branch, and stale `.control-panel`, `.quick-command-list`, `.mode-rail`, and `.mode-popover` CSS selectors. No Command Code runtime, transport, session lifecycle, or config write behavior changed.
