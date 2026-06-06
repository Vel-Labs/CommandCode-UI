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
| Memory | Memory | Implemented read-only discovery |
| Sessions | Sessions | Implemented discovery with project-session resume and transcript reveal actions |

## Blocking Advanced-Only Behavior

The Advanced modal must stay available until each behavior below has a Settings route or an explicit replacement path:

- Memory editing and `transport.saveMemory(filePath, content, cwd)`.

## Removal Rules

Do not remove `AdvancedPanel` until:

- every advanced-only action is either implemented in Settings or explicitly deferred in the roadmap;
- every write-capable replacement shows destination path, scope, preview, validation, and cancel/revert affordance;
- MCP connect/disconnect actions keep showing exact command previews before execution;
- session resume/reveal stays separate from transcript parsing or terminal-output heuristics;
- Browser/Electron receipts confirm the Settings replacements are reachable;
- the roadmap, architecture doc, and smoke report distinguish implemented, validated, blocked, and deferred behavior.

## Current Decision

Keep `AdvancedPanel` as the explicit advanced tool surface.

Settings is now the primary navigation home for configuration and diagnostics, including project-scoped session resume, transcript reveal, MCP connect/disconnect execution, and project-scoped agent writes. Advanced remains the only place for memory writes.
