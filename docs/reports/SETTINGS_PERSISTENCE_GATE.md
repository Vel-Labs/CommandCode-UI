# Settings Persistence Gate

Date: 2026-06-06

This gate defines the ownership boundary for Phase 2 editable Settings work. It is a contract for later implementation, not a new runtime capability.

## Current Implemented Scope

GUI-owned app preferences are stored at:

- `~/.commandcode/gui-preferences.json`

GUI-owned project preferences are stored at:

- `<project>/.commandcode/gui-preferences.json`

These files are adapter preferences. They are not Command Code runtime configuration and must not be treated as the source of model, permission, hook, MCP, taste, checkpoint, or IDE semantics.

Current app preference fields:

- `cwd`
- `recentProjects`
- `commandExecutable`
- `model`
- `projectModels`
- `appearanceTheme`
- `releaseNotesSeen`
- `sidebarWidth`
- `rightInspectorWidth`

Current project preference fields:

- `projectPath`
- `model`
- `runtimeMode`
- `permissionMode`
- `trust`
- `skipOnboarding`
- `headlessMaxTurns`
- `headlessYolo`
- `appearanceTheme`

Renderer-local notification preferences are stored in browser `localStorage`:

- `ccgui.toast-preferences`
- `ccgui.audio-preferences`

These keys only control existing GUI toast and audio presentation. They do not configure OS notifications, hook execution, Command Code readiness semantics, or Command Code `settings.json`.

Renderer-local terminal preferences are stored in browser `localStorage`:

- `ccgui.terminal-preferences`

These keys only control xterm presentation when terminal panes mount. They do not configure PTY lifecycle, shell selection, Command Code terminal protocol, session resize behavior, or Command Code `settings.json`.

## Command Code-Owned Scope

Command Code-owned configuration remains in documented Command Code paths, including:

- `~/.commandcode/settings.json`
- `<project>/.commandcode/settings.json`

The GUI may surface those paths and may later offer scoped editors, but only after each editable setting shows:

- destination path
- scope, such as user or project
- whether the value is GUI-owned or Command Code-owned
- preview of the exact write
- validation result before write
- revert or cancel path

## Phase 2 Write Rules

Editable Settings sections must not add new writes until the package explicitly names its destination and scope in this report or a successor gate.

Allowed without a new write gate:

- read-only reference pages
- registry/search/navigation changes
- route extraction
- tests around existing preference behavior
- documentation of existing preference paths

Requires a write gate before implementation:

- keyboard shortcut remapping
- startup behavior changes
- data deletion, cache clearing, reset, export, or import
- hook editor writes
- MCP add/remove/auth actions
- agent, skill, memory, or taste editing
- Command Code `settings.json` mutation

## Validation Status

Current executable coverage:

- `tests/settings-registry.test.ts` covers Settings registry/search/route coverage.
- `tests/server-security.test.ts` covers project GUI preference sanitization and project-scoped preference writes.
- `tests/notification-preferences.test.ts` covers renderer-local notification preference defaults, corrupt storage fallback, merge behavior, volume clamping, and sanitized saves.
- `tests/terminal-preferences.test.ts` covers renderer-local terminal preference defaults, corrupt storage fallback, value clamping, and sanitized saves.

Current visible destination coverage:

- General shows the GUI app preference destination for `commandExecutable`.
- General shows the GUI project preference destination for `skipOnboarding`.
- Runtime shows the GUI project preference destination for `permissionMode` and `trust`.
- Runtime shows the GUI app/project preference destinations for `model` and `projectModels`.
- Appearance shows the GUI app/project preference destinations for `appearanceTheme`.
- Notifications shows renderer-local `localStorage` destinations for toast and audio preferences.
- Terminal shows the renderer-local `localStorage` destination for xterm presentation preferences.

Known unimplemented acceptance:

- OS notifications, hook-triggered alerts, quiet mode, and per-session readiness preferences
- terminal bell behavior, profiles, history controls, and live PTY geometry updates
- editable settings destination labels for future write-capable sections
- data controls write/delete only within approved roots
- AdvancedPanel removal after Settings replacement paths exist
