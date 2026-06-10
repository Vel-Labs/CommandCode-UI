# Hardening Sprint Closeout

Date: 2026-06-08

This is the running implementation closeout for `docs/reports/hardening_sprint.md`.

## Hardening Batch Closeout: Gate 0 Baseline Freeze

### Scope

- Tasks completed: Gate 0 baseline validation.
- Files changed: none.
- Files intentionally not touched: `docs/reports/HARDENING_BUGFIX_AUDIT.md` remains historical input.

### Behavior Implemented

- No behavior changed. The current dirty tree was frozen as the baseline candidate before implementation.

### Code Shape

- New modules/components: none.
- Files reduced/split: none.
- Files still over ~350 lines and why: not evaluated in Gate 0; Gate 6 owns extraction decisions.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Baseline pass. |
| `npx vitest run` | Pass | 32 files / 209 tests. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Mock, real headless start, mock session, multi-session, auth basics. |
| `npm run smoke:pty` | Pass | macOS `/bin/zsh`, `node-pty` healthy, output `ok`. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | Command Code `v0.33.2`, auth ok, 27 models, PTY healthy. |
| Electron UI receipt | Not run | No Electron UI/native IPC changes in Gate 0. |
| Built WebGUI receipt | Not run | No browser UX changes in Gate 0. |
| WSL/Linux receipt | Not run | Platform validation requires separate environment. |

### Residual Risk

- Baseline proves local macOS command health only. It does not prove Electron click-through, built WebGUI click-through, WSL, Linux, native Windows, or first-run missing-Command-Code flows.

### Follow-Up

- Continue implementation from `docs/reports/hardening_sprint.md`, preserving task IDs and gate-specific receipts.

## Hardening Batch Closeout: Gate 1 Safety Foundations (`HARD-001` - `HARD-005`)

### Scope

- Tasks completed: `HARD-001`, `HARD-002`, `HARD-003`, `HARD-004`, `HARD-005`.
- Files changed: `src/shared/pathContainment.ts`, `src/server/index.ts`, `src/main/index.ts`, `src/core/artifactDetection.ts`, `tests/path-containment.test.ts`, `tests/server-security.test.ts`, `docs/architecture/ARCHITECTURE.md`, `docs/architecture/SECURITY.md`, `docs/reference/API_REFERENCE.md`, `docs/reports/HARDENING_SPRINT_CLOSEOUT.md`.
- Files intentionally not touched: `docs/reports/HARDENING_BUGFIX_AUDIT.md`; renderer IPC and transport contracts; Command Code CLI invocation semantics.

### Behavior Implemented

- `HARD-001`: CORS now echoes only exact HTTP loopback origins for `127.0.0.1`, `localhost`, and `::1`; prefix lookalikes are not echoed.
- `HARD-002`: Canonical path containment moved into `src/shared/pathContainment.ts` and is shared by server, main-process reveal IPC, and artifact detection.
- `HARD-003`: Static serving resolves the renderer root once and checks requested files with canonical containment before serving or falling back to `index.html`.
- `HARD-004`: Oversized JSON request bodies now return `413 { "error": "Request body too large" }`.
- `HARD-005`: Architecture, security, and API docs now describe current auth cookie issuance, exact CORS, session stop/interrupt/delete routes, IPC scope, and body-size behavior.

### Code Shape

- New modules/components: `src/shared/pathContainment.ts`.
- Files reduced/split: duplicate containment helpers removed from `src/main/index.ts`, `src/server/index.ts`, and `src/core/artifactDetection.ts`.
- Files still over ~350 lines and why: `src/server/index.ts` remains large; this batch kept Gate 1 behavior surgical and leaves server composition extraction to `HARD-051`.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Full Gate 1 matrix. |
| `npx vitest run` | Pass | 33 files / 219 tests. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Mock, real headless start, mock session, multi-session, auth basics. |
| `npm run smoke:pty` | Pass | macOS `/bin/zsh`, `node-pty` healthy, output `ok`. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | Command Code `v0.33.2`, auth ok, 27 models, PTY healthy. |
| Electron UI receipt | Not run | No Electron visual change; native IPC helper reuse covered by typecheck/tests. |
| Built WebGUI receipt | Not run | Browser API smoke passed; no WebGUI UX change yet. |
| WSL/Linux receipt | Not run | Operator/environment required. |

### Residual Risk

- CORS/security behavior is covered by unit/API tests and browser smoke, but full browser click-through remains Gate 5.
- Static asset containment is covered with built-root fixture tests; production WebGUI receipt remains Gate 5.
- WSL/Linux claims remain unmade.

### Follow-Up

- Gate 2 should address explicit browser/Electron transport variants, WebGUI server-side path selection, browser reveal fallbacks, and shell-neutral reveal labels.

## Hardening Batch Closeout: Gate 2 WebGUI Parity (`HARD-010` - `HARD-013`)

