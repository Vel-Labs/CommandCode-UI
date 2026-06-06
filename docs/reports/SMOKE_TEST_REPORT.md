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

### 2026-06-06 Phase 2 Settings notification preferences

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `52/52` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5206`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-kD2gLwTl.js` and `index-CFKlYiiM.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:49423` |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: renderer-local Settings Notifications package. Notifications Settings now edits the existing GUI toast/audio categories and volume controls through browser `localStorage` keys `ccgui.toast-preferences` and `ccgui.audio-preferences`. No server routes, renderer IPC expansion, file-backed config writes, transport/session lifecycle changes, notification readiness inference, OS notification behavior, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings terminal preferences

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `55/55` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| PTY smoke | Pass | `npm run smoke:pty` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5207`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-CpB4j3th.js` and `index-CFKlYiiM.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:49602` |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: renderer-local Settings Terminal package. Terminal Settings now edits xterm presentation preferences through browser `localStorage` key `ccgui.terminal-preferences`, and `TerminalPane` loads those preferences when panes mount. No server routes, renderer IPC expansion, file-backed config writes, PTY/session lifecycle changes, live terminal geometry mutation, shell selection, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings About release history

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5208`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-BasEfPfb.js` and `index-BVW7j6TR.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:49748` |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: presentation-only Settings About package. About now renders bundled release-note history from existing `releaseNotes` metadata. No update checks, release-note dismissal state changes, persistence fields, server routes, renderer IPC expansion, runtime/session lifecycle changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings keyboard reference

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5209`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-Cq2e3QF-.js` and `index-DzGfjRxt.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:49905` |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: presentation-only Settings Keyboard package. Keyboard now shows grouped shortcut references and Command Code command examples, and existing New Session, Send, and Menu Input controls expose accelerator hints. No shortcut remapping, persistence fields, server routes, renderer IPC expansion, runtime/session lifecycle changes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings startup project preference

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `56/56` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5210`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DHiO5Oye.js` and `index-DzGfjRxt.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:50069` |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: app-preference Settings General package. General now writes sanitized `startupProjectBehavior` to `~/.commandcode/gui-preferences.json` and app preference hydration uses it to restore the last selected project or open without a selected project. No automatic session start/resume, window restore, renderer IPC expansion, Command Code settings mutation, or runtime/session lifecycle changes were added.

### 2026-06-06 Phase 2 Settings data controls gate

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5211`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-lrqYgMS2.js` and `index-3LQJOXlJ.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:50208` |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: read-only Settings Data controls gate package. Data now names transcript deletion, cache clearing, preference reset, export, and import as blocked or planned actions and records the required route/path-validation boundary in `docs/reports/DATA_CONTROLS_GATE.md`. No file delete/write/export/import routes, renderer IPC expansion, Command Code settings mutation, or runtime/session lifecycle changes were added.

