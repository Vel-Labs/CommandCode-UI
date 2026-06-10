# Hardening Sprint

**Date:** 2026-06-08
**Source audit:** `docs/reports/HARDENING_BUGFIX_AUDIT.md`
**Repo:** `/Users/steven/Workspace/40_Code/projects/command-code-gui`
**Purpose:** Convert the audit findings into a phased, layered, goal-ready hardening plan.

This document is an execution plan, not proof that the work is complete. Each task below must remain unclaimed until its implementation, tests, and receipts are present in the repo.

## Operating Rules

- Command Code CLI remains the execution engine and source of truth.
- The GUI remains an adapter around desktop shell, PTY lifecycle, headless orchestration, session display, operator controls, transcripts, and GUI preferences.
- Do not add generic shell execution to the renderer.
- Do not broaden preload IPC beyond narrow, named native operations.
- Do not treat terminal parsing as structured Command Code truth. Native conversation rendering is a presentation projection only.
- Keep Electron and WebGUI visual language consistent. Platform differences must be explicit and user-facing.
- Keep Demo/mock, real interactive PTY, and real headless Command Code paths separately validated.
- Keep macOS, WebGUI, Linux, WSL, and native Windows status separate.
- Code cleanliness is an acceptance requirement. Prefer focused modules, shared components, typed services/hooks, and orchestrator layers.
- Treat roughly 350 lines as a readability warning threshold. If a task touches an oversized file, either keep the edit surgical or first extract the relevant boundary with tests.

## Baseline

Latest audit validation on macOS:

| Check | Status |
|---|---|
| `npm run typecheck` | Pass |
| `npx vitest run` | Pass, 32 files / 209 tests |
| `npm run build` | Pass |
| `npm run smoke:browser` | Pass |
| `npm run smoke:pty` | Pass |
| `npm run smoke:headless` | Pass |
| `npm run doctor` | Pass, Command Code `v0.33.2`, PTY healthy |

Unproven at baseline:

- Real Electron click-through.
- Real WebGUI click-through.
- Linux package/runtime.
- WSL clean-room install/runtime.
- First-run path without Command Code installed.
- Visual regression coverage.

## Sprint Outcome

The sprint is complete only when all of these are true:

1. WebGUI users can set and validate a server-side project path without Electron native dialogs.
2. Browser-only reveal actions never silently no-op; they show useful alternatives.
3. Large `.jsonl` transcripts remain inspectable through bounded/paged rendering.
4. Localhost security posture uses exact origin checks and canonical path containment.
5. Oversized HTTP bodies return structured 413 responses instead of connection resets.
6. GUI first-run readiness exposes binary, auth, model, PTY, and project state without requiring terminal interpretation.
7. Native conversation parser misses degrade to explicit diagnostic fallback states.
8. A rendering crash in a workspace does not remove all session controls.
9. Architecture/API/security docs match current behavior.
10. Electron and WebGUI have at least one click-through receipt each.
11. WSL has a clean-room receipt or is explicitly marked blocked with exact missing access.
12. Flagged large files have either been safely split or have a recorded follow-up extraction plan with tests and receipts.

## Phase Gates

### Gate 0: Baseline Freeze

**Intent:** Ensure every later change is measured against a known-good state.

Required before implementation:

- Run and record:
  - `npm run typecheck`
  - `npx vitest run`
  - `npm run build`
  - `npm run smoke:browser`
  - `npm run smoke:pty`
  - `npm run smoke:headless`
  - `npm run doctor`
- Confirm current dirty worktree and do not overwrite unrelated changes.
- Confirm `docs/reports/HARDENING_BUGFIX_AUDIT.md` remains append-only historical input.

Exit criteria:

- Baseline commands pass or failures are recorded as pre-existing.
- Sprint tasks start from this document, not from ad hoc audit notes.

### Gate 1: Safety Foundations

**Intent:** Fix security and error-handling foundations before adding UX features.

Tasks:

- `HARD-001` exact CORS origin validation.
- `HARD-002` canonical path containment helper.
- `HARD-003` static asset containment hardening.
- `HARD-004` structured 413 for oversized request bodies.
- `HARD-005` docs drift cleanup for auth, CORS, session lifecycle, API route count, and IPC scope.

Exit criteria:

- Security tests cover positive and negative cases.
- Existing smoke commands still pass.
- Docs match current server and IPC behavior.

### Gate 2: WebGUI Parity For Non-Terminal Users

**Intent:** Make browser mode honest and usable, especially for Linux/WSL.

Tasks:

- `HARD-010` explicit transport variants for browser and Electron.
- `HARD-011` WebGUI server-side project path picker and validation.
- `HARD-012` browser reveal fallbacks for transcript/project/session reveal actions.
- `HARD-013` shell-neutral labels for reveal actions.

Exit criteria:

- WebGUI path selection works without Electron.
- Browser reveal actions show alternatives instead of silently resolving.
- Electron native folder/reveal flows still work.

### Gate 3: Continuity And Session Control

**Intent:** Protect session understanding and operator control during long or messy sessions.

Tasks:

- `HARD-020` paged/bounded `.jsonl` transcript inspection.
- `HARD-021` transcript model identity display.
- `HARD-022` native conversation parser confidence and diagnostic fallback.
- `HARD-023` React error boundaries with session-control-preserving fallback.
- `HARD-024` real parser fixture corpus from Command Code sessions.

Exit criteria:

- Large transcripts render a bounded useful view.
- Parser misses are visible and actionable.
- Workspace render failures do not remove all stop/force controls.

### Gate 4: First-Run Readiness

**Intent:** Make install/auth/doctor/project setup understandable for users who are not terminal-focused.

Tasks:

- `HARD-030` `ccgui doctor --json` or `/api/doctor`.
- `HARD-031` GUI first-run readiness checklist.
- `HARD-032` missing Command Code guidance with platform-specific copyable commands.
- `HARD-033` WSL-specific path/runtime guidance.

Exit criteria:

- Missing binary, unauthenticated CLI, missing model list, unhealthy PTY, and missing project each render distinct next steps.
- Auto-install, if ever added, remains explicitly user-approved and out of this sprint unless separately scoped.

### Gate 5: Visual And Platform Receipts

**Intent:** Prove the experience, not just the code path.

Tasks:

- `HARD-040` Electron click-through smoke.
- `HARD-041` built WebGUI click-through smoke.
- `HARD-042` WSL clean-room receipt.
- `HARD-043` Linux runtime/package receipt.
- `HARD-044` visual smoke report.

Exit criteria:

- Dated receipts exist with exact commands, URLs, screenshots or DOM assertions, and pass/fail status.
- WSL/Linux remain separate from macOS/Electron claims.

### Gate 6: Code Shape Hardening

**Intent:** Reduce monolithic files without changing behavior.

Tasks:

- `HARD-050` split renderer app orchestration from view composition.
- `HARD-051` split server composition from auth/cors/static/ws/routes.
- `HARD-052` split browser transport into API client, WebSocket manager, base transport, browser transport, Electron transport.
- `HARD-053` extract transcript actions/viewer/timeline shared components.
- `HARD-054` extract live conversation cache/reducer/presentational components.
- `HARD-055` split settings domains from `ReferenceSettings.tsx`.
- `HARD-056` split `CoreSettings.tsx` into profile, appearance, runtime, and composition.

Exit criteria:

- Behavior is frozen by tests before extraction.
- Each split is validated with the same commands and relevant UI receipts.
- Oversized files are reduced or have an explicit reason they remain large.

## Task Backlog

### HARD-001: Exact CORS Origin Validation

**Severity:** P2
**Depends on:** Gate 0
**Files likely touched:**

- `src/server/index.ts`
- `src/server/cors.ts` if extracting first
- `tests/server-security.test.ts`

**Implementation boundary:**

- Replace prefix checks with parsed URL validation.
- Allow only exact local hostnames: `127.0.0.1`, `localhost`, and `::1`.
- Preserve dev-mode behavior only where explicitly required.