### Scope

- Tasks completed: `HARD-010`, `HARD-011`, `HARD-012`, `HARD-013`.
- Files changed: `src/core/types.ts`, `src/core/transport.ts`, `src/renderer/src/browserAdapter.ts`, `src/renderer/src/useTransport.ts`, `src/renderer/src/types.d.ts`, `src/renderer/src/components/AppPopovers.tsx`, `src/renderer/src/workspaces/SessionWorkspace.tsx`, `src/renderer/src/workspaces/TranscriptWorkspace.tsx`, `src/renderer/src/inspectors/RightInspectorPanel.tsx`, `src/renderer/src/settings/AdvancedReadOnlySettings.tsx`, `src/renderer/src/styles.css`, `tests/browser-transport.test.ts`, `docs/reports/HARDENING_SPRINT_CLOSEOUT.md`.
- Files intentionally not touched: renderer preload IPC surface; server route scope beyond existing file-list validation; Command Code CLI behavior.

### Behavior Implemented

- `HARD-010`: Transport now declares `environment`, `supportsNativeDirectoryPicker`, and `supportsNativeReveal`. Browser reveal actions return explicit unsupported results; Electron overlays return success after native IPC.
- `HARD-011`: Browser/WebGUI project popover uses manual server-side path input and validates with the existing scoped file-list route. Electron keeps native directory picking.
- `HARD-012`: Browser reveal fallback now shows/copies transcript or project paths through visible status/fallback UI instead of silently resolving.
- `HARD-013`: User-facing reveal labels are shell-neutral (`Reveal project`, `Show transcript path`, `Reveal transcript`) instead of Finder-specific in shared browser/Electron UI.

### Code Shape

- New modules/components: none; small transport capability fields and UI wiring only.
- Files reduced/split: none.
- Files still over ~350 lines and why: `App.tsx`, `browserAdapter.ts`, and session/transcript UI remain large; Gate 6 owns deeper extraction. This batch avoided adding generic shell power or broad IPC.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Full Gate 2 matrix after final UI change. |
| `npx vitest run` | Pass | 34 files / 220 tests. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Mock, real headless start, mock session, multi-session, auth basics. |
| `npm run smoke:pty` | Pass | macOS `/bin/zsh`, `node-pty` healthy, output `ok`. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | Command Code `v0.33.2`, auth ok, 27 models, PTY healthy. |
| Electron UI receipt | Pass | Ephemeral Playwright + local Chrome/Electron startup: `window.commandCode` has `chooseDirectory`, `getServerInfo`, `openExternal`, `revealPath`, `revealTranscript`; screenshot `/tmp/ccgui-gate2-electron-preload-receipt.png`. |
| Built WebGUI receipt | Pass | `npm run serve -- --port 5230`; ephemeral Playwright + local Chrome: server-side path input visible, project selected, Demo session started, `Show transcript path` visible, browser fallback visible; screenshot `/tmp/ccgui-gate2-webgui-transcript-fallback-receipt.png`. |
| WSL/Linux receipt | Not run | Operator/environment required; no WSL/Linux runtime claim made. |

### Residual Risk

- Browser project reveal fallback is wired through the shared result handler and inspector button, but the built WebGUI click-through receipt exercised active-session transcript fallback because the project reveal button is only in the right-inspector route.
- Electron receipt proves preload surface and startup, not native OS dialog/reveal click-through. Native dialog/reveal click-through remains Gate 5/operator-visible validation.
- WSL/Linux remain unvalidated.

### Follow-Up

- Gate 3 should implement bounded large transcript inspection, model identity display already present where metadata exists, parser diagnostics, render error boundaries, and real parser fixtures.

## Hardening Batch Closeout: Gate 3 Continuity And Session Control (`HARD-020` - `HARD-024`)

### Scope

- Tasks completed: `HARD-020`, `HARD-022`, `HARD-023`, `HARD-024`; `HARD-021` confirmed already present for available metadata.
- Files changed: `src/server/index.ts`, `tests/server-security.test.ts`, `src/renderer/src/components/ErrorBoundary.tsx`, `src/renderer/src/main.tsx`, `src/renderer/src/App.tsx`, `src/renderer/src/styles.css`, `tests/live-conversation.test.ts`, `tests/fixtures/live-conversation/README.md`, `tests/fixtures/live-conversation/install-prompt.txt`, `tests/fixtures/live-conversation/auth-prompt.txt`, `tests/fixtures/live-conversation/model-selection.txt`, `tests/fixtures/live-conversation/mcp-prompt.txt`, `tests/fixtures/live-conversation/plan-mode-prompt.txt`, `tests/fixtures/live-conversation/permission-prompt.txt`, `tests/fixtures/live-conversation/interrupted-session.txt`, `tests/fixtures/live-conversation/failed-command.txt`, `tests/fixtures/live-conversation/long-running-no-token-progress.txt`.
- Files intentionally not touched: Command Code transcript/checkpoint internals; terminal-output parser semantics beyond validation; broad renderer IPC.

