# Hooks Reference For The GUI

Retrieved: 2026-06-06

Official sources:

- https://commandcode.ai/docs/hooks
- https://commandcode.ai/docs/hooks/configuration
- https://commandcode.ai/docs/hooks/reference
- https://commandcode.ai/docs/hooks/examples
- https://commandcode.ai/docs/hooks/best-practices

This page records the hook behavior the GUI is allowed to model. It is not an upstream Command Code replacement.

## Current GUI Boundary

Implemented:

- Settings > Hooks discovers documented project and user hook config files: `<project>/.commandcode/settings.json` and `~/.commandcode/settings.json`.
- Settings > Hooks parses `PreToolUse`, `PostToolUse`, and `Stop` command hooks.
- Project hooks display before user hooks because project scope takes precedence.
- Enable/disable, command, matcher, timeout, and delete edits are previewed before writing and write a sibling `.ccgui.bak` backup.
- Dry-run payload preview and dry-run test results are GUI diagnostics only. They include `ccgui_dry_run: true` and `execution: not-run`.
- Hook logs are read only from derived project/user hook directories: `<project>/.commandcode/hooks` and `~/.commandcode/hooks`.

Not implemented:

- The GUI does not execute hook commands.
- The GUI does not start a real Command Code session to test hooks.
- The GUI does not infer hook success from terminal output.
- The GUI does not accept arbitrary hook config paths or arbitrary hook log paths from the renderer.
- OS notifications, hook-triggered GUI alerts, quiet mode, and runtime-integrated response-ready/input-required notifications remain gated.

## Supported Events

| Event | GUI treatment | Runtime owner |
|---|---|---|
| `PreToolUse` | Parsed, shown as blocking-capable, editable through preview-confirmed scoped writes | Command Code |
| `PostToolUse` | Parsed, shown as audit/after-tool behavior, editable through preview-confirmed scoped writes | Command Code |
| `Stop` | Parsed, shown as finish/stop behavior, editable through preview-confirmed scoped writes | Command Code |

Unknown events are preserved as diagnostics instead of silently dropped.

## Dry-Run Test Runner

Settings > Hooks `Dry-run test` builds a sample payload and reports whether the selected hook would run for that sample.

The dry-run runner:

- Returns `willRun: true` when the hook is enabled and the sample tool matches the matcher.
- Returns `willRun: false` when the hook is disabled or the sample tool does not match the matcher.
- Always returns `execution: not-run`.
- Does not spawn a process.
- Does not write files.
- Does not call Command Code.
- Does not start or attach to a real session.

For real hook behavior, Command Code remains the execution source of truth.

## Stop-Hook Notification/Audio Recipe

Use a `Stop` hook when a project wants Command Code itself to run an audio or notification command at session stop time. The GUI can edit and dry-run the config shape, but Command Code owns execution.

Project-scoped example:

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "command-code-bonk --sound done",
        "enabled": true
      }
    ]
  }
}
```

Operator checklist:

- Choose project scope when the recipe belongs with the repo.
- Choose user scope only for personal notification behavior.
- Preview the edit in Settings > Hooks before applying.
- Confirm the destination path before writing.
- Use `Dry-run test` only to inspect the sample payload and matcher status.
- Run a real Command Code session only when the operator intentionally wants Command Code to execute the hook.

Safety notes:

- A Stop hook is not a substitute for GUI readiness state.
- A Stop hook can produce audio, but it does not prove a response is ready or input is required.
- Keep audio off by default in GUI preferences unless the operator enables it.
- Avoid shell commands that depend on secrets, broad filesystem access, or network side effects.