**Tests:**

- Allow `http://127.0.0.1:<port>`.
- Allow `http://localhost:<port>`.
- Allow IPv6 loopback if supported by the server path.
- Reject `http://localhost.evil.example`.
- Reject `http://127.0.0.1.evil.example`.
- Reject `http://evil.example`.
- Verify `npm run smoke:browser` still passes.

**Done means:**

- CORS behavior is exact-host based.
- Tests prove old prefix bypass cases fail.

### HARD-002: Canonical Path Containment Helper

**Severity:** P3 security hardening
**Depends on:** Gate 0
**Files likely touched:**

- `src/shared/pathContainment.ts`
- `src/server/index.ts`
- `src/main/index.ts`
- `src/core/artifactDetection.ts`
- `tests/path-containment.test.ts`

**Implementation boundary:**

- Create canonical `resolveBoundaryPath()` and `isPathUnderRoot()`.
- Preserve current allowed-root semantics.
- Do not broaden file read/write/reveal scope.

**Tests:**

- Existing path.
- Non-existent leaf.
- Non-existent intermediate directory.
- Root path itself.
- Sibling-prefix path, for example `/tmp/root` vs `/tmp/root2`.
- Symlink inside root.
- Symlink escape outside root.

**Done means:**

- Three duplicate containment implementations are removed.
- All existing file/reveal/transcript boundary tests still pass.

### HARD-003: Static Asset Containment Hardening

**Severity:** P3
**Depends on:** `HARD-002` preferred
**Files likely touched:**

- `src/server/index.ts`
- `src/server/static.ts` if extracting
- `tests/server-security.test.ts`

**Implementation boundary:**

- Resolve static root once.
- Use `path.relative()` or canonical helper instead of `startsWith(staticDir)`.
- Preserve SPA fallback behavior.

**Tests:**

- Valid asset returns 200.
- SPA fallback returns `index.html`.
- `../` traversal rejected.
- Encoded traversal rejected.
- Sibling-prefix path rejected.

**Done means:**

- Static serving cannot escape the renderer build root.
- Browser route still loads.

### HARD-004: Structured 413 For Oversized Request Bodies

**Severity:** P3
**Depends on:** Gate 0
**Files likely touched:**

- `src/server/index.ts`
- `tests/server-security.test.ts`

**Implementation boundary:**

- Oversized bodies return HTTP 413 and structured JSON.
- Client should receive a typed HTTP error, not a connection reset.

**Tests:**

- POST body over 1MB returns `413` with `{ "error": "Request body too large" }`.
- Body at or below limit follows normal route behavior.

**Done means:**

- Browser transport reports a clear error for oversized payloads.

### HARD-005: Docs Drift Cleanup

**Severity:** P2
**Depends on:** `HARD-001` through `HARD-004` if behavior changes first
**Files likely touched:**

- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/SECURITY.md`
- `docs/reference/API_REFERENCE.md`
- `docs/reports/TEST_PLAN.md`
- `README.md` if user-facing behavior changed

**Implementation boundary:**

- Update stale claims only.
- Do not create new unvalidated readiness claims.

**Known stale claims to check:**

- Cookie set on every response.
- `Access-Control-Allow-Origin: *`.
- Old stop/kill route names.
- Ctrl-C stop ladder if no longer accurate.
- API endpoint count.
- Preload method count and IPC scope.

**Validation:**

- `rg "cookie on every|Access-Control-Allow-Origin: \\*|/api/sessions/:id/kill|Ctrl-C|endpoint"` across docs.
- Existing validation commands still pass if docs-only.

**Done means:**

- Docs describe current behavior and do not overclaim platform proof.

### HARD-010: Explicit Browser/Electron Transport Variants

**Severity:** P2 code shape prerequisite
**Depends on:** Gate 1 preferred
**Files likely touched:**

- `src/renderer/src/browserAdapter.ts`
- `src/renderer/src/useTransport.ts`
- `src/renderer/src/transport/apiClient.ts`
- `src/renderer/src/transport/websocketManager.ts`
- `src/renderer/src/transport/baseTransport.ts`
- `src/renderer/src/transport/browserTransport.ts`
- `src/renderer/src/transport/electronTransport.ts`
- transport tests

**Implementation boundary:**

- Make Electron native overlays explicit.
- Browser variant must return explicit unsupported/fallback results for native-only actions.
- Preserve existing `TransportAPI` behavior until caller updates land.

**Tests:**

- Browser variant does not silently no-op native-only methods.
- Electron variant delegates native methods to preload IPC.
- WebSocket replay/data/exit behavior unchanged.

**Done means:**

- It is clear which transport methods are browser-only, Electron-only, or shared.

### HARD-011: WebGUI Server-Side Project Path Picker

**Severity:** P1
**Depends on:** `HARD-010`
**Files likely touched:**

- `src/renderer/src/components/AppPopovers.tsx`
- new reusable project path picker component
- `src/server/index.ts` or project validation route if added
- component tests

**Implementation boundary:**

- Browser mode uses manual server-side path input, not native file selection.
- Electron keeps native directory picker.
- Do not default real sessions to `/` unless the user explicitly enters `/`.

**Tests:**

- Valid path accepted.
- Invalid path rejected with clear message.
- Recent server-side paths render.
- WebGUI label says `Set server-side project path...`.

**Manual receipt:**

- Built WebGUI route: set project path, start Demo session, start real session, file browser and git status use the path.

**Done means:**

- WebGUI project setup is honest and functional for Linux/WSL.

### HARD-012: Browser Reveal Fallbacks

**Severity:** P1
**Depends on:** `HARD-010`
**Files likely touched:**

- `src/renderer/src/components/TranscriptActions.tsx`
- `src/renderer/src/inspectors/RightInspectorPanel.tsx`
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx`
- `src/renderer/src/settings/AdvancedReadOnlySettings.tsx`
- transport variant files

**Implementation boundary:**

- Browser reveal must show fallback UI.
- Electron reveal must still use native IPC.
- Cover transcript reveal, project reveal, and settings session reveal.

**Fallback options:**

- Copy path.
- Show path.
- Open in file inspector when possible.
- Download or show transcript tail when appropriate.

**Tests:**

- Browser click shows fallback.
- Electron click calls native reveal.
- Settings, inspector, and transcript workspace all use shared behavior.

**Done means:**

- No reveal button silently resolves in WebGUI.

### HARD-013: Shell-Neutral Reveal Labels

**Severity:** P3 UX polish
**Depends on:** `HARD-012`
**Files likely touched:**

- `src/renderer/src/inspectors/RightInspectorPanel.tsx`
- shared action components

**Implementation boundary:**

- Avoid `Finder` label outside macOS Electron.
- Use labels such as `Reveal project`, `Show path`, or platform-specific label from runtime.

**Done means:**

- Browser/Linux/WSL users do not see macOS-only UI copy.

### HARD-020: Paged Or Bounded `.jsonl` Transcript Inspection

**Severity:** P1
**Depends on:** Gate 1 preferred
**Files likely touched:**

