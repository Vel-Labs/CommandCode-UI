# Test Plan

## Pure functions

- `buildInteractiveArgs`
- `buildHeadlessArgs`
- `normalizeCwd`
- model/status output parsing

## Main process

- start mock session
- write to mock session
- stop mock session
- start PTY with a harmless binary in tests
- transcript append failure does not crash

## Renderer

- controls persist cwd/model/binary
- start disabled/guarded without cwd unless Mock mode is enabled
- quick commands write to active session
- headless result renders stdout/stderr/exit code

## Manual smoke matrix

- macOS + zsh
- macOS + integrated VS Code terminal
- Windows 11 + PowerShell
- Windows 11 + Cursor
- Linux + bash

## Real Command Code smoke

1. `cmd --version`
2. `cmd status --json`
3. `cmd --list-models`
4. start session
5. `/help`
6. `/plan explain this repo`
7. `/exit`
8. force stop if needed
