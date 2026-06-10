# CLI Integration Notes

## Documented commands used by this starter

- `cmd` starts an interactive session.
- `cmd "message"` starts an interactive session with an initial message.
- `cmd --resume <session-id>` resumes an existing Command Code conversation through the CLI runtime.
- `cmd --continue` continues the last conversation through the CLI runtime.
- `cmd --print "query"` runs non-interactively and exits.
- `cmd --list-models` lists model ids.
- `cmd status --json` emits status as a JSON line for automation.

## Flags mapped to UI controls

- `--model <model>` -> Model override input
- `--permission-mode standard|auto-accept` -> Standard / Full access chip
- `--trust` -> Trust project access option
- `--skip-onboarding` -> Skip onboarding checkbox
- `--max-turns` -> Headless runner max turns
- `--yolo` -> Headless write/shell checkbox

## Important limitation

Headless mode is standalone. It cannot use interactive slash commands, keyboard shortcuts, or a persistent conversation. Use it for automation. Use the PTY path for normal sessions.

Existing `.jsonl` chat contexts are runtime-owned by Command Code. The GUI may discover, read, and reveal them through guarded transcript routes, but resuming must go through `cmd --resume` or `cmd --continue`; the GUI should not mutate transcript or checkpoint files directly.

Recent chat clicks are intentionally view-first. The renderer opens a read-only transcript/history view with explicit Resume, Reveal file, and Open transcript actions. Resume prefers the Command Code title from `.meta.json` when available, with the session id retained as metadata.

The composer is the normal operator prompt path and writes paced keystrokes plus Enter into the active Command Code PTY. Enter sends from the composer; Shift+Enter inserts a line break. The active Command Code session renders as a native conversation projection by default, while the raw xterm transcript is hidden under Advanced session tools for diagnostics and unsupported TUI states. Inline approval controls send the same numbered PTY choices the terminal expects. Explicit terminal input is available only from the Advanced fallback so ordinary prompt typing returns to the composer. The header Terminal button starts a separate OS shell PTY in the selected repo so the operator can run project commands without repurposing the Command Code conversation viewport. That shell path is selected by `terminalMode: "shell"`; the renderer does not choose an arbitrary command executable for it.

## Windows note

The Command Code binary name `cmd` can conflict with Windows `cmd.exe`. Keep the binary path configurable and include a clear doctor check.