### Behavior Implemented

- `HARD-020`: Oversized `.jsonl` transcripts now return a bounded, line-aligned tail with `truncated: true` instead of a dead-end size error. Tail reads use bounded file reads instead of loading the full file.
- `HARD-021`: Transcript workspace already displays model identity through `resolveSessionModelIdentity`; missing metadata remains explicit as an unknown/default identity.
- `HARD-022`: Existing parser tests confirm unknown TUI/menu states become `terminal_required` with raw detail instead of assistant text.
- `HARD-023`: Root and workspace error boundaries were added. The active session fallback preserves `Stop` and `Force Stop` actions.
- `HARD-024`: Added a disk-backed live-conversation fixture corpus for install prompt, auth prompt, model selection, MCP prompt, plan-mode prompt, permission prompt, interrupted session, failed command, and long-running no-token progress. Fixtures assert event classification from sanitized Command Code terminal recordings/minimized TUI excerpts without treating terminal text as structured execution truth.

### Code Shape

- New modules/components: `src/renderer/src/components/ErrorBoundary.tsx`, `tests/fixtures/live-conversation/`.
- Files reduced/split: bounded transcript tail helper extracted inside the server module; deeper route extraction deferred.
- Files still over ~350 lines and why: `App.tsx` and `src/server/index.ts` remain oversized; this batch prioritized crash isolation and transcript continuity without destabilizing session orchestration.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Full post-Gate 4 matrix. |
| `npx vitest run` | Pass | 34 files / 230 tests after fixture corpus. |
| `npx vitest run tests/live-conversation.test.ts` | Pass | 36 parser tests, including 9 fixture-corpus cases. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Browser smoke unchanged. |
| `npm run smoke:pty` | Pass | PTY healthy. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | 6 passed, 0 failed after structured doctor extraction. |
| Electron UI receipt | Partial | Existing Gate 2 Electron startup/preload receipt still applies; no crash-injection UI receipt was run. |
| Built WebGUI receipt | Partial | Existing Gate 2 WebGUI receipt still applies; no large-transcript visual receipt was run. |
| WSL/Linux receipt | Not run | Operator/environment required. |

### Residual Risk

- Parser corpus coverage is now disk-backed for the required prompt/failure/progress classes, but it remains a sanitized/minimized corpus rather than exhaustive coverage of every future Command Code TUI repaint or prompt variant.
- Error boundary fallback is implemented and typechecked, but forced render-crash click-through was not automated.

### Follow-Up

- Add a browser visual receipt for a >1 MB `.jsonl` transcript fixture.

## Hardening Batch Closeout: Gate 4 First-Run Readiness (`HARD-030` - `HARD-033`)

### Scope

- Tasks completed: `HARD-030`, partial `HARD-031`, partial `HARD-032`, partial `HARD-033`.
- Files changed: `src/core/doctor.ts`, `src/cli/ccgui.ts`, `src/server/index.ts`, `src/core/transport.ts`, `src/renderer/src/browserAdapter.ts`, `src/renderer/src/settings/CoreSettings.tsx`, `src/renderer/src/settings/ProfileSettings.tsx`, `src/renderer/src/settings/AppearanceSettings.tsx`, `src/renderer/src/settings/SettingsRoutes.tsx`.
- Files intentionally not touched: auto-install flows; Command Code auth internals; native Windows support claims.

### Behavior Implemented

- `HARD-030`: Added shared `runDoctorChecks()`, `ccgui doctor --json`, authenticated `GET /api/doctor`, and `transport.doctor()`.
- `HARD-031`: Settings Profile setup checklist now renders structured doctor checks for Node, platform, binary, auth, models, and PTY.
- `HARD-032`: Missing binary next-step text is included in structured doctor output. No auto-install path was added.
- `HARD-033`: Windows/WSL guidance is represented in structured doctor output and WebGUI path picker copy; no WSL runtime receipt was produced.

### Code Shape

- New modules/components: `src/core/doctor.ts`.
- Files reduced/split: doctor logic moved out of CLI-only prose and reused by server/API.
- Files still over ~350 lines and why: `CoreSettings.tsx` was later reduced under threshold by `HARD-056`; runtime/general extraction remains optional follow-up rather than a threshold blocker.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Full post-Gate 4 matrix. |
| `npx vitest run` | Pass | 34 files / 221 tests. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Browser smoke unchanged. |
| `npm run smoke:pty` | Pass | PTY healthy. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | Structured CLI formatter: 6 passed, 0 failed. |
| `ccgui doctor --json` | Pass | `npx tsx src/cli/ccgui.ts doctor --json` returned `ok: true`, Command Code `0.33.2`, 27 models, PTY healthy. |
| `/api/doctor` | Pass | Authenticated route returned status 200 and pass statuses for node/platform/binary/auth/models/PTY. |
| Electron UI receipt | Not run | No dedicated Settings Profile visual receipt after doctor UI change. |
| Built WebGUI receipt | Not run | No dedicated Settings Profile visual receipt after doctor UI change. |
| WSL/Linux receipt | Not run | Operator/environment required. |

