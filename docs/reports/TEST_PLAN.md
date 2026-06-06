# Test Plan

Last updated: 2026-06-06

This plan maps the current V1 validation surface. Package-specific receipts live in `docs/reports/SMOKE_TEST_REPORT.md`.

## Pure functions

- CLI argument builders: `buildInteractiveArgs`, `buildHeadlessArgs`, `normalizeCwd`
- Transcript parsing and artifact detection
- Hook config parsing, preview helpers, dry-run payloads, and readiness reducers
- MCP command builders, list parsing, scope metadata, and redacted add previews
- Model catalog, model routing previews, and per-session model identity display
- Command palette search, command execution previews, workflow recipes, docs topics, and workbench action gates
- Settings registry/search and renderer-local notification/terminal preference parsing

## Main process

- start mock session
- write to mock session
- stop mock session
- start PTY with a harmless binary in tests
- transcript append failure does not crash
- scoped project preference writes stay under approved project roots
- scoped hook config/log routes reject outside-root and unsupported paths

## Renderer

- Settings navigation reaches implemented sections
- risky runtime modes stay visibly labeled
- command palette rows show execution intent before action
- right inspector renders files, transcripts, docs, environment, and IDE modes without broad IPC
- unread/readiness labels render from explicit reducer state
- Settings read-only cards show loading state without changing transport behavior

## Manual smoke matrix

- macOS + zsh
- macOS + integrated VS Code terminal
- Windows 11 + PowerShell
- Windows 11 + Cursor
- Linux + bash

## Real Command Code smoke

1. `cmd --version`
2. `cmd status --json`
3. `cmd --list-models`
4. start session
5. `/help`
6. `/plan explain this repo`
7. `/exit`
8. force stop if needed

## Current automated commands

- `npm run typecheck`
- `npx vitest run`
- `npm run build`
- `npm run smoke:browser`
- `npm run smoke:headless` when headless or command-builder behavior changes
- `npm run smoke:pty` when PTY/session lifecycle behavior changes

## UI receipt expectations

- Browser and Electron receipts are required when a package changes UI layout, session workbench behavior, Settings navigation, inspector behavior, or visible runtime status.
- Route-level token proof is acceptable for docs-only packages or when the package does not affect rendered UI.
- If a real CLI path is not exercised, the package note must say so explicitly.

## Gated coverage

- Data deletion/export/import: blocked by `docs/reports/DATA_CONTROLS_GATE.md`.
- Hook execution and readiness notifications: blocked by `docs/reports/HOOKS_NOTIFICATIONS_GATE.md`.
- New Settings writes: controlled by `docs/reports/SETTINGS_PERSISTENCE_GATE.md`.
- Workbench file, IDE, git, terminal lifecycle/profile, theme-token, and release-fetching actions: blocked by `docs/reports/WORKBENCH_POLISH_GATE.md`.
