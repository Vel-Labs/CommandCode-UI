# Architecture

The Command Code GUI wraps the `cmd` CLI in an Electron + React desktop shell with a localhost HTTP/WebSocket server as the transport layer. The architecture cleanly separates the GUI shell from the CLI engine — the app is an adapter, not a fork.

## System overview

```
┌────────────────────────────────────────────────────────────────┐
│  Renderer Process (React)                                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐ │
│  │ Terminal  │ │ Headless │ │ Control   │ │ Advanced Panel  │ │
│  │ (xterm)   │ │ Runner   │ │ Panel     │ │ (7 tabs)        │ │
│  └─────┬─────┘ └────┬─────┘ └─────┬─────┘ └───────┬──────────┘ │
│        │             │             │               │            │
│  ┌─────┴─────────────┴─────────────┴───────────────┴──────────┐│
│  │                    TransportAPI                              ││
│  │  (browserAdapter.ts creates fetch+WS transport,             ││
│  │   useTransport.ts overlays Electron native APIs)            ││
│  └──────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP + WebSocket
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  Server Process (Node.js HTTP + WS)                            │
│  ┌────────────┐ ┌─────────────┐ ┌───────────────────────────┐ │
│  │ Route      │ │ WebSocket   │ │ Auth (cookie/header/query  │ │
│  │ Dispatcher │ │ Server      │ │  /bearer token ladder)    │ │
│  └─────┬──────┘ └──────┬──────┘ └───────────────────────────┘ │
│        │                │                                       │
│  ┌─────┴────────────────┴─────────────────────────────────────┐│
│  │                    Server Modules                            ││
│  │  ┌─────────┐ ┌─────────┐ ┌──────────────────────────────┐  ││
│  │  │ Sessions│ │ CLI      │ │ Discovery                   │  ││
│  │  │ Manager │ │ (cli.ts) │ │ (sessions, usage, taste,    │  ││
│  │  │         │ │          │ │  agents, MCP, skills, mem)  │  ││
│  │  └────┬────┘ └────┬─────┘ └──────────────┬───────────────┘  ││
│  └───────┴───────────┴──────────────────────┴──────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │ child_process.spawn / node-pty
                              ▼
               ┌──────────────────────────┐
               │   Installed `cmd` CLI     │
               │   (Command Code)          │
               └──────────────────────────┘
```

## Two deployment modes

### Electron (production)

```
Electron shell
  └─ Electron sets cookie (ccgui-token) via session.defaultSession.cookies.set()
  └─ BrowserWindow loads http://127.0.0.1:{port}
  └─ Renderer uses same-origin cookie for auth
```

The preload bridge (`src/preload/index.ts`) exposes only five native IPC methods:
- `cc:choose-directory` — native folder picker dialog
- `cc:open-external` — guarded URL opener (http/https only)
- `cc:reveal-transcript` — reveal a validated transcript file in the OS file manager
- `cc:reveal-path` — reveal a validated project directory in the OS file manager
- `cc:get-server-info` — returns port and token

### Browser (dev / WSL / Linux / headless)

```
npx vite (port 5174)
  └─ Vite proxy: /api→127.0.0.1:{PORT}, /ws→ws://127.0.0.1:{PORT}
  └─ Auth via X-Auth-Token header (set by applyAuth in browserAdapter.ts)
```

Run `npm run dev:web` for browser dev, or `npm run serve` for the built version served from the same process.

## Transport layer

### `TransportAPI` (interface)

Defined in `src/core/transport.ts`. The renderer never directly imports server modules — it only talks through this interface. Two implementations exist:

1. **`browserAdapter.ts`**: Creates fetch/WebSocket calls to the local server. Used in both Electron and browser mode. Electron mode overlays `chooseDirectory`, `openExternal`, `revealTranscript`, and `revealPath` with native IPC.

2. **`useTransport.ts`**: Returns the appropriate transport implementation based on whether `window.commandCode` (preload bridge) exists.

### API endpoints

All API endpoints require authentication except `GET /health`. Most endpoints are POST; PTY force-kill uses DELETE, and health/PTY-health are GET. See [API Reference](../reference/API_REFERENCE.md) for full request/response shapes.