### Residual Risk

- Missing-binary, unauthenticated, no-models, and PTY-unhealthy states are represented by structured checks but were not simulated in UI receipts.
- WSL-specific copy exists, but WSL remains unvalidated.

### Follow-Up

- Add simulated doctor-result component tests or fixtures for missing `cmd`, unauthenticated `cmd`, empty model list, unhealthy PTY, healthy existing install, WSL, and native Windows.

## Hardening Batch Closeout: Gate 5 Visual And Platform Receipts (`HARD-040` - `HARD-044`)

### Scope

- Tasks completed: partial `HARD-040`, partial `HARD-041`, partial `HARD-044`.
- Tasks not completed: `HARD-042`, `HARD-043`.
- Files changed: closeout documentation only for this gate.
- Files intentionally not touched: packaging, AppImage, WSL install scripts.

### Behavior Implemented

- No product behavior was added in this gate. Receipts were captured against the existing Gate 2 and Gate 6 implementation state.

### Code Shape

- New modules/components: none.
- Files reduced/split: none.
- Files still over ~350 lines and why: see Gate 6.

### Validation

| Check | Result | Notes |
|---|---|---|
| Electron UI receipt | Partial pass | Ephemeral Playwright/Electron startup verified preload surface and server info; screenshot `/tmp/ccgui-gate2-electron-preload-receipt.png`. Full Electron click-through with native folder/reveal dialogs was not run. |
| Built WebGUI receipt | Pass for Gate 2 fallback flow | `npm run serve -- --port 5230`; ephemeral Playwright + local Chrome verified server-side project path input, project selection, Demo session start, browser transcript fallback action, fallback visibility; screenshot `/tmp/ccgui-gate2-webgui-transcript-fallback-receipt.png`. |
| Built WebGUI receipt | Pass for current built flow | `npm run serve -- --port 5231`; ephemeral Playwright + local Chromium loaded tokenized WebGUI, dismissed release notes, set server-side project path to `/Users/steven/Workspace/40_Code/projects/command-code-gui`, verified project label, submitted `Say hello from the WebGUI demo receipt.`, saw `Mock session started`, `session 1`, the submitted prompt, and visible `Stop` controls. Screenshots: `/tmp/ccgui-gate5-webgui-built-home.png`, `/tmp/ccgui-gate5-webgui-built-project.png`, `/tmp/ccgui-gate5-webgui-built-demo-prompt.png`. |
| WSL receipt | Blocked/operator-required | Requires Windows + WSL environment. |
| Linux receipt | Blocked/operator-required | Requires Linux runtime/package environment. |

### Residual Risk

- Electron native folder/reveal click-through is not proven.
- The current built WebGUI receipt did not prove transcript reveal fallback because that button was not visible in the exercised session view. The earlier Gate 2 fallback receipt remains the fallback-specific evidence.
- WSL and Linux are not proven.
- Visual smoke report is represented by this closeout plus screenshots, not a standalone `VISUAL_SMOKE_REPORT.md`.

### Follow-Up

- Run a full Electron click-through: choose project, Demo, real session, composer follow-up, approval/terminal fallback, transcript inspector, stop/force stop, settings.
- Run WSL clean-room checklist from `docs/reports/hardening_sprint.md`.
- Run Linux browser/package checklist separately from macOS and WSL claims.

## Hardening Batch Closeout: Gate 6 Code Shape Hardening (`HARD-050` - `HARD-056`)

### Scope