- `src/server/index.ts`
- `src/core/transcriptParser.ts`
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx`
- extracted transcript viewer components if `HARD-053` is done first
- transcript tests

**Implementation boundary:**

- Preserve existing transcript read route compatibility.
- Add a dedicated paged route if needed, for example `/api/sessions/transcript/page`.
- Latest entries should render even when full `.jsonl` is larger than 1MB.

**Tests:**

- >1MB JSONL fixture renders latest N entries.
- Truncation metadata is returned.
- Filters work on loaded entries.
- Memory remains bounded.

**Manual receipt:**

- Open a large real or fixture transcript and verify partial timeline, banner, filters, and artifact links.

**Done means:**

- Transcript inspection never dead-ends solely because a structured transcript is large.

### HARD-021: Transcript Model Identity Display

**Severity:** P3
**Depends on:** `HARD-020` optional
**Files likely touched:**

- `src/renderer/src/workspaces/TranscriptWorkspace.tsx`
- `src/renderer/src/services/sessionModelIdentity.ts`
- tests

**Implementation boundary:**

- Show model identity when metadata is available.
- Show `Unknown model` or equivalent when not.
- Show Demo/Mock identity for mock sessions if available.

**Done means:**

- A user browsing old transcripts can see model/runtime identity before resuming.

### HARD-022: Parser Confidence And Diagnostic Fallback

**Severity:** P2
**Depends on:** `HARD-024` preferred
**Files likely touched:**

- `src/renderer/src/services/liveConversation.ts`
- `src/renderer/src/components/LiveConversationPane.tsx`
- extracted live conversation components if `HARD-054` is done first
- tests

**Implementation boundary:**

- Native timeline remains a projection.
- Unknown TUI states show `Needs terminal input` or diagnostic fallback.
- Avoid generic `Waiting for Command Code output` when recent raw output exists but is unparsed.

**Tests:**

- Known approvals render buttons.
- Unknown menu renders terminal-required fallback.
- Long-running progress remains specific.
- Parser confidence state renders in UI.

**Done means:**

- Non-terminal users know when they need the advanced terminal and why.

### HARD-023: React Error Boundaries

**Severity:** P2
**Depends on:** Gate 0
**Files likely touched:**

- `src/renderer/src/components/ErrorBoundary.tsx`
- `src/renderer/src/main.tsx`
- workspace wrappers
- tests

**Implementation boundary:**

- Root boundary catches full-app errors.
- Workspace boundaries isolate session/settings/transcript/home failures.
- Session fallback must preserve stop/force-stop access or provide an explicit recovery action.

**Tests:**

- Forced render error shows fallback.
- Sibling workspace remains available.
- Session fallback keeps stop/force controls accessible.

**Done means:**

- A render crash does not necessarily remove operator control of a running session.

### HARD-024: Real Command Code Parser Fixture Corpus

**Severity:** P2 validation
**Depends on:** Gate 0
**Files likely touched:**

- `tests/fixtures/live-conversation/`
- `tests/live-conversation.test.ts`
- maybe `docs/reports/SMOKE_TEST_REPORT.md`

**Fixture types:**

- Install prompt.
- Auth prompt or auth failure.
- Model selection.
- MCP prompt.
- Plan-mode prompt.
- Permission prompt.
- Interrupted session.
- Failed command.
- Long-running no-token progress.

**Done means:**

- Parser coverage is based on real terminal recordings, not only handcrafted examples.

### HARD-030: GUI-Consumable Doctor

**Severity:** P1
**Depends on:** Gate 1 preferred
**Files likely touched:**

- `src/cli/ccgui.ts`
- `src/core/doctor.ts` or equivalent new pure module
- `src/server/index.ts`
- tests

**Implementation boundary:**

- Extract doctor checks into pure reusable logic.
- Add `ccgui doctor --json` and/or `/api/doctor`.
- Do not parse CLI text in the renderer.

**Checks:**

- Node version.
- Platform.
- Command Code binary.
- Authentication.
- Model listing.
- PTY health.
- WSL/native Windows hints.

**Done means:**

- GUI can render environment readiness from structured data.

### HARD-031: First-Run Readiness Checklist

**Severity:** P1
**Depends on:** `HARD-030`
**Files likely touched:**

- `src/renderer/src/workspaces/HomeWorkspace.tsx`
- readiness components
- settings/auth components
- tests

**Implementation boundary:**

- Show binary, auth, models, PTY, project checks.
- Each failed check has a concrete next step.
- Demo mode remains available when real CLI is missing.

**Manual receipts:**

- Missing `cmd`.
- Unauthenticated `cmd`.
- Healthy existing install.
- PTY unhealthy simulated state.

**Done means:**

- A non-terminal user can understand what blocks real sessions.

### HARD-032: Platform Install Guidance

**Severity:** P2
**Depends on:** `HARD-031`
**Files likely touched:**

- readiness components
- README if public instructions change

**Implementation boundary:**

- Copyable install commands.
- No silent install.
- Native Windows warning remains separate from WSL guidance.

**Done means:**

- Missing install path is actionable without reading README first.

### HARD-033: WSL-Specific Guidance

**Severity:** P2
**Depends on:** `HARD-011`, `HARD-031`
**Files likely touched:**

- readiness/project picker components
- docs

**Implementation boundary:**

- Explain that paths are WSL/Linux server paths.
- Explain browser may run on Windows while server runs inside WSL.
- Keep WSL proof separate from native Windows proof.

**Done means:**

- WSL users are not asked to pick Windows paths for a Linux server process.

### HARD-040: Electron Click-Through Smoke

**Severity:** P2 validation
**Depends on:** Gate 2 or later
**Files likely touched:**

- `tests/e2e/`
- `package.json`
- smoke scripts
- `docs/reports/SMOKE_TEST_REPORT.md`

**Flow:**

1. Launch Electron.
2. Select project.
3. Start Demo session.
4. Start real session.
5. Send composer follow-up.
6. Handle approval button or terminal fallback.
7. Open transcript inspector.
8. Stop and force stop.
9. Open settings.

**Done means:**

- There is a repeatable Electron UI receipt.

### HARD-041: Built WebGUI Click-Through Smoke

**Severity:** P2 validation
**Depends on:** Gate 2
**Flow:**

1. Run built WebGUI server.
2. Authenticate via tokenized URL.
3. Set server-side project path.
4. Start Demo session.
5. Run mock headless.
6. Start real session where available.
7. Verify browser reveal fallback.
8. Inspect transcript.
9. Open settings.

**Done means:**

- Browser route is validated as a user experience, not only an API route.

### HARD-042: WSL Clean-Room Receipt

**Severity:** P2 validation
**Depends on:** Gate 2 and Gate 4 preferred
**Environment:** User's Windows machine with WSL.

**Scripted checklist:**

1. Install Node >= 20 inside WSL.
2. Clone or copy repo/package into WSL.
3. Run `npm install`.
4. Run `npm run build`.
5. Run `npm run doctor` before Command Code install and save output.
6. Install Command Code.
7. Run `cmd --version`.
8. Run `cmd status --json`.
9. Run `cmd --list-models`.
10. Run `npm run doctor`.
11. Run `npm run smoke:pty`.
12. Run `npm run smoke:browser`.
13. Run `npm run smoke:headless`.
14. Run `npm run serve -- --port 5183 --open`.
15. Open printed URL from Windows browser.
16. Set Linux project path.
17. Start Demo and real sessions.
18. Verify stop/interrupt/force stop.
19. Verify transcript inspection.

**Done means:**

- A dated WSL receipt exists or blocker is documented exactly.

### HARD-043: Linux Runtime/Package Receipt

**Severity:** P2 validation
**Depends on:** Gate 5 setup
**Scope:**

- Linux browser mode.
- Linux Electron/AppImage if packaging is in scope.

**Done means:**

- Linux status is known and documented separately from macOS and WSL.

### HARD-044: Visual Smoke Report

**Severity:** P2 validation/documentation
**Depends on:** `HARD-040`, `HARD-041`
**Files likely touched:**

- `docs/reports/SMOKE_TEST_REPORT.md` or new `docs/reports/VISUAL_SMOKE_REPORT.md`

**Done means:**

- Screenshots or DOM receipts show the app rendering correctly through the core flows.

### HARD-050: Split Renderer App Orchestration

**Severity:** P2 code shape
**Depends on:** tests freezing current App behavior
**Current file:** `src/renderer/src/App.tsx`, audit-reported at 1479 lines.

**Proposed boundaries:**

- `src/renderer/src/app/orchestration/AppOrchestrator.tsx`
- `src/renderer/src/app/views/AppView.tsx`
- `src/renderer/src/app/hooks/useAppPreferences.ts`
- `src/renderer/src/app/hooks/useSessionManager.ts`
- `src/renderer/src/app/hooks/useProjectContext.ts`
- `src/renderer/src/app/hooks/useUpdateChecks.ts`
- `src/renderer/src/app/hooks/useHeadlessJobs.ts`
- `src/renderer/src/app/hooks/useWorkEvents.ts`
- `src/renderer/src/app/hooks/useKeyboardShortcuts.ts`
- `src/renderer/src/app/hooks/useResizeHandlers.ts`

**Safe extraction order:**

1. Add tests for current workspace switching, preference hydration, session start/stop, project change, and resize state.
2. Extract app/project preferences.
3. Extract project context.
4. Extract session manager.
5. Extract update/headless/work-event hooks.
6. Split view from orchestration.

**Done means:**

- `App.tsx` becomes a small composition entry.
- Existing behavior and receipts still pass.

### HARD-051: Split Server Composition

**Severity:** P2 code shape/security
**Depends on:** `HARD-001`, `HARD-002`, `HARD-003`, route contract tests
**Current file:** `src/server/index.ts`, audit-reported at 1584 lines.

**Proposed boundaries:**

- `src/server/auth.ts`
- `src/server/cors.ts`
- `src/server/static.ts`
- `src/server/ws.ts`
- `src/server/routes/sessions.ts`
- `src/server/routes/files.ts`
- `src/server/routes/cli.ts`
- `src/server/routes/git.ts`
- `src/server/routes/discovery.ts`
- `src/server/routes/agents.ts`
- `src/server/routes/mcp.ts`
- `src/server/routes/skills.ts`
- `src/server/routes/memory.ts`
- `src/server/routes/hooks.ts`
- `src/server/routes/preferences.ts`

**Safe extraction order:**

1. Add route contract tests.
2. Extract auth/cors/static.
3. Extract WebSocket handling.
4. Extract routes one domain at a time.
5. Keep `createAppServer()` API stable.

**Done means:**

- Server index is a composition root, not a feature aggregator.

### HARD-052: Split Browser Transport

**Severity:** P2 code shape
**Depends on:** `HARD-010`
**Current file:** `src/renderer/src/browserAdapter.ts`, audit-reported at 454 lines.

**Proposed boundaries:**

- `src/renderer/src/transport/apiClient.ts`
- `src/renderer/src/transport/websocketManager.ts`
- `src/renderer/src/transport/baseTransport.ts`
- `src/renderer/src/transport/browserFallbacks.ts`
- `src/renderer/src/transport/browserTransport.ts`
- `src/renderer/src/transport/electronTransport.ts`

**Done means:**

- Transport is testable by layer and browser/Electron behavior is explicit.

### HARD-053: Shared Transcript Components

**Severity:** P3 code shape/UX consistency
**Depends on:** `HARD-012` or done alongside
**Current files:**

- `src/renderer/src/workspaces/TranscriptWorkspace.tsx`
- `src/renderer/src/inspectors/RightInspectorPanel.tsx`
- `src/renderer/src/settings/AdvancedReadOnlySettings.tsx`

**Proposed boundaries:**

- `TranscriptActions.tsx`
- `TranscriptViewer.tsx`
- `TranscriptTimeline.tsx`
- `TranscriptEntry.tsx`
- `TranscriptArtifactList.tsx`
- `TranscriptFilters.tsx`
- `TranscriptRawDetails.tsx`

**Done means:**

- Transcript/reveal behavior is shared and consistent across workspace, inspector, and settings.

### HARD-054: Split Live Conversation Pane

**Severity:** P3 code shape/continuity
**Depends on:** tests for current parser and UI behavior
**Current file:** `src/renderer/src/components/LiveConversationPane.tsx`, audit-reported at 440 lines.

**Proposed boundaries:**

- `src/renderer/src/services/liveConversationCache.ts`
- `src/renderer/src/services/liveConversationReducer.ts`
- `src/renderer/src/components/LiveConversationEntry.tsx`
- `src/renderer/src/components/LiveConversationActivity.tsx`
- `src/renderer/src/components/LiveConversationArtifact.tsx`
- `src/renderer/src/components/LiveConversationApproval.tsx`

**Done means:**

- Live conversation rendering is split into testable data flow and small presentational components.

### HARD-055: Split Reference Settings Domains

**Severity:** P3 code shape
**Depends on:** component tests for each section
**Current file:** `src/renderer/src/settings/ReferenceSettings.tsx`, audit-reported at 837 lines.

**Proposed boundaries:**

- `KeyboardSettings.tsx`
- `NotificationsSettings.tsx`
- `TerminalSettings.tsx`
- `HooksSettings.tsx`
- thin `ReferenceSettings.tsx`

**Done means:**

- Hooks, notifications, terminal, and keyboard references are independently maintainable.

### HARD-056: Split Core Settings

**Severity:** P3 code shape
**Depends on:** component tests for current controls
**Current file:** `src/renderer/src/settings/CoreSettings.tsx`, audit-reported at 568 lines.

**Proposed boundaries:**

- `ProfileSettings.tsx`
- `AppearanceSettings.tsx`
- `RuntimeSettings.tsx`
- composition `CoreSettings.tsx`

**Done means:**

- Profile, appearance, and runtime settings can evolve independently.

## Recommended Execution Order

1. Gate 0 baseline.
2. `HARD-001`, `HARD-004`, `HARD-005` for immediate safety/docs drift.
3. `HARD-002`, `HARD-003` for containment consistency.
4. `HARD-010`, `HARD-011`, `HARD-012`, `HARD-013` for WebGUI parity.
5. `HARD-020`, `HARD-021`, `HARD-022`, `HARD-023`, `HARD-024` for continuity.
6. `HARD-030`, `HARD-031`, `HARD-032`, `HARD-033` for first-run readiness.
7. `HARD-040`, `HARD-041`, `HARD-044` for visual receipts.
8. `HARD-042`, `HARD-043` for platform receipts.
9. `HARD-050` through `HARD-056` for code-shape hardening, unless a feature task would otherwise add substantial logic to one of those files. In that case, extract the relevant boundary first.

## Validation Matrix

Every implementation batch must report:

| Validation | Required When |
|---|---|
| `npm run typecheck` | Always |
| `npx vitest run` | Always |
| `npm run build` | Always unless docs-only |
| `npm run smoke:browser` | Server, transport, browser, auth, transcript, WebGUI changes |
| `npm run smoke:pty` | PTY/session lifecycle, Electron/session changes |
| `npm run smoke:headless` | Headless, doctor, CLI invocation, permission mode changes |
| `npm run doctor` | CLI, doctor, install/readiness, platform changes |
| Electron UI receipt | Electron UI, native IPC, shared visual components |
| Built WebGUI receipt | Browser/WebGUI UX, transport, project picker, reveal fallback |
| WSL receipt | WSL-specific claim |
| Linux receipt | Linux-specific claim |

## Completion Report Template

Use this template for each phase or batch closeout:

```md
## Hardening Batch Closeout: <Batch / Task IDs>

### Scope

- Tasks completed:
- Files changed:
- Files intentionally not touched:

### Behavior Implemented

- 

### Code Shape

- New modules/components:
- Files reduced/split:
- Files still over ~350 lines and why:

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` |  |  |
| `npx vitest run` |  |  |
| `npm run build` |  |  |
| `npm run smoke:browser` |  |  |
| `npm run smoke:pty` |  |  |
| `npm run smoke:headless` |  |  |
| `npm run doctor` |  |  |
| Electron UI receipt |  |  |
| Built WebGUI receipt |  |  |
| WSL/Linux receipt |  |  |

### Residual Risk

- 

### Follow-Up

- 
```

## Deferred Or Explicitly Separate

- Native Windows first-class support. WSL is the preferred Windows path for this sprint.
- Cloud-hosted GUI or remote file access.
- Auto-installing Command Code without explicit operator approval.
- Marketplace/plugin work.
- Replacing Command Code model, permission, taste, checkpoint, or IDE semantics.
