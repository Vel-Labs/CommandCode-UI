# Hardening Bugfix Audit

**Date:** 2026-06-08
**Repo:** `/Users/steven/Workspace/40_Code/projects/command-code-gui`
**Auditor:** Codex
**Scope:** Local repo audit of Electron, WebGUI, PTY/session continuity, non-terminal UX, install/onboarding, Linux/WSL readiness, docs drift, and test coverage.

This is a shared audit document. Other LLMs should append their pass in the reviewer sections below, not rewrite or delete existing findings unless they are explicitly correcting them with evidence.

**Current operating mode:** observe and report only. Agents should identify bugs, risks, validation gaps, docs drift, and code-shape concerns. They should not implement fixes in this pass. For any flagged file or module, agents should propose how the split or cleanup could be safely handled later, including likely extraction boundaries and validation, but leave the actual resolution for a future organized plan/goal.

## Current Local Validation

Commands run locally on macOS:

| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npx vitest run` | Pass, 32 files / 209 tests |
| `npm run build` | Pass |
| `npm run smoke:browser` | Pass; mock headless, real headless start, mock sessions, multi-session independence, auth basics |
| `npm run smoke:pty` | Pass; `node-pty` available, `/bin/zsh`, healthy, output `ok` |
| `npm run smoke:headless` | Pass; real `cmd --print` exited 0 |
| `npm run doctor` | Pass; Command Code `v0.33.2`, auth ok, 27 models, PTY healthy |

Important boundary: these checks prove local macOS CLI/server/build health. They do not prove a complete real Electron click-through, visual regression state, Linux package behavior, WSL clean-room behavior, or a first-run install path for users without Command Code.

## Executive Summary

The app is in a strong local engineering state: type safety, tests, build, PTY health, browser smoke, and real headless Command Code execution all pass. The remaining risk is less about basic viability and more about continuity and product hardening for non-terminal users.

Code quality is part of this audit, not a secondary cleanup concern. Electron and WebGUI modules should stay clean, human-readable, and componentized so the app can scale without turning into monolithic files. Prefer small focused modules, shared presentational primitives, explicit orchestrator layers, and consistent visual components across Electron and browser shells. As a practical readability target, files should stay around 350 lines when feasible; many components and services should be meaningfully smaller. When a file grows past that range, reviewers should identify whether it should be split into pure helpers, transport adapters, view-model hooks, presentational components, or orchestration layers. Reviewers should propose a safe split sequence, but not perform the split during this audit.

Top risks found locally:

1. **WebGUI project selection is not functional as a real picker.** Electron overlays a native folder picker, but browser mode returns localStorage or `/`, which can silently strand browser/WSL users.
2. **Browser reveal actions are no-ops.** Electron can reveal transcripts/projects through IPC, but WebGUI buttons can appear actionable while doing nothing.
3. **Large structured transcripts can still dead-end.** Oversized `.ansi` tails are handled, but oversized `.jsonl` transcripts return an error, which can block non-terminal users from understanding long sessions.
4. **CORS origin matching is prefix-based.** The server accepts origins starting with `http://localhost`, which is looser than the strategy/docs require.
5. **Docs have security and lifecycle drift.** Some architecture/API docs still describe older cookie and stop/kill behavior.
6. **Clean-room install/onboarding is not a first-class GUI flow yet.** The app detects missing Command Code, but it does not provide a guided install/auth/doctor journey suitable for non-terminal users.
7. **Linux/WSL are strategy-level supported but not validated in this checkout.** There is no receipt for AppImage/Linux browser mode/WSL first-run from a clean machine.
8. **Code-shape drift can become a product risk.** Hardening fixes should not pile more behavior into large renderer/server files when clean seams and reusable components are available.

## Findings

### P1: WebGUI `Choose folder...` cannot choose a real folder

**Status:** Confirmed in code.

**Evidence:**
- `src/renderer/src/components/AppPopovers.tsx` exposes `Choose folder...` for all shells.
- `src/renderer/src/useTransport.ts` overlays `chooseDirectory` only when Electron preload exists.
- `src/renderer/src/browserAdapter.ts` implements browser `chooseDirectory()` by returning `localStorage.getItem('ccgui.cwd') || '/'`.

**Why it matters:** The WebGUI is the most important shell for Linux/WSL and non-Electron users. A browser user who clicks Project -> Choose folder may get `/` or a stale path without any explicit confirmation. On WSL this is especially confusing because the correct path is inside the Linux environment, not the Windows browser's file system.

**Suggested fix:**
- Add a browser-specific project picker popover with a manual path input, recent paths, validation via `/api/files/list` or a dedicated `/api/project/validate`, and clear copy that the path is on the machine running `ccgui serve`.
- In browser mode, label the control `Set server-side project path...` instead of `Choose folder...`.
- Reject `/` as an implicit default for real sessions unless the user explicitly typed it.
- Add tests for browser project path validation and a browser smoke covering first project setup.

**Validation needed:**
- Start `npm run serve -- --open` from a clean browser profile.
- Set a real project path manually.
- Start mock and real sessions from that path.
- Verify file browsing and git status use the selected server-side path.

### P1: WebGUI reveal actions are silent no-ops

**Status:** Confirmed in code.

**Evidence:**
- `src/renderer/src/browserAdapter.ts` implements `revealTranscript()` and `revealPath()` as resolved promises with no UI feedback.
- `src/renderer/src/inspectors/RightInspectorPanel.tsx` shows reveal buttons from shared UI.
- `src/renderer/src/useTransport.ts` only overlays reveal behavior in Electron.

**Why it matters:** A non-terminal browser user can click `Reveal transcript` or `Reveal project in Finder` and nothing happens. This looks broken, not intentionally unsupported.

**Suggested fix:**
- Replace browser no-ops with explicit unsupported results in the transport contract, or show a toast/modal that explains browser mode cannot open the OS file manager.
- Provide useful alternatives: copy path, open in file inspector, download transcript tail, or show command `cd <path>`.
- Rename Finder-specific labels to shell-neutral labels such as `Reveal project` or conditionally `Show path`.

**Validation needed:**
- Browser route: click reveal buttons and confirm visible fallback.
- Electron route: click reveal buttons and confirm native reveal still works.

### P1: Oversized `.jsonl` transcripts still block transcript inspection

**Status:** Confirmed risk in current server behavior.

**Evidence:**
- `src/server/index.ts` returns bounded tails for oversized `.ansi`, `.log`, and `.txt` transcript diagnostics.
- The same route returns `Transcript too large (...). Max: 1MB.` for oversized non-tail file types, including `.jsonl`.
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx` displays the error and does not provide a paged or sampled view.

**Why it matters:** Recent real sessions can exceed 1MB. For non-terminal users, transcript/history inspection is the main continuity surface. A hard error removes the context they need to resume, audit, or understand what happened.

**Suggested fix:**
- Implement bounded `.jsonl` transcript sampling: latest N entries, filtered by event type, plus metadata showing total bytes and truncation.
- Add a server route for paginated transcript reads by byte range or line cursor.
- In the UI, show a partial timeline with a clear `Showing latest entries` banner instead of a dead-end error.

**Validation needed:**
- Create a >1MB `.jsonl` transcript fixture.
- Verify the transcript inspector renders a bounded timeline and filter counts.
- Verify memory use stays bounded.

### P1: Clean-room install/onboarding is not GUI-native yet

**Status:** Product/UX gap confirmed by docs and current flow.

**Evidence:**
- README prerequisites still start with terminal commands: `npm i -g command-code`, `cmd --version`, `cmd status --json`.
- `ccgui doctor` provides useful CLI diagnostics, including WSL hints, but the GUI does not own an install/auth wizard.
- The app can run Demo mode without Command Code installed, but users still need to infer the next install/auth step.

**Why it matters:** The target audience includes people who benefit precisely because they are not terminal-focused. If Command Code is missing or auth is not ready, the app should make the next step obvious and safe.

**Suggested fix:**
- Add a first-run readiness route in the GUI: Command Code binary -> auth -> model list -> PTY health -> project path.
- For missing binary, show platform-specific instructions and a copyable command. Keep auto-install behind an explicit operator action.
- For WSL, show `Run this inside WSL` guidance and explain that project paths are Linux paths.
- Add `ccgui doctor --json` or `/api/doctor` so the GUI can render the same checks without parsing terminal output.

**Validation needed:**
- Fresh macOS user without `cmd`.
- Fresh Linux user without `cmd`.
- Fresh Windows + WSL user without `cmd`.
- Existing authenticated user.

### P2: CORS origin checks are prefix-based

**Status:** Confirmed in code.

**Evidence:**
- `src/server/index.ts` allows an origin when `origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')`.
- The cross-platform strategy requires strict origin handling.

**Why it matters:** Prefix checks are fragile. `http://localhost.evil.example` matches the string prefix even though it is not localhost. The token still limits practical exposure, but this is not the strict local-origin posture the docs claim.

**Suggested fix:**
- Parse `new URL(origin)` and require hostname exactly `127.0.0.1`, `localhost`, or `::1`, with `http:` for local dev unless HTTPS is intentionally supported.
- Add regression tests for `http://localhost.evil.example`, `http://127.0.0.1.evil.example`, missing origin, and valid localhost origins.
- Consider rejecting credentialed CORS entirely outside dev unless there is a specific cross-origin browser mode.

**Validation needed:**
- Unit/API tests for allowed and rejected origins.
- Browser smoke still passes for same-origin built serving.

### P2: Architecture/API docs drift from current auth and session lifecycle

**Status:** Confirmed in docs.