- Tasks completed: `HARD-050`, `HARD-051`, `HARD-052`, `HARD-053`, `HARD-054`, `HARD-055`, `HARD-056`.
- Tasks not completed: none in Gate 6.
- Files changed: `src/shared/pathContainment.ts`, `src/core/doctor.ts`, `src/server/index.ts`, `src/server/http.ts`, `src/server/staticAssets.ts`, `src/server/preferences.ts`, `src/server/coreRoutes.ts`, `src/server/websocket.ts`, `src/server/sessionRoutes.ts`, `src/server/fileRoutes.ts`, `src/server/discoveryRoutes.ts`, `src/server/diagnosticsRoutes.ts`, `src/server/hookRoutes.ts`, `src/server/hookRouteSupport.ts`, `src/renderer/src/components/ErrorBoundary.tsx`, `src/renderer/src/components/LiveConversationPane.tsx`, `src/renderer/src/components/LiveConversationEvents.tsx`, `src/renderer/src/components/TranscriptPreview.tsx`, `src/renderer/src/components/AppChrome.tsx`, `src/renderer/src/components/AppWorkspaceContent.tsx`, `src/renderer/src/components/AppWorkspaceContentTypes.ts`, `src/renderer/src/components/AppWorkspaceOverlays.tsx`, `src/renderer/src/components/AppRightInspector.tsx`, `src/renderer/src/workspaces/TranscriptWorkspace.tsx`, `src/renderer/src/inspectors/RightInspectorPanel.tsx`, `src/renderer/src/App.tsx`, `src/renderer/src/services/appStorage.ts`, `src/renderer/src/services/guiPreferencePersistence.ts`, `src/renderer/src/hooks/useAppLayoutGeometry.ts`, `src/renderer/src/hooks/useGuiPreferences.ts`, `src/renderer/src/hooks/useSessionActions.ts`, `src/renderer/src/hooks/useSessionActionsTypes.ts`, `src/renderer/src/hooks/useRuntimeCheck.ts`, `src/renderer/src/hooks/useGitStatus.ts`, `src/renderer/src/hooks/usePtyHealth.ts`, `src/renderer/src/hooks/useCommandCodeUpdate.ts`, `src/renderer/src/hooks/useShellTerminal.ts`, `src/renderer/src/hooks/useRevealActions.ts`, `src/renderer/src/hooks/useSessionReadiness.ts`, `src/renderer/src/hooks/useHeadlessJobs.ts`, `src/renderer/src/hooks/useWorkEvents.ts`, `src/renderer/src/browserAdapter.ts`, `src/renderer/src/transport/browserApiClient.ts`, `src/renderer/src/transport/browserSessionSocket.ts`, `src/renderer/src/settings/ProfileSettings.tsx`, `src/renderer/src/settings/AppearanceSettings.tsx`, `src/renderer/src/settings/CoreSettings.tsx`, `src/renderer/src/settings/ReferenceSettings.tsx`, `src/renderer/src/settings/ReferenceSettingsShared.tsx`, `src/renderer/src/settings/KeyboardSettings.tsx`, `src/renderer/src/settings/NotificationsSettings.tsx`, `src/renderer/src/settings/TerminalSettings.tsx`, `src/renderer/src/settings/HooksSettings.tsx`, `src/renderer/src/settings/useHooksSettings.ts`, `src/renderer/src/settings/AboutSettings.tsx`, `src/renderer/src/settings/ReferenceGuideSettings.tsx`, `src/renderer/src/settings/SettingsRoutes.tsx`.
- Files intentionally not touched: broad renderer IPC and Command Code CLI execution semantics.

### Behavior Implemented

