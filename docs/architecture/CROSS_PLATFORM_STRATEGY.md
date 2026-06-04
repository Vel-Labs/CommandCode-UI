# Cross-platform / TAM strategy

The goal should not be "Electron-only." The goal should be one local Command Code bridge with multiple shells.

Recommended architecture:

```text
packages/core
  Command Code adapter
  PTY session manager
  headless runner
  transcript store
  workspace/path safety

packages/server
  localhost HTTP API
  WebSocket PTY transport
  random auth token
  strict CORS/origin checks
  127.0.0.1 binding by default

packages/web
  React UI
  xterm.js terminal
  command palette
  headless panel
  settings/status panels

apps/electron
  desktop shell
  starts or connects to local server
  native project picker
  tray/menu/update/notarization later

apps/cli
  ccgui serve
  ccgui doctor
  ccgui open
```

## Why this beats Electron-only

Electron is a good distribution shell for developers who want a desktop app, but it should not own the business logic. A localhost server mode makes the same product work as:

- a packaged desktop app on macOS, Linux, and native Windows where Command Code works;
- a browser app at `http://127.0.0.1:<port>` for users who dislike desktop wrappers;
- a WSL-first flow on Windows, where the server runs inside WSL next to the Command Code CLI and the browser/Electron shell connects from Windows;
- a future remote/devcontainer flow with explicit user opt-in.

## Platform implications

Command Code support is the real lower bound, not Electron support. Based on the current docs, macOS, Linux, and WSL are fully supported, while native Windows support is alpha. That means the broadest practical launch target is:

1. macOS desktop: first-class. Ship arm64 and x64 or a universal macOS build.
2. Linux desktop/browser: first-class, especially AppImage/tarball plus `ccgui serve`.
3. Windows via WSL: first-class for technical users. Prefer `ccgui serve` inside WSL.
4. Native Windows: beta/experimental until upstream Command Code native Windows is no longer alpha.

## MVP pivot

Keep the current Electron starter, but move the CLI-spawning code out of Electron main into a reusable core package. Then expose the core through both Electron IPC and WebSocket/HTTP.

Phase 1:

- Keep Electron + xterm.js renderer.
- Add `ccgui serve` that exposes `/health`, `/status`, `/models`, `/headless`, `/sessions` over localhost.
- Use WebSocket for session I/O.
- Electron loads the same React app, either directly or from the local server.

Phase 2:

- Electron auto-starts the server on a random port.
- Browser users run `npx ccgui serve` and open the printed URL.
- Add a random per-launch token to the URL and WebSocket handshake.

Phase 3:

- Add WSL detection and docs.
- For Windows desktop, prefer connecting to a server running inside WSL rather than trying to force native Windows process spawning.
- Add explicit remote/devcontainer support only after localhost security is solid.

## Security requirements for localhost mode

A local GUI that can spawn a coding agent is powerful. Treat it like a local privileged service.

Required before release:

- bind to `127.0.0.1`, not `0.0.0.0`, by default;
- generate a random token per server launch;
- require the token for all HTTP and WebSocket requests;
- reject unexpected `Origin` headers;
- keep CORS locked down;
- never expose a generic shell endpoint;
- validate workspace paths;
- make `--trust`, `--auto-accept`, and `--yolo` visually loud;
- log spawned command, args, cwd, exit code, and duration;
- keep transcripts local and deletable.

## What not to do yet

- Do not build a cloud-hosted GUI that reaches into local files without a local agent.
- Do not scrape Command Code's terminal UI to infer stable state.
- Do not build a plugin marketplace until the core adapter boundary is proven.
- Do not make Windows native the launch blocker; support WSL cleanly first.
