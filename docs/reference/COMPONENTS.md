# Components Reference

The renderer is a single-page React app with a Codex-like workbench layout: persistent left navigation, a center session/transcript workspace, and an optional right inspector for files, transcript, docs, environment, IDE, and advanced surfaces.

## Component tree

```
App
├─ ToastContainer                        (fixed-position toast notifications)
├─ SidebarShell                          (resizable left navigation, collapsible projects, recent chats, active sessions)
│
└─ section.native-main                   (center/right work area)
   ├─ SettingsWorkspace                  (full settings page inside the app shell)
   ├─ HomeWorkspace                      (centered composer-first new session view)
   ├─ TranscriptWorkspace                (fallback read-only recent context/history view)
   │  └─ TranscriptPreview               (read-only transcript fetch)
   ├─ SessionWorkspace                   (active terminal session)
   │  ├─ SessionHeader                   (compact title/status + workbench rail)
   │  ├─ TabBar                          (session tabs, switch/kill)
   │  ├─ TerminalPane                    (interactive Command Code PTY display)
   │  ├─ BottomTerminalPanel             (optional separate repo shell PTY)
   │  └─ ComposerBar                     (prompt, access/session/project/model chips)
   ├─ RightInspectorPanel                (resizable optional files/file/transcript/docs/environment/IDE/advanced sidecar)
   │  ├─ FileBrowser                     (project file tree)
   │  ├─ FileViewer                      (inline file preview)
   │  ├─ TranscriptPreview               (read-only transcript view)
   │  └─ Docs iframe                     (https://commandcode.ai/docs)
   └─ AdvancedPanel                      (modal for deeper runtime/project tools)
```

## Component details

### `App.tsx`

Root component. Owns all core state:
- **View state**: `workspaceView = home | session | transcript | settings`, `rightInspector = none | files | file | transcript | docs | environment | ide | advanced`
- **Session state**: `tabs[]` array of `{ id, label, mock, stopRequested, transcriptPath, resumedSession? }`, plus `activeTabId`
- **Project state**: `cwd`, `commandExecutable`, `model`, recent projects, and per-project GUI preferences. Renderer cache uses localStorage; selected-project defaults mirror to `.commandcode/gui-preferences.json`.
- **Permission state**: `permissionMode`, `trust`, `skipOnboarding`, `useMock`, plus the session-local terminal input toggle
- **Inspector state**: `viewingFile`, `selectedTranscript`, `resumeFailure`, `advancedOpen`
- **Job state**: `headlessJobs[]` array, `statusLine`

Key flows:
- `startSession` → transport.startSession → adds tab, sets activeId, notifies + plays chime
- `Cmd+T` / `Ctrl+T` → starts another session in the selected project using the current composer runtime/access/model defaults
- `openTranscriptSession` → pins history in the right inspector and immediately resumes through `cmd --resume`
- `toggleShellTerminal` → starts or kills a separate shell PTY rooted at the selected project
- `stopSession` → staged stop/interrupt/force-kill of the active Command Code PTY
- `runHeadless` → creates job entry, calls transport.runHeadless, updates result
- `onExit` → removes tab, notifies + plays chime; resume failures keep the transcript view open with inline failure state
- Composer submit and command palette rows write paced keystrokes plus Enter to the current active Command Code PTY + push to command history. The composer sends on Enter and inserts line breaks on Shift+Enter. Direct terminal input is enabled automatically for detected Command Code selection prompts and can also be enabled by clicking the terminal.

### `SidebarShell`

Primary app navigation. It owns no runtime semantics directly; it selects app views, project context, recent chats, and active sessions. Projects, Recent chats, and Active sessions are collapsible groups. Recent chats are capped by default with a Show more row; selecting one immediately resumes the selected Command Code session through the CLI while keeping the previous transcript visible in the right inspector. The sidebar width is draggable, persists to app GUI preferences, and collapses into icon-only mode when dragged below the collapse threshold.

### `TabBar`

Horizontal tab row above the terminal. Props: `tabs[]`, `activeId`, `onSelect`, `onKill`. Each tab shows a status dot (green=live, purple=mock), label, and close button.

### `TerminalPane`

Mounts xterm.js. Connects to a session's WebSocket stream via `transport.onSessionData`. Handles resize via `ResizeObserver` and sends PTY rows/cols on fit. The composer is the primary prompt surface, and the active Command Code pane is read-only by default; detected Command Code selection prompts automatically enable terminal input, and clicking the terminal or the session utility row's Menu input button can temporarily enable direct terminal input for menus, confirmations, and TUI flows. In read-only chat mode, the active PTY prompt area is visually masked so it does not compete with the composer. Menu input closes after Enter. The separate repo shell terminal is mounted with input enabled for direct commands such as `npm run dev`. Auto-follow is guarded: after terminal input or manual scroll, the app does not force `scrollToBottom()`. A manual Jump to prompt affordance appears only when output is not being followed. `Ctrl+O` is intercepted as an app-level expansion affordance when input is enabled. `Cmd+T` / `Ctrl+T` is handled by the app shell before the PTY and starts a new Command Code session in the same selected project.

### `WorkbenchToolRail`