- Shared path containment extracted for server/main/artifact detector.
- Shared doctor checks extracted for CLI/server/renderer.
- `HARD-051`: reusable HTTP helpers for token generation/extraction, bounded JSON body parsing, route parameter matching, JSON responses, static file responses, and auth-cookie refresh were moved into `src/server/http.ts`; exact loopback CORS evaluation and static asset containment/path fallback were moved into `src/server/staticAssets.ts`; GUI preference path and sanitization helpers were moved into `src/server/preferences.ts`; health, doctor, Command Code check/status/update/models, and GUI preference routes were moved into `src/server/coreRoutes.ts`; WebSocket session bridging was moved into `src/server/websocket.ts`; headless/session/transcript routes were moved into `src/server/sessionRoutes.ts`; file browsing/read routes were moved into `src/server/fileRoutes.ts`; session discovery, project Command Code reference, usage, taste, agents, MCP, skills, and memory routes were moved into `src/server/discoveryRoutes.ts`; IDE/Git diagnostics were moved into `src/server/diagnosticsRoutes.ts`; hook config/log/dry-run/preview/apply routes were moved into `src/server/hookRoutes.ts` with pure hook config/log helpers in `src/server/hookRouteSupport.ts` without changing the route table, auth gates, dev-mode no-origin CORS fallback, request handling order, static containment checks, preference file locations, sanitized preference schema, replay-on-connect behavior, data/exit forwarding, write/resize messages, idle timer resets, mock headless output, workspace registration/cleanup, bounded transcript tail behavior, workspace-contained file access policy, scoped agent save policy, scoped memory save policy, hook preview behavior, or scoped backup-then-write apply behavior.
- Error boundary component extracted for root/workspace crash isolation.
- `HARD-050`: App-level localStorage defaults, preference keys, label helpers, permission/update labels, and geometry constants were moved into `services/appStorage.ts`; sidebar/inspector width state and drag handlers were moved into `hooks/useAppLayoutGeometry.ts`; file-backed app/project preference hydration, debounced preference saves, and persistent preference setters were moved into `hooks/useGuiPreferences.ts`, with pure preference transforms in `services/guiPreferencePersistence.ts`; workspace branch rendering moved into `components/AppWorkspaceContent.tsx`, its prop contract into `components/AppWorkspaceContentTypes.ts`, shared right-inspector wiring into `components/AppRightInspector.tsx`, popovers/release notes into `components/AppWorkspaceOverlays.tsx`, and shell/workspace JSX assembly into `components/AppChrome.tsx`; session start/resume/submit/plan/stop/interrupt/force-kill/release-note command actions were moved into `hooks/useSessionActions.ts` with its prop contract in `hooks/useSessionActionsTypes.ts`; runtime check/status action moved into `hooks/useRuntimeCheck.ts`; Git status refresh/request ordering moved into `hooks/useGitStatus.ts`; PTY health refresh moved into `hooks/usePtyHealth.ts`; Command Code update check/install state moved into `hooks/useCommandCodeUpdate.ts`; bottom shell terminal lifecycle moved into `hooks/useShellTerminal.ts`; reveal fallback handling moved into `hooks/useRevealActions.ts`; session readiness foreground/background transitions, attached-readiness creation, tab-backgrounding, and session-output subscriptions moved into `hooks/useSessionReadiness.ts`; headless job history and `transport.runHeadless` orchestration moved into `hooks/useHeadlessJobs.ts`; local work-event history moved into `hooks/useWorkEvents.ts` without changing renderer state flow, inspector collapse behavior, file-backed preference paths/schema/save debounce behavior, localStorage compatibility writes, git-status fallback rendering, startup update checks, PTY fallback-to-Demo behavior, shell PTY cleanup when no project is selected, WebGUI reveal-copy fallback copy, native conversation readiness semantics, headless run semantics, session stop ladder, PTY prompt submission delay/chunking, workspace error-boundary fallbacks, popover behavior, update action routing, or transcript activity rendering.
- `HARD-052`: Browser transport auth/URL handling and WebSocket session fanout were split into focused transport modules while preserving the existing transport API and explicit browser unsupported native-action results.
- `HARD-053`: Transcript preview/timeline/artifact rendering was moved into a shared component consumed by both transcript workspace and right inspector, preserving the existing read/filter/truncation behavior.
- `HARD-054`: Live conversation event rendering was split from session/cache orchestration without changing `parseLiveConversation` semantics or approval terminal fallback behavior.
- `HARD-055`: Reference settings domains were split into keyboard, notifications, terminal, hooks, about, guide, and shared helper modules; hook discovery/preview/apply orchestration moved into `useHooksSettings` without changing confirmation gates.
- `HARD-056`: Profile/readiness and appearance settings were split out of `CoreSettings.tsx` without changing Settings route behavior.

### Code Shape