**Evidence:**
- `docs/architecture/ARCHITECTURE.md` says the server sets the cookie on every response. Current server behavior only issues cookies after token proof or authenticated requests.
- The same doc describes older stop/kill route names and a Ctrl-C stop ladder, while current server exposes stop, interrupt, and delete/force kill separately.
- `docs/reference/API_REFERENCE.md` says CORS uses `Access-Control-Allow-Origin: *`, while current code has conditional origin handling.

**Why it matters:** This repo treats docs as execution contracts. Security and lifecycle drift can cause future agents to reintroduce closed bugs or validate the wrong behavior.

**Suggested fix:**
- Update architecture/API docs from current server code.
- Add a docs drift checklist to future hardening gates: auth issuance, CORS, session stop ladder, IPC surface, file access scope, WebGUI limitations.
- Keep `README.md`, `docs/architecture/SECURITY.md`, `docs/reference/API_REFERENCE.md`, and `docs/architecture/ARCHITECTURE.md` aligned whenever server auth/session behavior changes.

**Validation needed:**
- `rg` for stale claims: `cookie on every`, `Access-Control-Allow-Origin: *`, `/api/sessions/:id/kill`, `Ctrl-C`.

### P2: Native conversation projection is useful but still PTY-text fragile

**Status:** Confirmed architectural risk with good partial coverage.

**Evidence:**
- `src/renderer/src/services/liveConversation.ts` parses terminal text into native events.
- Tests cover many prompt, activity, approval, taste-learning, and terminal-required cases.
- Unknown TUI states intentionally fall back to `terminal_required`, but live correctness depends on recognizing enough Command Code output shapes.

**Why it matters:** The app must not pretend it owns Command Code runtime state. For non-terminal users, the native conversation is the main experience, so parsing misses must degrade loudly and helpfully, not look stuck.

**Suggested fix:**
- Keep treating the native timeline as projection, not truth.
- Add a persistent `Raw terminal available` affordance when parsing falls back or no output changes for a threshold.
- Add parser fixtures from real Command Code sessions for install prompts, auth prompts, model selection, MCP prompts, plan-mode prompts, interrupted sessions, failed commands, and long-running no-token progress.
- Track parser confidence in the UI: `Native view`, `Needs terminal input`, `Diagnostic fallback`.

**Validation needed:**
- Real CLI session recordings for at least five prompt types.
- Tests proving parser misses become terminal-required states instead of assistant text or generic waiting.

### P2: Real Electron click-through is not covered by the current automated bundle

**Status:** Validation gap.

**Evidence:**
- Local validation passed build/unit/smoke scripts.
- Existing reports repeatedly use route-level or startup receipts when browser automation is unavailable.
- Current automated smoke does not click through the Electron UI, start a real session visually, handle an approval button, reveal a transcript, or stop/force stop from the rendered shell.

**Why it matters:** This app is UX-heavy. Server and unit tests do not catch disabled buttons, silent no-ops, hidden overflow, stale status text, or keyboard focus breaks.

**Suggested fix:**
- Add a minimal Playwright/Electron smoke or documented manual receipt path.
- Cover: first load, choose project, Demo session, real session, composer follow-up, approval button, terminal fallback, transcript inspector, stop, force stop, settings navigation.
- Keep screenshots or DOM receipts under a report with exact command and date.

**Validation needed:**
- Run on macOS Electron.
- Run built browser route.
- Repeat on Linux/WSL once available.

### P2: Linux/WSL support needs a clean-room validation checklist and receipts

**Status:** Not locally validated in this pass.

**Evidence:**
- `docs/architecture/CROSS_PLATFORM_STRATEGY.md` positions Linux and WSL as first-class paths.
- `docs/reports/TEST_PLAN.md` lists Linux + bash and Windows matrix items.
- No local Linux/WSL receipt was generated in this audit.

**Why it matters:** WSL is probably the right Windows path because Command Code support is stronger there than native Windows. But WSL introduces path, browser, port, and install expectations that macOS Electron dogfood will not reveal.

**Suggested clean-room WSL script:**
1. Install Node >= 20 inside WSL.
2. Install or clone this GUI package.
3. Run `npm install`.
4. Run `npm run build`.
5. Run `npm run doctor` before Command Code install and save output.
6. Install Command Code using the documented command.
7. Run `cmd --version`, `cmd status --json`, and `cmd --list-models`.
8. Run `npm run doctor`, `npm run smoke:pty`, `npm run smoke:browser`, and `npm run smoke:headless`.
9. Run `npm run serve -- --port 5183 --open` from inside WSL.
10. Open the printed browser URL from Windows.
11. Set a Linux project path manually.
12. Start Demo and real sessions.
13. Verify stop/interrupt/force stop and transcript inspection.

**Validation needed:** Add a dated WSL receipt section to this document or `docs/reports/SMOKE_TEST_REPORT.md`.

### P3: CLI `serve --port 0` remains unavailable even though internal server supports port 0

**Status:** Known gap, still visible in CLI code.

**Evidence:**
- `createAppServer(0)` works and is used by smoke scripts.
- `src/cli/ccgui.ts` rejects ports `< 1`.
- `docs/reports/HARDENING_GATE.md` already noted `ccgui serve --port 0` as deferred.

**Why it matters:** Auto-assigned ports make WSL/Linux/browser mode easier when common ports are occupied. The current CLI defaults to `5173` and requires manual retry.

**Suggested fix:**
- Allow `--port 0` and print `app.url` / `app.authUrl` after bind.
- On `EADDRINUSE`, optionally retry a bounded number of ports or suggest `--port 0`.
- Add a CLI smoke for `ccgui serve --port 0`.

### P3: Static-file path containment should use `path.relative`/realpath rather than prefix checks

**Status:** Defensive hardening suggestion.

**Evidence:**
- `src/server/index.ts` normalizes the pathname and checks `resolved.startsWith(staticDir)`.

**Why it matters:** Prefix checks are easy to get subtly wrong when paths share prefixes. This route serves built assets only, so the impact is lower than API/file routes, but the hardened pattern should be consistent.

**Suggested fix:**
- Resolve `staticDir` once with `realpathSync`.
- Resolve the requested target and require `path.relative(staticRoot, target)` not to start with `..` and not be absolute.
- Add tests for encoded traversal, sibling-prefix paths, and SPA fallback.

## Product Hardening Themes For Non-Terminal Users

The app should assume the user does not know:

- what `cmd` resolves to on their platform;
- whether Command Code is installed or authenticated;
- what a PTY is;
- that a browser UI controls paths on the server machine;
- how to answer terminal menus with `Enter`, `Esc`, or `n`;
- where transcripts live;
- whether a run is Demo, real interactive, or real headless.

Recommended UX principles:

- First-run readiness should be a checklist, not a terminal transcript.
- Browser mode must be explicit about server-side paths.
- Risky execution modes must remain visible in the active session header and composer.
- Unsupported browser-native actions must show an alternative, never silently succeed.
- Long-running sessions need specific progress or a visible diagnostic fallback.
- Transcript/history must remain inspectable even when large.

## Code Quality And Scalability Standards

Every hardening pass should evaluate the shape of the code, not just whether the immediate bug can be patched.

- Keep Electron shell code defensive and small. Native IPC should remain narrow and purpose-specific.
- Keep WebGUI behavior explicit about browser/server boundaries, especially project paths and OS-only actions.
- Prefer scalable shared components for repeated visual patterns: status pills, readiness cards, project selectors, transcript controls, approval cards, and browser fallbacks.
- Avoid monolithic renderer files. Move focused behavior into typed services, hooks, view-model modules, and presentational components.
- Keep pure logic in testable modules outside React components when possible.
- Use orchestrator layers to join smaller modules instead of letting one file own transport, parsing, state, rendering, and side effects.
- Treat 350 lines as a readability warning threshold, not a hard law. If a file exceeds it, the reviewer should explain why it is acceptable or propose a split.
- When flagging a file, propose a safe split plan: extraction order, new module boundaries, tests to freeze behavior first, and manual receipts needed after the later cleanup.
- Preserve consistent look and feel between Electron and WebGUI. Divergence should be explicit platform behavior, not duplicated one-off UI.
- Do not solve UX gaps with broad shell access, renderer-side filesystem assumptions, or more terminal scraping.
- Do not implement cleanup during this audit. Record the recommendation so the follow-up plan can batch and sequence the work.

## Suggested Next Fix Order

1. WebGUI project path setup and browser reveal fallback.
2. Large `.jsonl` transcript partial rendering.
3. CORS exact-origin hardening and tests.
4. Architecture/API docs drift cleanup.
5. GUI first-run doctor/install/auth readiness surface.
6. Electron/browser visual click-through smoke.
7. WSL clean-room receipt.
8. Linux package/AppImage receipt.

## Reviewer Append Template

Each additional LLM should append a section using this format.

