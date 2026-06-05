# Components Reference

The renderer is a single-page React app with a grid layout: side rail (ControlPanel) + workspace area (terminal, headless, file browser, overlays).

## Component tree

```
App
├─ ToastContainer                        (fixed-position toast notifications)
├─ ControlPanel                          (left sidebar, ~350px)
│  ├─ RecentProjects                     (localStorage recent dirs list)
│  ├─ ModelDropdown                      (parses cmd --list-models, favorites)
│  ├─ AuthCard                           (parses cmd status --json)
│  ├─ CommandHistory                     (typed commands, star favorites)
│  ├─ HeadlessHistory                    (job result cards)
│  ├─ IdePanel                           (cmd --ide-status output)
│  └─ AudioSettings                      (master volume + per-category toggles)
│
└─ section.workspace                     (right area)
   ├─ ModeRail                           (persistent left-edge color bar)
   ├─ header.top-bar                     (branding, status pills, buttons)
   │  └─ StatusPill × 2                  (permission mode, trust status)
   │
   ├─ TabBar                             (session tabs, switch/kill)
   │
   ├─ div.workspace-body
   │  ├─ FileBrowser                     (left tree: project files)
   │  └─ div.workspace-main
   │     ├─ TerminalPane                 (xterm.js PTY display)
   │     └─ HeadlessRunner               (prompt textarea + run button)
   │
   ├─ FileViewer                         (overlay: file preview with MD rendering)
   ├─ DocsSidecar                        (overlay: iframe → commandcode.ai/docs)
   └─ AdvancedPanel                      (overlay: 7-tab management panel)
```

## Component details

### `App.tsx`

Root component. Owns all core state:
- **Session state**: `tabs[]` array of `{ id, label, mock, stopRequested, transcriptPath }`, plus `activeTabId`
- **Project state**: `cwd`, `commandExecutable`, `model` (persisted to localStorage)
- **Permission state**: `permissionMode`, `trust`, `skipOnboarding`, `useMock`
- **Overlay state**: `viewingFile`, `docsOpen`, `advancedOpen`
- **Job state**: `headlessJobs[]` array, `statusLine`

Key flows:
- `startSession` → transport.startSession → adds tab, sets activeId, notifies + plays chime
- `stopSession` → two-stage: first sends Ctrl-C, second kills PTY
- `runHeadless` → creates job entry, calls transport.runHeadless, updates result
- `onExit` → removes tab, notifies + plays chime
- `sendSlash` → writes command to current active PTY + pushes to command history

### `ControlPanel`

Pure configuration UI. Receives all state via props with setters. Renders a `children` slot for side-rail panels. Accepts callbacks: `onChooseProject`, `onStartSession`, `onStopSession`, `onCheck`, `onSlash`.

### `TabBar`

Horizontal tab row above the terminal. Props: `tabs[]`, `activeId`, `onSelect`, `onKill`. Each tab shows a status dot (green=live, purple=mock), label, and close button.

### `TerminalPane`

Mounts xterm.js. Connects to a session's WebSocket stream via `transport.onSessionData`. Handles resize via `ResizeObserver`. Calls `onExit` callback when the server signals session exit.

### `HeadlessRunner`

Simple form: prompt textarea, max turns input, yolo checkbox, run button. Accepts `onRun(prompt, maxTurns, yolo)` callback — does NOT call transport directly.

### `FileBrowser`

Recursive tree component. Loads directory from `transport.listFiles(dir)`. Expandable directories, file type icons (emoji per extension), file sizes. Clicking a file calls `onSelectFile(path)`.

### `FileViewer`

Modal overlay. Reads file content from `transport.readFile(path)`. Renders:
- `.md` files → light Markdown-to-HTML (headings, lists, code blocks, tables, inline bold/code/links)
- `.ansi` files → raw pre with ansi-content class
- Everything else → raw pre

### `DocsSidecar`

Iframe overlay at `https://commandcode.ai/docs` with ←/→/🏠 navigation buttons.

### `AdvancedPanel`

Modal overlay with 7 tabs. Each tab is a self-contained sub-component that fetches data from the transport API on mount:

| Tab | Sub-component | Data source |
|---|---|---|
| Sessions | `SessionDiscovery` | `transport.discoverSessions()` → `~/.commandcode/` scan |
| Usage | `UsageDashboard` | `transport.usage()` → headless `/usage --json` |
| Taste | `TasteBrowser` | `transport.listTaste()` → parse taste.md files |
| Agents | `AgentEditor` | `transport.listAgents()` + `saveAgent()` → agent configs |
| MCP | `McpPanel` | `transport.listMcp()` + `mcpAction()` → `cmd mcp` commands |
| Skills | `SkillsBrowser` | `transport.listSkills()` → skill directory scan |
| Memory | `MemoryEditor` | `transport.listMemories()` + `saveMemory()` → project memory files |

### Utility components

- **`StatusPill`**: Label + tone (good/warn/purple/default) pill badge
- **`ModeRail`**: Vertical left-edge bar with color + label based on permission mode
- **`ToastContainer`**: Fixed-position toast display, subscribes to `notify()` calls
- **`AudioSettings`**: Master volume slider + per-category enable toggles
- **`RecentProjects`**: Auto-tracks cwd changes to localStorage, shows recent dirs list
- **`CommandHistory`**: Stores last 50 typed commands, star-to-favorite system
- **`HeadlessHistory`**: Scrollable job result cards with stdout/stderr/duration
- **`IdePanel`**: Parses `cmd --ide-status`, green highlights for OK lines

## State persistence

All viewer-visible preferences persist to localStorage with the `ccgui.` prefix:

| Key | Data |
|---|---|
| `ccgui.cwd` | Last working directory |
| `ccgui.command` | Command binary path |
| `ccgui.model` | Selected model |
| `ccgui.model-favorites` | Starred models |
| `ccgui.recent-dirs` | Recent project directories (max 8) |
| `ccgui.command-history` | Typed commands (max 50) |
| `ccgui.favorite-commands` | Starred commands |
| `ccgui.toast-preferences` | Toast settings (position, duration, categories) |
| `ccgui.audio-preferences` | Audio settings (master volume, per-category enables) |

## Data flow patterns

### PTY data → xterm display

```
cmd PTY → node-pty onData → CoreSessionManager event → WS broadcast
  → browserAdapter socket.onmessage → sessionCallback
  → TerminalPane xterm.write() → xterm.js render
```

### Slash command → PTY

```
User clicks quick command → ControlPanel.onSlash(command)
  → App.sendSlash(command) → transport.write(sessionId, line)
  → POST /api/sessions/:id/write → sessionManager.write()
  → PTY.write() → cmd CLI
```

### Headless run → job history

```
HeadlessRunner.onRun() → App.runHeadless(prompt, maxTurns, yolo)
  → creates HeadlessJob entry → transport.runHeadless()
  → POST /api/headless → cli.runHeadless() → cmd --print
  → updates job with result → HeadlessHistory re-renders
```
