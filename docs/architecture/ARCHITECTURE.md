# Architecture

The starter uses a two-path integration model.

## Interactive path

```text
React UI -> preload IPC -> Electron main -> node-pty -> cmd -> xterm.js
```

This path is for normal Command Code use. It gives the CLI a real pseudo-terminal so interactive UI, slash commands, prompts, ANSI output, and keyboard interaction behave like a terminal.

## Headless path

```text
React UI -> preload IPC -> Electron main -> child_process.spawn -> cmd --print
```

This path is for one-shot automation. It captures stdout, stderr, exit code, signal, timeout state, and duration. It should be used for tasks like summarization, audits, or CI-like checks where a standalone invocation is acceptable.

## State model

For the MVP, the terminal is display-only state. The GUI does not parse Command Code's TUI to infer internal agent state. Structured cards should only be built from documented JSON outputs, stable files, or future official APIs.

## Session lifecycle

- Start creates a session id and PTY.
- Renderer subscribes to `cc:session-data:<id>` and `cc:session-exit:<id>`.
- Data is written to xterm and appended to an ANSI transcript file.
- Stop kills the PTY.
- Future hardening should add Ctrl-C, graceful `/exit`, timeout, and force-kill stages.

## Security posture

The renderer never receives Node.js integration and only talks through a narrow preload bridge. The main process only spawns the configured Command Code executable with controlled argument arrays.
