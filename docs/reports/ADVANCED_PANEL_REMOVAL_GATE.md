# AdvancedPanel Removal Gate

Date: 2026-06-06

This gate records what Settings replaces from the removed `src/renderer/src/components/AdvancedPanel.tsx` modal and the receipts that closed the removal gate.

## Current Settings Replacement Coverage

| Advanced tab | Settings replacement | Status |
|---|---|---|
| Project state | Data / Project state | Implemented read-only |
| Usage | Usage | Implemented read-only local headless history and Command Code usage summary refresh |
| Taste | Taste | Implemented read-only |
| Agents | Agents | Implemented discovery and project-scoped editing through existing save route |
| MCP | MCP | Implemented `cmd mcp list` view with connect/disconnect command previews and execution |
| Skills | Skills | Implemented read-only discovery and content preview expansion |
| Memory | Memory | Implemented discovery and project-scoped editing through existing save route |
| Sessions | Sessions | Implemented discovery with project-session resume and transcript reveal actions |

## Blocking Advanced-Only Behavior

No Advanced-only behavior is currently blocking replacement coverage. Direct Settings route receipts now exist for the replacement paths, including scoped file writes, session reveal/resume, and MCP connect/disconnect against safe fixtures.

## Removal Rules

Do not remove `AdvancedPanel` until:

- every advanced-only action is either implemented in Settings or explicitly deferred in the roadmap;
- every write-capable replacement shows destination path, scope, preview, validation, and cancel/revert affordance;
- MCP connect/disconnect actions keep showing exact command previews before execution;
- session resume/reveal stays separate from transcript parsing or terminal-output heuristics;
- Browser/Electron receipts confirm the Settings replacements are reachable;
- the roadmap, architecture doc, and smoke report distinguish implemented, validated, blocked, and deferred behavior.

## Current Decision

`AdvancedPanel` has been removed.

Settings is now the primary navigation home for configuration and diagnostics, including project-scoped session resume, transcript reveal, MCP connect/disconnect execution, project-scoped agent writes, and project-scoped memory writes. Advanced no longer has an exclusive action, and direct Browser/Electron reachability receipts are recorded in the roadmap and smoke report.

The Settings Advanced page no longer opens the generic Advanced modal. It routes to explicit diagnostics sections for Project state, Sessions, Usage, MCP, Agents, Skills, Memory, and Taste. The legacy modal entry points were removed after safe click-through receipts covered scoped file writes, session reveal/resume, and MCP connect/disconnect.
