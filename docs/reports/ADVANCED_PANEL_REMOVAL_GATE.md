# AdvancedPanel Removal Gate

Date: 2026-06-06

This gate records what Settings replaces from `src/renderer/src/components/AdvancedPanel.tsx` and what still blocks removing the Advanced modal. It is a removal contract, not a runtime change.

## Current Settings Replacement Coverage

| Advanced tab | Settings replacement | Status |
|---|---|---|
| Project state | Data / Project state | Implemented read-only |
| Usage | Usage | Implemented read-only local headless history and Command Code usage summary refresh |
| Taste | Taste | Implemented read-only |
| Agents | Agents | Implemented read-only discovery |
| MCP | MCP | Implemented read-only `cmd mcp list` view |
| Skills | Skills | Implemented read-only discovery and content preview expansion |
| Memory | Memory | Implemented read-only discovery |
| Sessions | Sessions | Implemented read-only discovery; resume and reveal remain blocking |

## Blocking Advanced-Only Behavior

The Advanced modal must stay available until each behavior below has a Settings route or an explicit replacement path:

- Project-scoped session resume with `onResumeSession(session)`.
- Transcript reveal with `transport.revealTranscript(session.transcriptPath)`.
- Agent editing and `transport.saveAgent(agentPath, content, cwd)`.
- Memory editing and `transport.saveMemory(filePath, content, cwd)`.
- MCP connect/disconnect actions through `transport.mcpAction(commandExecutable, action, serverName)`.

## Removal Rules

Do not remove `AdvancedPanel` until:

- every advanced-only action is either implemented in Settings or explicitly deferred in the roadmap;
- every write-capable replacement shows destination path, scope, preview, validation, and cancel/revert affordance;
- MCP connect/disconnect actions show exact command effects before execution;
- session resume/reveal stays separate from transcript parsing or terminal-output heuristics;
- Browser/Electron receipts confirm the Settings replacements are reachable;
- the roadmap, architecture doc, and smoke report distinguish implemented, validated, blocked, and deferred behavior.

## Current Decision

Keep `AdvancedPanel` as the explicit advanced tool surface.

Settings is now the primary navigation home for read-only configuration and diagnostics, but Advanced remains the only place for project-scoped session resume, transcript reveal, agent writes, memory writes, and MCP connect/disconnect.