**Session lifecycle:**
- `POST /api/sessions` — start a new interactive session
- `POST /api/sessions/:id/write` — send data to session PTY
- `POST /api/sessions/:id/resize` — resize terminal
- `POST /api/sessions/:id/stop` — request graceful Command Code exit (`/exit`)
- `POST /api/sessions/:id/interrupt` — send Ctrl-C (`\x03`)
- `DELETE /api/sessions/:id` — force-kill and remove the session
- `WS /ws/sessions/:id` — stream PTY output (data + exit events)

**CLI introspection:**
- `POST /api/check` — `cmd --version`
- `POST /api/status` — `cmd status --json`
- `POST /api/models` — `cmd --list-models`
- `POST /api/headless` — `cmd --print <prompt>`
- `POST /api/ide-status` — `cmd --ide-status`

**File system:**
- `POST /api/files/list` — list directory entries
- `POST /api/files/read` — read file contents

**Discovery & management (Phase 8):**
- `POST /api/sessions/discover` — scan `~/.commandcode/` for past sessions
- `POST /api/usage` — `cmd /usage --json` headless invocation
- `POST /api/taste/list` — parse taste.md files
- `POST /api/agents/list` — list agent configs
- `POST /api/agents/save` — save agent config
- `POST /api/mcp/list` — `cmd mcp list`
- `POST /api/mcp/action` — `cmd mcp connect|disconnect <name>`
- `POST /api/skills/list` — scan skill directories
- `POST /api/memories/list` — read project memory files
- `POST /api/memories/save` — save memory file

## Session lifecycle

```
Start → startSession() → POST /api/sessions → server spawns PTY
  │
  ├─ Mock mode: server emits banner text, echo loop with mockResponse()
  ├─ Real mode: server calls node-pty, streams PTY output via WS
  │
  └─ On data:
      ├─ Server appends to ANSI transcript file
      ├─ Server emits 'session:data' event
      └─ WS broadcasts to renderer → xterm.js displays

Stop ladder:
  1. User clicks "Stop"      → POST /api/sessions/:id/stop → writes /exit
  2. User clicks "Interrupt" → POST /api/sessions/:id/interrupt → writes Ctrl-C
  3. Force Stop              → DELETE /api/sessions/:id → PTY kill()
  4. PTY exits               → server emits 'session:exit' → WS broadcasts
```

## Auth model

The server generates a random 64-char hex token on startup. The auth ladder checks four sources in order:

1. **Cookie** (`ccgui-token` in `Cookie` header) — primary for same-origin Electron
2. **Custom header** (`X-Auth-Token`) — dev mode Vite proxy (cookies don't cross ports)
3. **Query param** (`?token=...`) — initial page load, drops after cookie is set
4. **Bearer** (`Authorization: Bearer ...`) — programmatic API access

Tokenized initial loads set the HttpOnly cookie only after the query token is proven, then redirect to strip the token from the URL. Authenticated API/static responses refresh the cookie. `GET /health`, invalid tokens, unauthenticated responses, and `/api/token` do not set the cookie.

## CORS and request limits

The server echoes CORS origins only for exact HTTP loopback hosts: `127.0.0.1`, `localhost`, and `::1`. Prefix lookalikes such as `localhost.evil.example` are not echoed. Non-browser local tooling may omit an Origin header; invalid origins receive `Access-Control-Allow-Origin: null`.

JSON request bodies are capped at 1 MB. Oversized bodies return `413 { "error": "Request body too large" }` instead of resetting the connection.

## Renderer component tree

See [Components Reference](reference/COMPONENTS.md) for the full component tree and state management.

## Mock mode

Mock mode spawns no PTY — the server responds with pre-canned text for common slash commands (`/help`, `/plan`, `/design`, `/exit`). This allows the entire UI to be explored and tested before Command Code is installed.

## Security posture

- Renderer never receives Node.js integration (`contextIsolation: true`, `nodeIntegration: false`)
- Preload bridge exposes only five IPC methods, all guarded and native-only
- Main process only spawns the configured `cmd` binary with controlled argument arrays
- No arbitrary shell execution from renderer
- Permission mode is always visible (mode rail, top-bar status pills)
- External URLs opened from renderer are validated (http/https only)
