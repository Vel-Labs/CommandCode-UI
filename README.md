# Command Code

Command Code is a native-feeling desktop workbench for a terminal-first coding agent.

It keeps Command Code CLI as the execution engine, then adds the parts that make daily operation easier: a calm composer, project picker, visible permission modes, PTY health, session tabs, headless runs, transcripts, runtime diagnostics, and settings that feel like a desktop app instead of a stack of command-line flags.

![Command Code home screen](docs/assets/command-code-home.png)

## Why This Exists

Command Code is powerful as a CLI and as a headless harness. That power also creates friction for normal use: operators need to remember command flags, choose code locations, understand when a real PTY is healthy, and keep risky permission states visible while work is running.

This app turns that workflow into a small desktop cockpit:

- **Start from intent:** type what you want done, then pick project, mode, model, and permissions from the composer row.
- **Keep the CLI honest:** interactive work runs through a PTY, and one-shot automation runs through `cmd --print`.
- **Make risk visible:** `standard`, `plan`, `auto-accept`, and `trust` states stay on-screen instead of being hidden in configuration.
- **Support headless work:** run non-interactive prompts from the GUI while preserving receipts and exit status.
- **Expose health:** PTY, auth, IDE, model, and command binary checks are inspectable without scraping terminal output.

This is intentionally an adapter, not a fork. The GUI does not own model semantics, tool permissions, taste learning, checkpoint internals, or private Command Code APIs. Command Code remains the engine and source of execution truth.

## Dogfood Story

This interface was created predominantly with **DeepSeek running through Command Code's harness**, then refined with **Codex** for UX polish, documentation, validation, and packaging checks.

That matters because the app is not just a wrapper around a CLI. It is a proof loop for the thing it presents: a headless/terminal agent can help build the native surface that makes the same agent easier to use. The result is a desktop UI that preserves the CLI's power while reducing the operator burden around session setup, runtime mode, and safety visibility.

## Screenshots

Appearance themes are selectable from Settings so the app can keep the Command Code visual identity without forcing a single high-intensity presentation.

![Command Code appearance settings](docs/assets/command-code-appearance.png)

The default theme uses the Command Code spectral grid. The Blueprint theme keeps the same layout but cools the color system for longer work sessions.

![Command Code blueprint theme](docs/assets/command-code-blueprint-theme.png)

## What Is Included

- Electron + React + TypeScript desktop shell
- PTY-backed interactive Command Code session runner
- Headless `cmd --print` runner for non-interactive jobs
- Mock mode so the interface can be explored before Command Code is installed
- Composer-first new session flow with project, mode, model, and permission chips
- Settings page with profile, runtime, appearance, usage, integrations, and advanced sections
- Selectable appearance themes with local persistence
- Runtime checks for CLI and PTY health
- Files drawer, docs sidecar, advanced drawer, command history, and headless run history
- Product icon assets for macOS, Windows, and Linux packaging

## Prerequisites

```bash
npm i -g command-code
cmd --version
cmd status --json
```

On Windows, the executable name `cmd` can collide with the Windows command shell. If the app launches the wrong binary, set the command binary in Settings to the full npm shim path or to another working Command Code binary name if your installation exposes one.

## Run

```bash
npm install
npm run dev
```

Use **Mock** mode first if you only want to validate the GUI. Switch to **Real session** after `cmd --version`, `cmd status --json`, and the PTY health check pass.

## Localhost Browser Mode

For operators who do not want to run the Electron shell, Command Code can run as a localhost web UI against the same guarded local bridge. After the package is published to npm, the one-line path is:

```bash
npx command-code-gui@latest serve --open
```

The server binds to `127.0.0.1`, prints an auth token, and opens a tokenized URL when `--open` is provided. The browser UI uses the same PTY/session/headless endpoints as the desktop shell.

From a source checkout, the equivalent command is:

```bash
npm run serve -- --open
```

Useful localhost commands:

```bash
npx command-code-gui@latest doctor
npx command-code-gui@latest serve --port 5183 --open
npx command-code-gui@latest serve --dir /path/to/out/renderer
```

## Build And Package

```bash
npm run build
npm run dist
```

Native packages such as `node-pty` may need an Electron rebuild on some systems:

```bash
npm rebuild node-pty --runtime=electron --target=$(node -p "require('electron/package.json').version") --disturl=https://electronjs.org/headers
```

For unsigned macOS packaging checks during local development:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --dir --config.npmRebuild=false
```

For npm packaging checks:

```bash
npm pack
npx --package ./command-code-gui-0.1.0.tgz ccgui doctor
```

## Architecture

```text
Renderer React UI
  ├─ composer, settings, drawers, session tabs
  ├─ xterm.js terminal surface
  └─ project/model/mode/permission controls
        │ secure IPC only
        ▼
Preload bridge
        │ validates channel shape, no node integration
        ▼
Electron main process / local server
  ├─ PTY SessionManager -> cmd [interactive]
  ├─ child_process runner -> cmd --print [headless]
  ├─ command-code doctor/status/list-models helpers
  └─ guarded external links + directory picker
        │
        ▼
Installed Command Code CLI
```

## Design Decisions

- **Do not parse the TUI as the source of truth.** Display terminal output faithfully and add structured state only through stable CLI/API surfaces.
- **Treat headless and interactive as separate paths.** Headless is clean for automation; interactive sessions need a real PTY.
- **Keep permissions explicit.** Risky modes should be visible in the composer and active-session header.
- **Fail closed.** The renderer does not get broad shell capability. Main process spawning is scoped to the configured Command Code binary and controlled arguments.
- **Keep desktop comfort separate from runtime ownership.** Settings, themes, and project pickers improve operation without changing Command Code semantics.

## Validation

```bash
npm run typecheck
npx vitest run
npm run build
npm run smoke:pty
```

## Docs

All documentation lives under `docs/`. See [docs/INDEX.md](docs/INDEX.md) for the full index.

| Section | Contents |
|---|---|
| [Architecture](docs/architecture/) | App architecture, cross-platform strategy, security |
| [Guides](docs/guides/) | Visual design style guide |
| [Reference](docs/reference/) | CLI reference, component reference, known limitations |
| [Reports](docs/reports/) | Smoke test reports, hardening gates, test plans |
| [Roadmap](ROADMAP.md) | Implementation plan and remaining work |