- New modules/components: `pathContainment.ts`, `doctor.ts`, `server/http.ts`, `server/staticAssets.ts`, `server/preferences.ts`, `server/coreRoutes.ts`, `server/websocket.ts`, `server/sessionRoutes.ts`, `server/fileRoutes.ts`, `server/discoveryRoutes.ts`, `server/diagnosticsRoutes.ts`, `server/hookRoutes.ts`, `server/hookRouteSupport.ts`, `ErrorBoundary.tsx`, `TranscriptPreview.tsx`, `LiveConversationEvents.tsx`, `AppChrome.tsx`, `AppWorkspaceContent.tsx`, `AppWorkspaceContentTypes.ts`, `AppWorkspaceOverlays.tsx`, `AppRightInspector.tsx`, `appStorage.ts`, `guiPreferencePersistence.ts`, `useAppLayoutGeometry.ts`, `useGuiPreferences.ts`, `useSessionActions.ts`, `useSessionActionsTypes.ts`, `useRuntimeCheck.ts`, `useGitStatus.ts`, `usePtyHealth.ts`, `useCommandCodeUpdate.ts`, `useShellTerminal.ts`, `useRevealActions.ts`, `useSessionReadiness.ts`, `useHeadlessJobs.ts`, `useWorkEvents.ts`, `browserApiClient.ts`, `browserSessionSocket.ts`, `ReferenceSettingsShared.tsx`, `KeyboardSettings.tsx`, `NotificationsSettings.tsx`, `TerminalSettings.tsx`, `HooksSettings.tsx`, `useHooksSettings.ts`, `AboutSettings.tsx`, `ReferenceGuideSettings.tsx`.
- Files reduced/split: duplicate containment and doctor prose logic reduced. `src/server/index.ts` reduced from 1611 lines to 350 lines after extracting reusable HTTP helpers into `src/server/http.ts` at 147 lines, CORS/static path helpers into `src/server/staticAssets.ts` at 37 lines, GUI preference helpers into `src/server/preferences.ts` at 98 lines, core runtime/preference routes into `src/server/coreRoutes.ts` at 129 lines, WebSocket session bridging into `src/server/websocket.ts` at 88 lines, headless/session/transcript routes into `src/server/sessionRoutes.ts` at 147 lines, file browsing/read routes into `src/server/fileRoutes.ts` at 82 lines, discovery/integration routes into `src/server/discoveryRoutes.ts` at 117 lines, IDE/Git diagnostics into `src/server/diagnosticsRoutes.ts` at 148 lines, hook routes into `src/server/hookRoutes.ts` at 306 lines, and hook config/log helpers into `src/server/hookRouteSupport.ts` at 128 lines. `App.tsx` reduced from 1540 lines to 336 lines after moving storage/default helpers into `appStorage.ts` at 159 lines, file-backed preference orchestration into `useGuiPreferences.ts` at 345 lines plus `guiPreferencePersistence.ts` at 70 lines, shell/workspace JSX assembly into `AppChrome.tsx` at 166 lines, workspace composition into `AppWorkspaceContent.tsx` at 339 lines, composition props into `AppWorkspaceContentTypes.ts` at 106 lines, workspace overlays into `AppWorkspaceOverlays.tsx` at 139 lines, right-inspector wiring into `AppRightInspector.tsx` at 75 lines, session lifecycle/actions into `useSessionActions.ts` at 349 lines plus `useSessionActionsTypes.ts` at 53 lines, runtime check action into `useRuntimeCheck.ts` at 26 lines, layout resize state into `useAppLayoutGeometry.ts` at 87 lines, git-status refresh into `useGitStatus.ts` at 59 lines, PTY health into `usePtyHealth.ts` at 42 lines, update state into `useCommandCodeUpdate.ts` at 95 lines, shell terminal lifecycle into `useShellTerminal.ts` at 78 lines, reveal fallback handling into `useRevealActions.ts` at 45 lines, session readiness bookkeeping into `useSessionReadiness.ts` at 75 lines, headless job orchestration into `useHeadlessJobs.ts` at 92 lines, and work-event history into `useWorkEvents.ts` at 18 lines. `TranscriptWorkspace.tsx` reduced from 294 lines to 79 lines; shared transcript preview rendering now lives in `TranscriptPreview.tsx` at 218 lines and is imported by both workspace and inspector. `browserAdapter.ts` reduced from 471 lines to 311 lines; new focused transport files are `browserApiClient.ts` at 93 lines and `browserSessionSocket.ts` at 106 lines. `LiveConversationPane.tsx` reduced from 440 lines to 196 lines; event rendering now lives in `LiveConversationEvents.tsx` at 249 lines. `ReferenceSettings.tsx` reduced from 837 lines to 13 lines; extracted reference settings modules are each below the warning threshold (`HooksSettings.tsx` 327 lines, `useHooksSettings.ts` 276 lines, `NotificationsSettings.tsx` 96 lines, `TerminalSettings.tsx` 70 lines, `KeyboardSettings.tsx` 38 lines). `CoreSettings.tsx` reduced from 597 lines to 322 lines; new focused files are `ProfileSettings.tsx` at 196 lines and `AppearanceSettings.tsx` at 103 lines.
- Files still over ~350 lines and why:
  - `src/server/index.ts`: 350 lines; at the readability warning threshold, but no longer over it.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Post-`AppChrome` extraction. |
| `npx vitest run` | Pass | 34 files / 221 tests after `AppChrome` extraction. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Browser smoke unchanged after server route, preference-hook, workspace-composition, and session-action extraction. |
| `npm run smoke:pty` | Pass | PTY healthy. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | Structured doctor smoke. |
| `git diff --check` | Pass | No whitespace errors after `AppChrome` extraction batch. |

### Residual Risk

- Code-shape acceptance for Gate 6 is satisfied locally. `src/server/index.ts` remains exactly at the warning threshold, so future server behavior should still prefer route modules over adding logic back to the entrypoint.

### Follow-Up

- Remaining sprint follow-up is outside Gate 6: full Electron click-through, WSL receipt, and Linux receipt.

## Sprint Outcome Status

### Satisfied Locally

1. WebGUI users can set and validate a server-side project path without Electron native dialogs.
2. Browser-only reveal actions show useful alternatives instead of silently no-oping.
3. Large `.jsonl` transcripts remain inspectable through bounded tail rendering.
4. Localhost security uses exact loopback origin checks and canonical path containment.
5. Oversized HTTP bodies return structured 413 responses.
6. First-run readiness exposes binary, auth, model, PTY, and project state through structured doctor checks and Settings UI.
7. Native conversation parser misses degrade to explicit diagnostic fallback states, with a disk-backed fixture corpus for required prompt/failure/progress classes.
8. Workspace render crashes are isolated by error boundaries that preserve session controls for active sessions.
9. Architecture/API/security docs were updated to match current behavior.
10. Flagged large files were split or brought to the threshold target: `App.tsx` is 336 lines; `src/server/index.ts` is 350 lines.

### Receipts And Blockers