```md
## Reviewer Pass: <Reviewer Name / Model> - <YYYY-MM-DD>

### Validation Performed

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass/Fail/Not run |  |
| `npx vitest run` | Pass/Fail/Not run |  |
| `npm run build` | Pass/Fail/Not run |  |
| `npm run smoke:browser` | Pass/Fail/Not run |  |
| `npm run smoke:pty` | Pass/Fail/Not run |  |
| `npm run smoke:headless` | Pass/Fail/Not run |  |
| Electron UI click-through | Pass/Fail/Not run |  |
| WebGUI click-through | Pass/Fail/Not run |  |
| Linux/WSL clean-room | Pass/Fail/Not run |  |

### Agreement With Existing Findings

| Finding | Agree? | Resolution Suggestions / Differences |
|---|---|---|
| P1 WebGUI `Choose folder...` cannot choose a real folder | Yes/No/Partial |  |
| P1 WebGUI reveal actions are silent no-ops | Yes/No/Partial |  |
| P1 Oversized `.jsonl` transcripts still block transcript inspection | Yes/No/Partial |  |
| P1 Clean-room install/onboarding is not GUI-native yet | Yes/No/Partial |  |
| P2 CORS origin checks are prefix-based | Yes/No/Partial |  |
| P2 Architecture/API docs drift from current auth and session lifecycle | Yes/No/Partial |  |
| P2 Native conversation projection is useful but still PTY-text fragile | Yes/No/Partial |  |
| P2 Real Electron click-through is not covered by the current automated bundle | Yes/No/Partial |  |
| P2 Linux/WSL support needs a clean-room validation checklist and receipts | Yes/No/Partial |  |
| P3 CLI `serve --port 0` remains unavailable | Yes/No/Partial |  |
| P3 Static-file path containment should use `path.relative`/realpath | Yes/No/Partial |  |
| Code quality/readability and scalable Electron/WebGUI components | Yes/No/Partial |  |

### New Findings

#### <Severity>: <Title>

**Status:** Confirmed / Suspected / Needs verification
**Evidence:** File paths, line references, command output, screenshots, or exact reproduction steps.
**Why it matters:** User impact and safety impact.
**Suggested fix:** Concrete implementation direction.
**Validation needed:** Exact command or manual flow that would prove the fix.

### Code Shape Review

List files that are becoming too large, too mixed-responsibility, or duplicated across Electron/WebGUI. For each, suggest a split into pure helpers, hooks/view models, presentational components, transport adapters, or orchestrator layers. Use the 350-line readability target as a warning threshold and explain exceptions.

For each flagged file, include:

- current responsibility mix;
- why the size/shape creates risk;
- proposed split boundaries;
- safe extraction order;
- tests or fixtures to add before moving code;
- manual UI receipts needed after the later cleanup;
- explicit note that no cleanup was implemented in this audit pass.

### Disagreements Or Corrections

If you disagree with an existing finding, do not delete it. Add:

- the finding title;
- what evidence contradicts it;
- whether the original issue is resolved, misclassified, or still real but lower priority;
- what validation proves your correction.

### Proposed Fix Batches

Group fixes into small batches that can be implemented and validated independently. Each batch should list files likely touched, tests to add/update, and manual receipts required.
```

## Rules For Future Reviewers

- Do not overwrite existing findings; append your pass.
- If you agree with a bug, focus on resolution strategy and validation, not restating the bug.
- If you think a finding is wrong, provide concrete evidence and mark it as corrected in your own section.
- This phase is observe/report only. Do not implement fixes or refactors while contributing to this audit.
- Separate confirmed code bugs from product gaps and unvalidated platform claims.
- Keep Electron, WebGUI, Linux, WSL, and native Windows separate.
- Keep Demo/mock, real interactive PTY, and real headless Command Code paths separate.
- Treat clean, human-readable code as an acceptance requirement, not polish.
- Flag files that exceed roughly 350 lines unless their structure remains clearly readable and justified.
- Prefer small scalable components and orchestrator layers over monolithic Electron, server, or renderer files.
- When flagging a file, propose the later safe split strategy and validation, but do not perform the split in this audit pass.
- Preserve consistent look and feel through shared components instead of duplicated one-off UI.
- Do not broaden renderer IPC or add generic shell execution as a fix.
- Do not scrape terminal output in UI components as structured truth; parser output is presentation only.
- Any risky install/update/write action should be explicit, previewed when possible, and visibly labeled.
- Every proposed fix should name its validation command or manual route.

---

## Reviewer Pass: Nemotron (CommandCodeBot) - 2026-06-08

> **Note:** This review pass was performed by Nemotron (via CommandCodeBot). All findings, suggestions, and proposed fixes are AI-generated observations from automated codebase analysis.

### Validation Performed

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | 0 errors |
| `npx vitest run` | Pass | 32 files / 209 tests |
| `npm run build` | Pass | electron-vite + esbuild |
| `npm run smoke:browser` | Pass | mock headless, real headless, mock sessions, multi-session, auth |
| `npm run smoke:pty` | Pass | node-pty available, /bin/zsh healthy |
| `npm run smoke:headless` | Pass | real `cmd --print` exited 0 |
| `npm run doctor` | Pass | cmd v0.33.2, auth ok, 27 models, PTY healthy |
| Electron UI click-through | Not run | No automated visual test exists |
| WebGUI click-through | Not run | No automated visual test exists |
| Linux/WSL clean-room | Not run | No WSL/Linux machine in this environment |

### Agreement With Existing Findings

| Finding | Agree? | Resolution Suggestions / Differences |
|---|---|---|
| P1 WebGUI `Choose folder...` cannot choose a real folder | Yes | Add browser-specific picker popover with manual path input + `/api/files/list` validation. Label control `Set server-side project path...` in browser mode. |
| P1 WebGUI reveal actions are silent no-ops | Yes | Replace no-ops with toast/modal explaining limitation + alternatives (copy path, open in file inspector, download tail). Use shell-neutral labels. |
| P1 Oversized `.jsonl` transcripts still block transcript inspection | Yes | Implement bounded JSONL sampling (latest N entries by event type) + paginated server route. Show `Showing latest entries` banner. |
| P1 Clean-room install/onboarding is not GUI-native yet | Yes | Add first-run readiness checklist route: binary -> auth -> models -> PTY -> project. Add `/api/doctor` for GUI-native rendering. |
| P2 CORS origin checks are prefix-based | Yes | Parse origin URL, require exact hostname match (`127.0.0.1`, `localhost`, `::1`). Add regression tests for prefix-bypass origins. |
| P2 Architecture/API docs drift from current auth and session lifecycle | Yes | Sync docs from server code: cookie issuance only on authenticated responses, stop/interrupt/kill ladder, conditional CORS. Add docs drift checklist. |
| P2 Native conversation projection is useful but still PTY-text fragile | Yes | Keep projection boundary explicit. Add parser fixtures from real CLI sessions. Add parser confidence indicator in UI. |
| P2 Real Electron click-through is not covered by the current automated bundle | Yes | Add Playwright/Electron smoke covering core flows. Keep screenshots/DOM receipts in dated report. |
| P2 Linux/WSL support needs a clean-room validation checklist and receipts | Yes | Run the clean-room WSL script in a fresh environment. Add receipt to TEST_PLAN or SMOKE_TEST_REPORT. |
| P3 CLI `serve --port 0` remains unavailable | Yes | Allow `--port 0` in CLI, print bound URLs. Add CLI smoke test. |
| P3 Static-file path containment should use `path.relative`/realpath | Yes | Resolve staticDir once with realpathSync. Use `path.relative` not startsWith. Add traversal tests. |
| Code quality/readability and scalable Electron/WebGUI components | Yes | See Code Shape Review below for specific file flags and split proposals. |

### New Findings

#### P2: App.tsx exceeds 1400 lines — monolithic orchestration surface

**Status:** Confirmed

**Evidence:**
- `src/renderer/src/App.tsx` is 1479 lines and owns: transport, all workspace state, session lifecycle, preferences hydration/persistence, git status, PTY health, update checks, composer, keyboard shortcuts, sidebar/inspector resize, popover management, transcript inspection, headless jobs, shell terminal, and render delegation.

**Why it matters:** This is the central orchestrator for the entire renderer. Any hardening fix (WebGUI picker, transcript pagination, onboarding wizard) will add more logic here, increasing coupling and making isolated testing harder. The file mixes presentation (JSX for ShellLayout) with business logic (preferences, session management, readiness reducers).

**Suggested fix:** Split into:
1. `src/renderer/src/app/orchestration/AppOrchestrator.tsx` — state management, transport, effects, lifecycle (pure React logic, no JSX)
2. `src/renderer/src/app/views/AppView.tsx` — JSX composition, ShellLayout, workspace switching
3. `src/renderer/src/app/hooks/useAppPreferences.ts` — app/project preference hydration/save logic
4. `src/renderer/src/app/hooks/useSessionManager.ts` — session start/stop/tab/resume logic
5. `src/renderer/src/app/hooks/useProjectContext.ts` — project discovery, git status, cwd management

**Safe extraction order:**
1. Add tests freezing current App.tsx behavior (snapshots for workspace views, preference hydration, session start/stop).
2. Extract `useAppPreferences` hook first (pure, testable).
3. Extract `useProjectContext` hook (git, discovery, cwd).
4. Extract `useSessionManager` hook (session lifecycle).
5. Split orchestration from view.
6. Manual receipts: verify Electron + browser mode, real session, mock session, headless, settings persistence, sidebar/inspector resize.

#### P2: server/index.ts exceeds 1500 lines — single-file HTTP/WS/Auth/File/Session/Sessions/Discovery/Hooks aggregation

**Status:** Confirmed

**Evidence:**
- `src/server/index.ts` is 1584 lines and owns: HTTP server, WebSocket server, auth (cookie/header/query/bearer), CORS, route dispatch, static file serving, session manager, workspace roots, idle timers, PTY factory, CLI wrappers, file browsing, git status, session discovery, taste/agents/MCP/skills/memory, hooks config/logs/dry-run, app/project preferences.

**Why it matters:** Security-sensitive code (auth, path containment, CORS) is mixed with feature routes. A change to transcript handling or hooks can accidentally affect auth or static serving. Testing requires spinning up the full server.

**Suggested fix:** Split into:
1. `src/server/auth.ts` — token generation, extraction, validation, cookie setting
2. `src/server/cors.ts` — origin validation, CORS headers
3. `src/server/routes/` — one file per domain: sessions, files, git, ide, discovery, preferences, hooks, headless
4. `src/server/static.ts` — static file serving with hardened path containment
5. `src/server/ws.ts` — WebSocket session streaming
6. `src/server/index.ts` — thin composition root (~100 lines)

