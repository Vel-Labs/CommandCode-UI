# Command Code Docs Local Index

This folder tracks upstream Command Code documentation that directly affects the GUI adapter. It is a local implementation reference, not a replacement for the official docs.

Retrieved: 2026-06-06

## Hooks

Source pages:

- https://commandcode.ai/docs/hooks
- https://commandcode.ai/docs/hooks/configuration
- https://commandcode.ai/docs/hooks/reference
- https://commandcode.ai/docs/hooks/examples
- https://commandcode.ai/docs/hooks/best-practices

Key points for the GUI:

- Hooks are configured in `settings.json` under the `hooks` key.
- User scope is `~/.commandcode/settings.json`; project scope is `.commandcode/settings.json`.
- Project settings take precedence over user settings.
- Hook events documented today are `PreToolUse`, `PostToolUse`, and `Stop`.
- Tool matchers cover shell, read, write, and edit behavior.
- Hook processes read JSON from stdin and write JSON to stdout.
- Common hook payload fields include session id, transcript path, cwd, event name, and permission mode.
- Hooks are deterministic enforcement and audit surfaces, not model-owned behavior.

GUI implications:

- Add a Settings > Hooks section.
- Show project vs user scope and whether the file is committed.
- Read and validate `.commandcode/settings.json` before writing.
- Current GUI status: Settings > Hooks reads only the documented project/user `settings.json` paths through scoped discovery, shows parsed diagnostics, can preview/apply enable/disable toggles with `.ccgui.bak` backups, and can preview broader command, matcher, timeout, and delete edits without writing. Broader write behavior and execution remain gated.
- Current GUI dry-run status: Settings > Hooks can render an explicitly marked sample payload for discovered hooks, but it does not claim the sample was emitted by a real Command Code session.
- Surface hook order and whether a hook can block execution.
- Add local examples for block shell, sensitive read warning, write audit, and Stop revision.
- Provide a test payload runner before asking users to run a real Command Code session.
- Keep hook execution owned by Command Code; the GUI should edit config and run diagnostics only.

## MCP

Source pages:

- https://commandcode.ai/docs/mcp
- https://commandcode.ai/docs/mcp/quickstart
- https://commandcode.ai/docs/mcp/manage
- https://commandcode.ai/docs/mcp/examples

Key points for the GUI:

- MCP management uses `cmd mcp <subcommand>`.
- Important commands include `add`, `add-json`, `list`, `get`, `remove`, `auth`, `auth --status`, `auth --list`, and `auth --clear`.
- Transports include stdio and HTTP.
- MCP scopes are local, project, and user.
- Scope files are `~/.commandcode/projects/<slug>/mcp.json`, `.mcp.json`, and `~/.commandcode/mcp.json`.
- Precedence is local over project over user.
- Connected MCP tools are registered with names like `mcp__<server>__<tool>`.
- MCP tools are subject to permission prompts and are disabled in plan mode.

GUI implications:

- Move MCP out of a generic Advanced tab into Settings > MCP.
- Show scope, config path, auth state, connection state, tool count, and error text.
- Add guided add flows for HTTP, stdio, and JSON config.
- Show command preview before adding/removing/auth-clearing.
- Treat auth/token handling as user-owned and avoid storing secrets in GUI preferences.

## Design

Source page:

- https://commandcode.ai/docs/design

Key points for the GUI:

- `/design <mode> [target]` is the core shape.
- Modes include redesign, setup, tokenize, review, checkup, smell, finish, voice, surface, refine, typeset, recolor, relayout, motion, responsive, and interaction.
- `voice` is for marketing and expressive surfaces.
- `surface` is for operator tools, dashboards, admin panels, and app UI.
- `/design help` shows the usage guide.

GUI implications:

- Add a Design helper rather than only a slash command row.
- Let users choose mode, target file/component, and freeform goal.
- Preview the exact `/design ...` command before sending it to the session.
- Prefer `surface` as the default for this app's own UI work.
- Store any GUI-specific design guidance in project docs, not hidden prompt state.

## Tools

Source page:

- https://commandcode.ai/docs/reference/tools

Key points for the GUI:

- Built-in tools include filesystem, search, shell, planning/task management, IDE diagnostics, and subagents.
- Filesystem paths are validated against the workspace and `--add-dir` directories.
- State-changing tools require permission by default.
- `--auto-accept`, `--yolo`, and `--plan` change permission behavior.
- MCP tools appear alongside built-in tools and are subject to permission prompts.
- Plan mode limits tools for safety.

GUI implications:

- Keep risky mode badges highly visible.
- Treat plan mode as a real runtime state, not just a label.
- Add a Tools reference panel that explains what the current mode permits.
- Keep renderer IPC narrow; do not mirror Command Code tools as arbitrary GUI powers.
- When exposing helper actions, show whether they may trigger shell, write, edit, or MCP tools.

## Follow-Up Local Pages

Suggested next local docs:

- `hooks.md`
- `mcp.md`
- `design.md`
- `tools.md`
- `gui-implications.md`

Each page should cite the official source URL and focus on what this GUI needs to know to build safe, discoverable workflows.