Compact Codex-like icon rail in the active session header. Left-to-right actions are:
- IDE/Finder: opens the right inspector on IDE status and project reveal actions.
- Environment: opens the right inspector on git branch/change status from `transport.gitStatus(cwd)`.
- Terminal: toggles a compact shell PTY rooted at the selected repo. This is intentionally separate from the active Command Code session.
- Right sidebar: opens or closes the inspector, defaulting to Files when no inspector is open.

### `HeadlessRunner`

Simple form: prompt textarea, max turns input, yolo checkbox, run button. Accepts `onRun(prompt, maxTurns, yolo)` callback — does NOT call transport directly.

### `FileBrowser`

Recursive tree component. Loads directory from `transport.listFiles(dir)`. Expandable directories, file type icons (emoji per extension), file sizes. Clicking a file calls `onSelectFile(path)`.

### `TranscriptWorkspace`

Fallback read-only recent context view used when a resume fails or when history is opened directly. It shows Command Code session title, id, timestamp, transcript preview, lightweight work events, and explicit actions:
- `Resume` starts a real PTY through the existing session API.
- `Reveal file` opens the transcript path through the existing guarded reveal route.
- `Open transcript` sends the transcript into the right inspector.

The GUI never writes to runtime-owned `.jsonl`, `.meta.json`, or checkpoint files.

### `RightInspectorPanel`

Persistent, dismissible sidecar for active/transcript workspaces. It replaces the old file drawer/docs overlay pattern and can show files, a selected file preview, transcript/history, docs, environment status, IDE/Finder actions, or advanced entry points. Opening a file from the browser or transcript flow loads it here instead of a modal overlay. The inspector width is draggable, persists to app GUI preferences, and collapses when dragged below the useful width.

### `FileViewer`

Reads file content from `transport.readFile(path)`. Renders inline in the right inspector, with overlay mode still available for older callers:
- `.md` files → light Markdown-to-HTML (headings, lists, code blocks, tables, inline bold/code/links)
- `.ansi` files → raw pre with ansi-content class
- Everything else → raw pre

### `AdvancedPanel`

Modal overlay with 8 tabs. Each tab is a self-contained sub-component that fetches data from the transport API on mount:

| Tab | Sub-component | Data source |
|---|---|---|
| Project state | `ProjectStateReference` | `transport.projectCommandCodeReference(cwd)` → repo `.commandcode` plus user project context path |
| Sessions | `SessionDiscovery` | `transport.discoverSessions(cwd)` → global scans plus `~/.commandcode/projects/<project-slug>/`; project contexts can resume through `cmd --resume` |
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

Renderer-side cache persists to localStorage with the `ccgui.` prefix:

| Key | Data |
|---|---|
| `ccgui.cwd` | Last working directory |
| `ccgui.command` | Command binary path |
| `ccgui.model` | Selected model |
| `ccgui.recent-dirs` | Recent project directories |
| `ccgui.project-models` | Project path → selected model override |
| `ccgui.favorite-models` | Starred models |
| `ccgui.release-notes-seen` | Locally dismissed release-note versions |
| `ccgui.sidebar-width` | Last expanded left sidebar width |
| `ccgui.right-inspector-width` | Last right inspector width |
| `ccgui.recent-dirs` | Recent project directories (max 8) |
| `ccgui.command-history` | Typed commands (max 50) |
| `ccgui.favorite-commands` | Starred commands |
| `ccgui.toast-preferences` | Toast settings (position, duration, categories) |
| `ccgui.audio-preferences` | Audio settings (master volume, per-category enables) |

Selected-project GUI defaults are also written to:

| File | Data |
|---|---|
| `<project>/.commandcode/gui-preferences.json` | Selected model, runtime mode, permission mode, trust flag, onboarding/headless defaults, appearance theme, and update timestamp |

## Data flow patterns

### PTY data → xterm display

```
cmd PTY → node-pty onData → CoreSessionManager event → WS broadcast
  → browserAdapter socket.onmessage → sessionCallback
  → TerminalPane xterm.write() → xterm.js render
```

### Composer prompt → Command Code PTY

```
User submits composer or command palette item → App.submitComposer/App.runCommand()
  → transport.write(activeCommandCodeSessionId, line)
  → POST /api/sessions/:id/write → sessionManager.write()
  → PTY.write() → cmd CLI
```

### Header terminal → repo shell PTY

```
User clicks Terminal → App.toggleShellTerminal()
  → POST /api/sessions with terminalMode=shell
  → CoreSessionManager starts the OS shell in cwd
  → TerminalPane input is enabled for repo commands
```

### Headless run → job history

```
HeadlessRunner.onRun() → App.runHeadless(prompt, maxTurns, yolo)
  → creates HeadlessJob entry → transport.runHeadless()
  → POST /api/headless → cli.runHeadless() → cmd --print
  → updates job with result → HeadlessHistory re-renders
```

### Recent chats → resume + side history

```
Sidebar recent chat click → App.openTranscriptSession(session)
  → rightInspector = transcript + selectedTranscript = session
  → App.startSession(undefined, session, keepTranscriptInspector)
  → POST /api/sessions with resume title/id → cmd --resume
  → active Command Code session receives future prompts from the composer while history remains visible in the side inspector
```
