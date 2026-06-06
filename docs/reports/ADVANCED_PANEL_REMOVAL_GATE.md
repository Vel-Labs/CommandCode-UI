# AdvancedPanel Removal Gate

Date: 2026-06-06

This gate records what Settings replaces from `src/renderer/src/components/AdvancedPanel.tsx` and what still blocks removing the Advanced modal. It is a removal contract, not a runtime change.

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

No Advanced-only behavior is currently blocking replacement coverage. Removal still requires the rules below, including direct route receipts for the Settings replacements.

## Removal Rules

Do not remove `AdvancedPanel` until:

- every advanced-only action is either implemented in Settings or explicitly deferred in the roadmap;
- every write-capable replacement shows destination path, scope, preview, validation, and cancel/revert affordance;
- MCP connect/disconnect actions keep showing exact command previews before execution;
- session resume/reveal stays separate from transcript parsing or terminal-output heuristics;
- Browser/Electron receipts confirm the Settings replacements are reachable;
- the roadmap, architecture doc, and smoke report distinguish implemented, validated, blocked, and deferred behavior.

## Current Decision

Keep `AdvancedPanel` available until the removal rules are closed.

Settings is now the primary navigation home for configuration and diagnostics, including project-scoped session resume, transcript reveal, MCP connect/disconnect execution, project-scoped agent writes, and project-scoped memory writes. Advanced no longer has an exclusive action, but removal remains gated by direct Browser/Electron reachability receipts and roadmap/doc closeout.

The Settings Advanced page no longer opens the generic Advanced modal. It now routes to explicit diagnostics sections for Project state, Sessions, Usage, MCP, Agents, Skills, Memory, and Taste. The legacy modal remains available from non-Settings entry points until this removal gate is closed.