**Safe extraction order:**
1. Add API contract tests for each route group (freeze request/response shapes).
2. Extract auth/cors as pure modules (easiest to test in isolation).
3. Extract static file serving (security-critical, testable with traversal fixtures).
4. Extract route groups one by one, keeping server.ts as composition root.
5. Manual receipts: run smoke:browser, smoke:headless, smoke:pty, doctor, verify auth flow in Electron and browser.

#### P2: browserAdapter.ts exceeds 450 lines — transport implementation mixed with browser-specific fallbacks

**Status:** Confirmed

**Evidence:**
- `src/renderer/src/browserAdapter.ts` is 454 lines and implements the entire `TransportAPI` (50+ methods) plus browser-specific fallbacks (chooseDirectory no-op, reveal no-ops, token fetching, WebSocket management).

**Why it matters:** The transport contract is large. Browser-specific no-ops (chooseDirectory, revealTranscript, revealPath) are implemented inline instead of being explicit "unsupported" results. Adding WebGUI picker or reveal fallback requires modifying this monolithic adapter.

**Suggested fix:** Split into:
1. `src/renderer/src/transport/browserTransport.ts` — core fetch/WebSocket implementation (shared by Electron + browser)
2. `src/renderer/src/transport/browserFallbacks.ts` — explicit unsupported implementations with helpful alternatives (toasts, copy-path, download)
3. `src/renderer/src/transport/websocketManager.ts` — WebSocket connection pooling, replay, lifecycle
4. `src/renderer/src/transport/apiClient.ts` — typed fetch wrapper with auth, error handling

**Safe extraction order:**
1. Add transport contract tests (mock server responses for each method).
2. Extract `apiClient` and `websocketManager` as pure helpers.
3. Extract `browserTransport` using those helpers.
4. Replace browser no-ops with explicit unsupported results + UI fallback triggers.
5. Manual receipts: verify Electron mode still overlays native APIs correctly, browser mode shows fallbacks.

#### P3: RightInspectorPanel.tsx duplicates reveal button logic and transcript preview rendering

**Status:** Confirmed

**Evidence:**
- `src/renderer/src/inspectors/RightInspectorPanel.tsx` (244 lines) renders reveal buttons (`Reveal transcript`, `Reveal project in Finder`) inline and embeds `TranscriptPreview` directly.
- `TranscriptWorkspace.tsx` also renders reveal buttons and transcript preview.
- Both components import `TransportAPI` and call `transport.revealTranscript` / `transport.revealPath`.

**Why it matters:** Reveal behavior and transcript rendering are duplicated. A fix for WebGUI reveal fallback (P1) must be applied in two places. The inspector mixes view switching (files/transcript/docs/env/ide) with content rendering.

**Suggested fix:** Extract shared presentational components:
1. `src/renderer/src/components/TranscriptActions.tsx` — reveal button + fallback handling (receives `onReveal`, `isBrowser`, `onFallback`)
2. `src/renderer/src/components/TranscriptViewer.tsx` — wraps `TranscriptPreview` with loading/error/empty states
3. `RightInspectorPanel` becomes a pure view switcher that composes these shared components.

**Safe extraction order:**
1. Add component tests for TranscriptPreview (loading, error, truncated, artifact list, filters).
2. Extract `TranscriptActions` and `TranscriptViewer` as presentational components.
3. Update both `RightInspectorPanel` and `TranscriptWorkspace` to use them.
4. Manual receipts: verify inspector transcript mode, transcript workspace, WebGUI fallback, Electron native reveal.

#### P3: useTransport.ts is thin but critical — Electron overlay logic is implicit

**Status:** Confirmed

**Evidence:**
- `src/renderer/src/useTransport.ts` (33 lines) overlays Electron native APIs onto browser transport by mutating the returned transport object.
- The overlay is conditional on `window.commandCode` existence, but there is no explicit "this is Electron" flag or transport variant.

**Why it matters:** The overlay pattern works but makes it hard to reason about which transport methods are native vs browser. Adding a new native method (e.g., `showNotification`) requires remembering to update this overlay. Browser-specific behavior (fallbacks) lives in browserAdapter instead of being a transport variant.

**Suggested fix:** Make transport variants explicit:
1. `createElectronTransport()` — wraps browser transport + native IPC overlays
2. `createBrowserTransport()` — returns transport with explicit unsupported results for native-only methods
3. `useTransport()` — selects variant based on `window.commandCode` existence

**Safe extraction order:**
1. Add transport variant tests (verify Electron variant has native methods, browser variant has fallback behaviors).
2. Refactor browserAdapter to return a base transport without Electron overlays.
3. Create `electronAdapter.ts` that extends base with native IPC.
4. Update `useTransport` to select variant.
5. Manual receipts: verify chooseDirectory, openExternal, revealTranscript, revealPath work in Electron; fallbacks appear in browser.

### Code Shape Review

#### `src/renderer/src/App.tsx` — 1479 lines

**Current responsibility mix:**
- Renderer entry point + ShellLayout composition
- All app-level state (cwd, tabs, sessions, preferences, git, PTY health, update status, headless jobs, shell terminal, composer, keyboard shortcuts, sidebar/inspector widths, popovers, work events, release notes)
- All effect logic (preference hydration/save, session readiness, PTY health polling, git status polling, project discovery, session lifecycle, update checks, startup project behavior)
- Workspace view switching (home/session/transcript/settings)
- Event handlers (composer submit, stop/kill, resume, headless, project choose, settings navigation)

**Why the size/shape creates risk:**
- Single point of failure for renderer behavior changes
- Hard to test in isolation (requires full React tree + transport mock)
- Hardening fixes (WebGUI picker, onboarding wizard, transcript pagination) will add more state/effects here
- Mixes presentation (JSX) with business logic (state machines, effects)

**Proposed split boundaries:**
```
src/renderer/src/app/
  orchestration/
    AppOrchestrator.tsx      # state + effects, no JSX (~400 lines)
    useAppPreferences.ts     # app/project preference hydration/save (~150 lines)
    useSessionManager.ts     # session start/stop/tab/resume (~200 lines)
    useProjectContext.ts     # cwd, git status, project discovery (~150 lines)
    useUpdateChecks.ts       # update check, release notes (~100 lines)
    useHeadlessJobs.ts       # headless job queue (~80 lines)
    useWorkEvents.ts         # work event log (~50 lines)
  views/
    AppView.tsx              # JSX composition, ShellLayout, workspace switch (~150 lines)
  hooks/
    useKeyboardShortcuts.ts  # Cmd+T, Ctrl+O global handlers (~60 lines)
    useResizeHandlers.ts     # sidebar/inspector resize logic (~80 lines)
```

**Safe extraction order:**
1. Add snapshot/integration tests for current App.tsx behavior (workspace views, session start/stop, preference persistence).
2. Extract `useAppPreferences` (pure, no transport calls in tests).
3. Extract `useProjectContext` (git, discovery - mock transport).
4. Extract `useSessionManager` (session lifecycle - mock transport).
5. Extract remaining hooks.
6. Split `AppOrchestrator` from `AppView`.
7. Manual receipts: Electron dev, browser dev, real session, mock session, headless, settings persist, sidebar/inspector resize.

**Tests/fixtures to add before moving code:**
- Snapshot tests for each workspace view (home, session, transcript, settings)
- Integration test for preference hydration (app + project)
- Integration test for session start → stop → force kill
- Integration test for project change → session discovery refresh
- Transport mock fixtures for all used methods

**Manual UI receipts needed after cleanup:**
- Electron: start real session, follow-up prompt, approval button, stop, force stop, transcript inspector, settings nav
- Browser: start mock session, headless job, project path input, transcript inspect, settings nav
- Both: sidebar/inspector resize collapse, keyboard shortcuts (Cmd+T, Ctrl+O), release note modal

#### `src/server/index.ts` — 1584 lines

**Current responsibility mix:**
- HTTP server creation, routing, body parsing
- WebSocket server + session streaming
- Auth: token generation, extraction (cookie/header/query/bearer), validation, cookie setting
- CORS: origin checking, headers
- Static file serving with path containment
- Session manager integration (start, write, resize, stop, interrupt, forceKill, idle timers)
- Workspace root registration + path containment (`isPathUnderRoot`)
- CLI wrappers (check, status, update, models, headless, ide-status)
- File system routes (list, read) with workspace boundary
- Git status route
- Session discovery route
- Project commandcode reference route
- Usage, taste, agents, MCP, skills, memory routes
- Hooks config/logs/dry-run/apply routes
- App/project preferences routes

**Why the size/shape creates risk:**
- Security logic (auth, CORS, path containment) mixed with feature routes
- Change to any domain (hooks, transcripts, preferences) risks auth/static regressions
- No route-level test isolation — all tests spin up full server
- CORS prefix bug exists because origin check is inline in server handler

**Proposed split boundaries:**
```
src/server/
  auth.ts              # token gen, extractToken, validateToken, setAuthCookie (~100 lines)
  cors.ts              # validateOrigin, corsHeaders (~60 lines)
  static.ts            # serveStatic with hardened path containment (~80 lines)
  ws.ts                # WebSocket session streaming, replay, auth (~120 lines)
  routes/
    sessions.ts        # /api/sessions* + WS handlers (~250 lines)
    files.ts           # /api/files/* with workspace boundary (~150 lines)
    cli.ts             # /api/check, /api/status, /api/update, /api/models, /api/headless, /api/ide-status (~200 lines)
    git.ts             # /api/git/status (~80 lines)
    discovery.ts       # /api/sessions/discover, /api/project/commandcode-reference, /api/usage, /api/taste/list (~150 lines)
    agents.ts          # /api/agents/* (~80 lines)
    mcp.ts             # /api/mcp/* (~80 lines)
    skills.ts          # /api/skills/list (~40 lines)
    memory.ts          # /api/memories/* (~80 lines)
    hooks.ts           # /api/hooks/* (~200 lines)
    preferences.ts     # /api/app/preferences*, /api/project/preferences* (~150 lines)
  index.ts             # composition root: createServer, mount routes, start/stop (~150 lines)
```

