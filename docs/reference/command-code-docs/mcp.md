# Command Code MCP Reference For The GUI

Retrieved: 2026-06-06

Sources:

- https://commandcode.ai/docs/mcp
- https://commandcode.ai/docs/mcp/quickstart
- https://commandcode.ai/docs/mcp/manage
- https://commandcode.ai/docs/mcp/examples
- Local CLI evidence from `cmd mcp --help`, `cmd mcp add --help`, `cmd mcp add-json --help`, `cmd mcp remove --help`, and `cmd mcp auth --help`

This page is a local implementation reference for the GUI adapter. Command Code remains the runtime and configuration owner for MCP behavior.

## Current CLI Shape

Installed `cmd` exposes MCP management through:

```text
cmd mcp add [options] <name> [url]
cmd mcp list
cmd mcp get <name>
cmd mcp remove [options] <name>
cmd mcp add-json [options] <name> <json>
cmd mcp auth [options] [server]
```

`cmd mcp add` accepts:

- `--transport <type>` with `stdio` or `http`; default is `stdio`.
- `--scope <scope>` with `local`, `project`, or `user`; default is `local`.
- repeatable `--env <KEY=value>` entries.
- repeatable `--header <header>` entries for HTTP transport.
- a server name and optional URL. URL is required for HTTP transport.

`cmd mcp add-json` accepts:

- `--scope <scope>` with `local`, `project`, or `user`; default is `local`.
- `--client-secret <secret>` for OAuth config injection.
- a server name and JSON configuration string.

`cmd mcp remove` accepts an optional `--scope <scope>` and otherwise auto-detects the scope. `cmd mcp auth` supports `--status`, `--clear`, and `--list`.

## Scope And Ownership

MCP scopes used by the GUI:

- `local`: local project-specific configuration under `~/.commandcode/projects/<slug>/mcp.json`.
- `project`: committed project configuration in `.mcp.json`.
- `user`: global user configuration under `~/.commandcode/mcp.json`.

Project/user/local scope must be visible before every MCP write. The GUI must not silently choose a scope or destination for mutation.

## GUI Implementation Status

Implemented:

- Settings > MCP is a first-class route in the Settings Center.
- The route shows local, project, and user scope reference tiles.
- The route shows MCP policy notes for permission prompts, plan-mode restrictions, and secret handling.
- The route uses the existing read-only `cmd mcp list` path and surfaces list diagnostics.
- Parsed `mcp__<server>__<tool>` names are shown when the existing list output includes them.
- Existing connect/disconnect actions are visible in Settings using the existing `transport.mcpAction` path.
- Details, remove, auth status, auth clear, and auth list commands have preview-only rows.
- HTTP, stdio, and JSON add flows have preview-only command builders and Settings UI.
- Secret-like env/header/client-secret values are redacted in previews.

Not implemented:

- MCP add execution.
- MCP config file parsing or editing.
- MCP remove execution.
- MCP auth clear execution.
- MCP server edit/save.
- MCP connection test.
- MCP logs or deeper diagnostics.
- Storing MCP secrets in GUI preferences.

## GUI Rules

- Treat MCP as Command Code-owned.
- Use documented `cmd mcp ...` commands and documented scope paths only.
- Show command previews before any future mutation.
- Show scope and destination path before any future config write.
- Do not store MCP secrets in GUI app or project preferences.
- Do not infer MCP auth or tool state from terminal text.
- Do not broaden renderer IPC to expose arbitrary shell or filesystem access.
- Keep plan-mode restrictions visible: MCP tools are disabled in plan mode.

## Open Gates

Before adding MCP mutation flows, the GUI needs:

- A scoped config-write gate for local/project/user MCP destinations.
- A safe fixture for MCP add/remove/auth-clear click-through tests.
- Explicit secret-handling behavior that never persists raw secrets in GUI preferences.
- Confirmation UX that shows scope, destination, command preview, and mutation owner.
- Validation receipts proving mock mode, browser route, Electron startup, and real CLI behavior where mutation is safe.
