# Command Code GUI V1 Roadmap

Status: active execution contract after v0 hardening closeout on 2026-06-06.

This roadmap is derived from `docs/roadmaps/v1/LLM_SUGGESTION_MATRIX.md`. It became active after the v0 roadmap and hardening gate were closed on 2026-06-06.

## How To Use This Roadmap

Each phase should be treated as a bounded implementation package. Before starting a phase, confirm the current code and docs still match the assumptions here. After completing a phase, update this roadmap, `docs/architecture/V1_ARCHITECTURE.md`, and any relevant user-facing docs so `planned`, `implemented`, `validated`, and `deferred` remain separate.

For implementation work:

- Prefer one branch per phase unless a phase is intentionally split into independent work packages.
- Keep UI work, transport work, config persistence, and test work separated enough that reviewers can reason about each layer.
- Do not let renderer components gain broad shell or filesystem capability.
- Use Command Code documented commands and config as the source of truth.
- Do not infer runtime semantics from terminal text unless the feature is explicitly marked best-effort.
- Preserve mock mode while adding real CLI behavior.
- For every write path, show scope, destination path, and owner before committing the write.

## Continuous Goal Orchestration

V1 can run as a longer continuous Codex goal. It should not run as one giant undifferentiated edit. Treat each phase as a package and each package as a sequence of small validation loops:

```text
preflight -> implement slice -> verify -> update roadmap/docs -> git commit -> continue
```

The coordinating agent should keep going through safe packages without asking the operator to restart the run, but it must stop and report before crossing into a package that changes runtime truth, config write boundaries, or upstream-owned Command Code semantics without proof.

Recommended continuous-run order:

1. Finish Phase 1 renderer architecture extraction.
2. Add Phase 10 validation scaffolding early and keep it current during implementation.
3. Complete Phase 2 Settings Center.
4. Start Phase 3 Hooks and Notifications only after Settings ownership is proven.
5. Complete Phase 4 Models and Session Identity.
6. Complete Phase 5 Workflow Helpers.
7. Complete Phase 6 MCP and Integrations.
8. Complete Phase 7 Agents, Skills, Memory, and Taste.
9. Complete Phase 8 Transcript, Artifacts, and Multi-Session Workbench.
10. Complete Phase 9 Native Workbench Polish.
11. Finish Phase 10 closeout docs, reports, and contributor guidance.

The best initial long run is:

- Finish Phase 1.
- Add the Phase 10 validation template/receipt pattern.
- Complete Phase 2 read-only/settings-architecture work.
- Stop before Phase 3 write-capable hook and notification readiness mutation unless Settings is validated and committed.

Packages that can run back-to-back after validation:

- Phase 1 extraction slices.
- Phase 1 hooks that only move existing renderer coordination without changing behavior.
- Phase 2 settings registry/search.
- Phase 2 read-only AdvancedPanel migration.
- Phase 3 hook parser/config tests.
- Phase 4 per-session model metadata tests and UI labels.
- Phase 5 command registry and palette search.
- Phase 6 MCP command builders/parsers.
- Phase 7 discovery modules.
- Phase 8 transcript parser and artifact detector tests.
- Phase 10 docs/index/report updates.

Packages that require a hard internal gate before continuing:

- Session lifecycle/readiness state.
- Any config write path.
- MCP add/edit/remove/auth-clear mutation flows.
- Agent, memory, taste, or skill editors.
- File/artifact preview reads.
- Response-ready notifications.
- Terminal/session restoration changes.
- Shared settings persistence.
- CSS token/theme rewrites.

## Package Validation And Git Gates

Every package must leave durable version-control evidence. A package is not complete until it has a commit, unless it is intentionally abandoned and reverted or explicitly left as a named WIP with failing receipts.

Preflight gate:

- Run `git status --short --branch`.
- Identify unrelated user changes and do not overwrite them.
- Read the phase scope and acceptance section before edits.
- Confirm whether the package touches runtime truth, write paths, transport, session lifecycle, or only presentation.

Implementation gate:

- Keep each package to one coherent ownership boundary.
- Avoid mixing behavior changes with architecture-only extraction when practical.
- Keep renderer transport calls behind typed interfaces.
- Keep CLI argument building and config parsing in pure, testable functions.

Verification gate:

- Always run `npm run typecheck`.
- Run `npx vitest run` for parser, transport, config, session, or shared helper changes.
- Run `npm run build` before committing renderer, server, main-process, or packaging changes.
- Run `npm run smoke:browser` after browser transport, auth, mock, or session UI changes.
- Run `npm run smoke:headless` when headless or command-builder behavior changes.
- Run `npm run smoke:pty` when PTY/session lifecycle behavior changes.
- Verify Browser and Electron route receipts when UI layout, session workbench, settings navigation, or inspector behavior changes.
- If a real CLI path is not tested, mark it explicitly untested in the package note before committing.

Documentation gate:

- Update this roadmap after each package with `implemented`, `validated`, `blocked`, `deferred`, and `planned` kept separate.
- Update `docs/architecture/V1_ARCHITECTURE.md` when module ownership or layering changes.
- Update user-facing docs only when behavior, setup, CLI usage, security boundaries, or validation expectations change.
- Use `docs/reports/V1_VALIDATION_TEMPLATE.md` as the receipt scaffold for each V1 package.

Git commit gate:

- Run `git diff --check`.
- Review `git diff --stat` and make sure the package did not absorb unrelated edits.
- Stage only the files that belong to the package, unless the operator explicitly asks to commit the whole worktree.
- Commit after each validated package with a message that names the package, for example `refactor: extract renderer inspector modules` or `feat: add settings registry`.
- Do not continue to the next package after a green validation gate without committing the completed package first.
- Push after a phase is complete, after any security/runtime boundary change, or when the operator asks for a remote checkpoint.
- If validation fails, do not create a normal completion commit. Either fix and re-verify, or create an explicit WIP commit only if the operator asked for a checkpoint with known failures.

## Gate: Finish V0 First

V1 may start. The current v0 roadmap and hardening gate are closed in the current worktree.

V0 closeout receipts:

- `ROADMAP.md` marks v0 hardening closed.
- `docs/reports/HARDENING_GATE.md` marks no v0 P0 item open.
- Real PTY, mock mode, headless runs, transcript replay, auth display, scoped file writes, browser mode, Electron mode, and runtime receipts are validated or explicitly deferred.
- Multi-session terminal state no longer shares prompt-detection state across tab switches.
- Response-ready byte-length notifications are disabled for v0; V1 must add explicit readiness state before reintroducing them.
- `docs/reports/SMOKE_TEST_REPORT.md` reflects current verified behavior.

V0-to-v1 handoff artifacts:

- Updated `ROADMAP.md` with v0 closed, deferred, and v1-ready items.
- Updated `docs/reports/HARDENING_GATE.md` with pass/fail evidence.
- Updated `docs/reports/SMOKE_TEST_REPORT.md`.
- Current `npm run typecheck`, `npm run build`, `npx vitest run`, and smoke command receipts.
- Browser/Electron equivalent runtime receipts for real and mock paths.

## V1 Principles

### Runtime Ownership

Command Code remains the engine and source of execution truth. The GUI owns the desktop shell, PTY lifecycle, session display, operator controls, local preferences, and documented config editing. The GUI does not own model semantics, tool permission semantics, taste internals, checkpoint internals, IDE internals, or private Command Code APIs.

Implementation requirements:

- Use documented CLI commands and config paths.
- Preview commands before mutation when invoking advanced workflows.
- Keep all runtime claims tied to a receipt: command, file, config path, status response, or transcript.
- Mark unverified upstream behavior as experimental or blocked.

### Human-Readable Code Layers

V1 should make the repo easier for a growing community to extend. Feature work should reduce the `App.tsx` burden, not add to it.

Implementation requirements:

- Keep presentation components focused on layout and interaction.
- Move coordination into hooks, stores, typed services, or small controller modules.
- Keep CLI argument building and config parsing in pure testable functions.
- Keep renderer IPC and browser transport interfaces narrow and typed.
- Avoid hidden prompt mutation or terminal-output scraping in UI components.

### Native Workbench Feel

The app should feel like a cohesive desktop workbench, not a set of modal tools around a terminal.

Implementation requirements:

- Prefer settings sections, inspectors, contextual panels, and command helpers over generic modals.
- Keep active session state, model identity, permission mode, and runtime health visible.
- Make generated artifacts easy to inspect without leaving the session.
- Use restrained motion and clear layout transitions to orient the operator.

### Extensible Capability Layers

V1 should prepare extension points for deeper workflows without making every advanced feature a core app dependency. Visual design mode, preferred vision-model routing, notification recipes, and local model adapters should be able to grow as plugins or capability packs after the core settings/session/workbench layers are stable.

Implementation requirements:

- Keep optional capabilities discoverable through Settings and the command palette.
- Show install state, minimum requirements, config paths, health checks, and disable/uninstall controls for plugin-like capabilities.
- Do not silently mutate Command Code config or local runtime files during setup.
- Keep plugin surfaces integrated with local docs, right-inspector receipts, and command previews.
- Treat heavy local dependencies, GPU requirements, Python environments, voice transcription, DOM capture, and screenshot storage as explicit requirements.

### Explicit Write Boundaries

Any surface that edits files or config must show exactly what it will touch.

Implementation requirements:

- Display project/global/user scope.
- Display destination path.
- Display whether the file is GUI-owned, project-owned, global config, or runtime-owned.
- Deny writes outside allowlisted roots.
- Preserve symlink, binary, size, and root-boundary protections from v0.

### Validation Before Claims

V1 items are not complete because code was merged. They are complete when code, tests, docs, and runtime proof agree.

Implementation requirements:

- TypeScript passes.
- Mock mode still works.
- Real CLI path is smoke-tested or explicitly marked untested.
- Browser and Electron behavior are both checked when the feature touches runtime UI.
- Docs state exactly what is implemented versus planned.

## Phase 1: Renderer Architecture Foundation

Goal: make v1 feature work cheap to add without expanding the current renderer monolith.

Status on 2026-06-06: complete and validated. The renderer architecture foundation is split into presentation modules for shell layout, home, session, transcript, settings, right inspector, popovers, release notes, and command metadata. Runtime health, session lifecycle, app preference, and project preference hook extractions remain deferred behind their hard gates because they affect runtime truth, transport/session lifecycle, or shared settings persistence.

Phase closeout validation receipts on 2026-06-06:

- `npm run typecheck`
- `npx vitest run` -> `41/41`
- `npm run build`
- `npm run smoke:browser`
- `npm run smoke:pty`
- `npm run smoke:headless`
- Latest built browser route token proof at `http://127.0.0.1:5192/`
- Latest Electron dev startup with embedded app server `http://127.0.0.1:61897`

First behavior-preserving extraction slice moved shared renderer view types to `src/renderer/src/appTypes.ts`, transcript UI to `src/renderer/src/workspaces/TranscriptWorkspace.tsx`, and the right inspector/environment panel to `src/renderer/src/inspectors/RightInspectorPanel.tsx`. Validation receipts for that slice: `npm run typecheck`, `npm run build`, `npx vitest run`, `npm run smoke:browser`, `npm run smoke:headless`, `npm run smoke:pty`, a real interactive `POST /api/sessions` receipt with `mock=false`, Browser route receipt at `http://127.0.0.1:5186/`, and Electron dev startup receipt.

Second behavior-preserving extraction slice moved shell chrome, sidebar navigation, settings navigation rows, sidebar resize CSS variables, and update/footer controls into `src/renderer/src/layout/ShellLayout.tsx`. `App.tsx` still owns state coordination, transport calls, runtime mode changes, project preference persistence, and session lifecycle. Validation receipts for this slice: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5186/`, and Electron dev startup with embedded app server `http://127.0.0.1:60751`. Screenshot automation remains not run because Playwright is not installed in this project.

Third behavior-preserving extraction slice moved the shared composer presentation to `src/renderer/src/components/ComposerBar.tsx` and the home workspace presentation to `src/renderer/src/workspaces/HomeWorkspace.tsx`. `App.tsx` still owns prompt state, plan-mode behavior, popover routing, and session start submission. Validation receipts for this slice: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5187/`, and Electron dev startup with embedded app server `http://127.0.0.1:60942`. Screenshot automation remains not run because Playwright is not installed in this project.

Fourth behavior-preserving extraction slice moved active session workbench presentation, tab/terminal layout, bottom terminal presentation, and workbench tool rail into `src/renderer/src/workspaces/SessionWorkspace.tsx`. `App.tsx` still owns transport calls, session lifecycle callbacks, terminal input state, stop ladder behavior, bottom-terminal shell session lifecycle, and right-inspector selection. Validation receipts for this slice: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5188/`, and Electron dev startup with embedded app server `http://127.0.0.1:61091`. Screenshot automation remains not run because Playwright is not installed in this project.

Fifth behavior-preserving extraction slice moved settings workspace presentation to `src/renderer/src/workspaces/SettingsWorkspace.tsx` without adding Phase 2 settings expansion. `App.tsx` still owns app/project preference hydration and persistence, settings section selection, and all existing setter callbacks. Validation receipts for this slice: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5189/`, and Electron dev startup with embedded app server `http://127.0.0.1:61272`. Screenshot automation remains not run because Playwright is not installed in this project.

Sixth behavior-preserving extraction slice moved native project/runtime/model/slash popover presentation to `src/renderer/src/components/AppPopovers.tsx`, moved release-note presentation to `src/renderer/src/components/ReleaseNotesModal.tsx`, and added a shared `ReleaseNote` type in `src/renderer/src/appTypes.ts`. `App.tsx` still owns command palette items, command execution, release-note state, update checks, and all popover state transitions. Validation receipts for this slice: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5190/`, and Electron dev startup with embedded app server `http://127.0.0.1:61482`. Screenshot automation remains not run because Playwright is not installed in this project.

Seventh behavior-preserving extraction slice moved command palette/release-note constants to `src/renderer/src/commandPalette.ts` and moved outside-click/Escape popover dismissal to `src/renderer/src/hooks/useDismissiblePopover.ts`. Runtime health, session lifecycle, app preference, and project preference hooks are intentionally deferred because those packages affect runtime truth or shared settings persistence and require a hard internal gate. Validation receipts for this slice: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5191/`, and Electron dev startup with embedded app server `http://127.0.0.1:61625`. Screenshot automation remains not run because Playwright is not installed in this project.

Dead UI path audit and cleanup are documented in `docs/reports/PHASE1_DEAD_UI_AUDIT.md`. The cleanup removed unreferenced legacy presentation components, the unreachable `mode` popover branch, and stale `.control-panel`, `.quick-command-list`, `.mode-rail`, and `.mode-popover` CSS. Validation receipts for cleanup: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5192/`, and Electron dev startup with embedded app server `http://127.0.0.1:61897`.

Remaining Phase 1 package order:

1. Extract shell layout and sidebar without changing navigation behavior. Implemented and validated in the second extraction slice.
2. Extract home workspace and composer presentation. Implemented and validated in the third extraction slice.
3. Extract session workspace and workbench tool rail while preserving `TerminalPane` behavior. Implemented and validated in the fourth extraction slice.
4. Extract settings workspace presentation without starting Phase 2 settings expansion. Implemented and validated in the fifth extraction slice.
5. Extract command palette, popovers, and release notes. Implemented and validated in the sixth and seventh extraction slices.
6. Move session, runtime health, app preference, project preference, and command palette coordination into scoped hooks only where this reduces `App.tsx` ownership. Command constants and popover dismissal are implemented and validated; session lifecycle, runtime health, and preference persistence hooks are deferred behind their hard gates.
7. Audit dead UI paths and document before removal. Implemented in `docs/reports/PHASE1_DEAD_UI_AUDIT.md`; documented cleanup is complete.
8. Start CSS separation only after component ownership is clear. Started with stale selector cleanup tied to the dead UI audit; broader CSS module/token separation remains planned and should not be mixed with Phase 2 settings expansion.

### Scope

- Split `src/renderer/src/App.tsx` into clear feature modules.
- Extract shell layout, sidebar, home workspace, session workspace, transcript workspace, settings workspace, right inspector, command palette, popovers, release notes, and workflow helpers.
- Introduce hooks or scoped context providers for sessions, runtime health, preferences, projects, command palette, config surfaces, and notifications.
- Keep transport calls behind typed interfaces.
- Keep CLI command/argument assembly in pure functions.
- Audit dead UI paths such as legacy quick-command surfaces.
- Start breaking monolithic CSS into component, feature, or token layers.

### Likely Impacted Files

- `src/renderer/src/App.tsx`
- `src/renderer/src/components/*`
- `src/renderer/src/browserAdapter.ts`
- `src/renderer/src/transport.ts` or equivalent transport interfaces
- `src/renderer/src/styles.css`
- `src/shared/types.ts`
- `tests/*`
- `docs/architecture/V1_ARCHITECTURE.md`

Likely new files:

- `src/renderer/src/workspaces/HomeWorkspace.tsx`
- `src/renderer/src/workspaces/SessionWorkspace.tsx`
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx`
- `src/renderer/src/workspaces/SettingsWorkspace.tsx`
- `src/renderer/src/layout/ShellLayout.tsx`
- `src/renderer/src/hooks/useSessions.ts`
- `src/renderer/src/hooks/useRuntimeHealth.ts`
- `src/renderer/src/hooks/useAppPreferences.ts`
- `src/renderer/src/hooks/useCommandPalette.ts`
- `src/renderer/src/services/*`

### Tests And Proof

- `npm run typecheck`
- `npm run build`
- `npx vitest run`
- Existing mock interactive session still starts and streams.
- Existing real session path is smoke-tested or marked untested.
- Browser/Electron screenshots confirm no visible regression in home, session, transcript, and settings routes.

### Operational Cleanliness

- Do not change behavior and architecture in the same commit when avoidable.
- Prefer extraction commits that preserve output and tests.
- Keep deleted/deprecated components documented until removed.
- Avoid broad renames that make diff review impossible.
- Do not move IPC or filesystem capability closer to renderer components.

### Agent Parallelization

Parallel-friendly:

- One agent can inventory current `App.tsx` state ownership and propose module boundaries.
- One agent can audit component/CSS dead code.
- One agent can add tests around existing pure helpers before extraction.

Sequential:

- Actual `App.tsx` extraction should be sequenced through one coordinating agent to avoid conflicting imports and state ownership.
- Transport/interface changes must happen before feature modules rely on them.
- CSS modularization should follow component extraction, not precede it blindly.

### Acceptance

- `App.tsx` is no longer the primary owner of every surface.
- Existing features still work in mock mode.
- No broader renderer shell or filesystem IPC is added.
- The architecture doc matches the new layering.

## Phase 2: Settings Center

Goal: turn Settings into the app's natural configuration center.

Status on 2026-06-06: complete and validated for the current V1 contract. Settings is now the primary configuration path, the generic Advanced modal has been removed, editable Settings actions show ownership/destination before writes, and remaining risky/destructive or upstream-owned actions are explicitly planned, gated, blocked, or deferred.

First read-only settings architecture package added `src/renderer/src/settings/settingsRegistry.tsx`, expanded the settings section taxonomy, replaced the settings search placeholder with real registry filtering, and added read-only placeholder pages for new Phase 2 sections. This package did not add config writes, persistence changes, server routes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `41/41`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5193/`, and Electron dev startup with embedded app server `http://127.0.0.1:62462`.

Second read-only package added Settings-hosted views for Project state, MCP, Agents, Skills, Memory, and Taste via `src/renderer/src/settings/AdvancedReadOnlySettings.tsx`. The Advanced modal remains available, and no connect/disconnect/edit/save actions were migrated. This package did not add config writes, persistence changes, server routes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `41/41`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5194/`, and Electron dev startup with embedded app server `http://127.0.0.1:62843`.

Third read-only package added reference pages for Keyboard, Notifications, Terminal, Models, Design, Hooks, and About via `src/renderer/src/settings/ReferenceSettings.tsx`. These pages expose current shortcuts, existing notification/terminal boundaries, model/design/hook entry points, and update visibility without adding preference writes, server routes, or Command Code config mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `41/41`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5195/`, and Electron dev startup with embedded app server `http://127.0.0.1:63129`.

Fourth presentation package extracted existing Profile, General, Runtime, Appearance, Usage, Integrations, and Advanced settings pages into `src/renderer/src/settings/CoreSettings.tsx`. Existing callbacks and persistence behavior remain at the prior ownership boundary; this package did not add config writes, persistence changes, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `41/41`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5196/`, and Electron dev startup with embedded app server `http://127.0.0.1:63392`.

Fifth presentation package extracted Settings section routing, shared section frames, and placeholder fallback into `src/renderer/src/settings/SettingsRoutes.tsx`, leaving `SettingsWorkspace` as the shell container. The same package removed stale headless settings props from `SettingsWorkspace`; headless preference behavior remains owned by the existing command popover and app preference path. This package did not add config writes, persistence changes, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `41/41`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5197/`, and Electron dev startup with embedded app server `http://127.0.0.1:63628`.

Sixth gate package added `docs/reports/SETTINGS_PERSISTENCE_GATE.md` to define GUI-owned preference files, Command Code-owned `settings.json` scope, and write gates required before editable Settings sections expand. It also added project GUI preference route coverage to `tests/server-security.test.ts` for invalid project paths and sanitized temp-project writes. This package did not add config writes, persistence fields, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, and `npm run build`.

Seventh read-only package replaced the placeholder Integrations page with a Settings hub that routes to existing MCP, Hooks, Agents, Skills, Design, Memory, and Taste sections and keeps local/CLI docs links visible. It did not add connect, edit, save, auth, config mutation, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5198/`, and Electron dev startup with embedded app server `http://127.0.0.1:64131`.

Eighth read-only package made Profile an actionable Settings dashboard by adding shortcut tiles to General, Runtime, Usage, Project state, and Integrations while preserving its local runtime receipts. It did not add config writes, persistence fields, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5199/`, and Electron dev startup with embedded app server `http://127.0.0.1:64302`.

Ninth gate package added `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md` to record Settings replacement coverage for AdvancedPanel tabs and the advanced-only actions that still block removal: session resume/reveal, agent writes, memory writes, and MCP connect/disconnect. This package did not change runtime behavior, renderer IPC, server routes, config writes, persistence fields, transport/session lifecycle, or Command Code settings mutation. Validation receipt: `npm run typecheck`.

Tenth presentation package added visible GUI preference destination labels to existing editable Settings controls in General, Runtime, and Appearance. The labels name the app and project GUI preference paths for command binary, onboarding, permissions, trust, model, project model routing, and appearance. This package did not add config writes, persistence fields, server routes, renderer IPC expansion, runtime/session changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5201/`, and Electron dev startup with embedded app server `http://127.0.0.1:64697`.

Eleventh read-only package added the existing Command Code usage summary refresh to Settings Usage alongside local headless history. It reuses the existing `transport.usage(commandExecutable, cwd)` capability and does not add server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5202/`, and Electron dev startup with embedded app server `http://127.0.0.1:64883`.

Twelfth read-only package added expandable skill content previews to Settings Skills using the existing `transport.listSkills()` payload. Insert/use actions remain planned behind command-preview work. This package did not add server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5203/`, and Electron dev startup with embedded app server `http://127.0.0.1:65069`.

Thirteenth read-only package added a Sessions Settings section backed by the existing `transport.discoverSessions(cwd)` capability. Settings now shows discovered sessions and transcript paths without resume or reveal actions. Resume and reveal remain blocked in `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md` because they affect session lifecycle and file access. This package did not add server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, file reveal actions, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5204/`, and Electron dev startup with embedded app server `http://127.0.0.1:65255`.

Fourteenth read-only package added MCP connect/disconnect command previews to Settings MCP using the existing Command Code command shape (`<command> mcp connect|disconnect <server>`). Actual connect/disconnect execution remains in Advanced because it mutates external MCP state. This package did not add server routes, renderer IPC expansion, config writes, persistence fields, transport/session lifecycle changes, MCP actions, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `48/48`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5205/`, and Electron dev startup with embedded app server `http://127.0.0.1:65482`.

Fifteenth renderer-local preferences package added an editable Notifications Settings page for the existing GUI toast/audio categories and moved preference parsing/storage into `src/renderer/src/settings/notificationPreferences.ts`. These preferences persist in browser `localStorage` keys `ccgui.toast-preferences` and `ccgui.audio-preferences`; OS notifications, hook-triggered alerts, quiet mode, and per-session readiness remain planned. This package did not add server routes, renderer IPC expansion, file-backed config writes, transport/session lifecycle changes, notification readiness inference, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `52/52`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5206/`, and Electron dev startup with embedded app server `http://127.0.0.1:49423`.

Sixteenth renderer-local preferences package added an editable Terminal Settings page for xterm font size, line height, scrollback, and cursor blink, and moved terminal preference parsing/storage into `src/renderer/src/settings/terminalPreferences.ts`. `TerminalPane` reads these preferences when panes mount. This package did not add server routes, renderer IPC expansion, file-backed config writes, PTY/session lifecycle changes, live terminal geometry mutation, shell selection, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `55/55`, `npm run build`, `npm run smoke:browser`, `npm run smoke:pty`, built browser route token proof at `http://127.0.0.1:5207/`, and Electron dev startup with embedded app server `http://127.0.0.1:49602`.

Seventeenth presentation package added bundled release-note history to Settings About using the existing `releaseNotes` metadata in `src/renderer/src/commandPalette.ts`. This package did not run update checks, change release-note dismissal state, add persistence fields, add server routes, expand renderer IPC, change runtime/session lifecycle, or mutate Command Code settings. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5208/`, and Electron dev startup with embedded app server `http://127.0.0.1:49748`.

Eighteenth presentation package expanded Settings Keyboard with grouped shortcut references and command examples from the existing command palette metadata, and added visible accelerator hints to the existing New Session, Send, and Menu Input controls. This package did not add shortcut remapping, persistence fields, server routes, renderer IPC expansion, runtime/session lifecycle changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5209/`, and Electron dev startup with embedded app server `http://127.0.0.1:49905`.

Nineteenth app-preference package added `startupProjectBehavior` to app GUI preferences and Settings General. Operators can choose whether app preference hydration restores the last selected project or opens without a selected project. This package updated server sanitization and app preference boundary tests, but did not add automatic session start/resume, window restore, renderer IPC expansion, Command Code settings mutation, or runtime/session lifecycle changes. Validation receipts: `npm run typecheck`, `npx vitest run` -> `56/56`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5210/`, and Electron dev startup with embedded app server `http://127.0.0.1:50069`.

Twentieth read-only gate package added `docs/reports/DATA_CONTROLS_GATE.md` and a Settings Data controls gate card. Data now names transcript deletion, cache clearing, preference reset, export, and import as blocked or planned actions with required path, scope, preview, confirmation, and validation boundaries. This package did not add file delete/write/export/import routes, renderer IPC expansion, Command Code settings mutation, or runtime/session lifecycle changes. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5211/`, and Electron dev startup with embedded app server `http://127.0.0.1:50208`.

Twenty-first session-action package added project-session Resume and transcript Reveal actions to Settings Sessions using existing `resumeProjectSession` and `transport.revealTranscript` paths. This removes session resume/reveal from the remaining Advanced-only blockers without adding new renderer IPC, server routes, transcript scraping, terminal-output inference, or Command Code settings mutation. Automated smoke covered build, browser transport, and PTY health; direct real CLI resume/reveal click-through was not run in this package. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, `npm run smoke:pty`, built browser route token proof at `http://127.0.0.1:5212/`, and Electron dev startup with embedded app server `http://127.0.0.1:50338`.

Twenty-second MCP action package added Settings MCP connect/disconnect execution using existing `transport.mcpAction(commandExecutable, action, serverName)` and the already visible `cmd mcp connect|disconnect <server>` command previews. This removes MCP connect/disconnect from the remaining Advanced-only blockers without adding renderer IPC, server routes, hidden config writes, or Command Code settings mutation. Automated smoke covered build and browser transport; real MCP connect/disconnect click-through was not run to avoid mutating an unknown server. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5213/`, and Electron dev startup with embedded app server `http://127.0.0.1:50499`.

Twenty-third agent-write package added Settings Agents edit/save using existing `transport.saveAgent(agentPath, content, cwd)`. Settings shows the destination path before save and server validation keeps writes under the selected project `.commandcode/agents/` root. This removes agent writes from the remaining Advanced-only blockers without adding renderer IPC, new server routes, or Command Code settings mutation. Automated tests covered the existing agent path boundary; direct Settings agent save click-through was not run in this package. Validation receipts: `npm run typecheck`, `npx vitest run` -> `56/56`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5214/`, and Electron dev startup with embedded app server `http://127.0.0.1:50660`.

Twenty-fourth memory-write package added Settings Memory edit/save using existing `transport.saveMemory(filePath, content, cwd)`. Settings shows the destination path before save and server validation keeps writes under the selected project root to `COMMANDCODE.md`, `AGENTS.md`, `CLAUDE.md`, or `.commandcode/memory/`. This removes memory writes from the remaining Advanced-only blockers without adding renderer IPC, new server routes, or Command Code settings mutation. Automated tests covered the existing memory path boundary; direct Settings memory save click-through was not run in this package. Validation receipts: `npm run typecheck`, `npx vitest run` -> `56/56`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5215/`, in-app Browser route load for authenticated `Command Code` shell, and Electron dev startup with embedded app server `http://127.0.0.1:50919`.

Twenty-fifth agent-boundary package aligned Settings agent discovery with the project-scoped save route. `/api/agents/list` now accepts `cwd`, includes agents from `<project>/.commandcode/agents/`, marks project agents editable, and marks user/global agents read-only. This fixes the prior mismatch where Settings could list user/global agent files while the server save route correctly rejected those paths. No new renderer IPC, new save route, hidden config write, or Command Code settings mutation was added. Validation receipts: `npm run typecheck`, `npx vitest run` -> `57/57`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5216/`, in-app Browser route load for authenticated `Command Code` shell, and Electron dev startup with embedded app server `http://127.0.0.1:51274`.

Twenty-sixth Advanced Settings hub package replaced the Settings Advanced page's generic `Open Advanced tools` modal launcher with explicit Settings navigation to Project state, Sessions, Usage, MCP, Agents, Skills, Memory, and Taste. This moves diagnostics and scoped project tools into Settings as first-class routes while leaving the legacy Advanced modal available outside Settings until `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md` is closed. No renderer IPC, server routes, config writes, file access changes, transport/session lifecycle changes, or Command Code settings mutation was added. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5217/`, in-app Browser click-through to Settings Advanced showing `Diagnostics and scoped tools` and no `Open Advanced tools`, and Electron dev startup with embedded app server `http://127.0.0.1:51469`.

Twenty-seventh validation package exercised direct Settings write click-throughs for Agents and Memory against an isolated temporary `HOME` and temporary project served from `http://127.0.0.1:5218/`. The in-app Browser loaded the temp project, opened Settings Agents through Settings search, edited `.commandcode/agents/clickthrough-agent.md`, clicked Save, observed the Settings saved state, and verified the updated content on disk. The same run opened Settings Memory, edited `AGENTS.md`, clicked Save memory, observed `Saved memory file.`, and verified the updated content on disk. The fixture was removed after the receipt. This package did not exercise Settings Sessions resume/reveal or real MCP connect/disconnect, and it did not change runtime behavior. Validation receipt: `npm run typecheck`.

Twenty-eighth validation package exercised Settings Sessions reveal/resume click-through against an isolated temporary `HOME` and temporary project served from `http://127.0.0.1:5219/`. The fixture created a project transcript under the Command Code project transcript store, loaded Settings Sessions through Settings search, observed the project transcript, clicked Reveal, and verified the Sessions page remained intact in the browser adapter. It then clicked Resume and observed `Real session started` from the UI while scoped to the temp project; the isolated server was stopped immediately afterward and the fixture was removed. This package did not exercise real MCP connect/disconnect, and it did not change app code. Validation receipt: `npm run typecheck`.

Twenty-ninth MCP validation package fixed MCP status parsing so `disconnected` is not misclassified as `connected`, added a temp-executable regression test for `listMcp` and `mcpAction`, and exercised Settings MCP Connect/Disconnect against a fake local Command Code executable served from an isolated temporary `HOME` and temporary project at `http://127.0.0.1:5220/`. The in-app Browser opened Settings MCP, observed the fake `fixture` server as `disconnected`, clicked Connect and observed `fixture: ok - fixture: connect` plus `connected`, clicked Disconnect and observed `fixture: ok - fixture: disconnect` plus `disconnected`, then verified the temp state file and removed the fixture. No real external MCP server was mutated. Validation receipts: `npm run typecheck`, `npx vitest run` -> `58/58`, `npm run build`, and `npm run smoke:browser`.

Thirtieth AdvancedPanel removal package deleted `src/renderer/src/components/AdvancedPanel.tsx`, removed its modal launch state, removed the Runtime popover's generic Advanced launcher, removed the dead right-inspector `advanced` mode, and dropped modal-only CSS while preserving the Settings Advanced diagnostics hub. This package did not add renderer IPC, server routes, config writes, file access changes, transport/session lifecycle changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `58/58`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5221/`, in-app Browser click-through to Settings Advanced showing `Diagnostics and scoped tools` with no `Open Advanced tools`, and Electron dev startup with embedded app server `http://127.0.0.1:52429`.

Thirty-first Phase 2 closeout package updated the roadmap and architecture status after revalidating the Settings Center contract. It did not change renderer, server, IPC, config, transport, session lifecycle, file access, or Command Code settings behavior. Validation receipts: `npm run typecheck`, `npx vitest run` -> `58/58`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5222/` with assets `index-lfU4Ropg.js` and `index-BE4-R85S.css`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:52655`.

### Scope

- Fold AdvancedPanel content into Settings as first-class sections. Implemented; the legacy AdvancedPanel modal has been removed after Settings replacement receipts landed.
- Add or complete sections: General, Runtime, Models, Hooks, MCP, Agents, Skills, Design, Memory, Taste, Notifications, Terminal, Keyboard, Data, About, and Advanced Diagnostics.
- Implement real settings search or remove the placeholder until search exists.
- Populate Integrations with actual integration management or remove the dead section. Implemented as a useful Settings hub with routes to MCP, Hooks, Agents, Skills, Design, Memory, and Taste; write-capable integration management remains gated.
- Redesign Profile into an actionable dashboard or collapse it into General. Implemented as a dashboard with shortcuts to active Settings sections and runtime receipts.
- Add terminal settings for font size, scrollback, bell, cursor, line height, history, and profile where supported. Renderer-local font size, line height, scrollback, and cursor blink controls are implemented; bell behavior, profiles, history controls, and live PTY geometry updates remain planned.
- Add notification settings for toast/audio categories, quiet mode, per-session readiness, hook-triggered alerts, and volume. Existing GUI toast/audio category and volume controls are implemented through renderer-local preferences; OS notifications, quiet mode, hook-triggered alerts, and readiness remain planned.
- Add keyboard shortcut reference and visible accelerator hints. Keyboard now shows grouped shortcuts and command examples, and existing New Session, Send, and Menu Input controls show accelerator hints; shortcut remapping remains planned.
- Add startup behavior settings: default project, window restore, startup session behavior. Startup project behavior is implemented as an app GUI preference; window restore and automatic session start/resume remain planned.
- Add data controls: transcript deletion, cache clearing, preference reset, export/import. Data now has a read-only controls gate; destructive and file-producing actions remain blocked until scoped routes and path validation tests exist.
- Add About/version/release-history/update visibility. About now shows update state plus bundled release-note history; update checks remain user-triggered by existing controls.
- Add loading states and undo/revert affordances for editable settings where appropriate. Existing editable Settings controls now show destination labels; future write-capable sections remain gated by `docs/reports/SETTINGS_PERSISTENCE_GATE.md`.

### Likely Impacted Files

- `src/renderer/src/App.tsx`
- `src/renderer/src/components/SettingsPanel.tsx` or equivalent
- `src/renderer/src/settings/AdvancedReadOnlySettings.tsx`
- `src/renderer/src/components/ToastSystem.tsx`
- `src/renderer/src/components/UsageDashboard.tsx`
- `src/renderer/src/components/AuthCard.tsx`
- `src/renderer/src/components/ModelDropdown.tsx`
- `src/renderer/src/components/*Settings*.tsx`
- `src/renderer/src/styles.css`
- `src/shared/types.ts`
- `src/server/index.ts` for config read/write endpoints if needed
- `docs/reference/command-code-docs/README.md`
- `docs/architecture/V1_ARCHITECTURE.md`

Likely new files:

- `src/renderer/src/settings/SettingsWorkspace.tsx`
- `src/renderer/src/settings/settingsRegistry.ts`
- `src/renderer/src/settings/SettingsSearch.tsx`
- `src/renderer/src/settings/NotificationsSettings.tsx`
- `src/renderer/src/settings/TerminalSettings.tsx`
- `src/renderer/src/settings/KeyboardSettings.tsx`
- `src/renderer/src/settings/DataSettings.tsx`

### Tests And Proof

- Settings search filters sections and visible rows.
- Settings navigation reaches every formerly advanced section.
- Settings Advanced routes to explicit diagnostics sections instead of opening the generic Advanced modal.
- Settings Sessions includes project-session resume and transcript reveal actions; direct reveal/resume click-through is validated against an isolated temp project transcript.
- Settings MCP includes connect/disconnect execution with visible command previews; direct Settings MCP action click-through is validated against a fake local Command Code executable and no real external MCP server was mutated.
- Settings Agents includes project-scoped discovery and edit/save with visible destination paths; server tests cover that listed project agents use the same scoped root as the save route, and direct Settings save click-through is validated against an isolated temp project.
- Settings Memory includes project-scoped edit/save with visible destination paths; direct Settings save click-through is validated against an isolated temp project.
- Renderer-local toast/audio notification preferences persist and load. OS notifications, hook-triggered alerts, quiet mode, and readiness remain planned.
- Renderer-local terminal presentation preferences persist and load without breaking xterm. Bell behavior, profiles, history controls, and live PTY geometry updates remain planned.
- Editable settings show destination path before write. Implemented for existing editable GUI preference controls; future write-capable sections remain gated.
- Data control writes/deletes remain blocked by `docs/reports/DATA_CONTROLS_GATE.md`.
- Browser/Electron route receipts for Settings are validated through built-route token proof, in-app Browser click-through receipts, and Electron dev startup receipts. Screenshot automation remains not installed in this project, so desktop/narrow screenshot capture remains deferred rather than claimed.
- `npm run typecheck`
- `npx vitest run`

### Operational Cleanliness

- Do not delete AdvancedPanel functionality until each tab has a replacement path.
- Keep settings sections data-driven where practical so new sections can register metadata and search text.
- Avoid hiding diagnostics behind product labels; diagnostics should remain explicit.
- Do not store secrets in GUI preferences.
- Keep user, project, and global settings visually distinct.

### Agent Parallelization

Parallel-friendly:

- One agent can build settings registry/search.
- One agent can migrate AdvancedPanel read-only sections.
- One agent can design notification/terminal/keyboard settings.
- One agent can update docs and screenshots.

Sequential:

- AdvancedPanel removal completed after replacement routes and safe click-through receipts existed.
- Shared settings persistence and scope model must be defined before individual editable sections write config.
- UX naming and section taxonomy should be decided before parallel UI implementation.

### Acceptance

- Settings navigation is the only primary path for configuration.
- No daily workflow is hidden behind a generic Advanced modal.
- Every editable setting shows ownership and destination before write.
- Integrations and Profile are either useful or removed/reframed.

## Phase 3: Hooks And Notifications

Goal: make hooks and alerts configurable without hardcoded app behavior.

Status on 2026-06-06: started with a parser/gate package. `src/core/hooksConfig.ts` now parses documented hook settings from raw `settings.json` text, preserves source scope/path, extracts command hooks, matchers, timeout, enabled state, event order, and blocking capability, rejects invalid JSON/shapes before any future write path, and orders project hooks before user hooks for display. `docs/reports/HOOKS_NOTIFICATIONS_GATE.md` records the write, execution, and notification-readiness boundaries that still block editable hook config and response-ready notifications. This package did not add file reads/writes, server routes, renderer IPC, hook execution, test-payload execution, session readiness, OS notifications, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `64/64`, and `npm run build`.

Second read-only presentation package expanded Settings > Hooks with the Command Code-owned `settings.json` destination, project/user scopes, project-before-user precedence, parser gate status, execution ownership, and example recipes for risky shell blocking, sensitive read warnings, write audit, and Stop notification audio via `command-code-bonk`. This package did not add hook file reads/writes, server routes, renderer IPC, hook execution, test-payload execution, session readiness, OS notifications, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5223/` with assets `index-DwRVIZ21.js` and `index-BE4-R85S.css`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:52902`.

Third read-only discovery package added a scoped `/api/hooks/configs` route and `transport.discoverHookConfigs(cwd)` for Settings > Hooks. The route derives only the documented `~/.commandcode/settings.json` and `<project>/.commandcode/settings.json` paths, uses the existing project root resolver for `cwd`, caps reads at 1 MB, parses through `src/core/hooksConfig.ts`, and returns source status, parsed hook rows, warnings, and errors without edit controls. Settings > Hooks now displays discovered project/user config status and parsed commands. This package did not add hook writes, arbitrary file reads, renderer IPC, hook execution, test-payload execution, session readiness, OS notifications, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `67/67`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5224/` with assets `index-CS7Xf2sx.js` and `index-BE4-R85S.css`, authenticated `/api/hooks/configs` proof against temp project `/tmp/ccgui-hooks-project-dX71Ss` showing `Stop/echo route-stop/project`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:53191`.

Fourth pure edit-helper package added `setHookCommandEnabled` to `src/core/hooksConfig.ts`. The helper toggles a matching direct or grouped command hook's `enabled` field in raw `settings.json` content while preserving unrelated settings keys and returning formatted JSON for future preview/write flows. It does not read files, write files, add routes, add renderer IPC, execute hooks, or mutate Command Code settings. Validation receipts: `npm run typecheck`, `npx vitest run` -> `69/69`, and `npm run build`.

Fifth preview-only package added scoped `/api/hooks/preview-toggle`, `transport.previewHookToggle(...)`, and Settings > Hooks `Preview enable/disable` controls. The route derives the selected project or user `settings.json` path, validates scope/event/command/enabled input, uses the bounded read path and `setHookCommandEnabled`, and returns formatted preview JSON without writing the source file. Settings displays the preview content in a read-only panel. This package did not add hook writes, arbitrary file reads, renderer IPC, hook execution, test-payload execution, session readiness, OS notifications, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `71/71`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5225/` with assets `index-3INgc3cq.js` and `index-D4dE-QgW.css`, authenticated `/api/hooks/preview-toggle` proof against temp project `/tmp/ccgui-hooks-preview-hvNHyC` showing `preview=true/project/false/deepseek` plus `unchanged=true`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:53584`.

Sixth write package added scoped `/api/hooks/apply-toggle`, `transport.applyHookToggle(...)`, and Settings > Hooks `Apply preview` flow. The route recomputes the same scoped preview server-side, writes a sibling `.ccgui.bak` backup, then writes the formatted JSON to only the derived selected-project or user `settings.json` path. Settings confirms before applying, shows the backup path, and refreshes discovered hooks after success. This package added hook config writes only for previewed enable/disable toggles; it did not add arbitrary file reads/writes, renderer IPC, hook execution, test-payload execution, session readiness, OS notifications, or broader Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `73/73`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5226/` with assets `index-DVf_6sqB.js` and `index-D4dE-QgW.css`, authenticated `/api/hooks/apply-toggle` proof against temp project `/tmp/ccgui-hooks-apply-etrDYF` showing `apply=true/project/false/deepseek` and `backup=true/true`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:53817`.

Seventh dry-run package added `src/core/hooksPayload.ts` and Settings > Hooks `Sample payload` controls. The helper builds explicitly marked `ccgui_dry_run` JSON samples for `PreToolUse`, `PostToolUse`, and `Stop` using documented common fields such as event name, session id, transcript path, cwd, and permission mode. Settings displays the sample payload in a read-only panel for discovered hook commands. This package did not execute hooks, start sessions, infer real runtime payload state, add file access, add renderer IPC, mutate Command Code settings, or add notification readiness. Validation receipts: `npm run typecheck`, `npx vitest run` -> `76/76`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5227/` with assets `index-4gIYdAEq.js` and `index-D4dE-QgW.css`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:54048`.

Eighth pure readiness package added `src/renderer/src/services/sessionReadiness.ts` with reducer tests for per-session background, unread, response-ready, and input-required state. Attach, replay, foreground navigation, and replay output remain non-notifying; live background output only marks unread; explicit background `assistant-ready` and `input-required` events return distinct notification intent for future notification wiring. This package did not add OS notifications, toast dispatch, audio behavior, session lifecycle integration, terminal-output heuristics, server routes, renderer IPC, file access, Command Code settings mutation, hook execution, or real CLI execution. Validation receipts: `npm run typecheck`, `npx vitest run` -> `83/83`, and `npm run build`.

Ninth session wiring package added live-versus-replay metadata to session data callbacks, reducer-backed readiness state to active tabs, and unread/readiness badges in tabs and active-session sidebar rows. Replay buffers are ignored for unread state; foregrounding a tab clears unread state; composer and terminal input commits clear pending readiness flags. This package did not add OS notifications, toast dispatch, audio behavior, response-ready inference, input-required runtime inference, terminal byte-length heuristics, renderer IPC, file access, hook execution, or Command Code settings mutation. The real Command Code interactive path was not exercised; PTY health was smoke-tested only. Validation receipts: `npm run typecheck`, `npx vitest run` -> `83/83`, `npm run build`, `npm run smoke:browser`, `npm run smoke:pty`, built browser route token proof at `http://127.0.0.1:5228/` with assets `index-NQ0qlEmE.js` and `index-CXez1f6k.css`, mock session API proof with `mock=true`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:54683`.

Tenth Settings reference alignment package updated Notifications and Hooks reference copy to match current implementation boundaries: unread readiness state is visible in tabs, response-ready/input-required notification delivery remains gated, scoped hook discovery and enable/disable writes are implemented, and broader hook editing/command execution remains gated. This package did not add settings persistence changes, server routes, renderer IPC, file access, hook execution, OS notifications, audio behavior, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, and `npm run smoke:browser`.

Eleventh pure edit-helper package added `updateHookCommand` and `removeHookCommand` to `src/core/hooksConfig.ts` for future broader hook editor previews. The helpers can update direct command, matcher, and timeout fields, remove timeout fields, delete direct or grouped hook commands, clean up empty grouped hook entries, and reject matcher edits for grouped entries with multiple commands because that would affect unrelated hooks. This package did not add file reads, file writes, server routes, renderer IPC, hook editor UI, hook execution, OS notifications, audio behavior, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `86/86`, and `npm run build`.

Twelfth scoped preview route package added `/api/hooks/preview-edit` and `transport.previewHookEdit(...)` for future broader hook editor previews. The route accepts only derived project/user settings scopes, keeps the 1 MB read cap, returns formatted JSON previews for command/matcher/timeout/delete edits, and does not write files. This package did not add an apply route, renderer UI controls, renderer IPC, hook execution, OS notifications, audio behavior, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `89/89`, `npm run build`, `npm run smoke:browser`, built route proof at `http://127.0.0.1:5229/` against `/tmp/ccgui-hooks-edit-9c9gpd` showing `preview=true/update/project`, edited command/matcher/timeout, and `unchanged=true`.

Thirteenth preview UI package added broader edit/delete preview controls to Settings > Hooks. Operators can select a discovered hook, adjust command/matcher/timeout draft fields, preview update JSON, or preview delete JSON through `transport.previewHookEdit(...)`; no apply button or broader write behavior was added. This package did not add file writes, hook execution, renderer IPC, OS notifications, audio behavior, or Command Code settings mutation. The real Command Code interactive path was not exercised because this package does not start or control Command Code. Validation receipts: `npm run typecheck`, `npx vitest run` -> `89/89`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5230/` with assets `index-nnITahme.js` and `index-Df7RZjIk.css`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:55426`.

Fourteenth broader edit write package added `/api/hooks/apply-edit`, `transport.applyHookEdit(...)`, and Settings `Apply edit preview` confirmation for command, matcher, timeout, and delete edits. The server recomputes the scoped preview from the current settings file before writing, writes a sibling `.ccgui.bak` backup, and then writes only the derived user/project `settings.json` path. This package did not add arbitrary file paths, renderer IPC, hook execution, OS notifications, audio behavior, or Command Code runtime mutation. The real Command Code interactive path was not exercised because this package edits config only. Validation receipts: `npm run typecheck`, `npx vitest run` -> `92/92`, `npm run build`, `npm run smoke:browser`, authenticated `/api/hooks/apply-edit` proof at `http://127.0.0.1:5231/` against `/tmp/ccgui-hooks-apply-edit-m8v5W3` showing `apply=true/update/project`, edited command/matcher/timeout, and `backup=true/true`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:55693`.

Fifteenth scoped hook log viewer package added `src/core/hooksLogs.ts`, `/api/hooks/logs`, `/api/hooks/logs/read`, `transport.listHookLogs(...)`, `transport.readHookLog(...)`, and a Settings > Hooks read-only log viewer. The server derives only `<project>/.commandcode/hooks` and `~/.commandcode/hooks`, lists supported log-like files (`.log`, `.jsonl`, `.txt`, `.ansi`), caps reads at the existing 1 MB file-read limit, and rejects outside paths and unsupported extensions. This package did not add arbitrary file access, renderer IPC, hook execution, hook test-runner behavior, OS notifications, audio behavior, or Command Code runtime mutation. The real Command Code interactive path was not exercised because this package only reads scoped diagnostics. Validation receipts: `npm run typecheck`, `npx vitest run` -> `94/94`, `npm run build`, `npm run smoke:browser`, authenticated `/api/hooks/logs` and `/api/hooks/logs/read` proof at `http://127.0.0.1:56187/` against `/var/folders/r8/0k0xbybj7svf24btnjglc7jh0000gn/T/ccgui-hook-log-proof-KXgeh5` showing only `audit.log` listed/read while outside `outside.log` and unsupported `secret.md` were rejected, built browser route proof at `http://127.0.0.1:56188/` with assets `index-B7vaMBRP.js` and `index-Df7RZjIk.css`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:56240`. In-app Browser screenshot automation was not available in this turn, so route-level and Electron startup receipts were used instead.

Sixteenth dry-run test runner package added `src/core/hooksDryRun.ts`, `/api/hooks/dry-run`, `transport.dryRunHook(...)`, and Settings > Hooks `Dry-run test` controls. The runner returns sample payload evidence, matcher applicability, `willRun`/`would skip` status, and `execution: not-run`; it does not read hook config, write files, start sessions, spawn processes, execute hook commands, or mutate Command Code runtime state. Real hook execution and real-session test payloads remain gated. Validation receipts: `npm run typecheck`, `npx vitest run` -> `100/100`, `npm run build`, `npm run smoke:browser`, authenticated `/api/hooks/dry-run` proof at `http://127.0.0.1:56852/` showing matching `Bash|Shell` returned `willRun=true` with `execution=not-run` and mismatched `Write|Edit` versus `Read` returned `willRun=false` with `execution=not-run`, built browser route proof at `http://127.0.0.1:56853/` with assets `index-u1BdDkr0.js` and `index-Df7RZjIk.css`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:56886`. In-app Browser screenshot automation was not available in this turn, so route-level and Electron startup receipts were used instead.

Seventeenth docs recipe package added `docs/reference/command-code-docs/hooks.md` with current Settings > Hooks capabilities, non-implemented execution boundaries, dry-run runner semantics, and a project-scoped Stop-hook notification/audio recipe compatible with `command-code-bonk --sound done`. This package did not change runtime code, server routes, renderer IPC, settings persistence, hook execution, OS notifications, audio behavior, or Command Code settings mutation. Validation receipts: `npm run typecheck` and local docs link/content checks for `hooks.md`, `command-code-bonk`, `execution: not-run`, and `ccgui_dry_run`.

Eighteenth pure notification planner package added explicit `response-ready` and `input-required` toast/audio preference categories plus `src/renderer/src/services/readinessNotifications.ts`. The planner maps explicit readiness notification intents to toast/audio delivery plans while respecting preferences; audio remains disabled by default, and no dispatch, OS notification, terminal-output heuristic, session lifecycle change, renderer IPC, server route, or Command Code runtime mutation was added. Validation receipts: `npm run typecheck`, `npx vitest run` -> `103/103`, `npm run build`, `npm run smoke:browser`, built browser route proof at `http://127.0.0.1:57331/` with assets `index-B_jIDcWW.js` and `index-Df7RZjIk.css`, and Electron dev startup with renderer `http://localhost:5175/` plus embedded app server `http://127.0.0.1:57350`. In-app Browser screenshot automation was not available in this turn, so route-level and Electron startup receipts were used instead.

### Scope

- Add Settings > Hooks.
- Read hook config from documented user/project scopes. Implemented as read-only discovery through scoped derived paths; writes remain gated.
- Surface `.commandcode/settings.json` and `~/.commandcode/settings.json`.
- Show hook event, matcher, command, timeout, blocking behavior, execution order, enabled state, and source scope. Implemented for read-only parsed discovery rows.
- Validate hook JSON before writing.
- Preserve project-over-user precedence.
- Add enable/disable controls per hook. Implemented for scoped previewed toggles with backup writes; broader hook editing is implemented for command, matcher, timeout, and delete edits through preview-confirmed scoped writes with backups.
- Add hook logs/output viewer where logs are available. Implemented as a scoped read-only viewer for derived project/user hook directories with supported log-like extensions only.
- Add a test payload runner so users can validate hook behavior before real sessions. Implemented as a dry-run runner that returns sample payload evidence and matcher applicability with `execution: not-run`; real hook command execution remains gated.
- Add examples for dangerous shell blocking, sensitive read warnings, write auditing, and Stop-hook finish notifications.
- Document and support a community-style Stop-hook notification/audio recipe compatible with `vipulgupta2048/command-code-bonk`. Implemented as local reference docs and Settings examples; real hook execution remains Command Code-owned.
- Replace terminal data-length notification heuristics with explicit session lifecycle state. Pure reducer and live-versus-replay session callback metadata implemented; response-ready runtime integration remains gated.
- Track per-session unread, response-ready, and input-required state. Reducer-backed tab state and unread display implemented; explicit response-ready/input-required runtime events remain gated.
- Notify only when background sessions produce ready output or require operator input. Pure reducer returns notification intent and pure planner maps explicit intents to preference-aware delivery plans; UI/OS notification dispatch remains gated.

### Likely Impacted Files

- `src/renderer/src/components/TerminalPane.tsx`
- `src/renderer/src/components/ToastSystem.tsx`
- `src/renderer/src/settings/HooksSettings.tsx`
- `src/renderer/src/settings/NotificationsSettings.tsx`
- `src/renderer/src/hooks/useNotifications.ts`
- `src/renderer/src/hooks/useSessions.ts`
- `src/server/index.ts`
- `src/shared/types.ts`
- `src/core/*`
- `docs/reference/command-code-docs/README.md`
- `docs/roadmaps/v1/LLM_SUGGESTION_MATRIX.md`

Likely new files:

- `src/core/hooksConfig.ts`
- `src/core/hooksConfig.test.ts`
- `src/renderer/src/settings/HookEditor.tsx`
- `src/renderer/src/settings/HookTestRunner.tsx`
- `src/renderer/src/services/sessionReadiness.ts` (implemented as a pure reducer)

### Tests And Proof

- Hook config parser handles empty, user-only, project-only, and merged configs.
- Invalid hook JSON is rejected before write.
- Test payload runner dry-runs without starting a real session. Real hook command execution remains gated.
- Opening/attaching/returning to a session does not produce response-ready toast. Implemented at pure reducer level and in tab foreground/replay wiring; runtime UI notification integration remains gated.
- Background session output produces one appropriate unread/ready notification. Reducer distinguishes live background output from readiness intent, and tabs/sidebar show unread state; notification dispatch remains gated.
- Input-required state produces a distinct notification. Implemented at pure reducer intent level; notification dispatch remains gated.
- Notification preferences suppress or enable categories correctly. Implemented for readiness intents at pure planner level; runtime dispatch remains gated.
- `npm run typecheck`
- `npx vitest run`
- Browser/Electron dogfood with three sessions.

### Operational Cleanliness

- Hook execution remains Command Code-owned. The GUI edits config and runs diagnostics only.
- Do not introduce GUI-only hook semantics under the same name as Command Code hooks.
- Keep session readiness separate from hook notifications.
- Do not depend on arbitrary terminal text as the sole readiness signal.
- Keep audio off by default unless user preference says otherwise.

### Agent Parallelization

Parallel-friendly:

- One agent can implement hook config parsing/validation tests.
- One agent can build Hooks Settings UI.
- One agent can implement notification preferences.
- One agent can update docs and example recipes.

Sequential:

- Session readiness state must be designed before notification UI can be correct.
- Hook write behavior must wait for config scope validation.
- Community hook recipe should be documented after the hooks editor shape is known.

### Acceptance

- Opening, attaching, or returning to a session does not fire response-ready notifications.
- Background sessions notify only when they produce a ready response or require operator input.
- Hook execution remains owned by Command Code.
- Hook config edits are scoped, validated, and reversible where possible.

## Phase 4: Models And Session Identity

Goal: make model routing and per-session model context truthful.

Status update 2026-06-06: First presentation-foundation package added a tested session model identity resolver in `src/renderer/src/services/sessionModelIdentity.ts` and wired it into active session header labels, composer chips, tab details, and transcript metadata. This package keeps display labels and command values separate, preserves the existing `SessionTab.model` session-start metadata, and uses `Default at start` when exact old-session metadata is unavailable instead of falling back to the current global picker. It did not add model routing config writes, CLI argument changes, Command Code model semantics, IPC routes, filesystem access, or session lifecycle changes. Validation receipts: `npm run typecheck`, `npx vitest run` -> `107/107`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57370/` serving assets `index-B80NPNmD.js` and `index-Df7RZjIk.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:57625`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Second renderer-only package added model catalog helpers in `src/renderer/src/services/modelCatalog.ts` and wired search/filter into the existing model picker while preserving local favorites/pinning. Search matches documented model id, short name, provider, and displayed description from `cmd --list-models` output. The current selected model remains visible if the filter narrows it out. This package did not add model routing config writes, CLI argument changes, Command Code model semantics, IPC routes, filesystem access, or session lifecycle changes. Validation receipts: `npm run typecheck`, `npx vitest run` -> `110/110`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57371/` serving assets `index-BZe6ioWY.js` and `index-BR1DD7ml.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:57810`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Third renderer-only package replaced the generic Models reference card with `src/renderer/src/settings/ModelsSettings.tsx`. The page now visibly separates single-session model selection, Command Code-owned task routing through `/configure-models`, model catalog search, and future/plugin-owned vision adapter routing. The task routing section provides a command preview only and explicitly leaves persistent routing edits unimplemented pending documented config behavior and a scoped write path. This package did not add config writes, CLI argument changes, Command Code model semantics, IPC routes, filesystem access, or session lifecycle changes. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57372/` serving assets `index-0J8Ve054.js` and `index-X_jYjd9B.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:58042`. Browser screenshot automation remains not run because Playwright is not installed in this project; `npx vitest run` was not rerun for this package because it did not touch parser, transport, config, session, or shared helper code.

Status update 2026-06-06: Fourth metadata package extended existing project transcript metadata discovery in `src/core/discovery.ts` so `.meta.json` files surface trimmed `model` values as well as titles. This lets resumed project transcripts display model identity from Command Code session metadata when available, while older sessions still fall back to `Default at start`. The package adds a temp-base discovery test and does not add new file roots, renderer IPC routes, config writes, CLI argument changes, Command Code model semantics, or session lifecycle changes. Validation receipts: `npm run typecheck`, `npx vitest run` -> `112/112`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57373/` serving assets `index-0J8Ve054.js` and `index-X_jYjd9B.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:58239`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Fifth docs package added `docs/reference/command-code-docs/models.md` and linked it from the local docs index. The page records direct `cmd --help` and `cmd --list-models` evidence for `--model`, `--list-models`, `/model`, and `/configure-models`, and keeps task routing config writes gated until a documented format and scoped write contract exist. This package did not change runtime code, renderer IPC, file access, config writes, CLI arguments, or session lifecycle. Validation receipts: `npm run typecheck`, `rg --files docs/reference/command-code-docs`, and `rg -n "configure-models|--list-models|--model|vision adapter" docs/reference/command-code-docs/models.md docs/reference/command-code-docs/README.md`.

Status update 2026-06-06: Sixth preview package added `src/core/modelRouting.ts` with a pure preview contract for documented task categories: compaction, title generation, and background work. Settings > Models now renders these tasks as `Command Code-owned`, `preview-only`, and applying as `Opens Command Code helper` through `/configure-models`. This package improves task-routing visibility without adding config writes, routing-table parsing, renderer IPC, filesystem access, CLI argument changes, Command Code model semantics, or session lifecycle changes. Validation receipts: `npm run typecheck`, `npx vitest run` -> `114/114`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57374/` serving assets `index-Dtbqg9wM.js` and `index-C49QUrJu.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:58486`. Browser screenshot automation remains not run because Playwright is not installed in this project.

### Scope

- Add persistent Settings > Models / Task Routing for `/configure-models`.
- Show documented task assignments such as compaction, title generation, and background work.
- Preview routing changes before applying.
- Persist the model selected for each session at start/resume.
- Display contextual per-session model in session header, composer chip, transcript metadata, and tab details.
- Ensure global/default model changes do not relabel active sessions.
- Add model search/filter.
- Show context window, pricing, or capability metadata only from documented or explicit sources.
- Clearly distinguish task model routing from single-session model selection.
- Define a future extension point for preferred vision-model routing, where a configured vision adapter can summarize screenshots/images for models that do not natively accept image input.

### Likely Impacted Files

- `src/renderer/src/App.tsx`
- `src/renderer/src/components/ModelDropdown.tsx`
- `src/renderer/src/components/SessionTabs.tsx`
- `src/renderer/src/components/SessionHeader.tsx`
- `src/renderer/src/components/Composer.tsx`
- `src/renderer/src/settings/ModelsSettings.tsx`
- `src/shared/types.ts`
- `src/core/sessions.ts`
- `src/core/cli.ts`
- `src/server/index.ts`
- transcript/session discovery modules

Likely new files:

- `src/core/modelRouting.ts`
- `src/renderer/src/settings/TaskRoutingSettings.tsx`
- `src/renderer/src/services/sessionMetadata.ts`

### Tests And Proof

- Starting a session stores selected model in session metadata.
- Resuming a session displays model from transcript/session metadata when available.
- Changing global model does not change existing tab model labels.
- Model dropdown search/filter works with large model lists.
- Task routing preview shows command/config effect before apply.
- Preferred vision-model configuration is absent, disabled, or clearly marked future/plugin-owned unless an adapter contract exists.
- `npm run typecheck`
- `npx vitest run`
- Browser/Electron dogfood with sessions using Deepseek, Kimi2.6, and Nemotron-3-ultra.

### Operational Cleanliness

- Do not infer model routing tables from terminal output unless marked best-effort.
- Do not invent pricing/context metadata.
- Do not promise image support for a text-only model unless a configured vision adapter has produced text context.
- Keep display labels and command values distinct.
- Preserve favorites/pinning behavior.
- Keep old sessions truthful even if exact model metadata is unavailable; show "unknown" or "default at start" rather than a false current global model.

### Agent Parallelization

Parallel-friendly:

- One agent can implement per-session metadata and tests.
- One agent can improve model dropdown search/filter.
- One agent can research documented model routing config and update docs.
- One agent can draft the future vision-adapter contract without wiring it into runtime.

Sequential:

- Session metadata shape must land before UI labels and transcript metadata depend on it.
- Task routing UI should wait for documented config/command behavior to be verified.
- Vision-adapter routing should wait for a plugin/capability contract.

### Acceptance

- Changing the global/default model does not relabel active sessions.
- Sessions started with Deepseek, Kimi2.6, Nemotron-3-ultra, or another explicit model retain their own display identity.
- Task routing is visibly separate from active session model selection.

## Phase 5: Workflow Helpers

Goal: make advanced slash commands discoverable and safer to use.

Status on 2026-06-06: complete and validated for the current V1 contract. Searchable commands, workflow recipes, Settings routing, recent-project search, local docs topic search, `/design` preview, Agent Draft preview, command execution badges, and command/runtime ownership labels are implemented. Session-result search is deferred behind a session lifecycle gate because direct resume/start behavior changes runtime truth.

Status update 2026-06-06: First search/recipe foundation package added `src/renderer/src/commandPalette/search.ts` and `src/renderer/src/commandPalette/workflowRecipes.ts`, plus a search input and preview-only workflow recipe rows in the existing slash popover. Search now covers existing commands and declarative recipes for interactive, headless, plan, design, resume, continue, configure models, MCP setup, hook setup, notification setup, and agent creation. Executable command rows still use the existing `runCommand(item)` path; recipe rows do not execute commands, mutate prompts, write config, broaden IPC, or infer Command Code state. Guided `/design` and `/agents` helper forms remain planned. Validation receipts: `npm run typecheck`, `npx vitest run` -> `117/117`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57375/` serving assets `index-CBo51pUT.js` and `index-BV7Dspfr.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:58698`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Second workflow-helper package added `src/renderer/src/workflows/designCommand.ts` and `src/renderer/src/workflows/DesignHelper.tsx`, replacing the placeholder Settings > Design card with a preview-only `/design` helper. The helper supports documented design modes, optional target, visible goal context, and future selected-element context; only mode and target are included in the slash command preview, so goal/context are not hidden prompt rewrites. This package did not add active-session send behavior, config writes, renderer IPC, file access, CLI argument changes, or session lifecycle changes. Validation receipts: `npm run typecheck`, `npx vitest run` -> `120/120`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57376/` serving assets `index-DhV-rzOP.js` and `index-D0pnBW39.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:58884`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Third workflow-helper package added `src/renderer/src/workflows/agentDraft.ts` and `src/renderer/src/workflows/AgentHelper.tsx`, placing a preview-only Agent Draft helper above the existing Settings > Agents list. The helper offers reviewer, implementer, and researcher templates, shows project scope and the projected `.commandcode/agents/<slug>.md` destination, and renders draft frontmatter/content without saving. Existing project-agent edit/save behavior remains unchanged and explicit. This package did not add new write routes, broaden renderer IPC, change file access policy, add agent routing semantics, mutate Command Code settings, or change session lifecycle. Validation receipts: `npm run typecheck`, `npx vitest run` -> `122/122`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57377/` serving assets `index-DAvzRyHn.js` and `index-C9vlN-bN.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:59085`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Fourth workflow-helper package added `src/renderer/src/commandPalette/commandPreview.ts` and command-row behavior badges in `src/renderer/src/components/AppPopovers.tsx`. Executable palette rows now visibly distinguish `send-active-session`, `insert-composer`, and `headless-run`, with plan-mode, runtime, active-session/composer, and Command Code-owned model-routing badges. This is display-only metadata for the existing `runCommand(item)` path; it does not change execution, prompt contents, config writes, renderer IPC, file access, CLI arguments, or session lifecycle. Validation receipts: `npm run typecheck`, `npx vitest run` -> `127/127`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57378/` serving assets `index-BCeYJrJ3.js` and `index-BIafH59q.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:59366`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Fifth workflow-helper package made `open-settings` workflow recipes actionable from the slash popover by adding explicit `settingsSection` metadata in `src/renderer/src/commandPalette/workflowRecipes.ts` and routing those rows to Settings > MCP, Hooks, Notifications, or Agents. Runtime-start recipes remain preview-only and have no settings target, so the palette still does not invent new session lifecycle behavior. This package did not add runtime execution, prompt rewriting, config writes, renderer IPC, file access, CLI argument changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `129/129`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57379/` serving assets `index-CgUo9V_S.js` and `index-BYxtwXbi.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:59571`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Sixth workflow-helper package extended `src/renderer/src/commandPalette/search.ts` so non-empty palette queries can return Settings sections from the existing `settingsRegistry`, and rendered those matches as explicit Settings rows in the slash popover. Empty palette state still shows commands and workflow recipes only, preventing the command popover from becoming a duplicate Settings sidebar. This package did not add runtime execution, prompt rewriting, config writes, renderer IPC, file access, CLI argument changes, session lifecycle changes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `130/130`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57380/` serving assets `index-DLm2HRQl.js` and `index-BYxtwXbi.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:59737`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Seventh workflow-helper package added `src/renderer/src/commandPalette/docs.ts` and extended palette search to return recent projects plus local docs topics for non-empty queries. Project rows select an existing recent project path, and docs rows open the existing docs inspector; neither path starts/resumes a session or reads additional files. Session-result search remains planned because direct resume would affect session lifecycle and needs its own gate. Validation receipts: `npm run typecheck`, `npx vitest run` -> `132/132`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57381/` serving assets `index-C1WCSshw.js` and `index-BYxtwXbi.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:59988`. Browser screenshot automation remains not run because Playwright is not installed in this project.

### Scope

- Replace static command buttons with searchable command/workflow palette.
- Add fuzzy search over commands, settings, projects, sessions, agents, skills, docs, and recent workflows. Implemented for commands, workflow recipes, Settings sections, recent projects, and local docs topics; session search remains planned.
- Add recipes for interactive, headless, plan, design, resume, continue, configure models, MCP setup, hook setup, notification setup, and agent creation.
- Route settings-backed recipes to their Settings sections without executing runtime commands.
- Add guided `/design` helper with mode, target, goal, and command preview.
- Shape `/design` helper inputs so future visual design plugins can add selected element metadata, screenshot/frame context, drawn annotations, and voice transcripts without rewriting the core helper.
- Add guided `/agents` helper with templates, validation, and scope display.
- Add shortcut hints and Settings > Keyboard reference.
- Distinguish "send to active session" from "start new session".
- Preview risky command/config effects before execution.

### Likely Impacted Files

- `src/renderer/src/components/CommandPalette.tsx`
- `src/renderer/src/components/Composer.tsx`
- `src/renderer/src/components/SlashCommandMenu.tsx`
- `src/renderer/src/settings/KeyboardSettings.tsx`
- `src/renderer/src/settings/DesignSettings.tsx`
- `src/renderer/src/settings/AgentsSettings.tsx`
- `src/core/cli.ts`
- `src/shared/types.ts`
- `docs/reference/command-code-docs/README.md`

Likely new files:

- `src/renderer/src/commandPalette/commandRegistry.ts`
- `src/renderer/src/commandPalette/workflowRecipes.ts`
- `src/renderer/src/commandPalette/commandPreview.ts`
- `src/renderer/src/workflows/DesignHelper.tsx`
- `src/renderer/src/workflows/AgentHelper.tsx`

### Tests And Proof

- Palette search returns expected commands/settings/docs.
- Command preview matches the command actually sent.
- Helpers distinguish active-session send from new-session start.
- `/design` helper builds the correct documented command.
- `/design` helper can carry optional structured context fields internally even if visual capture is deferred.
- `/agents` helper does not write unsupported semantics without verification.
- Keyboard shortcut hints render and remain accessible.
- `npm run typecheck`
- `npx vitest run`
- Browser screenshot of palette and helper flows.

### Operational Cleanliness

- Do not turn slash commands into hidden prompt rewriting.
- Keep command recipes declarative and searchable.
- Mark commands that are plan-mode, write-capable, or risky.
- Keep helper actions cancellable before execution.
- Keep visual design inputs optional and clearly marked as future/plugin-owned until implemented.

### Agent Parallelization

Parallel-friendly:

- One agent can build search/index primitives.
- One agent can define command registry metadata.
- One agent can implement `/design` helper.
- One agent can implement shortcut reference.

Sequential:

- Command registry shape should land before individual helper surfaces.
- Risk/preview semantics should be defined before helpers execute commands.

### Acceptance

- Every helper distinguishes "send to active session" from "start new session".
- Every write-capable helper previews command/config effects before execution.
- Users can find `/design`, `/agents`, `/configure-models`, hooks, and MCP without memorizing slash commands.

## Phase 6: MCP And Integrations

Goal: make MCP visible and operable from the GUI without hiding secrets or inventing runtime behavior.

Status on 2026-06-06: complete and validated for the current V1 contract. Settings > MCP is a first-class Settings route with scope/policy reference, read-only list diagnostics, parsed tool chips when present in `cmd mcp list` output, visible connect/disconnect command previews and execution through the existing `transport.mcpAction` path, gated details/remove/auth previews, and preview-only HTTP/stdio/JSON add flows with redacted secret display. MCP add execution, remove execution, auth-clear execution, config parsing/editing, server edit/save, connection tests, deeper diagnostics, and log viewing remain deferred behind explicit mutation, config-write, secret-handling, and fixture-validation gates.

Phase closeout validation receipts on 2026-06-06:

- `npm run typecheck`
- `npx vitest run` -> `148/148`
- `npm run build`
- `npm run smoke:browser`
- `npm run smoke:headless`
- `cmd mcp --help`, `cmd mcp add --help`, `cmd mcp add-json --help`, `cmd mcp remove --help`, and `cmd mcp auth --help`
- Latest built route token proof at `http://127.0.0.1:57388/` serving assets `index-CX2HZXGu.js` and `index-8BkyITsP.css`
- Latest Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:61837`
- Browser plugin navigation was not available in this thread, so route-level and built-asset receipts were used for the latest UI proof.

Status update 2026-06-06: First MCP foundation package added `src/core/mcpCommands.ts` with tested pure builders for `cmd mcp connect|disconnect <server>` argument arrays and display previews. `src/core/discovery.ts` now uses the same builder for the existing MCP action path, and Settings > MCP uses the shared preview builder instead of a renderer-local formatter. This package did not add new MCP actions, add/remove/auth flows, config writes, renderer IPC, secret storage, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `135/135`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57382/` serving assets `index-ClVCWnWo.js` and `index-BYxtwXbi.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:60273`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Second MCP foundation package added `src/core/mcpReference.ts` with tested local/project/user scope path metadata and MCP policy notes for permission prompts, plan-mode disabling, and secret handling. Settings > MCP now renders these read-only reference tiles before server action rows so scope, config path, and secret policy are visible before future MCP writes. This package did not add MCP add/remove/auth flows, config reads or writes, renderer IPC, secret storage, runtime mutation, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `138/138`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57383/` serving assets `index-ielxPO9j.js` and `index-B7MCApJP.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:60472`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Third MCP foundation package added `src/core/mcpList.ts` and extended the existing MCP list parser to derive optional `mcp__server__tool` tool names from the already-returned `cmd mcp list` output. Settings > MCP renders parsed tool chips when the output includes tool names while preserving raw output and existing connected/disconnected/error parsing. This package did not add new MCP commands, config reads or writes, renderer IPC, secret storage, runtime mutation, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `142/142`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57384/` serving assets `index-B8yrRZRO.js` and `index-NxwaFrMv.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:60729`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Fourth MCP foundation package extended `src/core/mcpCommands.ts` with tested preview builders for gated MCP commands: `cmd mcp get <server>`, `cmd mcp remove [--scope <scope>] <server>`, `cmd mcp auth --status [server]`, `cmd mcp auth --clear [server]`, and `cmd mcp auth --list`. Settings > MCP now shows per-server details, remove, auth status, and auth clear previews without adding buttons or transport execution for those gated mutations. Installed CLI help was checked with `cmd mcp --help`, `cmd mcp remove --help`, `cmd mcp auth --help`, `cmd mcp add --help`, and `cmd mcp add-json --help`; existing connect/disconnect behavior was left unchanged. Validation receipts: `npm run typecheck`, `npx vitest run` -> `144/144`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57385/` serving assets `index-Cym8am9P.js` and `index-NxwaFrMv.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:60930`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Fifth MCP foundation package added `McpListResult` diagnostics to the existing read-only `/api/mcp/list` transport path. The route still returns `servers` for compatibility, but now also reports `ok`, `stdout`, `stderr`, and `error`; Settings > MCP displays failure diagnostics instead of flattening CLI failures into an empty server list. This package did not add new MCP commands, config reads or writes, renderer IPC, secret storage, runtime mutation, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `145/145`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57386/` serving assets `index-ClhC1Mch.js` and `index-8BkyITsP.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:61209`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Sixth MCP foundation package extracted Settings > MCP presentation into `src/renderer/src/settings/McpSettings.tsx` and updated `SettingsRoutes` to use the dedicated module. This preserves the existing transport calls, command previews, scope/policy tiles, tool chips, diagnostics, and connect/disconnect buttons while moving MCP out of the `AdvancedReadOnlySettings` catch-all. This package did not add new MCP commands, config reads or writes, renderer IPC, secret storage, runtime mutation, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `145/145`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:57387/` serving assets `index-v30dRzNV.js` and `index-8BkyITsP.css`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:61460`. Browser screenshot automation remains not run because Playwright is not installed in this project.

Status update 2026-06-06: Seventh MCP foundation package extended `src/core/mcpCommands.ts` with tested preview-only builders for documented `cmd mcp add` and `cmd mcp add-json` argument shapes, including HTTP headers, stdio env values, scopes, transport, JSON config, and redacted client-secret display. This package did not add Settings UI, execution buttons, config reads or writes, renderer IPC, secret storage, runtime mutation, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `148/148`, `npm run smoke:headless`, and `npm run build`. Real external MCP add/add-json mutation was not tested because the package only builds redacted previews.

Status update 2026-06-06: Eighth MCP foundation package added a preview-only Add server section to `src/renderer/src/settings/McpSettings.tsx` for HTTP, stdio, and JSON config flows. The section uses the pure add/add-json builders, shows scope, server name, transport-specific inputs, password fields for secret-like values, and a redacted command preview, but it does not expose an apply button or call any transport route. This package did not add MCP add mutation, config reads or writes, renderer IPC, secret storage, runtime mutation, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57388/` serving assets `index-CX2HZXGu.js` and `index-8BkyITsP.css`, built asset text proof for `Add server preview`, `JSON config add`, and `Not available in this package`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:61837`. Browser plugin navigation was not available in this thread, so route-level receipts were used.

### Scope

- Move MCP into Settings/Integrations as a first-class workflow.
- Show server scope, config path, transport, auth state, connection state, tool count, and error text.
- Add guided add flows for HTTP, stdio, and JSON config.
- Preview `cmd mcp ...` commands before mutating MCP state.
- Add server edit, tool browser, connection test, diagnostics, and log viewing.
- Explain permission prompts and plan-mode tool restrictions.
- Avoid storing MCP secrets in GUI preferences.

### Likely Impacted Files

- `src/renderer/src/settings/AdvancedReadOnlySettings.tsx`
- `src/renderer/src/settings/SettingsRoutes.tsx`
- `src/renderer/src/settings/McpSettings.tsx`
- `src/renderer/src/settings/IntegrationsSettings.tsx`
- `src/core/cli.ts`
- `src/core/mcp.ts`
- `src/server/index.ts`
- `src/shared/types.ts`
- `docs/reference/command-code-docs/README.md`

Likely new files:

- `src/core/mcpCommands.ts`
- `src/core/mcpConfig.ts`
- `src/renderer/src/settings/McpServerEditor.tsx`
- `src/renderer/src/settings/McpToolBrowser.tsx`

### Tests And Proof

- MCP command builders produce expected `cmd mcp` commands.
- MCP list parser handles connected, disconnected, and error states.
- Add/edit/remove/auth-clear previews show exact command or config path.
- Secret-like values are not persisted in GUI preferences.
- Plan-mode restriction copy is visible.
- `npm run typecheck`
- `npx vitest run`

### Operational Cleanliness

- Treat MCP as Command Code-owned.
- Prefer CLI commands for mutation where documented.
- Do not silently edit MCP config without showing scope/path.
- Never log or store auth secrets.
- Keep failure states explicit and copyable.

### Agent Parallelization

Parallel-friendly:

- One agent can implement command builders/parsers.
- One agent can implement Settings UI.
- One agent can build docs/help copy.
- One agent can add tests.

Sequential:

- Parser and command-builder behavior must be agreed before UI actions.
- Secret-handling policy must be enforced before mutation flows are enabled.

### Acceptance

- MCP secrets are not stored in GUI preferences. Implemented and validated for shipped surfaces: add previews redact secret-like values, and no MCP secret persistence path was added.
- Project/user/local scope is explicit before every MCP write. Implemented for shipped write-adjacent surfaces: add previews expose scope before any future write; no add/remove/auth-clear write path is shipped.
- MCP tools are discoverable with status and failure text. Implemented through the read-only list parser, optional tool chips, and `/api/mcp/list` diagnostics.
- MCP mutation flows beyond existing connect/disconnect are deferred behind separate gates for scoped config writes, safe fixture click-throughs, and secret-handling policy.

## Phase 7: Agents, Skills, Memory, And Taste

Goal: make community extension surfaces understandable and scoped.

Status on 2026-06-06: complete and validated for the current V1 contract. Agents, Skills, Memory, and Taste are first-class Settings routes with dedicated modules, visible source/destination paths, scoped ownership labels, and Command Code ownership copy. Agents and Memory preserve the existing scoped project save routes with visible destination and server-side path validation. Skills and Taste remain read-only, with activation/CRUD unavailable because upstream semantics are not implemented by the GUI. Memory templates, section-level editing, undo/revert, import/export/reset, skill activation, skill/taste CRUD, default-agent routing, and taste confidence semantics are deferred behind documented persistence/write gates and upstream verification.

Phase closeout validation receipts on 2026-06-06:

- `npm run typecheck`
- `npx vitest run` -> `148/148`
- `npm run build`
- `npm run smoke:browser`
- Latest built route token proof at `http://127.0.0.1:57393/` serving assets `index-cFVLxJPL.js` and `index-8BkyITsP.css`
- Latest Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:62825`
- Previous isolated Settings Agent and Memory save click-through receipts remain the write-path evidence because Phase 7 packages changed presentation and route ownership without changing those save routes or server policy.
- Browser plugin navigation was not available in this thread, so route-level and built-asset receipts were used for the latest UI packages.

Status update 2026-06-06: First Phase 7 renderer architecture package extracted Settings Agents, Skills, Memory, and Taste presentation from `src/renderer/src/settings/AdvancedReadOnlySettings.tsx` into dedicated modules: `AgentsSettings.tsx`, `SkillsSettings.tsx`, `MemorySettings.tsx`, and `TasteSettings.tsx`. It also added a shared `SettingsReadOnlyCard.tsx` used by those routes and MCP while preserving existing transport calls, project-scoped Agents/Memory save behavior, read-only Skills/Taste behavior, destination labels, and Command Code ownership copy. This package did not add renderer IPC, server routes, config writes, file access changes, runtime/session lifecycle changes, skill/taste CRUD, agent routing semantics, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57389/` serving assets `index-Bap9IfZ3.js` and `index-8BkyITsP.css`, built asset text proof for `Agent configs`, `Skills`, `Memory files`, and `Taste packages`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:62327`. Browser plugin navigation was not available in this thread, so route-level and built-asset receipts were used.

Status update 2026-06-06: Second Phase 7 read-only package improved `src/renderer/src/settings/TasteSettings.tsx` readability by making taste packages expandable and showing package path, Command Code-owned labeling, category confidence, up to four learning snippets per category, empty-category text, and hidden-learning counts. This package uses only the existing `transport.listTaste()` payload and did not add renderer IPC, server routes, config writes, file access changes, runtime/session lifecycle changes, taste CRUD, taste confidence semantics, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57390/` serving assets `index-DdFlkBOV.js` and `index-8BkyITsP.css`, built asset text proof for `Taste packages`, `Command Code-owned`, `No taste categories discovered`, and `more learnings`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:62470`. Browser plugin navigation was not available in this thread, so route-level and built-asset receipts were used.

Status update 2026-06-06: Third Phase 7 read-only package improved `src/renderer/src/settings/SkillsSettings.tsx` source visibility by showing each discovered skill path, a derived read-only source label for current discovery roots (`user Command Code`, `agent plugin`, or `discovered`), and an explicit `Insert/use not available in this package` preview row when expanded. This package uses only the existing `transport.listSkills()` payload and did not add renderer IPC, server routes, config writes, file access changes, runtime/session lifecycle changes, skill activation, skill CRUD, hidden command execution, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57391/` serving assets `index-0YZ7cnKj.js` and `index-8BkyITsP.css`, built asset text proof for `Insert/use not available in this package`, `user Command Code`, `agent plugin`, and `skillScopeLabel`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:62593`. Browser plugin navigation was not available in this thread, so route-level and built-asset receipts were used.

Status update 2026-06-06: Fourth Phase 7 Memory readability package updated `src/renderer/src/settings/MemorySettings.tsx` so memory rows expand into a read-only preview before editing, show the destination path in preview and edit states, and require an explicit `Edit` button before the existing editor opens. The existing `transport.saveMemory(filePath, content, cwd)` path and server validation remain unchanged. This package did not add renderer IPC, server routes, new config writes, file access changes, runtime/session lifecycle changes, memory CRUD beyond the existing save behavior, undo/revert, template semantics, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57392/` serving assets `index-BUzH0Hjz.js` and `index-8BkyITsP.css`, built asset text proof for `No memory content available`, `more lines`, `memoryPreview`, `Save memory`, and `Destination:`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:62689`. Direct Settings memory save click-through was not rerun for this package because it changed presentation around the already validated save route without changing the route or server policy.

Status update 2026-06-06: Fifth Phase 7 Agent readability package updated `src/renderer/src/settings/AgentsSettings.tsx` so agent rows expand into a read-only raw-content preview, show the destination path before editing, and require an explicit `Edit` button before the existing project agent editor opens. The existing `transport.saveAgent(agentPath, content, cwd)` path and server validation remain unchanged. This package did not add renderer IPC, server routes, new config writes, file access changes, runtime/session lifecycle changes, agent CRUD beyond the existing project save behavior, agent routing semantics, default-agent semantics, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57393/` serving assets `index-cFVLxJPL.js` and `index-8BkyITsP.css`, built asset text proof for `No agent content available`, `agentPreview`, `Project agent destination`, `user read-only`, and `project editable`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:62825`. Direct Settings agent save click-through was not rerun for this package because it changed presentation around the already validated save route without changing the route or server policy.

### Scope

- Move agents, skills, memory, and taste into Settings or contextual inspectors.
- Add agent manager with project/global scope, templates, validation, and destination paths.
- Improve skills browsing and activation visibility.
- Add memory preview, templates, section editing, validation, and undo/revert.
- Improve taste readability and ownership labeling.
- Add import/export/reset only where semantics are documented or clearly GUI-owned.
- Mark unsupported CRUD behavior as blocked or experimental until upstream behavior is verified.

### Likely Impacted Files

- `src/renderer/src/settings/AdvancedReadOnlySettings.tsx`
- `src/renderer/src/settings/SettingsRoutes.tsx`
- `src/renderer/src/settings/AgentsSettings.tsx`
- `src/renderer/src/settings/SkillsSettings.tsx`
- `src/renderer/src/settings/MemorySettings.tsx`
- `src/renderer/src/settings/TasteSettings.tsx`
- `src/server/index.ts`
- `src/core/discovery.ts`
- `src/shared/types.ts`
- file access policy modules from v0
- `AGENTS.md`
- `docs/architecture/V1_ARCHITECTURE.md`

Likely new files:

- `src/core/agentsConfig.ts`
- `src/core/skillsDiscovery.ts`
- `src/core/memoryConfig.ts`
- `src/core/tasteDiscovery.ts`
- `src/renderer/src/settings/ScopedFileEditor.tsx`

### Tests And Proof

- Discovery scans project/global locations without escaping allowed roots.
- Agent writes are limited to verified config roots.
- Memory writes are limited to known project/global memory files.
- Markdown preview renders memory files safely.
- Undo/revert restores previous content before save where implemented.
- Unsupported skill/taste CRUD paths are not exposed as stable.
- `npm run typecheck`
- `npx vitest run`

### Operational Cleanliness

- Preserve Command Code ownership of agent, skill, memory, and taste semantics.
- Show whether each file is runtime-owned, project-owned, global config, or GUI-owned.
- Avoid broad file-write endpoints.
- Use file-backed edits with explicit destination and confirmation.
- Keep raw file access available for debugging where safe.

### Agent Parallelization

Parallel-friendly:

- One agent can implement discovery modules.
- One agent can implement scoped markdown editor.
- One agent can migrate AdvancedPanel surfaces into Settings.
- One agent can add tests for access policy.

Sequential:

- Access policy and destination labeling must land before write-capable editors.
- Upstream verification must happen before enabling skill/taste CRUD or agent defaults.

### Acceptance

- The GUI does not invent Command Code semantics for skills, taste confidence, or default agent/model behavior. Implemented: Skills/Taste are read-only, Taste confidence is displayed from existing discovery only, and default agent/model behavior is not added.
- Any CRUD behavior that depends on upstream semantics is verified first or marked experimental. Implemented: only the previously validated project-scoped Agent/Memory save paths are exposed; skill/taste CRUD, import/export/reset, default-agent routing, memory templates, section-level editing, and undo/revert remain deferred.
- Operators can inspect extension surfaces without leaving Settings or the right inspector. Implemented in Settings routes for Agents, Skills, Memory, and Taste with source/destination paths and previews.

## Phase 8: Transcript, Artifacts, And Multi-Session Workbench

Goal: make sessions durable, readable, artifact-aware, and reliable under daily-driver load.

Status on 2026-06-06: started. The first parser package added `src/core/transcriptParser.ts` and `tests/transcript-parser.test.ts` to normalize already-provided transcript JSONL text into typed user, assistant, tool, error, event, and unknown timeline entries. The parser preserves raw entries, records invalid JSONL lines as parse errors, ignores blank lines, and does not read, mutate, reveal, or infer state from transcript files. Validation receipts: `npm run typecheck`, `npx vitest run` -> `152/152`, and `npm run build`. Browser, Electron, PTY, headless, and real CLI smoke were not run for this package because no renderer, transport, session lifecycle, file access, command-builder, or runtime behavior changed.

Second status update on 2026-06-06: added `src/core/artifactDetection.ts` and `tests/artifact-detection.test.ts` as a pure, policy-aware artifact detector. It finds common relative and absolute file-like references in already-provided text, resolves relative paths against an explicit workspace root, normalizes allowed roots through realpath checks, rejects outside-root paths and symlink escapes, keeps missing in-root candidates for later existence checks, and returns rejection reasons for future UI. Validation receipts: `npm run typecheck`, `npx vitest run` -> `157/157`, and `npm run build`. This did not add preview reads, reveal actions, renderer UI, server routes, IPC, transcript mutation, session lifecycle changes, or Command Code invocation behavior.

Third status update on 2026-06-06: `TranscriptPreview` now renders parsed transcript timeline entries with user, assistant, tool, event, error, unknown, and all-entry filters while preserving raw transcript and raw-entry disclosures for debugging. It still uses the existing guarded `transport.readTranscript()` route and does not add server routes, renderer IPC, file access policy changes, transcript mutation, artifact preview reads, session lifecycle changes, response-ready inference, or Command Code invocation behavior. Validation receipts: `npm run typecheck`, `npx vitest run` -> `157/157`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57394/` serving `index-AP-RfVtB.js` and `index-DaU9l8ex.css`, built asset proof for `Transcript filters`, `Raw transcript`, `Raw entry`, and `transcript-timeline`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:63620`.

Fourth status update on 2026-06-06: transcript previews now surface explicit, click-to-open referenced artifact chips and route them into the existing right-inspector file preview. The renderer uses `src/renderer/src/services/transcriptArtifacts.ts` for browser-safe, selected-workspace suggestions only; actual file content reads still go through the existing guarded `FileViewer` -> `transport.readFile()` -> `/api/files/read` route. No new renderer IPC, server route, filesystem capability, auto-open behavior, write path, transcript mutation, session lifecycle change, or Command Code invocation behavior was added. Validation receipts: `npm run typecheck`, `npx vitest run` -> `159/159`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57395/` serving `index-mM3ke8qx.js` and `index-CgvJRcPm.css`, built asset proof for `Referenced artifacts`, `outside scope or unavailable`, `suggestTranscriptArtifacts`, and `transcript-artifacts`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:63992`.

Fifth status update on 2026-06-06: transcript workspaces now show read-only resume receipts for source file, session id, project, model, timestamp, and latest result/failure using existing transcript metadata and status state. This did not change resume command construction, session lifecycle, transport behavior, renderer IPC, file access, config writes, transcript mutation, or Command Code invocation behavior. Validation receipts: `npm run typecheck`, `npx vitest run` -> `159/159`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57396/` serving `index-C0-eDGSd.js` and `index-BWNvK0UU.css`, built asset proof for `Resume receipt`, `Source file`, `Session id`, `Latest result`, and `resume-receipt`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:64212`.

Sixth status update on 2026-06-06: the sidebar now distinguishes `Recent contexts` from `Live sessions` and adds compact metadata under rows: recent context source/date and live session readiness/runtime labels. This improves active-session visibility without changing session lifecycle, transcript discovery, resume behavior, terminal behavior, transport, renderer IPC, file access, config writes, or Command Code invocation behavior. Validation receipts: `npm run typecheck`, `npx vitest run` -> `159/159`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57397/` serving `index-B6d8s-38.js` and `index-iHF04H3r.css`, built asset proof for `Recent contexts`, `Live sessions`, `sessionVisibilityLabel`, and `sidebar-row-meta`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:64486`.

Seventh status update on 2026-06-06: active Command Code sessions now keep their own mounted `TerminalPane` while inactive panes are hidden, so tab switches and inspector/layout changes no longer clear the visible terminal buffer for the selected session. Only the active pane accepts input and sends resize events; inactive panes remain subscribed to their own session output. This did not add renderer IPC, server routes, broad shell/file capability, Command Code command changes, config writes, transcript mutation, or private runtime inference. Validation receipts: `npm run typecheck`, `npx vitest run` -> `159/159`, `npm run build`, `npm run smoke:browser`, `npm run smoke:pty`, built route token proof at `http://127.0.0.1:57398/` serving `index-BTmTf7TD.js` and `index-Cw9LExQE.css`, built asset proof for `terminal-pane-slot`, `terminal-pane-slot--active`, `activeRef`, and mapped terminal panes, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:64699`.

Eighth status update on 2026-06-06: `FileViewer` now treats `.html` and `.htm` as explicit fallback-to-source previews with a visible safety note. HTML content is not executed in the GUI preview. Validation receipts: `npm run typecheck`, `npx vitest run` -> `161/161`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57399/` serving `index-Cg2UA8m-.js` and `index-pRMa43Mm.css`, built asset proof for `HTML is shown as source`, `html-source`, `fileViewerMode`, and `not executed`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:64927`. This did not add sandbox execution, renderer IPC, server routes, new file access, config writes, or Command Code invocation behavior.

Ninth status update on 2026-06-06: added `tests/cli.test.ts` coverage proving a partial-input mock session remains active while another live mock session exits and a third session remains active, then the first session can still respond. Validation receipts: `npm run typecheck` and `npx vitest run` -> `162/162`. This is a regression proof only and does not change runtime code, renderer IPC, server routes, terminal behavior, config writes, or Command Code invocation behavior.

Tenth status update on 2026-06-06: `npm run smoke:browser` now includes repeatable three-session API coverage. The new `7.3b Multi-session independence` step starts three mock sessions, holds one at partial input, exits a second, verifies a third can still receive input, and cleans up the active sessions. Validation receipts: `npm run typecheck`, `npx vitest run` -> `162/162`, and `npm run smoke:browser` -> `7.3b Multi-session independence: PASS`.

Eleventh status update on 2026-06-06: right-inspector file previews now show source labels so project-file previews and transcript artifact previews stay visibly associated with their source. Artifact chips set labels such as `Artifact from <session>`; file-browser selections set `Project file`. Validation receipts: `npm run typecheck`, `npx vitest run` -> `162/162`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57400/` serving `index-Bmylt_JS.js` and `index-AJSFYY41.css`, built asset proof for `file-viewer-source`, `Artifact from`, `Project file`, `sourceLabel`, and `onSelectArtifact`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:49233`. This did not add renderer IPC, server routes, file access, write paths, session lifecycle changes, or Command Code invocation behavior.

Twelfth status update on 2026-06-06: the `Recent contexts` sidebar group now includes local search over discovered session title, id, transcript path, cwd, model, and source. Filtering stays presentation-only and does not change transcript discovery, resume behavior, session lifecycle, transport, file access, config writes, or Command Code invocation behavior. Validation receipts: `npm run typecheck`, `npx vitest run` -> `162/162`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57401/` serving `index-lMGg5-XN.js` and `index-wn1oizx1.css`, built asset proof for `Search contexts`, `sidebar-context-search`, `No contexts match`, `filteredRecentContexts`, and `recentContextQuery`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:49404`.

Thirteenth status update on 2026-06-06: live session tabs, the active-session header, and the `Live sessions` sidebar now use a shared `sessionReadinessDisplay()` formatter so attaching, replaying, running, waiting for input, response ready, completed, errored, and unread-output states are visibly labeled from existing reducer state. This improves presentation only; it does not add readiness events, terminal-output scraping, private runtime inference, notification dispatch, session lifecycle changes, transport changes, renderer IPC, file access, config writes, or Command Code invocation behavior. Validation receipts: `npm run typecheck`, `npx vitest run` -> `163/163`, `npm run build`, `npm run smoke:browser`, built route token proof at `http://127.0.0.1:57402/` serving `index-KrviLkPx.js` and `index-Bo3FjM3z.css`, built asset proof for `sessionReadinessDisplay`, `waiting for input`, `response ready`, `completed`, `unread output`, `tab-readiness--good`, and `tab-readiness--bad`, and Electron dev startup with Vite `5175` plus embedded app server `http://127.0.0.1:49704`.

Fourteenth status update on 2026-06-06: Phase 8 browser and Electron three-session UI dogfood passed in Demo mode through the rendered shell. Playwright against the built browser route at `http://127.0.0.1:57403/` created three sessions from the UI and verified three tab labels, `Live sessions` metadata, the active-session header, and an active terminal pane. Playwright's Electron launcher against the built app repeated the same three-session UI flow and saved `/tmp/ccgui-phase8-electron-three-session-dogfood.png`; browser screenshot receipt saved `/tmp/ccgui-phase8-three-session-dogfood.png`. Core Phase 8 session durability/readability/artifact association is validated. Editable labels/notes, safe bulk operations, rendered untrusted HTML, file reveal actions from artifact chips, and notification dispatch remain deferred behind their named persistence, file-access, and notification gates.

### Scope

- Parse transcript JSONL into readable conversation/timeline entries. Implemented for the transcript preview UI.
- Add transcript filters for user, assistant, tool/event, errors, hooks, and session lifecycle events. Implemented for parsed transcript preview kinds; deeper lifecycle state remains planned.
- Show resume receipts: source file, session id, cwd, model, timestamp, and resume result. Implemented as a read-only transcript workspace receipt card.
- Detect file paths referenced by terminal output and transcript entries.
- Surface generated or referenced files as session artifacts. Implemented for transcript preview suggestions that open the existing right-inspector file preview after an explicit click.
- Add right-inspector previews for rendered Markdown, rendered HTML, raw text, ANSI logs, and reveal-file actions. Existing right-inspector file preview is wired from transcript artifact chips for Markdown, raw text, and ANSI through the current guarded file-read route; safe rendered HTML and artifact-chip reveal actions remain deferred behind file-access and untrusted-rendering gates.
- Add safe HTML rendering rules, sandboxing, or fallback-to-source behavior. Implemented with explicit fallback-to-source behavior and safety copy for `.html` and `.htm` previews.
- Add session search, grouping, labels/notes, and safe bulk operations. Recent context search and sidebar grouping are implemented; editable labels/notes and bulk operations are deferred behind persistence and safe-bulk gates.
- Fix hidden/background terminal restoration so resize is not needed to repaint. Implemented by keeping one mounted terminal pane per live session and activating panes without clearing their buffers.
- Add explicit states for attaching, replaying, waiting for input, running, completed, errored, unread, and response-ready. Implemented as visible labels from the existing readiness reducer; notification dispatch and deeper runtime-state provenance remain planned/gated.
- Clarify sidebar naming and active-session visibility. Implemented with `Recent contexts` and `Live sessions` sidebar labels plus per-row source/date/readiness/runtime metadata.

### Likely Impacted Files

- `src/renderer/src/components/TerminalPane.tsx`
- `src/renderer/src/components/RightInspector.tsx`
- `src/renderer/src/components/TranscriptViewer.tsx`
- `src/renderer/src/components/FileViewer.tsx`
- `src/renderer/src/components/SessionTabs.tsx`
- `src/renderer/src/hooks/useSessions.ts`
- `src/renderer/src/services/sessionArtifacts.ts`
- `src/server/index.ts`
- `src/core/sessions.ts`
- `src/core/transcripts.ts`
- `src/shared/types.ts`
- file access policy modules from v0

Likely new files:

- `src/core/transcriptParser.ts`
- `src/core/artifactDetection.ts`
- `src/renderer/src/inspector/ArtifactPreview.tsx`
- `src/renderer/src/inspector/MarkdownPreview.tsx`
- `src/renderer/src/inspector/HtmlPreview.tsx`
- `src/renderer/src/inspector/AnsiPreview.tsx`

### Tests And Proof

- Transcript parser handles JSONL user, assistant, tool, error, and unknown entries. Implemented and validated in `tests/transcript-parser.test.ts`; hook/system event entries and invalid JSONL parse errors are covered too.
- Artifact detector finds relative and absolute paths in terminal/transcript text within allowed roots. Implemented and validated in `tests/artifact-detection.test.ts`.
- Artifact detector rejects paths outside allowed roots and symlink escapes. Implemented and validated in `tests/artifact-detection.test.ts`.
- Markdown preview renders `.md` files. Existing `FileViewer` Markdown rendering is reachable from transcript artifact chips through the right inspector.
- HTML preview is sandboxed or falls back safely. Implemented as source-only fallback with a visible non-execution note.
- Active sessions restore visually after tab changes, inspector resizing, and terminal input toggles. Implemented for tab/layout restoration with mounted per-session panes; manual multi-session dogfood remains part of Phase 8 closeout.
- One blocked interactive session does not block rendering or state in other sessions. Mock session independence is covered in `tests/cli.test.ts` and `npm run smoke:browser`; manual UI dogfood remains part of Phase 8 closeout.
- Per-session artifacts remain associated with the correct session. Implemented with right-inspector file preview source labels for transcript artifact chips.
- Live session readiness states are visibly labeled. Implemented with `sessionReadinessDisplay()` coverage in `tests/session-readiness.test.ts` and wired to tabs, the active-session header, and the sidebar.
- `npm run typecheck`
- `npx vitest run`
- Browser/Electron dogfood with at least three sessions. Passed in Demo mode through Playwright against the built browser route and built Electron app on 2026-06-06; screenshots saved under `/tmp/ccgui-phase8-three-session-dogfood.png` and `/tmp/ccgui-phase8-electron-three-session-dogfood.png`.

### Operational Cleanliness

- Do not mutate transcript files.
- Do not auto-open generated files without user action.
- Keep artifact preview read-only unless an explicit editor is implemented and scoped. Implemented for transcript artifact chips by reusing the existing read-only `FileViewer`.
- Treat HTML as untrusted content.
- Do not let terminal path detection bypass file access policy.
- Preserve raw transcript access for debugging. Implemented in the parsed transcript preview with raw transcript and raw-entry disclosures.

### Agent Parallelization

Parallel-friendly:

- One agent can build transcript parser tests.
- One agent can build artifact detection and access-policy tests.
- One agent can implement inspector previews.
- One agent can reproduce multi-session terminal restore bugs.

Sequential:

- File access policy must be stable before artifact preview reads files.
- Artifact detection must land before inspector UI depends on artifact metadata.
- Multi-session terminal fixes should be coordinated by one agent because TerminalPane/session state changes are tightly coupled.

### Acceptance

- Active sessions restore visually after tab changes, inspector resizing, and terminal input mode changes.
- One blocked interactive session does not block output rendering or session state in other tabs.
- A file created or referenced by an agent session can be opened in the right inspector without leaving the session view.
- Rendered Markdown and HTML previews are safe, scoped, and visibly tied to a file path.

## Phase 9: Native Workbench Polish

Goal: close the gap between functional adapter and natural desktop workbench.

### Scope

- Improve popover anchoring, responsive positioning, Escape/click-outside behavior, and attachment cues.
- Make the right inspector behave like a native companion pane for files, docs, transcripts, hooks, MCP, and session artifacts.
- Add restrained page transitions, panel slide-ins, loading skeletons, and resize-to-collapse.
- Make update indicator easier to see.
- Wire git environment state into the workspace header.
- Improve PTY doctor integration and failure diagnostics.
- Add optional native workbench affordances: file search/create/rename/delete, IDE launch/config, branch switcher/diff, terminal tabs/history/profiles, and release-note fetching.
- Add fine-grained theme controls such as accent color, grid opacity, terminal font size, and app density.

### Likely Impacted Files

- `src/renderer/src/components/Sidebar.tsx`
- `src/renderer/src/components/RightInspector.tsx`
- `src/renderer/src/components/TerminalPane.tsx`
- `src/renderer/src/components/ProjectPicker.tsx`
- `src/renderer/src/components/PermissionPopover.tsx`
- `src/renderer/src/components/ReleaseNotes.tsx`
- `src/renderer/src/components/GitEnvironmentStatus.tsx`
- `src/renderer/src/styles.css`
- `src/renderer/src/settings/AppearanceSettings.tsx`
- `src/server/index.ts` for git/IDE/file capabilities if implemented
- `docs/guides/DESIGN_STYLE_GUIDE.md`

### Tests And Proof

- Popovers remain anchored at desktop and narrow widths.
- Escape and outside-click dismissal work independently per popover.
- Sidebar/panel resize-to-collapse works and persists preference.
- Motion does not cause layout overlap or unreadable text.
- Git status displays actual project state or a clear unavailable state.
- Optional file/IDE/git actions are scoped and reversible.
- Browser/Electron screenshots across desktop and narrow widths.
- `npm run typecheck`
- `npx vitest run`

### Operational Cleanliness

- Do not let polish expand the app into a full IDE without explicit scope approval.
- Keep file mutation features behind access policy and confirmation.
- Keep motion restrained and accessible.
- Keep theme controls token-based; avoid one-off color overrides.
- Treat release fetching as optional and failure-tolerant.

### Agent Parallelization

Parallel-friendly:

- One agent can fix popover anchoring.
- One agent can implement motion/loading states.
- One agent can improve appearance settings.
- One agent can wire git status display.

Sequential:

- Right inspector artifact work should finish before broader inspector polish.
- File/IDE/git mutation features need policy review before UI implementation.
- Theme token changes should be coordinated to avoid CSS churn.

### Acceptance

- Visual polish is verified in Browser/Electron screenshots.
- File, IDE, git, and release-note features stay scoped so the GUI does not become a broad IDE clone.
- The app feels cohesive under normal daily-driver flows: start session, switch tabs, inspect artifact, change settings, return to session.

## Phase 10: Validation, Docs, And Contributor Enablement

Goal: make v1 changes safe to maintain by a growing community.

Early scaffold status on 2026-06-06: started. `docs/reports/V1_VALIDATION_TEMPLATE.md` now provides the reusable package validation receipt template for V1 work. `tests/settings-registry.test.ts` adds executable coverage for the Settings Center registry, search filtering, group order, and route coverage without adding runtime behavior.

Status update 2026-06-06: MCP reference docs package added `docs/reference/command-code-docs/mcp.md` and linked it from the local Command Code docs index. The page records current installed `cmd mcp` help evidence for add, add-json, remove, and auth command shapes; names implemented Settings > MCP surfaces; and keeps add/remove/auth-clear mutation, config editing, diagnostics, and secret persistence behind explicit gates. This package did not change runtime code, renderer IPC, file access, config writes, CLI arguments, or session lifecycle. Validation receipts: `npm run typecheck`, `cmd mcp --help`, `cmd mcp add --help`, `cmd mcp add-json --help`, `cmd mcp remove --help`, `cmd mcp auth --help`, `rg --files docs/reference/command-code-docs`, and `rg -n "add-json|client-secret|Open Gates|Current GUI status" docs/reference/command-code-docs/mcp.md docs/reference/command-code-docs/README.md`.

### Scope

- Keep local Command Code docs under `docs/reference/command-code-docs/`.
- Add focused docs for hooks, MCP, design, tools, and GUI implications.
- Keep `docs/architecture/V1_ARCHITECTURE.md` aligned with implementation.
- Add renderer component tests, transport tests, config reader/writer tests, session lifecycle tests, command-preview tests, and artifact-preview tests.
- Add regression coverage for multi-session output restoration, blocked terminal input, per-session model labels, and response-ready notifications.
- Capture Browser/Electron screenshots or runtime receipts for UI changes.
- Add contributor guidance for phase sequencing, agent handoff, and proof receipts.

### Likely Impacted Files

- `docs/INDEX.md`
- `docs/architecture/V1_ARCHITECTURE.md`
- `docs/reference/command-code-docs/README.md`
- `docs/reports/SMOKE_TEST_REPORT.md`
- `docs/reports/TEST_PLAN.md`
- `README.md`
- `tests/*`
- `scripts/smoke-*`
- `package.json`

Likely new files:

- `docs/contributors/V1_IMPLEMENTATION_GUIDE.md`
- `docs/reference/command-code-docs/hooks.md`
- `docs/reference/command-code-docs/mcp.md`
- `docs/reference/command-code-docs/design.md`
- `docs/reference/command-code-docs/tools.md`
- `docs/reports/V1_VALIDATION_TEMPLATE.md`

### Tests And Proof

- `npm run typecheck`
- `npm run build`
- `npx vitest run`
- Smoke scripts for browser, Electron, mock, real headless, real interactive, and artifact preview where available.
- Screenshot or receipt bundle for each merged UI phase.
- Docs index includes every new doc.
- Roadmap status is updated after each phase.

### Operational Cleanliness

- Keep docs local, source-cited, and dated when they summarize external docs.
- Do not claim production-ready behavior without runtime proof.
- Keep validation templates short enough that contributors actually use them.
- Preserve old reports when useful, but mark stale reports clearly.
- Keep "blocked", "implemented", "validated", and "deferred" separate.

### Agent Parallelization

Parallel-friendly:

- One agent can maintain docs index and local docs.
- One agent can add test infrastructure.
- One agent can build validation templates.
- One agent can update README and contributor guidance.

Sequential:

- Final smoke report must happen after implementation and test work.
- Roadmap closeout should be done by one coordinating agent after all proof is collected.

### Acceptance

- TypeScript passes.
- Mock mode works.
- Real CLI paths are smoke-tested or explicitly marked untested.
- Docs do not claim behavior that is only planned or discussion-only.
- Contributors can read the architecture docs, roadmap, and validation template and understand where to work next.

## Phase 11: Post-V1 Plugin And Capability Incubation

Goal: define a safe path for heavier, optional capabilities that build on v1 without bloating the core GUI.

This phase is intentionally post-v1 unless explicitly re-scoped. V1 should prepare the seams; plugin incubation should own heavyweight dependencies, installation flows, and experimental orchestration.

### Candidate Capabilities

- Visual `/design` mode inspired by Cursor Design Mode: select a live UI element, multi-select related elements, draw over a frozen frame, attach a screenshot, narrate a change, and route that structured visual context into `/design`.
- Preferred vision-model adapter for `/configure-models`: let a user configure a local or remote vision model that turns images/screenshots into text context for a non-vision coding model.
- Local vision-language model plugin examples such as NVlabs Eagle paired with local coding models.
- Community notification/audio packs such as command-code-bonk-style Stop hooks.
- Capability packs for domain workflows that combine hooks, MCP servers, command recipes, docs, and settings panels.

### Conceptual Architecture

- Plugin manifest declares id, name, description, version, capability type, minimum app version, required commands, required runtimes, config paths, health checks, and uninstall/disable behavior.
- Capability registry exposes plugin entry points into Settings, command palette, right inspector, and workflow helpers.
- Plugin setup previews every command and file write before execution.
- Plugin health check verifies dependencies without starting user work.
- Plugin receipts show installed files, modified config, last health result, and last run result.
- Plugins can contribute local docs pages and workflow recipes.
- Plugins cannot bypass file access policy, renderer sandbox, or Command Code ownership boundaries.

### Visual Design Mode Plugin Sketch

Inspired by Cursor's design-mode pattern, the useful unit is not just a prompt; it is prompt plus visual target context.

Potential context packet:

- target app URL or local route
- screenshot or frozen frame path
- selected element identity, such as DOM path, accessible name, attributes, dimensions, computed styles, and nearest component/file hint when available
- multi-selected element relationships
- drawn annotation path or bounding boxes
- voice transcript
- operator prompt
- target mode for `/design`, such as surface, responsive, interaction, relayout, recolor, or finish
- exact command preview and destination session

Likely impacted future files:

- `src/renderer/src/workflows/VisualDesignMode.tsx`
- `src/renderer/src/inspector/ScreenshotAnnotator.tsx`
- `src/renderer/src/services/domCapture.ts`
- `src/renderer/src/services/voiceInput.ts`
- `src/core/pluginManifest.ts`
- `src/core/capabilityRegistry.ts`
- `src/server/index.ts` for safe screenshot and local route capture if needed

Required proof:

- Capture works only against allowed local/browser targets.
- Screenshot storage path is explicit and clearable.
- DOM capture does not include secrets beyond the selected page context.
- Voice transcription dependency is explicit and optional.
- Generated `/design` command/context can be reviewed before sending.
- Visual context does not silently mutate files.

### Preferred Vision-Model Plugin Sketch

The goal is to let models without native image input use a configured "vision adapter" that converts images or screenshots into text context before the coding model receives the task.

Potential adapter contract:

- adapter name and provider
- local or remote endpoint
- supported input types: image, screenshot, video frame, PDF page
- output type: caption, OCR, structured UI description, object list, layout map, or freeform answer
- model/runtime requirements
- GPU/CPU/memory requirements
- install commands or external setup docs
- test image diagnostic
- privacy mode and retention policy
- failure fallback when vision processing fails

Likely impacted future files:

- `src/core/visionAdapters.ts`
- `src/renderer/src/settings/VisionModelSettings.tsx`
- `src/renderer/src/workflows/ImageContextHelper.tsx`
- `src/renderer/src/inspector/ImagePreview.tsx`
- `src/core/capabilityRegistry.ts`
- `docs/reference/plugins/vision-adapters.md`

Required proof:

- Adapter health check shows minimum requirements and current status.
- A test image produces a visible text description.
- The generated text context is visible before being sent to the coding model.
- Image files stay within approved roots or explicit user-selected attachments.
- The UI never claims the coding model saw the image directly when it only received adapter text.

### Operational Cleanliness

- Keep plugin execution opt-in.
- Require explicit install, enable, disable, and uninstall paths.
- Never install heavyweight dependencies silently.
- Keep all plugin-added config file-backed and inspectable.
- Prefer local docs and receipts over chat-only setup instructions.
- Treat GPU, Python, container, browser automation, microphone, and screenshot permissions as high-friction capabilities that require clear user consent.

### Agent Parallelization

Parallel-friendly:

- One agent can design plugin manifest schema.
- One agent can design visual design context packet.
- One agent can design vision-adapter contract.
- One agent can draft local plugin docs and examples.

Sequential:

- Capability registry and manifest schema must land before any real plugin UI.
- Visual design capture should wait until file access, screenshot storage, and browser target policy are agreed.
- Vision adapter setup should wait until install/health-check/uninstall semantics are agreed.

### Acceptance

- Post-v1 plugin direction is documented without blocking v1.
- V1 helper surfaces are designed so visual design and vision adapters can plug in later.
- Heavy dependencies and permissions are not introduced into core v1 by accident.

## Needs Upstream Verification Before Implementation

These items should not be implemented as stable GUI features until Command Code behavior is documented or verified:

- Pre-session, post-session, file-change, and custom-command hooks outside documented Command Code hook events.
- Full CRUD for skills and taste confidence.
- Agent defaults and per-agent model overrides if not documented by Command Code.
- Parsing or editing model routing tables beyond documented config/CLI behavior.
- Model pricing/context metadata unless provided by a documented source.
- IDE, git, and file CRUD expansion that could cross the GUI-adapter boundary.
- Any behavior that depends on private Command Code APIs.
- Plugin mutation of Command Code config beyond documented config paths.
- Vision-model routing inside `/configure-models` unless Command Code exposes a documented adapter/routing contract.
- Visual design mode claims about component/file identity unless DOM capture, source mapping, or framework metadata is verified.

## Phase Splitting Guidance

Good parallel work packages:

- Documentation and local reference summaries.
- Pure parser/config modules plus tests.
- Search/index registries.
- Read-only UI migrations.
- Screenshot/visual verification tasks after a branch is runnable.

Work that should stay sequential:

- `App.tsx` extraction and shared state ownership.
- Transport/session lifecycle changes.
- File access policy and write-capable editors.
- Notification readiness semantics.
- Per-session model metadata.
- Any shared styling/token rewrite.

Review rule:

- If two agents touch the same state owner, transport boundary, or settings persistence module, coordinate through one lead agent before merging.
- If a task changes runtime truth, require proof from Browser or Electron, not only tests.
- If a task changes a config write path, require a destination-path screenshot or receipt.