### 2026-06-06 Phase 2 Settings session actions

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| PTY smoke | Pass | `npm run smoke:pty` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5212`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-BWgdSGol.js` and `index-3LQJOXlJ.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:50338` |
| Real Settings resume click-through | Not run | Existing `resumeProjectSession` path was wired into Settings, but no discovered project transcript was resumed through the Settings button in this package |
| Settings reveal click-through | Not run | Existing `transport.revealTranscript` path was wired into Settings, but no transcript was revealed through the Settings button in this package |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: Settings Sessions action package. Sessions now exposes project-session Resume and transcript Reveal actions using existing App/transport paths. No new renderer IPC, server routes, transcript scraping, terminal-output inference, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings MCP actions

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5213`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-CXpQ8CKU.js` and `index-3LQJOXlJ.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:50499` |
| Real Settings MCP action click-through | Not run | Existing `transport.mcpAction` path was wired into Settings, but no MCP server was connected or disconnected to avoid mutating unknown external MCP state |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: Settings MCP action package. MCP now exposes connect/disconnect execution using existing `transport.mcpAction` and visible command previews. No renderer IPC expansion, new server routes, hidden config writes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings agent editing

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `56/56` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5214`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DSNyQ3bw.js` and `index-B3iP_G8E.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:50660` |
| Agent path boundary tests | Pass | `tests/server-security.test.ts` covers denied writes without a workspace root and allowed writes only under `<project>/.commandcode/agents/` |
| Real Settings agent save click-through | Not run | Existing `transport.saveAgent` path was wired into Settings, but no project agent file was edited through the Settings button in this package |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: Settings Agents write package. Agents now exposes edit/save using existing `transport.saveAgent` with visible destination paths. No renderer IPC expansion, new server routes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings memory editing

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `56/56` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5215`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DmRQ1WBq.js` and `index-B3iP_G8E.css` |
| In-app Browser route | Pass | Authenticated `http://127.0.0.1:5215/` loaded title `Command Code`; shell body contained `Command Code` and `Settings` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:50919` |
| Memory path boundary tests | Pass | `tests/server-security.test.ts` covers denied memory writes without a workspace root and allowed writes only to scoped project memory destinations |
| Real Settings memory save click-through | Not run | Existing `transport.saveMemory` path was wired into Settings, but no project memory file was edited through the Settings button in this package |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: Settings Memory write package. Memory now exposes edit/save using existing `transport.saveMemory` with visible destination paths. No renderer IPC expansion, new server routes, or Command Code settings mutation were added.

### 2026-06-06 Phase 2 Settings agent boundary alignment

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `57/57` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5216`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DBkQa1hg.js` and `index-B3iP_G8E.css` |
| In-app Browser route | Pass | Authenticated `http://127.0.0.1:5216/` loaded title `Command Code`; shell body contained `Command Code` and `Settings` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:51274` |
| Agent list/save boundary test | Pass | `tests/server-security.test.ts` covers that `/api/agents/list` with `cwd` includes `<project>/.commandcode/agents/` files with `scope: project` and that the same path is writable through `/api/agents/save` |
| Real Settings agent save click-through | Not run | The server and Settings route contract is aligned, but no project agent file was edited through the Settings button in this package |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: Settings Agents boundary package. Project agents are now discoverable through `/api/agents/list` with `cwd`, editable in Settings, and saved through the existing scoped save route. User/global agents remain visible but read-only. No renderer IPC expansion, new save route, hidden config write, or Command Code settings mutation was added.

