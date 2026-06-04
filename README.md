# Command Code GUI Starter

A desktop starter for wrapping the Command Code CLI in a GUI that feels like Command Code: dark, gridded, focused, fast, and terminal-native underneath.

This is intentionally an adapter, not a fork. The app runs the installed `cmd` CLI in a background pseudo-terminal for interactive sessions and uses `cmd --print` for one-shot headless jobs.

## What is included

- Electron + React + TypeScript desktop shell
- PTY-backed interactive Command Code session runner
- Headless `cmd --print` runner for non-interactive jobs
- Mock mode so the interface can be explored before Command Code is installed
- Command palette buttons for common slash commands
- Project picker, model override, permission mode, trust, and onboarding toggles
- Visual system inspired by Command Code's black grid, white type, purple glow, and pill controls
- Command Code project memory, commands, and starter skill under `.commandcode/`

## How hard is this?

**MVP difficulty: moderate.** A credible first version is mostly a PTY wrapper plus a polished renderer. A strong production version becomes harder because you need resilient session lifecycle handling, cross-platform PTY quirks, terminal scroll behavior, exit handling, permissions visibility, IDE handoff, and a way to surface useful state without scraping fragile terminal output.

A practical split:

1. **Weekend MVP**: Electron shell, embedded terminal, spawn `cmd`, project picker, slash-command buttons, headless runner, mock mode.
2. **Useful daily driver**: session persistence, multiple tabs, transcripts, crash recovery, model/permission state, command history, safe file picker, external-editor handoff.
3. **Polished app**: diff viewer, checkpoint browser, IDE integration diagnostics, memory/taste/skills managers, cost/usage visibility, and native update flow.

## Prerequisites

```bash
npm i -g command-code
cmd --version
cmd status --json
```

On Windows, the executable name `cmd` can collide with the Windows command shell. If the app launches the wrong binary, set the **Command binary** field in the UI to the full npm shim path or to another working Command Code binary name if your installation exposes one.

## Run

```bash
npm install
npm run dev
```

Use **Mock mode** first if you only want to validate the GUI.

## Build

```bash
npm run build
npm run dist
```

Native packages such as `node-pty` may need an Electron rebuild on some systems. If the app fails during install or launch, run:

```bash
npm rebuild node-pty --runtime=electron --target=$(node -p "require('electron/package.json').version") --disturl=https://electronjs.org/headers
```


## Distribution strategy

This starter should be treated as **Electron shell first**, not **Electron-only**. For the broadest TAM, evolve it into a shared local Command Code bridge with two front doors:

- a packaged Electron desktop app for users who want native app behavior;
- a localhost browser mode for users who prefer `npx ccgui serve`, WSL, Linux, devcontainers, or lighter installation.

The important boundary is the CLI bridge: PTY sessions, headless `cmd --print` runs, transcripts, and safety checks should live in a reusable core that can be reached through Electron IPC or a localhost WebSocket/HTTP server. See [docs/architecture/CROSS_PLATFORM_STRATEGY.md](docs/architecture/CROSS_PLATFORM_STRATEGY.md).

## Architecture

```text
Renderer React UI
  ├─ terminal surface via xterm.js
  ├─ command palette buttons
  ├─ headless runner panel
  └─ project/model/mode controls
        │ secure IPC only
        ▼
Preload bridge
        │ validates channel shape, no node integration
        ▼
Electron main process
  ├─ PTY SessionManager -> cmd [interactive]
  ├─ child_process runner -> cmd --print [headless]
  ├─ command-code doctor/status/list-models helpers
  └─ guarded external links + directory picker
        │
        ▼
Installed Command Code CLI
```

## Key design decisions

- **Do not parse the TUI as the source of truth.** Display it faithfully in xterm first. Add structured state only when Command Code exposes stable JSON or API hooks.
- **Treat headless and interactive as separate paths.** Headless is clean for automation but cannot use interactive slash commands or keyboard shortcuts.
- **Use a PTY for interactive sessions.** A normal `child_process.spawn` pipe will not behave like a real terminal for a CLI/TUI app.
- **Keep permissions explicit.** Standard, plan, auto-accept, trust, and yolo-style choices should be impossible to miss.
- **Fail closed.** Never expose arbitrary shell execution from the renderer. The only spawned command should be the configured Command Code binary with controlled arguments.

## Docs

All documentation lives under `docs/`. See [docs/INDEX.md](docs/INDEX.md) for a full listing with descriptions.

| Section | Contents |
|---|---|
| [Architecture](docs/architecture/) | App architecture, cross-platform strategy, security |
| [Guides](docs/guides/) | Visual design style guide |
| [Reference](docs/reference/) | CLI reference, CLI integration notes, issue map, known limitations, reference links |
| [Reports](docs/reports/) | Smoke test reports, test plans |
| [Roadmap](ROADMAP.md) | Full 9-phase implementation plan |


## Smoke checks

```bash
npm run typecheck
npm run doctor
```

Then open the app, choose a project, start Mock mode, and run:

```text
/help
/plan Build a GUI wrapper around Command Code
/design surface src/renderer/src/App.tsx
```

Switch Mock mode off after `cmd --version` and `cmd status --json` work in your terminal.
