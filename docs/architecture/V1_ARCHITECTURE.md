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
- `src/renderer/src/workspaces/SettingsWorkspace.tsx` owns existing settings workspace presentation only; Phase 2 settings expansion has not started.
- `src/renderer/src/workspaces/TranscriptWorkspace.tsx` owns transcript presentation and inline transcript preview.
- `src/renderer/src/inspectors/RightInspectorPanel.tsx` owns right-inspector presentation and environment display.
- `src/renderer/src/components/AppPopovers.tsx` owns existing project, runtime, permission, model, and slash-command popover presentation.
- `src/renderer/src/components/ReleaseNotesModal.tsx` owns release-note modal presentation.
- `src/renderer/src/commandPalette.ts` owns command palette item and release-note metadata.
- `src/renderer/src/hooks/useDismissiblePopover.ts` owns outside-click and Escape-key popover dismissal.
- `src/renderer/src/App.tsx` still owns runtime state coordination, transport calls, session lifecycle, terminal input state, app/project preference persistence, settings section selection, popover state transitions, release-note state, and command execution handling until later gated packages move those boundaries.

Deferred Phase 1 hook boundaries:

- Session lifecycle hooks are deferred because they affect transport/session lifecycle truth.
- Runtime health hooks are deferred because they affect runtime truth and PTY availability claims.
- App and project preference hooks are deferred because they affect shared settings persistence.

## Settings Center

Settings should become the natural home for configuration, not just a profile/status page.

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

## Validation Expectations

V1 feature work should include:

- TypeScript pass.
- Focused tests for pure builders and transport contracts.
- Mock-mode proof where relevant.
- Real CLI smoke test or explicit untested label.
- Browser/Electron screenshot or runtime receipt for UI work.
- Docs update when behavior or boundaries change.

The app should remain easy to iterate on, but not by letting hidden coupling accumulate in the renderer.