### 2026-06-06 Phase 2 Advanced Settings hub

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5217`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-Dn4EJrEA.js` and `index-B3iP_G8E.css` |
| In-app Browser route | Pass | Authenticated `http://127.0.0.1:5217/` loaded Settings, clicked Advanced, showed `Diagnostics and scoped tools`, and did not show `Open Advanced tools` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:51469` |
| Browser screenshot automation | Not run | Playwright is not installed in this project/runtime; no new dependency was added for this settings package |

Scope: Settings Advanced presentation package. Settings Advanced now routes to explicit diagnostics and scoped-tool sections instead of opening the generic Advanced modal. No renderer IPC expansion, server routes, config writes, file access changes, transport/session lifecycle changes, or Command Code settings mutation was added.

### 2026-06-06 Phase 2 Settings write click-through receipts

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Isolated built server | Pass | `HOME=/tmp/ccgui-home-BbQjiY npx tsx src/cli/ccgui.ts serve --port 5218`; app preferences were set through `/api/app/preferences/save` to temp project `/tmp/ccgui-project-oJCnEL` |
| Settings agent save click-through | Pass | In-app Browser loaded the temp project, opened Settings Agents through Settings search, edited `.commandcode/agents/clickthrough-agent.md`, clicked Save, observed `Saved /tmp/ccgui-project-oJCnEL/.commandcode/agents/clickthrough-agent.md`, and disk verification found `updated through Settings Agents click-through` |
| Settings memory save click-through | Pass | In-app Browser opened Settings Memory, edited `AGENTS.md`, clicked Save memory, observed `Saved memory file.`, and disk verification found `updated through Settings Memory click-through` |
| Fixture cleanup | Pass | Removed isolated temp HOME and temp project after verification |
| Settings session resume/reveal click-through | Not run | Requires a safe discovered project transcript fixture; existing action wiring remains implemented but this receipt was not exercised in this validation package |
| Real Settings MCP action click-through | Not run | Requires a safe MCP server fixture to avoid mutating an unknown external server |

Scope: validation-only Settings write click-through package. It exercised the existing Settings Agents and Memory save buttons against isolated temporary files and did not change app code, renderer IPC, server routes, config behavior, or Command Code settings.

### 2026-06-06 Phase 2 Settings session click-through receipts

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Isolated built server | Pass | `HOME=/tmp/ccgui-home-sessions-WyDa5e npx tsx src/cli/ccgui.ts serve --port 5219`; app preferences pointed to temp project `/tmp/ccgui-project-sessions-9UHJsA` with a project transcript fixture under the isolated Command Code project transcript store |
| Settings Sessions discovery | Pass | In-app Browser loaded the temp project, opened Settings Sessions through Settings search, and showed `Session Clickthrough Fixture` with Resume and Reveal controls |
| Settings reveal click-through | Pass | Clicked Reveal; browser adapter returned without leaving or breaking the Sessions page |
| Settings resume click-through | Pass | Clicked Resume and observed `Real session started` in the UI while scoped to the temp project; the isolated server was stopped immediately afterward |
| Fixture cleanup | Pass | Verified the transcript fixture existed before cleanup, then removed isolated temp HOME and temp project |
| Real Settings MCP action click-through | Not run | Requires a safe MCP server fixture to avoid mutating an unknown external server |

Scope: validation-only Settings session click-through package. It exercised existing Settings Sessions Reveal and Resume buttons against an isolated temp project transcript. It did not change app code, renderer IPC, server routes, config behavior, or Command Code settings.

### 2026-06-06 Phase 2 Settings MCP click-through receipts

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `58/58` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| MCP parser regression | Pass | `tests/discovery.test.ts` covers that `disconnected` stays `disconnected`, then fake `mcp connect` changes status to `connected`, and fake `mcp disconnect` changes it back |
| Isolated built server | Pass | `HOME=/tmp/ccgui-home-mcp-I53hXI CCGUI_FAKE_MCP_STATE=/tmp/ccgui-home-mcp-I53hXI/mcp-state npx tsx src/cli/ccgui.ts serve --port 5220`; app preferences pointed to temp project `/tmp/ccgui-project-mcp-ioYpz3` and fake command `/tmp/ccgui-home-mcp-I53hXI/fake-cmd` |
| Settings MCP connect click-through | Pass | In-app Browser opened Settings MCP, showed `fixture` as `disconnected`, clicked Connect, and observed `fixture: ok - fixture: connect` plus `connected` |
| Settings MCP disconnect click-through | Pass | In-app Browser clicked Disconnect, observed `fixture: ok - fixture: disconnect` plus `disconnected`, and the fake state file ended as `disconnected` |
| Fixture cleanup | Pass | Removed isolated temp HOME, temp project, fake command, and state file after verification |

Scope: Settings MCP validation package. It fixed disconnected-status parsing and exercised existing Settings MCP Connect/Disconnect buttons against a fake local Command Code executable. No real external MCP server was mutated.

### 2026-06-06 Phase 2 AdvancedPanel removal

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `58/58` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5221`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-lfU4Ropg.js` and `index-BE4-R85S.css` |
| In-app Browser route | Pass | Authenticated `http://127.0.0.1:5221/` loaded Settings Advanced, showed `Diagnostics and scoped tools`, and did not show `Open Advanced tools` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:52429` |
| Source scan | Pass | No source references remain for `AdvancedPanel`, `advancedOpen`, `Open Advanced tools`, the right-inspector `advanced` mode, or modal-only `.advanced-*` selectors except `.advanced-raw`, which remains used for Settings Usage raw output |

Scope: Settings replacement closeout package. Removed the legacy `AdvancedPanel` modal, its launch state, the Runtime popover Advanced button, the dead right-inspector `advanced` mode, and modal-only CSS. Settings Advanced remains the diagnostics hub. No renderer IPC expansion, server routes, config writes, file access changes, transport/session lifecycle changes, or Command Code settings mutation was added.

### 2026-06-06 Phase 2 Settings Center closeout

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `58/58` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock headless and mock interactive session paths passed |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5222`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-lfU4Ropg.js` and `index-BE4-R85S.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:52655` |
| Screenshot automation | Deferred | Playwright is not installed in this project/runtime; route and startup receipts were used instead of claiming desktop/narrow screenshots |

Scope: documentation/status closeout for Phase 2 Settings Center. It records that Settings is now the primary configuration path, the generic Advanced modal is removed, editable Settings actions show ownership/destination before writes, and remaining risky/destructive or upstream-owned actions stay planned, gated, blocked, or deferred. No renderer, server, IPC, config, transport, session lifecycle, file access, or Command Code settings behavior changed in this closeout package.

### 2026-06-06 Phase 3 hooks parser gate

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `64/64` |
| Build | Pass | `npm run build` |