**Safe extraction order:**
1. Add API contract tests for each route group (request shape → response shape).
2. Extract `auth.ts` and `cors.ts` (pure functions, easiest to test).
3. Extract `static.ts` (security-critical, test with traversal fixtures).
4. Extract `ws.ts` (WebSocket logic).
5. Extract route groups one by one, updating `index.ts` to mount them.
6. Manual receipts: smoke:browser, smoke:headless, smoke:pty, doctor, Electron auth flow, browser auth flow.

**Tests/fixtures to add before moving code:**
- Auth tests: valid cookie, valid header, valid query, valid bearer, invalid token, missing token
- CORS tests: allowed origins (127.0.0.1, localhost), rejected origins (prefix bypass, evil.com), missing origin in dev vs prod
- Static file tests: valid file, SPA fallback, traversal (../), encoded traversal, sibling prefix
- Route contract tests for each group (freeze request/response JSON shapes)

**Manual UI receipts needed after cleanup:**
- Electron: load app, auth cookie set, navigate, start session, WS stream
- Browser: load via serve --open, X-Auth-Token header works, WS stream
- Both: static assets load, transcript read, file browse, git status, headless run

#### `src/renderer/src/browserAdapter.ts` — 454 lines

**Current responsibility mix:**
- Token management (injected, cookie, /api/token fetch)
- Base URL / WS URL resolution
- Auth header application
- Fetch wrapper with error handling
- Full `TransportAPI` implementation (50+ methods)
- WebSocket connection management (pooling, replay, lifecycle)
- Browser-specific fallbacks: chooseDirectory (localStorage), revealTranscript (noop), revealPath (noop)

**Why the size/shape creates risk:**
- Transport contract is large and mixes browser fallbacks with core implementation
- No-op fallbacks for chooseDirectory/reveal are silent — no UI signal
- Adding WebGUI picker requires modifying this file instead of composing a variant
- WebSocket management is inline instead of extracted

**Proposed split boundaries:**
```
src/renderer/src/transport/
  apiClient.ts         # typed fetch with auth, error handling, base URL (~100 lines)
  websocketManager.ts  # WS pooling, replay, session callbacks, lifecycle (~150 lines)
  baseTransport.ts     # TransportAPI implementation using apiClient + websocketManager (~200 lines)
  browserFallbacks.ts  # explicit unsupported implementations with UI fallbacks (~100 lines)
  browserTransport.ts  # composes baseTransport + browserFallbacks (~50 lines)
  electronTransport.ts # composes baseTransport + native IPC overlays (~50 lines)
```

**Safe extraction order:**
1. Add transport contract tests (mock fetch/WS for each method).
2. Extract `apiClient` and `websocketManager` as pure helpers.
3. Extract `baseTransport` using those helpers.
4. Create `browserFallbacks` with explicit unsupported results + toast/copy-path triggers.
5. Create `browserTransport` and `electronTransport` variants.
6. Update `useTransport.ts` to select variant.
7. Manual receipts: Electron chooseDirectory/reveal work; browser shows fallback UI.

**Tests/fixtures to add before moving code:**
- Transport contract test for each method (mock server responses)
- WebSocket test: connect, replay, data, exit, cleanup
- Fallback behavior tests: chooseDirectory returns unsupported, revealTranscript returns unsupported

**Manual UI receipts needed after cleanup:**
- Electron: chooseDirectory opens native picker, revealTranscript opens Finder, revealPath opens Finder
- Browser: chooseDirectory shows path input modal, revealTranscript shows toast with copy-path, revealPath shows toast with copy-path

#### `src/renderer/src/inspectors/RightInspectorPanel.tsx` — 244 lines

**Current responsibility mix:**
- Inspector view switcher (files/file/transcript/docs/env/ide)
- Resize handle
- Content rendering for each mode (FileBrowser, FileViewer, TranscriptPreview, iframe, EnvironmentTracker, IdePanel)
- Reveal buttons for transcript and project
- Empty states

**Why the size/shape creates risk:**
- Duplicates reveal button logic with TranscriptWorkspace
- Embeds TranscriptPreview directly instead of composing a shared viewer
- View switching logic mixed with content rendering
- Adding WebGUI reveal fallback requires changes here AND in TranscriptWorkspace

**Proposed split boundaries:**
```
src/renderer/src/components/
  TranscriptActions.tsx    # reveal button + browser fallback handling (~60 lines)
  TranscriptViewer.tsx     # TranscriptPreview wrapper with states (~80 lines)
  InspectorEmpty.tsx       # shared empty state (~30 lines)
src/renderer/src/inspectors/
  RightInspectorPanel.tsx  # pure view switcher composing above (~100 lines)
  InspectorTabs.tsx        # tab bar for files/transcript/docs/env/ide (~60 lines)
  EnvironmentTracker.tsx   # extracted git status panel (~120 lines)
```

**Safe extraction order:**
1. Add component tests for TranscriptPreview (loading, error, truncated, artifacts, filters).
2. Extract `TranscriptActions` (receives onReveal, isBrowser, onFallback).
3. Extract `TranscriptViewer` (wraps TranscriptPreview).
4. Extract `EnvironmentTracker` and `InspectorEmpty`.
5. Refactor `RightInspectorPanel` to compose shared components.
6. Update `TranscriptWorkspace` to use `TranscriptActions` + `TranscriptViewer`.
7. Manual receipts: inspector transcript mode, transcript workspace, WebGUI fallback, Electron reveal.

#### `src/renderer/src/workspaces/TranscriptWorkspace.tsx` — 294 lines

**Current responsibility mix:**
- Transcript workspace header (resume button, open transcript, reveal)
- Resume receipt grid
- Work evidence list
- Transcript inline preview (embeds TranscriptPreview)
- TranscriptPreview component (filters, artifact list, raw details, timeline entries)
- DiagnosticTranscriptPreview (PTY tail view)
- TranscriptArtifactList
- TranscriptTimelineEntry

**Why the size/shape creates risk:**
- TranscriptPreview is a large sub-component (filters, timeline, artifacts, raw) embedded in workspace
- Duplicates reveal button with RightInspectorPanel
- Timeline entry rendering (7 kinds) is inline
- Artifact detection/suggestion logic is imported but rendering is here

**Proposed split boundaries:**
```
src/renderer/src/workspaces/
  TranscriptWorkspace.tsx  # header, receipt, evidence, composes TranscriptViewer (~100 lines)
src/renderer/src/components/
  TranscriptViewer.tsx     # TranscriptPreview wrapper (loading, error, empty) (~80 lines)
  TranscriptTimeline.tsx   # filter bar + entry list + artifact list (~150 lines)
  TranscriptEntry.tsx      # single entry rendering for 7 kinds (~120 lines)
  TranscriptArtifactList.tsx # artifact list rendering (~60 lines)
  TranscriptFilters.tsx    # filter button bar (~40 lines)
  TranscriptRawDetails.tsx # raw transcript details/summary (~50 lines)
```

**Safe extraction order:**
1. Add component tests for TranscriptPreview (all filter states, artifact list, truncation banner, raw details).
2. Extract `TranscriptFilters`, `TranscriptArtifactList`, `TranscriptRawDetails` as presentational.
3. Extract `TranscriptEntry` for each kind.
4. Extract `TranscriptTimeline` composing filters + entries + artifacts + raw.
5. Extract `TranscriptViewer` wrapping TranscriptTimeline with states.
6. Refactor `TranscriptWorkspace` to use `TranscriptViewer` + `TranscriptActions`.
7. Manual receipts: transcript workspace, inspector transcript mode, large JSONL, truncated ANSI, artifact clicks.

### Disagreements Or Corrections

None. All existing findings are confirmed and accurately described.

### Proposed Fix Batches

#### Batch 1: WebGUI Project Picker + Reveal Fallbacks (P1)
**Files likely touched:**
- `src/renderer/src/components/AppPopovers.tsx` — add browser project picker popover
- `src/renderer/src/transport/browserFallbacks.ts` (new) — explicit unsupported results + UI triggers
- `src/renderer/src/transport/browserTransport.ts` (new) — compose base + fallbacks
- `src/renderer/src/useTransport.ts` — select transport variant
- `src/renderer/src/components/TranscriptActions.tsx` (new) — shared reveal + fallback
- `src/renderer/src/inspectors/RightInspectorPanel.tsx` — use TranscriptActions
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx` — use TranscriptActions

**Tests to add/update:**
- Transport contract tests for browser variant (chooseDirectory returns unsupported, reveal returns unsupported)
- Component test for browser project picker (path input, validation via /api/files/list, recent paths)
- Component test for TranscriptActions (Electron: calls transport.reveal; Browser: shows fallback toast)

**Manual receipts:**
- Browser: `npm run serve -- --open`, click Project → Set server-side project path, enter valid path, start session
- Browser: click Reveal transcript → shows toast with copy-path/download options
- Electron: click Project → Choose folder → native picker works
- Electron: click Reveal transcript → opens Finder

#### Batch 2: Large .jsonl Transcript Partial Rendering (P1)
**Files likely touched:**
- `src/server/index.ts` — add paginated JSONL route (/api/sessions/transcript?offset&limit or cursor)
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx` — use paginated fetch, show "Showing latest N entries" banner
- `src/renderer/src/components/TranscriptViewer.tsx` (new) — truncated banner, load more
- `src/core/transcriptParser.ts` — add streaming/bounded parse for large JSONL

