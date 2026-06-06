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

Status on 2026-06-06: started. First read-only settings architecture package added `src/renderer/src/settings/settingsRegistry.tsx`, expanded the settings section taxonomy, replaced the settings search placeholder with real registry filtering, and added read-only placeholder pages for new Phase 2 sections. This package did not add config writes, persistence changes, server routes, or Command Code settings mutation. Validation receipts: `npm run typecheck`, `npx vitest run` -> `41/41`, `npm run build`, `npm run smoke:browser`, built browser route token proof at `http://127.0.0.1:5193/`, and Electron dev startup with embedded app server `http://127.0.0.1:62462`.

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

### Scope

- Fold AdvancedPanel content into Settings as first-class sections. Read-only replacement coverage is started; AdvancedPanel removal remains gated by `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md`.
- Add or complete sections: General, Runtime, Models, Hooks, MCP, Agents, Skills, Design, Memory, Taste, Notifications, Terminal, Keyboard, Data, About, and Advanced Diagnostics.
- Implement real settings search or remove the placeholder until search exists.
- Populate Integrations with actual integration management or remove the dead section. Started with the read-only Settings hub; write-capable integration management remains gated.
- Redesign Profile into an actionable dashboard or collapse it into General. Started with read-only dashboard shortcuts to the active Settings sections.
- Add terminal settings for font size, scrollback, bell, cursor, line height, history, and profile where supported. Renderer-local font size, line height, scrollback, and cursor blink controls are implemented; bell behavior, profiles, history controls, and live PTY geometry updates remain planned.
- Add notification settings for toast/audio categories, quiet mode, per-session readiness, hook-triggered alerts, and volume. Existing GUI toast/audio category and volume controls are implemented through renderer-local preferences; OS notifications, quiet mode, hook-triggered alerts, and readiness remain planned.
- Add keyboard shortcut reference and visible accelerator hints. Keyboard now shows grouped shortcuts and command examples, and existing New Session, Send, and Menu Input controls show accelerator hints; shortcut remapping remains planned.
- Add startup behavior settings: default project, window restore, startup session behavior. Startup project behavior is implemented as an app GUI preference; window restore and automatic session start/resume remain planned.
- Add data controls: transcript deletion, cache clearing, preference reset, export/import.
- Add About/version/release-history/update visibility. About now shows update state plus bundled release-note history; update checks remain user-triggered by existing controls.
- Add loading states and undo/revert affordances for editable settings where appropriate. Existing editable Settings controls now show destination labels; future write-capable sections remain gated by `docs/reports/SETTINGS_PERSISTENCE_GATE.md`.

### Likely Impacted Files

- `src/renderer/src/App.tsx`
- `src/renderer/src/components/SettingsPanel.tsx` or equivalent
- `src/renderer/src/components/AdvancedPanel.tsx`
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
- Renderer-local toast/audio notification preferences persist and load. OS notifications, hook-triggered alerts, quiet mode, and readiness remain planned.
- Renderer-local terminal presentation preferences persist and load without breaking xterm. Bell behavior, profiles, history controls, and live PTY geometry updates remain planned.
- Editable settings show destination path before write. Implemented for existing editable GUI preference controls; future write-capable sections remain gated.
- Browser/Electron screenshots for Settings at desktop and narrow widths.
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

- AdvancedPanel removal must wait until replacement routes exist.
- Shared settings persistence and scope model must be defined before individual editable sections write config.
- UX naming and section taxonomy should be decided before parallel UI implementation.

### Acceptance

- Settings navigation is the only primary path for configuration.
- No daily workflow is hidden behind a generic Advanced modal.
- Every editable setting shows ownership and destination before write.
- Integrations and Profile are either useful or removed/reframed.

## Phase 3: Hooks And Notifications

Goal: make hooks and alerts configurable without hardcoded app behavior.

### Scope

- Add Settings > Hooks.
- Read hook config from documented user/project scopes.
- Surface `.commandcode/settings.json` and `~/.commandcode/settings.json`.
- Show hook event, matcher, command, timeout, blocking behavior, execution order, enabled state, and source scope.
- Validate hook JSON before writing.
- Preserve project-over-user precedence.
- Add enable/disable controls per hook.
- Add hook logs/output viewer where logs are available.
- Add a test payload runner so users can validate hook behavior before real sessions.
- Add examples for dangerous shell blocking, sensitive read warnings, write auditing, and Stop-hook finish notifications.
- Document and support a community-style Stop-hook notification/audio recipe compatible with `vipulgupta2048/command-code-bonk`.
- Replace terminal data-length notification heuristics with explicit session lifecycle state.
- Track per-session unread, response-ready, and input-required state.
- Notify only when background sessions produce ready output or require operator input.

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
- `src/renderer/src/services/sessionReadiness.ts`