Scope: parser/gate package for Phase 3. `src/core/hooksConfig.ts` parses documented Command Code hook settings from raw `settings.json` text, preserves source scope/path, extracts command hooks, matchers, timeout, enabled state, event order, and blocking capability, rejects invalid JSON/shapes before future writes, and orders project hooks before user hooks for display. `docs/reports/HOOKS_NOTIFICATIONS_GATE.md` records the remaining write, hook execution, and notification-readiness gates. No file reads/writes, server routes, renderer IPC, hook execution, test payload execution, session readiness, OS notifications, or Command Code settings mutation were added.

### 2026-06-06 Phase 3 Hooks Settings read-only presentation

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock headless and mock interactive session paths passed |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5223`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DwRVIZ21.js` and `index-BE4-R85S.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:52902` |

Scope: read-only Settings > Hooks presentation package. Hooks now shows the Command Code-owned `settings.json` destination, project/user scopes, project-before-user precedence, parser gate status, execution ownership, and example recipes for risky shell blocking, sensitive read warnings, write audit, and Stop notification audio via `command-code-bonk`. No hook file reads/writes, server routes, renderer IPC, hook execution, test payload execution, session readiness, OS notifications, or Command Code settings mutation were added.

### 2026-06-06 Phase 3 Hooks config discovery

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `67/67` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock headless and mock interactive session paths passed |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5224`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-CS7Xf2sx.js` and `index-BE4-R85S.css` |
| Hook config endpoint | Pass | Authenticated `/api/hooks/configs` against temp project `/tmp/ccgui-hooks-project-dX71Ss` returned project source `true/true/1` and first hook `Stop/echo route-stop/project`; fixture was removed after verification |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:53191` |

Scope: read-only hook config discovery package. Added scoped `/api/hooks/configs`, `transport.discoverHookConfigs(cwd)`, and Settings > Hooks source/parsed-command display. The route derives only documented user/project `settings.json` paths, uses the existing project root resolver for `cwd`, caps reads at 1 MB, and parses through `src/core/hooksConfig.ts`. No hook writes, arbitrary file reads, renderer IPC, hook execution, test payload execution, session readiness, OS notifications, or Command Code settings mutation were added.

### 2026-06-06 Phase 3 Hooks edit helper

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `69/69` |
| Build | Pass | `npm run build` |

Scope: pure helper package for future hook enable/disable previews. `setHookCommandEnabled` toggles a matching direct or grouped command hook's `enabled` field in raw `settings.json` content while preserving unrelated settings keys and returning formatted JSON. No file reads, file writes, server routes, renderer IPC, hook execution, test payload execution, session readiness, OS notifications, or Command Code settings mutation were added.

### 2026-06-06 Phase 3 Hooks toggle preview

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `71/71` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock headless and mock interactive session paths passed |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5225`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-3INgc3cq.js` and `index-D4dE-QgW.css` |
| Hook toggle preview endpoint | Pass | Authenticated `/api/hooks/preview-toggle` against temp project `/tmp/ccgui-hooks-preview-hvNHyC` returned `preview=true/project/false/deepseek`; source file check returned `unchanged=true`; fixture was removed after verification |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:53584` |

Scope: preview-only Settings > Hooks package. Added scoped `/api/hooks/preview-toggle`, `transport.previewHookToggle(...)`, and Settings `Preview enable/disable` controls with a read-only formatted JSON panel. The route derives only selected project/user settings paths and returns preview content without writing the source file. No hook writes, arbitrary file reads, renderer IPC, hook execution, test payload execution, session readiness, OS notifications, or Command Code settings mutation were added.

