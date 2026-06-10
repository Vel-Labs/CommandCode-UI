# Security Notes

This app wraps an autonomous coding agent. Treat it like a high-trust local developer tool.

## Principles

- Renderer has no Node.js integration.
- IPC is narrow and typed.
- Main process spawns only the configured Command Code binary.
- Arguments are assembled from explicit UI controls.
- No arbitrary shell command channel is exposed to the renderer.
- File read/write routes require a selected project root and deny paths outside that root.
- Path containment uses canonical path resolution and rejects sibling-prefix and symlink-escape paths.
- Native reveal IPC validates transcript/project paths before opening the OS file manager.
- Localhost CORS echoes only exact HTTP loopback origins (`127.0.0.1`, `localhost`, `::1`).
- JSON request bodies over 1 MB return structured 413 errors.
- Risky execution modes are visible.

## Risky controls

- `--trust` skips the project permission prompt.
- `--auto-accept` skips permission prompts for write tools.
- `--yolo` allows file writes and shell commands in headless mode.

## Recommended hardening

- Confirm project path before starting a real session.
- Add confirmation before auto-accept or yolo.
- Add per-session transcript and command audit.
- Add app-level setting for Command Code binary path.
- Add Windows-specific signal tests.
