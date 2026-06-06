# V1 Architecture Direction

This document is the working architecture direction for the post-hardening app. The current `ROADMAP.md` remains the v0 roadmap until the hardening gate is closed. V1 begins after the app can truthfully prove mock, real PTY, browser, Electron, headless, auth, replay, and filesystem safety.

## Goals

- Keep Command Code CLI as the engine and execution source of truth.
- Keep code layers small enough for community contributors to understand quickly.
- Make new product surfaces extensible without turning `App.tsx` into the application boundary.
- Keep GUI-owned preferences separate from Command Code-owned configuration.
- Make advanced workflows natural without hiding risky execution modes.
- Prefer testable pure helpers and narrow transport contracts over renderer-side heuristics.

## Non-Goals

- Do not reimplement Command Code runtime semantics.
- Do not infer private Command Code state from terminal scraping.
- Do not give the renderer broad shell or filesystem capability.
- Do not make hooks, MCP, agents, skills, memory, or design helpers silent mutators.
- Do not treat a nice UI as proof that the underlying runtime path is validated.

## Layer Model

```text
Renderer features
  ShellLayout
  Workspaces
  Settings Center
  Workflow Helpers
  Inspectors
  Shared UI primitives
        |
        v
Renderer feature hooks
  useSessions
  useRuntimeHealth
  useAppPreferences
  useProjectPreferences
  useCommandPalette
  useConfigSurfaces
        |
        v
TransportAPI
  typed client boundary for server capabilities
        |
        v
Local server
  auth, routing, websocket sessions, scoped file/config access
        |
        v
Core adapters
  sessions, cli args, discovery, docs index, config readers/writers
        |
        v
Command Code CLI
  cmd interactive PTY, cmd --print, cmd mcp, slash commands, docs-owned semantics
```

## Renderer Modules

V1 should split `src/renderer/src/App.tsx` into modules with clear ownership:

| Module | Owns | Does Not Own |
|---|---|---|
| `ShellLayout` | sidebar, route chrome, resizable panes | session orchestration |
| `HomeWorkspace` | new-session composer and entry state | runtime diagnostics internals |
| `SessionWorkspace` | active session layout, terminal, composer | PTY implementation |
| `TranscriptWorkspace` | parsed transcript and resume UX | transcript file mutation |
| `SettingsWorkspace` | app/project preferences and config surfaces | private Command Code semantics |
| `RightInspector` | contextual file, env, docs, transcript, IDE views | global navigation |
| `CommandPalette` | searchable actions and slash-command helpers | hidden command execution |
| `WorkflowHelpers` | guided `/design`, `/agents`, `/mcp`, hooks setup | silent changes to project config |

Components should stay presentation-focused. Hooks can coordinate state, but transport calls should remain typed and easy to test.

Current extraction status on 2026-06-06:

- `src/renderer/src/layout/ShellLayout.tsx` owns shell chrome, sidebar navigation, settings navigation rows, sidebar CSS sizing variables, and update/footer controls.
- `src/renderer/src/components/ComposerBar.tsx` owns the shared prompt composer presentation used by home and session views.
- `src/renderer/src/workspaces/HomeWorkspace.tsx` owns new-session home presentation and home status rows.
- `src/renderer/src/workspaces/SessionWorkspace.tsx` owns active session workbench presentation, tab/terminal layout, bottom terminal presentation, and the workbench tool rail.
- `src/renderer/src/workspaces/SettingsWorkspace.tsx` owns the Settings shell while route content lives in the Phase 2 settings modules.
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx` owns transcript presentation and inline transcript preview.
- `src/renderer/src/inspectors/RightInspectorPanel.tsx` owns right-inspector presentation and environment display.
- `src/renderer/src/components/AppPopovers.tsx` owns existing project, runtime, permission, model, and slash-command popover presentation.
- `src/renderer/src/components/ReleaseNotesModal.tsx` owns release-note modal presentation.
- `src/renderer/src/commandPalette.ts` owns command palette item and release-note metadata.
- `src/renderer/src/commandPalette/search.ts` owns command/workflow/settings/project/docs search scoring for the slash popover.
- `src/renderer/src/commandPalette/workflowRecipes.ts` owns declarative workflow recipes and explicit Settings route targets for Settings-backed recipes.
- `src/renderer/src/commandPalette/commandPreview.ts` owns display-only execution labels for existing command rows: active-session send, composer insert, and headless run.
- `src/renderer/src/commandPalette/docs.ts` owns local docs topic metadata for palette discoverability.
- `src/renderer/src/workflows/DesignHelper.tsx` and `src/renderer/src/workflows/AgentHelper.tsx` own preview-only guided helper presentation for `/design` and agent drafts.
- `src/renderer/src/hooks/useDismissiblePopover.ts` owns outside-click and Escape-key popover dismissal.
- `src/renderer/src/App.tsx` still owns runtime state coordination, transport calls, session lifecycle, terminal input state, app/project preference persistence, settings section selection, popover state transitions, release-note state, and command execution handling until later gated packages move those boundaries.

Deferred Phase 1 hook boundaries:

- Session lifecycle hooks are deferred because they affect transport/session lifecycle truth.
- Runtime health hooks are deferred because they affect runtime truth and PTY availability claims.
- App and project preference hooks are deferred because they affect shared settings persistence.

Dead UI audit:

- `docs/reports/PHASE1_DEAD_UI_AUDIT.md` documents the audit and validated cleanup of unreferenced legacy components, an unreachable `mode` popover branch, and stale CSS selectors.
- Broader CSS module/token separation remains planned and should be kept separate from Phase 2 Settings Center expansion.

## Settings Center

Settings should become the natural home for configuration, not just a profile/status page.

Current implementation status on 2026-06-06:

- Phase 2 Settings Center is complete and validated for the current V1 contract. Remaining risky/destructive or upstream-owned actions are explicitly marked planned, gated, or blocked rather than hidden behind a generic modal.
- `src/renderer/src/settings/settingsRegistry.tsx` owns the searchable settings section registry and Phase 2 taxonomy.
- `ShellLayout` renders registry-backed settings navigation and filters sections through the settings search input.
- `SettingsWorkspace` renders read-only placeholder pages for newly registered Phase 2 sections until each section has a validated replacement path.
- `src/renderer/src/settings/AdvancedReadOnlySettings.tsx` renders Settings-hosted Project state, Data, and Sessions views.
- `src/renderer/src/settings/AgentsSettings.tsx`, `SkillsSettings.tsx`, `MemorySettings.tsx`, and `TasteSettings.tsx` own the Phase 7 extension-surface Settings presentation.
- `src/renderer/src/settings/SettingsReadOnlyCard.tsx` owns the shared read-only Settings card frame for extension and integration surfaces.
- `src/renderer/src/settings/ReferenceSettings.tsx` renders reference views for Keyboard, Models, Design, Hooks, and About, plus renderer-local Notifications and Terminal preference pages.
- `src/renderer/src/settings/CoreSettings.tsx` renders existing Profile, General, Runtime, Appearance, Usage, Integrations, and Advanced presentation sections while preserving their existing callbacks.
- `src/renderer/src/settings/SettingsRoutes.tsx` owns the Settings section dispatcher, shared frame, and placeholder fallback so `SettingsWorkspace` stays a shell container.
- Integrations is now a read-only Settings hub that routes to MCP, Hooks, Agents, Skills, Design, Memory, and Taste replacement sections without adding connect, edit, save, auth, or config mutation actions.
- Profile is now an actionable Settings dashboard that routes to General, Runtime, Usage, Project state, and Integrations while preserving its runtime receipt display.
- Existing editable Settings controls now show GUI preference destination labels for command binary, onboarding, permissions, trust, model, and appearance.
- Usage now includes the existing Command Code usage summary refresh alongside local headless history, using the pre-existing `transport.usage` capability.
- Skills now include read-only content preview expansion in Settings while insert/use actions remain planned.
- Skills now show discovered source paths, derived read-only source labels for current discovery roots, and explicit insert/use unavailability without executing skill commands.
- Sessions now include discovery, project-session resume, and transcript reveal actions in Settings using existing App/transport paths.
- MCP now shows connect/disconnect command previews and execution in Settings using the existing `transport.mcpAction` path.
- Notifications now edits the existing renderer-local toast/audio preference keys (`ccgui.toast-preferences`, `ccgui.audio-preferences`) through `src/renderer/src/settings/notificationPreferences.ts`; OS notifications, hook alerts, quiet mode, and session readiness remain planned.
- Terminal now edits renderer-local xterm presentation preferences (`ccgui.terminal-preferences`) through `src/renderer/src/settings/terminalPreferences.ts`; PTY lifecycle, shell selection, live resize behavior, profiles, and bell behavior remain planned.
- About now renders bundled release-note history from `src/renderer/src/commandPalette.ts` without running update checks or changing release-note dismissal state.
- Keyboard now shows grouped shortcut references and Command Code command examples in Settings, with visible accelerator hints added to existing New Session, Send, and Menu Input controls. Shortcut remapping remains planned.
- General now includes app-owned startup project behavior (`startupProjectBehavior`) for restoring the last selected project or opening without a project on app preference hydration. Window restore and session auto-start/resume remain planned.
- Data now includes a read-only data-controls gate card and `docs/reports/DATA_CONTROLS_GATE.md`; transcript deletion, cache clearing, preference reset, export, and import remain blocked until scoped routes and path validation tests exist.
- Sessions now includes project-session resume and transcript reveal actions in Settings using existing App/transport paths; no terminal-output inference or new IPC was added.
- MCP now includes connect/disconnect execution in Settings using the existing `transport.mcpAction` path and visible command previews. Add, remove, and auth actions remain gated.
- Agents now includes project-scoped discovery, read-only raw-content previews, and explicit edit/save in Settings using the existing `transport.saveAgent` route. Destination paths are visible before edit/save, project agents are editable, user/global agents are marked read-only, and server validation keeps writes under the selected project `.commandcode/agents/` root.
- Memory now includes read-only previews plus explicit edit/save in Settings using the existing `transport.saveMemory` route. Destination paths are visible in preview and edit states, and server validation keeps writes to `COMMANDCODE.md`, `AGENTS.md`, `CLAUDE.md`, or `.commandcode/memory/` under the selected project root.
- Taste now shows read-only package paths, category confidence, learning snippets, and Command Code-owned labels using the existing `transport.listTaste()` payload. Taste CRUD and confidence semantics remain Command Code-owned.
- Phase 7 extension surfaces are complete for the current V1 contract. Memory templates, section-level editing, undo/revert, import/export/reset, skill activation, skill/taste CRUD, default-agent routing, and taste confidence semantics remain deferred behind persistence/write gates and upstream verification.
- Advanced now routes to explicit Settings diagnostics sections. The legacy `AdvancedPanel` modal and its launch hooks have been removed after Settings replacements and safe click-through receipts landed.
- No renderer IPC expansion or Command Code settings mutation was added by these Settings Center packages.
- `docs/reports/SETTINGS_PERSISTENCE_GATE.md` defines the Phase 2 ownership boundary for GUI-owned preferences versus Command Code-owned `settings.json` before additional editable sections add writes.
- `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md` records the AdvancedPanel replacement coverage and removal receipts.

## Hooks And Notifications

Phase 3 has started with a pure parser/gate package:

- `src/core/hooksConfig.ts` parses documented Command Code hook settings from raw `settings.json` text and preserves source scope/path, event, matcher, command, timeout, enabled state, display order, and blocking capability.
- Project hooks are ordered before user hooks for display because project scope takes precedence over user scope.
- Invalid JSON and invalid hook shapes fail before any future write path can use them.
- `/api/hooks/configs` and `transport.discoverHookConfigs(cwd)` provide read-only discovery for exactly `~/.commandcode/settings.json` and `<project>/.commandcode/settings.json`; the project path is derived from the existing workspace root resolver and file reads are capped at 1 MB.
- `/api/hooks/preview-toggle` and `transport.previewHookToggle(...)` derive the same scoped settings paths and return formatted JSON previews for enable/disable changes without writing files.
- `/api/hooks/apply-toggle` and `transport.applyHookToggle(...)` apply only previewed enable/disable changes to the same scoped settings paths after writing a sibling `.ccgui.bak` backup.
- `/api/hooks/preview-edit`, `/api/hooks/apply-edit`, `transport.previewHookEdit(...)`, and `transport.applyHookEdit(...)` derive the same scoped settings paths for command, matcher, timeout, and delete previews/writes; apply routes recompute previews server-side and write sibling `.ccgui.bak` backups before writing only the derived settings path.
- `src/core/hooksLogs.ts`, `/api/hooks/logs`, `/api/hooks/logs/read`, `transport.listHookLogs(...)`, and `transport.readHookLog(...)` expose scoped read-only hook log diagnostics from `<project>/.commandcode/hooks` and `~/.commandcode/hooks` for supported log-like files only.
- `src/core/hooksPayload.ts` builds explicitly marked `ccgui_dry_run` sample payload JSON for Settings display without executing hooks, starting sessions, or inferring real runtime payload state.
- `src/core/hooksDryRun.ts`, `/api/hooks/dry-run`, and `transport.dryRunHook(...)` return sample payload evidence, matcher applicability, and `execution: not-run`; this dry-run path does not read hook config, write files, start sessions, spawn processes, or execute hook commands.
- `src/renderer/src/services/sessionReadiness.ts` defines a pure reducer for per-session background, unread, response-ready, and input-required state. Attach, replay, and foreground transitions are non-notifying; only explicit background readiness events can produce notification intent.
- `src/renderer/src/services/readinessNotifications.ts` maps explicit readiness intents to toast/audio delivery plans using renderer-local preferences. It does not dispatch toast, play audio, call OS notifications, or infer readiness from terminal output.
- Session data callbacks now carry `live` versus `replay` metadata so the renderer can ignore replay buffers for unread state. Active-session tabs and sidebar rows show reducer-backed unread/readiness badges without dispatching response-ready notifications.
- `docs/reports/HOOKS_NOTIFICATIONS_GATE.md` records the boundaries that still block hook creation/import/export, real hook execution, real-session test-payload execution, OS notifications, quiet mode, and runtime-integrated readiness notifications.
- Hook execution remains Command Code-owned. The GUI parser and toggle writer only prepare scoped Settings display, validation, diagnostics, and explicit config edits.
- Settings > Hooks currently supports scoped discovery, enable/disable toggles, broader command/matcher/timeout/delete edit previews and backup writes, dry-run sample payload previews, dry-run test results, and scoped read-only hook log viewing. It shows Command Code-owned `settings.json` destinations, project/user scopes, project-before-user precedence, parser gate status, discovered source status, parsed hook commands, preview/apply output, dry-run payload JSON, dry-run `would run`/`would skip` status, log diagnostics, execution ownership, and example recipes without executing hooks.

## MCP And Integrations

Phase 6 is complete for the current V1 contract. It shipped MCP visibility, explicit scopes, read-only diagnostics, previewed commands, existing connect/disconnect execution, and redacted add-flow previews without adding MCP config writes or secret persistence:

- `src/core/mcpCommands.ts` owns tested `cmd mcp connect|disconnect <server>` argument construction, gated command previews, and preview-only `cmd mcp add` / `cmd mcp add-json` argument construction with redacted secret display.
- `src/core/mcpList.ts` owns MCP list-output parsing for server status, tool count, raw output, and optional registered tool names already present in `cmd mcp list` output.
- `src/core/mcpReference.ts` owns tested scope path and policy metadata for local, project, and user MCP config, permission prompts, plan-mode restrictions, and secret-handling boundaries.
- `src/core/discovery.ts` uses the same builder for the existing MCP action path.
- Settings > MCP uses the shared preview builder, so visible previews and executed arguments stay aligned.
- Settings > MCP renders read-only scope/path and policy tiles before server actions so operators can see the relevant config ownership and secret boundary before future writes.
- Settings > MCP renders parsed `mcp__server__tool` names when the existing list output includes them. No additional tool-inspection command is run.
- Settings > MCP shows preview-only gated commands for details, remove, auth status, and auth clear. Those previews are not executable from the GUI yet.
- Settings > MCP shows a preview-only Add server section for HTTP, stdio, and JSON config flows using the shared redacted add/add-json builders. It has no apply button and does not call a transport route.
- `/api/mcp/list` returns read-only list diagnostics (`ok`, `stdout`, `stderr`, `error`) alongside `servers`, and Settings > MCP surfaces failures instead of treating failed list commands as empty state.
- `src/renderer/src/settings/McpSettings.tsx` owns Settings > MCP presentation; `AdvancedReadOnlySettings.tsx` no longer owns the MCP route content.
- MCP add has redacted preview UI only; execution, config reads/writes, and secret persistence remain planned or gated. MCP remove, auth, server edit, connection test, diagnostics, and log viewing also remain planned or gated. No MCP secrets are stored in GUI preferences.
- The deferred MCP mutation gates require a scoped config-write design, safe local fixtures for add/remove/auth-clear click-through, and explicit secret-handling proof before any apply buttons or write routes are added.

Suggested sections:

- General: project defaults, command binary, startup behavior.
- Runtime: PTY health, real/demo mode, headless defaults, permission visibility.
- Models: model picker plus `/configure-models` helper entry.
- Hooks: project/user settings discovery, hook list, validation, examples, and explicit scope.
- MCP: configured servers, scopes, auth status, add/remove flows, and `/mcp` helper.
- Agents: project/global agent configs, exact destination paths, validation.
- Skills: installed skills, source scope, preview, insert/use actions.
- Design: `/design` mode picker with target selection and command preview.
- Memory and Taste: readable scope, editable destinations, ownership warnings.
- Notifications: toasts, audio, quiet mode.
- Advanced: raw project state and diagnostics.

Every write-capable section must show:

- Scope: project, local project, user/global, or runtime-owned.
- Destination path.
- Whether the file is expected to be committed.
- The exact Command Code command or config mutation being performed.

## Command Code Docs Cache

The app should keep a local, human-readable docs reference under `docs/reference/command-code-docs/`.

The local docs should not claim to replace the upstream docs. They should be a curated implementation reference for this GUI:

- Hooks overview, configuration, reference, examples, and best practices.
- MCP overview, quickstart, manage, and examples.
- `/design` modes and workflow.
- Tool names, permission implications, and plan-mode limits.

Each local page should include:

- Source URL and retrieval date.
- Short summary.
- GUI implications.
- Config files or CLI commands the GUI may touch.
- Open questions for verification against the installed `cmd` version.

## Feature Helper Pattern

Guided helpers should follow one pattern:

1. Explain the workflow in app-native terms.
2. Let the operator choose scope and target.
3. Show the exact command/config change.
4. Run through Command Code or a narrow server route.
5. Show receipt: command, scope, path, exit code, transcript, or config diff.

This applies to `/configure-models`, `/agents`, `/design`, `/mcp`, hooks, skills, memory, and future features.

Current workflow-helper status on 2026-06-06:

- Phase 5 Workflow Helpers is complete and validated for the current V1 contract.
- The slash popover searches executable commands, workflow recipes, Settings sections, recent projects, and local docs topics. Empty state shows only commands and workflow recipes so the popover does not duplicate the Settings sidebar.
- Settings-backed workflow recipes route to their explicit Settings sections; runtime-start recipes remain preview-only and do not start sessions from recipe rows.
- Command rows show display-only execution semantics for `send-active-session`, `insert-composer`, and `headless-run` while preserving the existing `runCommand(item)` execution path.
- `/design` and Agent Draft helpers render explicit previews without hidden prompt rewriting, file writes, renderer IPC expansion, or Command Code settings mutation.
- Session-result search remains deferred behind a session lifecycle gate because direct resume/start actions affect runtime truth.

## Validation Expectations

V1 feature work should include:

- TypeScript pass.
- Focused tests for pure builders and transport contracts.
- Mock-mode proof where relevant.
- Real CLI smoke test or explicit untested label.
- Browser/Electron screenshot or runtime receipt for UI work.
- Docs update when behavior or boundaries change.

The app should remain easy to iterate on, but not by letting hidden coupling accumulate in the renderer.

## Transcript Parsing

Current Phase 8 status on 2026-06-06:

- `src/core/transcriptParser.ts` is a pure parser for already-provided transcript JSONL text. It does not read files, reveal files, mutate transcript/checkpoint state, call Command Code, or infer runtime readiness from terminal output.
- Parsed entries are normalized into user, assistant, tool, error, event, and unknown timeline kinds while preserving the raw parsed object or raw invalid JSONL line for debugging.
- Invalid JSONL is represented as an error entry instead of dropping surrounding transcript entries.
- `src/core/artifactDetection.ts` is a pure detector for already-provided terminal/transcript text. It accepts explicit allowed roots, resolves relative paths against an explicit workspace root, rejects outside-root paths and symlink escapes, and returns accepted/rejected candidates without reading file contents or revealing files.
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx` renders parsed transcript timeline entries through the existing guarded `transport.readTranscript()` route. It exposes kind filters and keeps raw transcript/raw-entry disclosures for debugging.
- `src/renderer/src/services/transcriptArtifacts.ts` provides browser-safe artifact suggestions for transcript UI only. It does not perform filesystem checks and is not an access-control boundary; the existing `FileViewer` and `/api/files/read` route remain the file-read enforcement path.
- Transcript artifact chips open the existing right-inspector file preview after explicit user action. They do not auto-open files, add server routes, add renderer IPC, or broaden filesystem capability.
- Safe rendered HTML preview, file reveal actions from artifact chips, session restoration, and response-ready state remain planned or gated.