### 2026-06-06 Phase 3 Hooks toggle apply

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `73/73` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock headless and mock interactive session paths passed |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5226`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-DVf_6sqB.js` and `index-D4dE-QgW.css` |
| Hook toggle apply endpoint | Pass | Authenticated `/api/hooks/apply-toggle` against temp project `/tmp/ccgui-hooks-apply-etrDYF` returned `apply=true/project/false/deepseek` and `backup=true/true`; fixture was removed after verification |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:53817` |

Scope: scoped config-write package for Settings > Hooks enable/disable toggles. Added `/api/hooks/apply-toggle`, `transport.applyHookToggle(...)`, confirmation-gated Settings `Apply preview`, backup-path reporting, and hook rediscovery after successful apply. The route recomputes the preview server-side, writes a sibling `.ccgui.bak` backup, and then writes formatted JSON only to the derived selected-project or user `settings.json` path. No arbitrary file reads/writes, renderer IPC, hook execution, test payload execution, session readiness, OS notifications, or broader Command Code settings mutation were added.

### 2026-06-06 Phase 3 Hooks dry-run payload preview

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `76/76` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock headless and mock interactive session paths passed |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5227`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-4gIYdAEq.js` and `index-D4dE-QgW.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:54048` |

Scope: dry-run payload preview package for Settings > Hooks. Added `src/core/hooksPayload.ts` and Settings `Sample payload` controls that render explicitly marked `ccgui_dry_run` JSON samples for discovered hook commands. No hook execution, session start, real runtime payload inference, file access, renderer IPC, Command Code settings mutation, or notification readiness behavior was added.

### 2026-06-06 Phase 3 session readiness model

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `83/83` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Not run | No browser transport, auth, mock, session UI, settings navigation, or inspector behavior changed |
| Real CLI path | Not run | Package is a pure reducer and does not start or control Command Code |

Scope: pure session readiness model package for Phase 3. Added `src/renderer/src/services/sessionReadiness.ts` and reducer tests for background, unread, response-ready, and input-required state. Attach, replay, foreground navigation, and replay output remain non-notifying; live background output only marks unread; explicit background `assistant-ready` and `input-required` events return distinct notification intent for future wiring. No OS notifications, toast dispatch, audio behavior, session lifecycle integration, terminal-output heuristics, server routes, renderer IPC, file access, Command Code settings mutation, hook execution, or real CLI execution was added.

### 2026-06-06 Phase 3 session readiness UI wiring

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `83/83` |
| Build | Pass | `npm run build`; assets `index-NQ0qlEmE.js` and `index-CXez1f6k.css` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |
| PTY smoke | Pass | `npm run smoke:pty`; `/bin/zsh` printed `ok` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5228`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-NQ0qlEmE.js` and `index-CXez1f6k.css`, mock session API returned `mock=true` |
| Electron dev startup | Pass | `npm run dev`; renderer `http://localhost:5175/`, embedded app server `http://127.0.0.1:54683` |

Scope: renderer/session wiring package for Phase 3 readiness state. Session data callbacks now carry `live` versus `replay` metadata, `App.tsx` keeps per-tab reducer-backed readiness state, and tabs/sidebar rows display unread/readiness badges while ignoring replay buffers for unread state. No OS notifications, toast dispatch, audio behavior, response-ready inference, input-required runtime inference, terminal byte-length heuristic, renderer IPC, file access, hook execution, or Command Code settings mutation was added. The real Command Code interactive path was not exercised; PTY health was smoke-tested only.

### 2026-06-06 Phase 3 Settings reference alignment

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Build | Pass | `npm run build` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |

Scope: Settings reference copy alignment for Phase 3. Notifications now distinguishes visible unread readiness state from still-gated response-ready/input-required notification delivery, and Hooks now distinguishes implemented scoped discovery/enable-disable writes from broader hook editing and command execution. No settings persistence changes, server routes, renderer IPC, file access, hook execution, OS notifications, audio behavior, or Command Code settings mutation was added.

### 2026-06-06 Phase 3 broader hook edit helper

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `86/86` |
| Build | Pass | `npm run build` |

Scope: pure hook edit-helper package for future broader hook editor previews. Added `updateHookCommand` and `removeHookCommand` coverage for direct command/matcher/timeout edits, grouped timeout removal, grouped deletion cleanup, and rejecting grouped matcher edits that would affect multiple commands. No file reads, file writes, server routes, renderer IPC, hook editor UI, hook execution, OS notifications, audio behavior, or Command Code settings mutation was added.

### 2026-06-06 Phase 3 broader hook edit preview route

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `89/89` |
| Build | Pass | `npm run build`; assets `index-D2M20r3w.js` and `index-CXez1f6k.css` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |
| Built route API proof | Pass | `npx tsx src/cli/ccgui.ts serve --port 5229`; authenticated `/api/hooks/preview-edit` against `/tmp/ccgui-hooks-edit-9c9gpd` returned `ok=true`, `action=update`, project source, edited command/matcher/timeout preview, and `unchanged=true` |

Scope: scoped preview-only route package for future broader hook editor work. Added `/api/hooks/preview-edit` and `transport.previewHookEdit(...)` for command, matcher, timeout, and delete previews using the same derived user/project settings paths and 1 MB read limit as hook discovery/toggle preview. No file writes, apply route, renderer UI controls, renderer IPC, hook execution, OS notifications, audio behavior, or Command Code settings mutation was added.