**Tests to add/update:**
- Server test: >1MB JSONL fixture → bounded tail + metadata (total bytes, entry count, truncated)
- Server test: paginated JSONL reads (cursor-based or byte-range)
- Component test: TranscriptViewer shows truncated banner, filter counts reflect loaded entries

**Manual receipts:**
- Create >1MB .jsonl fixture (or use real session)
- Open transcript inspector → shows partial timeline with banner
- Filters (User/Assistant/Tools/Events/Errors) show correct counts for loaded entries
- "Load more" or pagination works without memory spike

#### Batch 3: CORS Exact-Origin Hardening + Tests (P2)
**Files likely touched:**
- `src/server/cors.ts` (new) — parse origin, exact hostname match
- `src/server/index.ts` — use cors.ts
- `tests/server-security.test.ts` — add origin validation tests

**Tests to add/update:**
- Unit tests for validateOrigin: allowed (127.0.0.1, localhost, ::1), rejected (localhost.evil, 127.0.0.1.evil, evil.com, missing origin in prod, valid in dev)

**Manual receipts:**
- `npm run smoke:browser` still passes (same-origin)
- Electron dev mode still works (cookie auth)
- Browser dev mode (Vite proxy) still works (X-Auth-Token header)

#### Batch 4: Architecture/API Docs Drift Cleanup (P2)
**Files likely touched:**
- `docs/architecture/ARCHITECTURE.md` — update cookie issuance, stop ladder, CORS
- `docs/reference/API_REFERENCE.md` — update CORS, auth ladder, session lifecycle
- `docs/architecture/SECURITY.md` — verify alignment

**Tests to add/update:**
- Add docs drift check to CI (grep for stale patterns)

**Manual receipts:**
- Verify docs match server behavior for: auth cookie timing, CORS headers, session stop/interrupt/kill routes, IPC surface

#### Batch 5: GUI First-Run Readiness Surface (P1)
**Files likely touched:**
- `src/renderer/src/App.tsx` (or extracted orchestrator) — add readiness state machine
- `src/renderer/src/workspaces/HomeWorkspace.tsx` — show readiness checklist when no project/cmd
- `src/server/index.ts` — add `/api/doctor` route (or `ccgui doctor --json`)
- `src/renderer/src/components/AuthCard.tsx` — enhance with install guidance
- `src/renderer/src/components/AppPopovers.tsx` — project picker shows readiness

**Tests to add/update:**
- Component test: HomeWorkspace shows readiness checklist when cwd empty + cmd missing
- Integration test: /api/doctor returns structured checks (binary, auth, models, PTY, project)

**Manual receipts:**
- Fresh machine without cmd: app shows "Command Code not found" with install command + "Run doctor" button
- After install: auth check → model list → PTY health → project picker
- WSL: shows "Run inside WSL" guidance, project paths are Linux paths

#### Batch 6: Electron/Browser Visual Click-Through Smoke (P2)
**Files likely touched:**
- `package.json` — add Playwright + @playwright/test dependency
- `tests/e2e/` (new) — Electron smoke, browser smoke
- `scripts/` — smoke test runner for visual receipts

**Tests to add/update:**
- Playwright test: Electron launch → choose project → Demo session → real session → composer follow-up → approval button → terminal fallback → transcript inspector → stop → force stop → settings nav
- Playwright test: Browser serve --open → project path input → mock session → headless → transcript inspect

**Manual receipts:**
- Screenshots/DOM snapshots for each step in both Electron and browser
- Dated report in `docs/reports/VISUAL_SMOKE_REPORT.md`

#### Batch 7: WSL Clean-Room Receipt (P2)
**Files likely touched:**
- `docs/reports/SMOKE_TEST_REPORT.md` — add WSL receipt section
- `scripts/wsl-smoke.sh` (new) — automated clean-room script

**Tests to add/update:**
- Clean-room script execution in fresh WSL

**Manual receipts:**
- Dated WSL receipt with all 13 steps passing

#### Batch 8: CLI `--port 0` Support (P3)
**Files likely touched:**
- `src/cli/ccgui.ts` — allow port 0, print bound URLs
- `scripts/smoke-cli.ts` (new) — CLI smoke for port 0

**Tests to add/update:**
- CLI test: `ccgui serve --port 0` prints app.url and app.authUrl with actual port

**Manual receipts:**
- Run `ccgui serve --port 0` → prints bound URL with non-zero port
- Run `ccgui serve --port 0` twice → different ports

#### Batch 9: Static File Path Containment Hardening (P3)
**Files likely touched:**
- `src/server/static.ts` (new) — hardened static serving
- `src/server/index.ts` — use static.ts
- `tests/server-security.test.ts` — add static traversal tests

**Tests to add/update:**
- Static file tests: valid, SPA fallback, ../ traversal, encoded traversal, sibling prefix, absolute path

**Manual receipts:**
- `npm run smoke:browser` still serves assets correctly
- Traversal attempts return 404

#### Batch 10: Code Shape Cleanup — App.tsx Split (P2)
**Files likely touched:**
- Per extraction order in Code Shape Review above

**Tests to add/update:**
- Per extraction order

**Manual receipts:**
- Per extraction order

#### Batch 11: Code Shape Cleanup — server/index.ts Split (P2)
**Files likely touched:**
- Per extraction order in Code Shape Review above

**Tests to add/update:**
- Per extraction order

**Manual receipts:**
- Per extraction order

#### Batch 12: Code Shape Cleanup — browserAdapter.ts Split (P2)
**Files likely touched:**
- Per extraction order in Code Shape Review above

**Tests to add/update:**
- Per extraction order

**Manual receipts:**
- Per extraction order

#### Batch 13: Code Shape Cleanup — Inspector/Transcript Component Deduplication (P3)
**Files likely touched:**
- Per extraction order in Code Shape Review above

**Tests to add/update:**
- Per extraction order

**Manual receipts:**
- Per extraction order
---

## Reviewer Pass: Nemotron (DeepSeek) - 2026-06-08

> **Note:** This review pass was performed by Nemotron (DeepSeek model). All findings, suggestions, and proposed fixes are AI-generated observations from automated codebase analysis.

### Validation Performed

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | 0 errors |
| `npx vitest run` | Pass | 32 files / 209 tests |
| `npm run build` | Pass | electron-vite + esbuild |
| `npm run smoke:browser` | Pass | mock headless, real headless, mock sessions, multi-session, auth |
| `npm run smoke:pty` | Pass | node-pty available, /bin/zsh healthy |
| `npm run smoke:headless` | Pass | real `cmd --print` exited 0 |
| `npm run doctor` | Pass | cmd v0.33.2, auth ok, 27 models, PTY healthy |
| Electron UI click-through | Not run | No automated visual test exists |
| WebGUI click-through | Not run | No automated visual test exists |
| Linux/WSL clean-room | Not run | No WSL/Linux machine in this environment |

### Agreement With Existing Findings

| Finding | Agree? | Resolution Suggestions / Differences |
|---|---|---|
| P1 WebGUI `Choose folder...` cannot choose a real folder | Yes | Browser picker must validate server-side paths via `/api/files/list`. The localStorage fallback to `/` is especially dangerous on WSL because `/` is a valid Linux root. Reject implicit `/` unless user explicitly enters it. |
| P1 WebGUI reveal actions are silent no-ops | Yes | Strongly agree. The no-op Promise.resolve() pattern conceals the unsupported state. Add an `unsupported` result shape to TransportAPI so callers can distinguish "done" from "not available" without sniffing the environment. |
| P1 Oversized `.jsonl` transcripts still block transcript inspection | Yes | The server already has the bounded-tail pattern for `.ansi`/`.log`/`.txt`. Extending it to `.jsonl` with entry-count-based sampling (latest N JSONL lines, not byte slicing) is the right approach. |
| P1 Clean-room install/onboarding is not GUI-native yet | Yes | The `doctor` CLI already has excellent structure — it just needs a `--json` flag to be GUI-consumable. Adding `/api/doctor` in the server wraps that same pure function. |
| P2 CORS origin checks are prefix-based | Yes | The fix is straightforward: `new URL(origin).hostname === 'localhost' || new URL(origin).hostname === '127.0.0.1'`. The `::1` IPv6 case is worth covering for Linux loopback. |
| P2 Architecture/API docs drift from current auth and session lifecycle | Yes | The explore agent's exhaustive docs-vs-code comparison shows 8 stale claims. The most dangerous: `POST /api/sessions/:id/kill` doesn't exist, the stop ladder is wrong, and the endpoint count is off by nearly 2x. |
| P2 Native conversation projection is useful but still PTY-text fragile | Yes | This is well-handled as a projection. The parser confidence indicator in UI (Native view / Needs terminal input / Diagnostic fallback) is the right framing. |
| P2 Real Electron click-through is not covered by the current automated bundle | Yes | The existing 209 unit/integration tests are solid but they test components in isolation with mocked transport. A single Playwright smoke covering the full user journey would catch the reveal no-ops, project picker gaps, and disabled button states that unit tests miss. |
| P2 Linux/WSL support needs a clean-room validation checklist and receipts | Yes | The CROSS_PLATFORM_STRATEGY.md positions WSL as the primary Windows path. Without a dated receipt, every audit is guessing. |
| P3 CLI `serve --port 0` remains unavailable | Yes | `createAppServer(0)` already works (used by smoke scripts). The CLI just needs to pass it through and print `app.url`/`app.authUrl` after bind. |
| P3 Static-file path containment should use `path.relative`/realpath | Yes | Minor given the existing `normalize`+regex+`startsWith` triple defense, but `realpathSync` would also catch symlink escapes inside the static dir. |
| Code quality/readability and scalable Electron/WebGUI components | Yes | See Code Shape Review below for additional flagged files not covered in the first reviewer pass. |

