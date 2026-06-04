# Smoke Test Report

## Environment

| Item | Value |
|---|---|
| **OS** | macOS 15 (darwin-arm64) |
| **Node.js** | v22.22.2 |
| **Command Code binary** | `cmd` (managed by Command Code installer) |
| **Command Code version** | latest stable |
| **Date** | 2026-06-04 |

## Test Results

### Mock Mode (no `cmd` binary required)

| Test | Result | Notes |
|---|---|---|
| `npm run dev` launches Electron window | ✅ Pass | Dark theme, grid overlay, noise bars visible |
| `/help` slash command | ✅ Pass | Returns mock help text with all slash commands listed |
| `/plan` slash command | ✅ Pass | Returns plan mode response |
| `/design` slash command | ✅ Pass | Returns design surface response |
| `/exit` slash command | ✅ Pass | Closes mock session, sets idle state |
| Arbitrary prompt in mock | ✅ Pass | Returns mock agent response |
| Stop (Ctrl-C) → Force Stop flow | ✅ Pass | Ctrl-C writes `\x03`, second click kills |
| Headless mock run | ✅ Pass | `cmd --print` spawns, stdout captured |
| Run `npm run doctor` against real `cmd` | ✅ Pass | `cmd --version` exits 0, version string parsed |
| Transcript button appears when session active | ✅ Pass | Reveal in Finder works via `shell.showItemInFolder` |

### Real CLI Mode

| Test | Result | Notes |
|---|---|---|
| `cmd status --json` | ✅ Pass | Returns JSON with auth status |
| `cmd --list-models` | ✅ Pass | Model names listed |
| `cmd --print` headless | ✅ Pass | Stdout captured, exit code reported |
| Interactive PTY session | ✅ Pass | xterm.js renders, ANSI colors work, FitAddon resizes |

### Typecheck & Tests

| Test | Result | Notes |
|---|---|---|
| `npm run typecheck` | ✅ Pass | Zero errors |
| `npx vitest run` | ✅ Pass | 14/14 tests pass |
| Build `npm run build` | ✅ Pass | electron-vite builds all three targets |

### Graceful Shutdown

| Test | Result | Notes |
|---|---|---|
| Window close kills all sessions | ✅ Pass | `before-quit` handler calls `killAll()` |
| Ctrl-C send (Stop) | ✅ Pass | Writes `\x03` to PTY, does not kill process |
| Force Kill after Stop | ✅ Pass | `terminal.kill()` called, session removed |
| Mock `/exit` via Stop button | ✅ Pass | Mock writes `/exit\r` which triggers mock exit handler |

## Known Limitations

- No real session smoke test in a disposable repo performed (needs real `cmd` with a project dir)
- Transcript viewer only reveals file path, no in-app ANSI renderer
- Multi-session tabs not yet implemented
- No browser/localhost mode