### 2026-06-06 Phase 3 broader hook edit preview UI

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `89/89` |
| Build | Pass | `npm run build`; assets `index-nnITahme.js` and `index-Df7RZjIk.css` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 5230`; token proof returned `302`, cookie-authenticated `/` served built `Command Code` HTML and assets `index-nnITahme.js` and `index-Df7RZjIk.css` |
| Electron dev startup | Pass | `npm run dev`; renderer `http://localhost:5175/`, embedded app server `http://127.0.0.1:55426` |

Scope: preview-only Settings UI package for broader hook edits. Settings > Hooks now lets the operator open a discovered hook in an edit preview panel, adjust command/matcher/timeout draft fields, preview update JSON, or preview delete JSON through `transport.previewHookEdit(...)`. No apply button, file write, hook execution, renderer IPC, OS notification, audio behavior, or Command Code settings mutation was added. The real Command Code interactive path was not exercised because this package does not start or control Command Code.

### 2026-06-06 Phase 3 broader hook edit apply

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `92/92` |
| Build | Pass | `npm run build`; assets `index-biXKJ36X.js` and `index-Df7RZjIk.css` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |
| Built route API proof | Pass | `npx tsx src/cli/ccgui.ts serve --port 5231`; authenticated `/api/hooks/apply-edit` against `/tmp/ccgui-hooks-apply-edit-m8v5W3` returned `ok=true`, `action=update`, project source, edited command/matcher/timeout, and `backup=true/true` |
| Electron dev startup | Pass | `npm run dev`; renderer `http://localhost:5175/`, embedded app server `http://127.0.0.1:55693` |

Scope: scoped broader hook edit write package. Added `/api/hooks/apply-edit`, `transport.applyHookEdit(...)`, and Settings `Apply edit preview` confirmation for command, matcher, timeout, and delete edits. The server recomputes the preview from the current scoped settings file, writes a sibling `.ccgui.bak` backup, then writes only the derived user/project `settings.json` path. No arbitrary file path, renderer IPC, hook execution, OS notification, audio behavior, or Command Code runtime mutation was added. The real Command Code interactive path was not exercised because this package edits config only.

### 2026-06-06 Phase 3 scoped hook log viewer

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `94/94` |
| Build | Pass | `npm run build`; assets `index-B7vaMBRP.js` and `index-Df7RZjIk.css` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |
| Hook log API proof | Pass | Authenticated `/api/hooks/logs` and `/api/hooks/logs/read` against temp project `/var/folders/r8/0k0xbybj7svf24btnjglc7jh0000gn/T/ccgui-hook-log-proof-KXgeh5`; listed only `audit.log`, read `hook log proof`, rejected outside `outside.log`, and rejected unsupported `secret.md` |
| Built browser route | Pass | `npm run dev:server -- --port 56188`; token proof returned `302`, cookie-authenticated `/` served built assets `index-B7vaMBRP.js` and `index-Df7RZjIk.css`; authenticated `/api/hooks/logs` for the repo returned derived project/user hook directories and no arbitrary path |
| Electron dev startup | Pass | `npm run dev`; renderer `http://localhost:5175/`, embedded app server `http://127.0.0.1:56240` |
| In-app Browser screenshot automation | Not run | Browser plugin navigation tools were not exposed in this turn and Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: scoped read-only hook log diagnostics package. Added `src/core/hooksLogs.ts`, `/api/hooks/logs`, `/api/hooks/logs/read`, `transport.listHookLogs(...)`, `transport.readHookLog(...)`, and Settings > Hooks source diagnostics plus raw preview UI. The server derives only `<project>/.commandcode/hooks` and `~/.commandcode/hooks`, lists supported log-like files (`.log`, `.jsonl`, `.txt`, `.ansi`), caps reads at the existing 1 MB file-read limit, and rejects outside paths and unsupported extensions. No arbitrary file access, renderer IPC, hook execution, hook test-runner, OS notification, audio behavior, or Command Code runtime mutation was added. The real Command Code interactive path was not exercised because this package only reads scoped diagnostics.