| Outcome | Status | Exact remaining step |
|---|---|---|
| Electron click-through receipt | Partial/operator-required | Launch built Electron on macOS and execute: select project, start Demo session, start real session, send composer follow-up, handle approval button or terminal fallback, open transcript inspector, stop/force stop, open Settings. Record screenshot paths and DOM/status notes. Existing receipt only proves Electron startup/preload surface. |
| Built WebGUI receipt | Pass | Existing Gate 2 and Gate 5 built WebGUI receipts cover tokenized browser route, server-side project path, Demo session, visible stop controls, and browser transcript fallback. |
| WSL clean-room receipt | Blocked/operator-required | Requires Windows + WSL. Run the 19-step checklist in `docs/reports/hardening_sprint.md#hard-042-wsl-clean-room-receipt` from inside WSL and add the dated output/screenshot receipt here or to `docs/reports/SMOKE_TEST_REPORT.md`. |
| Linux runtime/package receipt | Blocked/operator-required | Requires Linux runtime/package environment. Run `npm install`, `npm run build`, `npm run doctor`, `npm run smoke:pty`, `npm run smoke:browser`, `npm run smoke:headless`, and browser-mode `npm run serve -- --port 5183 --open`; if AppImage packaging is in scope, run `npm run dist` and launch the AppImage separately. |

### Final Boundary

The sprint implementation and local macOS/WebGUI validation are complete except for the explicitly operator-required platform/visual receipts above. No WSL, Linux, native Windows, or full Electron click-through claim is made from this environment.

## Post-Sprint Dogfood Fix: Session Readiness Semantics

### Scope

- Tasks completed: dogfood follow-up for Electron tab/session status clarity and explicit Demo mode.
- Files changed: `src/renderer/src/services/sessionReadiness.ts`, `src/renderer/src/hooks/useSessionReadiness.ts`, `src/renderer/src/hooks/useSessionActions.ts`, `src/renderer/src/hooks/useGuiPreferences.ts`, `src/renderer/src/services/liveConversation.ts`, `src/renderer/src/components/LiveConversationPane.tsx`, `src/renderer/src/components/AppWorkspaceContent.tsx`, `src/renderer/src/components/AppWorkspaceContentTypes.ts`, `src/renderer/src/workspaces/SessionWorkspace.tsx`, `src/renderer/src/components/TabBar.tsx`, `src/renderer/src/styles.css`, `src/renderer/src/App.tsx`, `tests/session-readiness.test.ts`, `tests/live-conversation.test.ts`.

### Behavior Implemented

- Tab readiness now uses operator-facing labels: `attaching`, `ready`, `thinking`, `input`, `completed`, and `error`.
- Tab status includes a compact symbol plus color: attach/replay and thinking use warning/yellow affordance, ready uses green, error uses red.
- Promptless session output marks a tab `ready`; output after a prompt marks it `thinking`.
- Active-session prompt submission records `lastPrompt` before PTY writes so readiness and native conversation parsing are tied to the current turn immediately.
- Mock `received: <prompt>` framing is accepted as a prompt echo when Demo mode is explicitly enabled, preventing false `Sending to Command Code` stalls in Demo.
- Saved project preferences no longer restore or persist Demo mode; new app/project starts default to real Command Code sessions unless the operator explicitly enables Demo mode in the Runtime popover.
- PTY-unhealthy startup no longer silently switches to Demo mode; it keeps Real selected and surfaces the PTY blocker.
- Live conversation panes are keyed by session id so parser refs, turn history, activity memory, and raw-output state remount per PTY session; readiness feedback now carries its source session id so delayed parser updates cannot mutate whichever tab is active later.
- PTY repaint fragments such as indexed `READ[n]` rows, embedded `EXPLORE (...)` rows, partial ANSI color fragments, standalone token counters, and thinking/progress vocabulary are canonicalized as compact activity/working metadata or filtered; they no longer fall through as assistant chat text.
- Activity-only turns no longer mark a tab `ready`; only actual assistant message text transitions a turn to `ready`, while tool activity, file references, thinking, and progress keep the session in `thinking`.
- Isolated PTY tail fragments such as `)`, `tokens).`, and `• ↓ 91` are filtered from assistant chat bubbles.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npx vitest run tests/session-readiness.test.ts tests/live-conversation.test.ts` | Pass | 2 files / 51 tests. |
| `npm run typecheck` | Pass | Renderer/session typing clean. |
| `npx vitest run` | Pass | 34 files / 237 tests. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Mock/real headless start, mock session lifecycle, multi-session independence, auth checks. |
| `npm run smoke:pty` | Pass | PTY healthy on macOS `/bin/zsh`. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | 6 passed, 0 failed. |
| `git diff --check` | Pass | No whitespace errors. |

### Residual Risk

- Full Electron dogfood receipt should be rerun against the built UI to confirm the new labels and lights in the live desktop shell.
