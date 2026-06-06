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

- notification preferences
- terminal preferences
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

Known unimplemented acceptance:

- notification preferences persist and load
- terminal preferences persist without breaking xterm
- editable settings show destination path before write
- data controls write/delete only within approved roots
- AdvancedPanel removal after Settings replacement paths exist
