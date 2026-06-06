# Command Code Tools Reference

Retrieved: 2026-06-06

Source page:

- https://commandcode.ai/docs/reference/tools

This page records GUI implications for Command Code tools and permission modes. It is a local implementation reference, not a replacement for official docs.

## Documented Tool Families

Built-in Command Code tools include:

- filesystem tools
- search tools
- shell tools
- planning/task-management tools
- IDE diagnostics
- subagents
- MCP tools registered by connected MCP servers

Filesystem paths are validated by Command Code against the workspace and `--add-dir` directories. State-changing tools require permission by default.

## Permission And Mode Implications

Documented mode and flag implications from the local docs index:

- `--auto-accept` and `--yolo` affect permission prompts.
- `--plan` limits tools for safety.
- MCP tools appear alongside built-in tools and remain subject to permission prompts.
- Plan mode is a runtime safety boundary, not only a label.

## GUI Status

Implemented:

- Risky modes remain visually explicit in the session header/composer controls.
- Command palette rows show behavior badges for active-session send, composer insert, headless run, runtime-owned behavior, plan mode, and Command Code-owned model routing.
- Settings > MCP shows tool chips only when already present in existing `cmd mcp list` output.
- Settings > Hooks dry-run reports `execution: not-run` and does not execute hook commands.
- Workbench file, IDE, git, terminal lifecycle, theme-token, and release-fetching actions are gated by `docs/reports/WORKBENCH_POLISH_GATE.md`.

Not implemented:

- Mirroring Command Code tools as arbitrary GUI powers.
- Renderer IPC for broad shell/file/tool execution.
- Private runtime tool-state inference from terminal output.
- GUI-owned permission semantics beyond documented flags and visible labels.

## GUI Requirements

- Keep renderer IPC narrow and typed.
- Show whether a helper action may trigger shell, write, edit, file, MCP, or runtime behavior.
- Keep risky mode badges visible before starting or sending work.
- Do not infer successful tool calls or readiness from terminal text.
- Keep tool execution owned by Command Code unless a route has a scoped contract, preview, confirmation, and validation receipt.

## Validation Boundary

Any package that adds a new GUI helper capable of triggering a tool path must show:

- the exact command or route
- the active permission mode
- whether the action can mutate files, config, runtime state, git state, or external systems
- Browser/Electron receipts if it changes UI behavior
- tests or smoke receipts matching the affected surface