### 2026-06-06 Phase 3 hook dry-run test runner

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `100/100` |
| Build | Pass | `npm run build`; assets `index-u1BdDkr0.js` and `index-Df7RZjIk.css` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |
| Hook dry-run API proof | Pass | Authenticated `/api/hooks/dry-run` at `http://127.0.0.1:56852/`; matching `Bash|Shell` sample returned `willRun=true`, `toolName=Bash`, and `execution=not-run`; mismatched `Write|Edit` versus `Read` returned `willRun=false` and `execution=not-run` |
| Built browser route | Pass | `npm run dev:server -- --port 56853`; token proof returned `302`, cookie-authenticated `/` served built assets `index-u1BdDkr0.js` and `index-Df7RZjIk.css`; authenticated `/api/hooks/dry-run` returned `ccgui_dry_run=true` and `execution=not-run` |
| Electron dev startup | Pass | `npm run dev`; renderer `http://localhost:5175/`, embedded app server `http://127.0.0.1:56886` |
| In-app Browser screenshot automation | Not run | Browser plugin navigation tools were not exposed in this turn and Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: dry-run test runner package for Settings > Hooks. Added `src/core/hooksDryRun.ts`, `/api/hooks/dry-run`, `transport.dryRunHook(...)`, and Settings `Dry-run test` controls that return sample payload evidence, matcher applicability, and `execution: not-run`. The route does not read hook config, does not write files, does not start a session, does not spawn a process, and does not execute hook commands. Real hook execution, real-session test payloads, OS notifications, audio behavior, and Command Code runtime mutation remain gated.

### 2026-06-06 Phase 3 Stop-hook recipe docs

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Local docs links | Pass | `rg -n -e "Focused local page" -e "hooks\\.md.*started" docs/reference/command-code-docs/README.md` |
| Recipe boundary | Pass | `rg -n "command-code-bonk|execution: not-run|ccgui_dry_run|does not execute hook commands" docs/reference/command-code-docs/hooks.md` |

Scope: docs-only Stop-hook recipe package. Added `docs/reference/command-code-docs/hooks.md` with current Settings > Hooks capabilities, dry-run test runner semantics, non-implemented execution boundaries, and a project-scoped `command-code-bonk --sound done` Stop-hook recipe. No runtime code, server routes, renderer IPC, settings persistence, hook execution, OS notification, audio behavior, or Command Code settings mutation was added.

### 2026-06-06 Phase 3 readiness notification planner

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `103/103` |
| Build | Pass | `npm run build`; assets `index-B_jIDcWW.js` and `index-Df7RZjIk.css` |
| Browser/API smoke | Pass | `npm run smoke:browser`; mock session created/exited, auth checks passed |
| Built browser route | Pass | `npm run dev:server -- --port 57331`; token proof returned `302`, cookie-authenticated `/` served built assets `index-B_jIDcWW.js` and `index-Df7RZjIk.css` |
| Electron dev startup | Pass | `npm run dev`; renderer `http://localhost:5175/`, embedded app server `http://127.0.0.1:57350` |
| In-app Browser screenshot automation | Not run | Browser plugin navigation tools were not exposed in this turn and Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: pure readiness notification planner package. Added explicit `response-ready` and `input-required` toast/audio preference categories and `src/renderer/src/services/readinessNotifications.ts` to map explicit readiness intents to preference-aware delivery plans. Audio remains disabled by default. No readiness dispatch, OS notification, audio playback, terminal-output heuristic, session lifecycle change, server route, renderer IPC, hook execution, or Command Code runtime mutation was added.

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

### 2026-06-06 Phase 4 session model identity labels

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `107/107` |
| Build | Pass | `npm run build`; renderer assets `index-B80NPNmD.js` and `index-Df7RZjIk.css` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 57370`; token proof returned `302`, cookie-authenticated `/` served built assets `index-B80NPNmD.js` and `index-Df7RZjIk.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:57625` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: added a pure renderer session model identity resolver and used it for session header, composer chip, tab detail, and transcript metadata labels. This did not change Command Code model routing, CLI arguments, IPC routes, config writes, filesystem access, or session lifecycle. Real CLI path was not retested for this presentation-only slice.

### 2026-06-06 Phase 4 model dropdown search

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `110/110` |
| Build | Pass | `npm run build`; renderer assets `index-BZe6ioWY.js` and `index-BR1DD7ml.css` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 57371`; token proof returned `302`, cookie-authenticated `/` served built assets `index-BZe6ioWY.js` and `index-BR1DD7ml.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:57810` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: extracted documented model list parsing, favorite sorting, and search/filter matching into `src/renderer/src/services/modelCatalog.ts`, then added a search input to the existing model picker. This did not change Command Code model routing, CLI arguments, IPC routes, config writes, filesystem access, or session lifecycle. Real CLI path was not retested for this renderer-only picker slice.

