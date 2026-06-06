# Command Code GUI Implications

Retrieved: 2026-06-06

Source index:

- `hooks.md`
- `mcp.md`
- `models.md`
- `design.md`
- `tools.md`

This page summarizes cross-cutting implementation rules for the GUI adapter. Command Code remains the runtime engine and source of execution truth.

## Runtime Ownership Rules

The GUI owns:

- desktop shell layout
- PTY lifecycle orchestration
- headless run orchestration
- session display
- operator controls
- transcripts and local GUI preferences
- scoped, documented config editors where gates have been satisfied

The GUI does not own:

- Command Code model semantics
- tool permission semantics beyond documented flags and visible labels
- taste learning internals
- checkpoint internals
- IDE internals
- MCP server semantics
- hook execution semantics
- private Command Code APIs

## Implementation Requirements

- Use documented Command Code commands and config paths.
- Preview commands before mutation.
- Show scope, destination path, and owner before any write.
- Keep renderer IPC narrow and typed.
- Do not infer private runtime state from terminal output.
- Preserve Mock/Demo mode for GUI validation.
- Keep risky execution modes visually explicit.

## Implemented GUI Surfaces

- Settings > Models delegates model listing to Command Code and keeps task routing writes gated.
- Settings > Hooks supports scoped config discovery, preview-confirmed edits, dry-run payloads, and scoped log viewing; real hook execution remains gated.
- Settings > MCP supports read-only diagnostics, connect/disconnect through existing action paths, gated mutation previews, and redacted add previews.
- Settings > Design provides a preview-only `/design` helper.
- Settings > Data shows data-control and workbench-polish gates.
- The command palette labels execution intent before running or inserting commands.
- The right inspector shows files, transcripts, docs, environment status, and IDE status without broad shell capability.

## Gated Or Deferred Surfaces

- OS notifications, quiet mode, and runtime-integrated readiness dispatch remain gated by `docs/reports/HOOKS_NOTIFICATIONS_GATE.md`.
- Data deletion, cache clearing, preference reset, export, and import remain gated by `docs/reports/DATA_CONTROLS_GATE.md`.
- New Settings writes remain gated by `docs/reports/SETTINGS_PERSISTENCE_GATE.md`.
- File actions, IDE actions, git mutations, terminal lifecycle/profile work, editable theme-token controls, and release-fetching behavior remain gated by `docs/reports/WORKBENCH_POLISH_GATE.md`.
- Visual context capture, screenshot/DOM attachment, and preferred vision-model routing for `/design` remain post-V1/plugin-owned unless explicitly re-scoped.

## Validation Implications

For every package, receipts must match the touched surface:

- Parser/shared helper changes need focused unit tests.
- Renderer/server/main/package changes need `npm run build`.
- Browser transport, auth, mock, or session UI changes need `npm run smoke:browser`.
- Headless or command-builder changes need `npm run smoke:headless`.
- PTY/session lifecycle changes need `npm run smoke:pty`.
- Settings navigation, inspector behavior, session workbench layout, or visible runtime status changes need Browser and Electron receipts.

Docs must name what is implemented, validated, blocked, deferred, or planned. Do not claim behavior from a test or receipt unless that evidence directly covers the behavior.