### New Findings

#### P2: No React error boundary — a rendering crash in any component whitescreens the full app

**Status:** Confirmed

**Evidence:**
- `grep` for `ErrorBoundary`, `ComponentDidCatch`, `error boundary` across `src/renderer/` returns zero matches.
- `src/renderer/src/main.tsx` renders `<App />` directly inside `<React.StrictMode>` with no error boundary wrapper.
- `App.tsx` at 1479 lines orchestrates the entire renderer. A single unhandled exception in any workspace, inspector, or popover unmounts the entire tree.

**Why it matters:** This is especially risky for the native conversation parser (`liveConversation.ts`, 551 lines). A parse edge case on real PTY output could crash the `LiveConversationPane` and take down the entire session view, including the stop/force-stop controls. For non-terminal users, this means losing control of a running session.

**Suggested fix:**
1. Add `src/renderer/src/components/ErrorBoundary.tsx` — a class component boundary with fallback UI per workspace.
2. Wrap each workspace independently: `<ErrorBoundary fallback={SessionErrorFallback}><SessionWorkspace /></ErrorBoundary>`.
3. Wrap the root with a final boundary showing "Something went wrong — reload" with a reload button.
4. The fallback for the `SessionWorkspace` must preserve stop/force-stop controls even during a render crash.

**Validation needed:**
- Inject a deliberate render error in `LiveConversationPane` → verify session controls remain accessible.
- Inject a render error in `SettingsWorkspace` → verify other workspaces are unaffected.
- Verify the root-level fallback renders and the reload button calls `window.location.reload()`.

#### P3: `isPathUnderRoot` and `resolveBoundaryPath` are duplicated across 3 files with subtle differences

**Status:** Confirmed