### Tests And Proof

- Hook config parser handles empty, user-only, project-only, and merged configs.
- Invalid hook JSON is rejected before write.
- Test payload runner executes or dry-runs without starting a real session.
- Opening/attaching/returning to a session does not produce response-ready toast.
- Background session output produces one appropriate unread/ready notification.
- Input-required state produces a distinct notification.
- Notification preferences suppress or enable categories correctly.
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

### Scope

- Replace static command buttons with searchable command/workflow palette.
- Add fuzzy search over commands, settings, projects, sessions, agents, skills, docs, and recent workflows.
- Add recipes for interactive, headless, plan, design, resume, continue, configure models, MCP setup, hook setup, notification setup, and agent creation.
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

### Scope

- Move MCP into Settings/Integrations as a first-class workflow.
- Show server scope, config path, transport, auth state, connection state, tool count, and error text.
- Add guided add flows for HTTP, stdio, and JSON config.
- Preview `cmd mcp ...` commands before mutating MCP state.
- Add server edit, tool browser, connection test, diagnostics, and log viewing.
- Explain permission prompts and plan-mode tool restrictions.
- Avoid storing MCP secrets in GUI preferences.

### Likely Impacted Files

- `src/renderer/src/components/AdvancedPanel.tsx`
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

- MCP secrets are not stored in GUI preferences.
- Project/user/local scope is explicit before every MCP write.
- MCP tools are discoverable with status and failure text.

## Phase 7: Agents, Skills, Memory, And Taste

Goal: make community extension surfaces understandable and scoped.

### Scope

- Move agents, skills, memory, and taste into Settings or contextual inspectors.
- Add agent manager with project/global scope, templates, validation, and destination paths.
- Improve skills browsing and activation visibility.
- Add memory preview, templates, section editing, validation, and undo/revert.
- Improve taste readability and ownership labeling.
- Add import/export/reset only where semantics are documented or clearly GUI-owned.
- Mark unsupported CRUD behavior as blocked or experimental until upstream behavior is verified.

### Likely Impacted Files

- `src/renderer/src/components/AdvancedPanel.tsx`
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

- The GUI does not invent Command Code semantics for skills, taste confidence, or default agent/model behavior.
- Any CRUD behavior that depends on upstream semantics is verified first or marked experimental.
- Operators can inspect extension surfaces without leaving Settings or the right inspector.

## Phase 8: Transcript, Artifacts, And Multi-Session Workbench

Goal: make sessions durable, readable, artifact-aware, and reliable under daily-driver load.

### Scope

- Parse transcript JSONL into readable conversation/timeline entries.
- Add transcript filters for user, assistant, tool/event, errors, hooks, and session lifecycle events.
- Show resume receipts: source file, session id, cwd, model, timestamp, and resume result.
- Detect file paths referenced by terminal output and transcript entries.
- Surface generated or referenced files as session artifacts.
- Add right-inspector previews for rendered Markdown, rendered HTML, raw text, ANSI logs, and reveal-file actions.
- Add safe HTML rendering rules, sandboxing, or fallback-to-source behavior.
- Add session search, grouping, labels/notes, and safe bulk operations.
- Fix hidden/background terminal restoration so resize is not needed to repaint.
- Add explicit states for attaching, replaying, waiting for input, running, completed, errored, unread, and response-ready.
- Clarify sidebar naming and active-session visibility.

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

- Transcript parser handles JSONL user, assistant, tool, error, and unknown entries.
- Artifact detector finds relative and absolute paths in terminal/transcript text within allowed roots.
- Artifact detector rejects paths outside allowed roots and symlink escapes.
- Markdown preview renders `.md` files.
- HTML preview is sandboxed or falls back safely.
- Active sessions restore visually after tab changes, inspector resizing, and terminal input toggles.
- One blocked interactive session does not block rendering or state in other sessions.
- Per-session artifacts remain associated with the correct session.
- `npm run typecheck`
- `npx vitest run`
- Browser/Electron dogfood with at least three sessions.

### Operational Cleanliness

- Do not mutate transcript files.
- Do not auto-open generated files without user action.
- Keep artifact preview read-only unless an explicit editor is implemented and scoped.
- Treat HTML as untrusted content.
- Do not let terminal path detection bypass file access policy.
- Preserve raw transcript access for debugging.

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