### 2026-06-06 Phase 4 read-only Models settings

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Not run | Package did not touch parser, transport, config, session, or shared helper code |
| Build | Pass | `npm run build`; renderer assets `index-0J8Ve054.js` and `index-X_jYjd9B.css` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 57372`; token proof returned `302`, cookie-authenticated `/` served built assets `index-0J8Ve054.js` and `index-X_jYjd9B.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:58042` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: replaced the generic Models reference card with a read-only Settings > Models surface that separates single-session model selection, Command Code-owned task routing, model catalog search, and future/plugin-owned vision adapter routing. This did not change Command Code model routing, CLI arguments, IPC routes, config writes, filesystem access, or session lifecycle. Real CLI path was not retested for this renderer-only settings slice.

### 2026-06-06 Phase 4 transcript model metadata discovery

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `112/112` |
| Build | Pass | `npm run build`; renderer assets `index-0J8Ve054.js` and `index-X_jYjd9B.css` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 57373`; token proof returned `302`, cookie-authenticated `/` served built assets `index-0J8Ve054.js` and `index-X_jYjd9B.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:58239` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: extended the existing scoped project transcript `.meta.json` read to include trimmed model metadata, and added tests using an injected temporary Command Code base directory. This did not add file roots, IPC routes, config writes, CLI argument changes, Command Code model semantics, or session lifecycle behavior. Real CLI path was not retested for this metadata discovery slice.

### 2026-06-06 Phase 4 local models reference

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Docs index | Pass | `rg --files docs/reference/command-code-docs` shows `models.md` |
| Boundary search | Pass | `rg -n "configure-models|--list-models|--model|vision adapter" docs/reference/command-code-docs/models.md docs/reference/command-code-docs/README.md` |
| Build | Not run | Docs-only package; renderer/server/main/package files were unchanged |
| Browser/API smoke | Not run | Docs-only package; browser transport, auth, mock, and session UI were unchanged |

Scope: added a local Models reference page with direct `cmd --help` and `cmd --list-models` evidence, plus GUI boundaries for single-session model selection, task routing, and future vision-adapter routing. This did not change runtime code, renderer IPC, file access, config writes, CLI arguments, or session lifecycle.

### 2026-06-06 Phase 4 task routing preview

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `114/114` |
| Build | Pass | `npm run build`; renderer assets `index-Dtbqg9wM.js` and `index-C49QUrJu.css` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 57374`; token proof returned `302`, cookie-authenticated `/` served built assets `index-Dtbqg9wM.js` and `index-C49QUrJu.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:58486` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: added a pure model-routing preview contract for compaction, title generation, and background work, then rendered the rows in Settings > Models as Command Code-owned and preview-only. This did not add config writes, routing-table parsing, IPC routes, file access, CLI argument changes, Command Code model semantics, or session lifecycle behavior. Real CLI path was not retested for this preview-only settings slice.

### 2026-06-06 Phase 5 command palette search foundation

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `117/117` |
| Build | Pass | `npm run build`; renderer assets `index-CBo51pUT.js` and `index-BV7Dspfr.css` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 57375`; token proof returned `302`, cookie-authenticated `/` served built assets `index-CBo51pUT.js` and `index-BV7Dspfr.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:58698` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: added tested command/workflow palette search and preview-only recipes for interactive, headless, plan, design, resume, continue, configure models, MCP setup, hook setup, notification setup, and agent creation. Executable command rows still use the existing `runCommand(item)` path. This did not add prompt rewriting, helper execution semantics, config writes, renderer IPC, file access, CLI argument changes, or session lifecycle behavior. Real CLI path was not retested for this renderer-only palette slice.

### 2026-06-06 Phase 5 design helper preview

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `120/120` |
| Build | Pass | `npm run build`; renderer assets `index-DhV-rzOP.js` and `index-D0pnBW39.css` |
| Browser/API smoke | Pass | `npm run smoke:browser` |
| Built browser route | Pass | `npx tsx src/cli/ccgui.ts serve --port 57376`; token proof returned `302`, cookie-authenticated `/` served built assets `index-DhV-rzOP.js` and `index-D0pnBW39.css` |
| Electron dev startup | Pass | `npm run dev`; Vite used `5175`, embedded app server reported `http://127.0.0.1:58884` |
| Browser screenshot automation | Not run | Playwright is not installed in this project; route-level and Electron startup receipts were used instead |

Scope: added a tested `/design` command preview builder and preview-only Settings > Design helper. It includes documented mode and target in the command and keeps goal/selected-element context visible but outside the command. This did not add active-session send behavior, hidden prompt rewriting, config writes, renderer IPC, file access, CLI argument changes, or session lifecycle behavior. Real CLI path was not retested for this renderer-only helper slice.