**Evidence:**
- `src/server/index.ts` (lines 297–322): `resolveBoundaryPath` + `isPathUnderRoot` — walks up tree for non-existent paths, checks `startsWith(realRoot + path.sep)`.
- `src/main/index.ts` (lines 12–50): `realOrResolved` (identical logic to `resolveBoundaryPath`) + `isPathUnderRoot` (identical logic to server's version).
- `src/core/artifactDetection.ts` (lines 110–145): `resolveBoundaryPath` + `isPathUnderRoot` — third independent copy, used for transcript artifact path validation.

**Why it matters:** Three copies means three places to fix if a path containment bug is found. The `realpathSync` fallback logic (walking up the tree for non-existent parents) is non-trivial and should be canonical. The existing `src/server/index.ts` version has a `startsWith(realRoot + path.sep) || realTarget === realRoot` check, while `src/main/index.ts` uses only `startsWith(realRoot + path.sep)`. These subtle divergences invite mistakes.

**Suggested fix:**
- Create `src/shared/pathContainment.ts` with canonical `resolveBoundaryPath(filePath)` and `isPathUnderRoot(filePath, root)`.
- Import from all three locations.
- Add exhaustive tests for: existing path, non-existent intermediate path, non-existent leaf, symlink, symlink escape, sibling-first-char match (e.g., `/etc` vs `/etc2`), root path itself.

**Validation needed:**
- Unit tests for `resolveBoundaryPath` + `isPathUnderRoot` covering all edge cases.
- Verify `npm run typecheck`, `npx vitest run`, `npm run smoke:browser` pass.
- Verify file browse, agent save, transcript read, and `revealPath` IPC still enforce boundaries.

#### P3: `ReferenceSettings.tsx` (837 lines) mixes 5 unrelated settings domains in one file

**Status:** Confirmed

**Evidence:**
- `src/renderer/src/settings/ReferenceSettings.tsx` is 837 lines and contains: `KeyboardSettingsReadOnly`, `NotificationsSettings`, terminal preferences UI, hooks configuration diagnostics, hook log listing/reading, hook dry-run UI, and hook edit/apply flows.
- The file imports from `hooksConfig`, `hooksLogs`, `hooksDryRun`, `hooksPayload`, `notificationPreferences`, `terminalPreferences`, and `commandPalette` — each a separate domain.
- The hooks diagnostic UI alone spans ~400 lines of JSX with state management for config previews, log reading, dry-run execution, and edit/apply workflows.

**Why it matters:** A change to notification preferences or terminal settings requires touching a file that also contains the full hooks diagnostic surface. The hooks UI is complex (dry-run, edit preview, apply with backup), and mixing it with simpler read-only settings like keyboard shortcuts makes both harder to maintain.

**Suggested fix:** Follow the pattern already used by other settings — `AgentsSettings.tsx` (134 lines), `McpSettings.tsx` (279 lines), `MemorySettings.tsx` (97 lines):
1. `src/renderer/src/settings/HooksSettings.tsx` — hooks config, logs, dry-run, edit/apply (~400 lines)
2. `src/renderer/src/settings/NotificationsSettings.tsx` — toast/audio preferences (~130 lines)
3. `src/renderer/src/settings/KeyboardSettings.tsx` — read-only keyboard/command reference (~80 lines)
4. `src/renderer/src/settings/TerminalSettings.tsx` — terminal preferences (~80 lines)
5. `src/renderer/src/settings/ReferenceSettings.tsx` — thin re-export of the above (~30 lines)

**Safe extraction order:**
1. Add component tests for each extracted subsection (hooks config list, log read, dry-run result, notification toggle, keyboard shortcut grid).
2. Extract `KeyboardSettings` first (pure read-only, no state, easiest).
3. Extract `NotificationsSettings` (local state only, no server calls).
4. Extract `TerminalSettings` (local state only).
5. Extract `HooksSettings` last (most complex, server-dependent).
6. Replace `ReferenceSettings.tsx` with re-exports.
7. Update `SettingsRoutes.tsx` to route to individual components.

**Validation needed:**
- Verify all settings sections render in Electron and browser.
- Verify hooks config list, log read, dry-run, edit preview, and apply-before/after states work.
- Verify toast/audio preferences persist across reload.
- Verify keyboard shortcut grid and command palette reference render correctly.

#### P3: Server body-limit logic silently drops oversized requests without a 413 response

**Status:** Confirmed

**Evidence:**
- `src/server/index.ts` (lines 113–132): `parseBody()` calls `req.destroy()` when `total > maxBytes` without sending a 413 Payload Too Large response first.
- The client sees a connection reset (`fetch` throws `TypeError: fetch failed`) rather than a clear structured error.

**Why it matters:** Browser users with large compose prompts or preference payloads near 1MB could trigger this. The connection reset is indistinguishable from a server crash, making debugging hard. A 413 with `{ error: 'Request body too large' }` is more helpful and follows HTTP semantics.

**Suggested fix:**
- Before `req.destroy()`, send `res.writeHead(413, { 'Content-Type': 'application/json' })` and `res.end(JSON.stringify({ error: 'Request body too large' }))`.
- Ensure the response is flushed before destroying the socket.
- The `req.destroy()` should still be called to stop the client from continuing to send data.

**Validation needed:**
- Server test: POST >1MB payload → 413 response with structured error JSON.
- Client test: browser transport receives a typed error, not a generic fetch failure.

#### P3: Session model identity display doesn't appear in browser mode transcript workspace

**Status:** Suspected — needs verification

**Evidence:**
- `src/renderer/src/services/sessionModelIdentity.ts` (46 lines) provides `formatSessionModelLabel()` used in `SessionWorkspace.tsx` for the active-session header.
- `TranscriptWorkspace.tsx` (294 lines) shows the resume receipt grid and inline transcript, but I did not find a model identity display during my read-through. The transcript workspace shows the session title, project, and cwd, but not which model was used — information that would be available from `DiscoveredSession.meta` via the discovery route.

**Why it matters:** When browsing old transcripts to decide which to resume, the model used is a key decision factor. Non-terminal users may not remember which model produced which results.

**Suggested fix:**
- Add model identity to the resume receipt grid in `TranscriptWorkspace.tsx`.
- Pull from `DiscoveredSession.meta` if available, or display "unknown model" if metadata is missing.

**Validation needed:**
- Open a transcript from a real session → verify model name appears in the header or receipt grid.
- Open a transcript from a mock session → verify "Mock" or "Demo" appears.

#### P3: WebGUI `noop` pattern for `revealPath` is also used in `AdvancedReadOnlySettings.tsx`

**Status:** Confirmed

**Evidence:**
- `src/renderer/src/settings/AdvancedReadOnlySettings.tsx` (line 139): `<button onClick={() => void transport.revealTranscript(session.transcriptPath)}>Reveal</button>` — calls the no-op in browser mode with no feedback.

**Why it matters:** This is a third location (beyond `RightInspectorPanel` and `TranscriptWorkspace`) where reveal buttons appear. Any fix to the reveal no-op pattern must cover Settings → Data sessions listing as well.

**Suggested fix:**
- Apply the same `TranscriptActions` component (proposed in Batch 1 of first reviewer pass) to the `AdvancedReadOnlySettings` session list.

**Validation needed:**
- Settings → Data → browse sessions → click Reveal in browser → falls back gracefully.
- Same flow in Electron → native reveal works.

### Code Shape Review

All files flagged in the first reviewer pass are confirmed and their split proposals are sound. I'm adding files not covered by that pass.

#### `src/renderer/src/settings/ReferenceSettings.tsx` — 837 lines

**Current responsibility mix:**
- Keyboard shortcuts read-only reference
- Notification preferences (toast + audio)
- Terminal preferences (font, scrollback, cursor)
- Hooks configuration diagnostics (config list, toggle preview, edit preview, apply)
- Hook log listing and reading
- Hook dry-run UI
- Hook edit/apply with backup confirmation

**Why the size/shape creates risk:**
- 5 unrelated settings domains in one file
- Hooks UI has complex state (preview, apply, backup) that's hard to isolate for testing
- Any change to notifications or keyboard display requires touching hooks code
- The 837-line file is the second-largest renderer file after App.tsx

**Proposed split boundaries:**
```
src/renderer/src/settings/
  KeyboardSettings.tsx       # read-only keyboard/command grid (~80 lines)
  NotificationsSettings.tsx  # toast/audio preferences (~130 lines)
  TerminalSettings.tsx       # terminal prefs (~80 lines)
  HooksSettings.tsx          # hooks diagnostics: config, logs, dry-run, edit, apply (~400 lines)
  ReferenceSettings.tsx      # thin re-export (~30 lines)
```

**Safe extraction order:**
1. Add component tests for KeyboardSettings grid, NotificationsSettings toggles, TerminalSettings controls.
2. Add integration tests for HooksSettings: config list render, log read, dry-run execute, edit preview, apply with backup.
3. Extract KeyboardSettings first (pure, no state).
4. Extract NotificationsSettings (localStorage state only).
5. Extract TerminalSettings (localStorage state only).
6. Extract HooksSettings last (transport-dependent state machine).
7. Replace ReferenceSettings with re-exports.

**Tests/fixtures to add before moving code:**
- Snapshot test for each extracted component
- Integration test for hooks config list → select → preview toggle → apply
- Integration test for hooks log list → read → display
- Integration test for hooks dry-run → result display
- Notification preference persistence across remount

**Manual UI receipts needed after cleanup:**
- Settings → Keyboard: shortcut grid + command palette reference renders
- Settings → Notifications: toast duration, category toggles, audio volume work
- Settings → Terminal: font size, scrollback, cursor style persist
- Settings → Hooks: config list populated, toggle preview shows before/after, apply writes backup, logs list and read, dry-run executes
- All sections scroll correctly at windowed sizes (taste: min-height: 0, height: 100%, overflow-y: auto)

#### `src/renderer/src/settings/CoreSettings.tsx` — 568 lines

**Current responsibility mix:**
- Profile settings (command binary path)
- Appearance theme selection
- Chat bubble color customization
- Runtime settings (permission default, trust mode, startup behavior)
- Settings page header/navigation
- Preferences persistence logic

**Why the size/shape creates risk:**
- At 568 lines, it's approaching the readability threshold
- Appearance theme rendering (radio group with swatches) is mixed with runtime preferences
- Chat bubble color pickers are inline rather than extracted as a reusable control
- The file is smaller than the worst offenders but grows with each new preference

**Proposed split boundaries:**
```
src/renderer/src/settings/
  CoreSettings.tsx           # profile + runtime settings, composes sub-components (~200 lines)
  AppearanceSettings.tsx     # theme radio group + chat bubble colors (~200 lines)
  RuntimeSettings.tsx        # permission, trust, startup behavior (~150 lines)
  ProfileSettings.tsx        # command binary path, identity (~100 lines)
```

**Safe extraction order:**
1. Add component tests for AppearanceSettings (theme switch, color picker).
2. Add component tests for RuntimeSettings (permission toggle, trust toggle).
3. Extract AppearanceSettings (pure presentation, no server calls).
4. Extract RuntimeSettings (pure presentation).
5. Extract ProfileSettings (has binary path validation edge cases).
6. Refactor CoreSettings as composition root.

**Manual UI receipts needed after cleanup:**
- Settings → Profile: binary path input works, validation feedback
- Settings → Appearance: theme radio group switches, swatches render, chat bubble color pickers work, colors persist
- Settings → Runtime: permission defaults, trust mode, startup behavior persist

#### `src/renderer/src/components/LiveConversationPane.tsx` — 440 lines

**Current responsibility mix:**
- Raw PTY output buffering (bounded to 200KB)
- Activity memory management (repeated status lines collapsed)
- Live conversation parsing via `parseLiveConversation`
- Turn history merging via `mergeLiveConversationTurnHistory`
- Cache management (sessionId-keyed Map)
- Artifact link detection + rendering
- Waiting/terminal-required state display
- Approval button rendering
- Result summary rendering
- Compact/uncompact view modes

**Why the size/shape creates risk:**
- The parsing pipeline (raw → events → history turns → merged turns) is complex and mixed with React rendering
- Cache management is inline with component state
- Activity memory collapse logic is presentation logic mixed with data processing
- Adding the parser confidence indicator (proposed in first audit) will add more logic here

**Proposed split boundaries:**
```
src/renderer/src/components/
  LiveConversationPane.tsx       # view composition, ~150 lines
src/renderer/src/services/
  liveConversationCache.ts       # sessionId-keyed cache management (~60 lines)
  liveConversationReducer.ts     # raw → events → history → merged turns pipeline (~150 lines)
src/renderer/src/components/
  LiveConversationEntry.tsx      # single conversation turn rendering (~80 lines)
  LiveConversationActivity.tsx   # activity memory collapsed display (~60 lines)
  LiveConversationArtifact.tsx   # artifact link rendering (~40 lines)
  LiveConversationApproval.tsx   # approval button rendering (~50 lines)
```

**Safe extraction order:**
1. Add tests for `liveConversationCache` (set, get, invalidate, session change).
2. Add tests for `liveConversationReducer` (all parse event types, edge cases).
3. Extract cache and reducer as pure modules.
4. Extract presentational sub-components (Entry, Activity, Artifact, Approval).
5. Refactor pane as view composition.
6. Manual receipts: real session with follow-up, approval prompt, artifact links, long output with activity collapse.

**Manual UI receipts needed after cleanup:**
- Real session: output renders, follow-up prompt appears, approval buttons work, artifact links clickable
- Long session: activity memory collapses repeated status lines
- Terminal required state: diagnostic fallback affordance visible
- Session switch: cache purges old session data

### Disagreements Or Corrections

None. All existing findings from both the original audit and the first reviewer pass are confirmed and accurately described. The CORS prefix check, the reveal no-ops, the monolithic server/renderer files, the docs drift, and the missing onboarding/doctor GUI surface are all real and well-characterized.

One minor refinement to the first reviewer's Batch 2 (Large `.jsonl` Transcript): the server-side fix should add a dedicated route rather than overloading the existing `/api/sessions/transcript` POST body. A `POST /api/sessions/transcript/page` with `{ transcriptPath, cursor?, limit? }` would be cleaner and avoids ambiguity between "read tail" and "paginate." The existing route's behavior (full read or bounded tail by extension) should remain for backward compatibility.

### Proposed Fix Batches

These batches are additive to the first reviewer's 13 batches. They can be sequenced after or interleaved.

#### Batch A: React Error Boundary (P2)
**Files likely touched:**
- `src/renderer/src/components/ErrorBoundary.tsx` (new) — class component boundary with fallback UI
- `src/renderer/src/main.tsx` — wrap App with root boundary
- `src/renderer/src/workspaces/SessionWorkspace.tsx` — wrap with session boundary preserving stop controls
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx` — wrap with transcript boundary
- `src/renderer/src/workspaces/HomeWorkspace.tsx` — wrap with home boundary
- `src/renderer/src/workspaces/SettingsWorkspace.tsx` — wrap with settings boundary

**Tests to add/update:**
- Component test: ErrorBoundary catches render error and shows fallback
- Component test: SessionErrorFallback preserves stop/force-stop buttons
- Component test: sibling workspaces unaffected by error in another workspace

**Manual receipts:**
- Inject error in LiveConversationPane → session controls still accessible
- Inject error in SettingsWorkspace → home/session workspaces unaffected
- Inject error in App root → "Something went wrong" + reload button

#### Batch B: Path Containment De-Duplication (P3)
**Files likely touched:**
- `src/shared/pathContainment.ts` (new) — canonical `resolveBoundaryPath` + `isPathUnderRoot`
- `src/server/index.ts` — import from shared
- `src/main/index.ts` — import from shared
- `src/core/artifactDetection.ts` — import from shared
- `tests/path-containment.test.ts` (new) — exhaustive edge case tests

**Tests to add/update:**
- Unit tests for resolveBoundaryPath: existing path, non-existent leaf, non-existent intermediate, symlink, absolute path
- Unit tests for isPathUnderRoot: inside root, outside root, root itself, sibling prefix (/etc vs /etc2), symlink escape, encoded traversal

**Manual receipts:**
- Electron: file browse, agent save, reveal path → all enforce boundaries
- Browser: file browse, memory save, agent save → all enforce boundaries
- Server: transcript read, file read, hook log read → all enforce boundaries

#### Batch C: ReferenceSettings Split (P3)
**Files likely touched:**
- Per extraction order in Code Shape Review above

**Tests to add/update:**
- Per extraction order

**Manual receipts:**
- Per extraction order

#### Batch D: Server 413 Response for Oversized Bodies (P3)
**Files likely touched:**
- `src/server/index.ts` — send 413 before req.destroy() in parseBody
- `tests/server-security.test.ts` — add 413 response test

**Tests to add/update:**
- Server test: POST >1MB payload → 413 with `{ error: 'Request body too large' }`
- Server test: POST exactly at limit → 200 (normal processing)

**Manual receipts:**
- Browser: submit oversized compose prompt → clear error message, not connection reset
- `npm run smoke:browser` still passes
