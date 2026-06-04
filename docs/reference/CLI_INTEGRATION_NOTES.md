# CLI Integration Notes

## Documented commands used by this starter

- `cmd` starts an interactive session.
- `cmd "message"` starts an interactive session with an initial message.
- `cmd --print "query"` runs non-interactively and exits.
- `cmd --list-models` lists model ids.
- `cmd status --json` emits status as a JSON line for automation.

## Flags mapped to UI controls

- `--model <model>` -> Model override input
- `--permission-mode standard|plan|auto-accept` -> segmented mode control
- `--trust` -> Auto-trust checkbox
- `--skip-onboarding` -> Skip onboarding checkbox
- `--max-turns` -> Headless runner max turns
- `--yolo` -> Headless write/shell checkbox

## Important limitation

Headless mode is standalone. It cannot use interactive slash commands, keyboard shortcuts, or a persistent conversation. Use it for automation. Use the PTY path for normal sessions.

## Windows note

The Command Code binary name `cmd` can conflict with Windows `cmd.exe`. Keep the binary path configurable and include a clear doctor check.
