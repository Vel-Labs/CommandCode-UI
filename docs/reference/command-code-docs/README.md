# Command Code Docs Local Index

This folder tracks upstream Command Code documentation that directly affects the GUI adapter. It is a local implementation reference, not a replacement for the official docs.

Retrieved: 2026-06-06

## Hooks

Focused local page: `hooks.md`

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
- Current GUI status: Settings > Hooks reads only the documented project/user `settings.json` paths through scoped discovery, shows parsed diagnostics, can preview/apply enable/disable toggles with `.ccgui.bak` backups, can preview/apply broader command, matcher, timeout, and delete edits with `.ccgui.bak` backups, and can show scoped read-only hook logs from derived project/user hook directories. Hook execution remains gated.
- Current GUI dry-run status: Settings > Hooks can render an explicitly marked sample payload and can run a dry-run test that reports matcher applicability and `execution: not-run`; it does not claim the sample was emitted by a real Command Code session and does not execute hook commands.
- Surface hook order and whether a hook can block execution.
- Add local examples for block shell, sensitive read warning, write audit, and Stop revision.
- Provide a test payload runner before asking users to run a real Command Code session. The current runner is dry-run only; real hook execution remains gated.
- Keep hook execution owned by Command Code; the GUI should edit config and run diagnostics only.
- Readiness notification preferences now include `response-ready` and `input-required` categories, but runtime dispatch remains gated until explicit Command Code readiness events are integrated.

## Models

Focused local page: `models.md`

Source page:

- https://commandcode.ai/docs/reference/cli/models

Key points for the GUI:

- `--model <model>` selects a model for a session.
- `--list-models` lists available model ids from Command Code.
- `/model` switches or inspects models inside the interactive runtime.
- `/configure-models` chooses which model runs built-in tasks.
- Command Code accepts full model ids or short names after the last slash.

GUI implications:

- Keep model listing delegated to Command Code.
- Keep favorites, search, and section grouping as GUI presentation only.
- Store and display per-session model identity from session-start or transcript metadata.
- Keep task routing separate from single-session selection.
- Do not write persistent task routing config until the config format and scope behavior are documented and tested.
- Do not invent pricing, context-window, or capability metadata.
- Keep preferred vision-model routing future/plugin-owned unless a documented adapter contract exists.

## MCP

Focused local page: `mcp.md`

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
- Current GUI status: Settings > MCP shows scope/policy reference, list diagnostics, parsed tool chips when present in existing list output, connect/disconnect through the existing action path, gated remove/auth/details previews, and preview-only HTTP/stdio/JSON add flows. MCP add/remove/auth-clear mutation and config editing remain gated.

## Design

Focused local page: `design.md`

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

Focused local page: `tools.md`

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

- `hooks.md` (started)
- `models.md` (started)
- `mcp.md` (started)
- `design.md` (started)
- `tools.md` (started)
- `gui-implications.md` (started)

Each page should cite the official source URL and focus on what this GUI needs to know to build safe, discoverable workflows.
