# API Reference

The local server exposes a JSON REST API and WebSocket stream. Base URL is `http://127.0.0.1:{port}` where port is auto-assigned unless specified.

## Authentication

All endpoints require authentication except `GET /health`. The server checks four sources in priority order:

1. **Cookie**: `ccgui-token=<value>` in `Cookie` header (same-origin Electron/production)
2. **Custom header**: `X-Auth-Token: <value>` (Vite proxy — cookies don't cross ports)
3. **Query param**: `?token=<value>` (initial page load, drops after cookie is set)
4. **Bearer**: `Authorization: Bearer <value>` (programmatic API access)

Missing/wrong token returns `401 { error: "Unauthorized" }`.

Responses are always JSON with `Content-Type: application/json`. The server sets CORS headers (`Access-Control-Allow-Origin: *`) for localhost browser mode.

---

## Health

### `GET /health`

No auth required.

**Response:**
```json
{ "ok": true }
```

---

## CLI introspection

### `POST /api/check`

Runs `cmd --version`.

**Request body:**
```json
{
  "commandExecutable": "cmd"
}
```

**Response:**
```json
{
  "ok": true,
  "command": "cmd",
  "version": "1.2.3",
  "stdout": "command-code v1.2.3\n",
  "stderr": "",
  "error": null
}
```

### `POST /api/status`

Runs `cmd status --json`.

**Request body:**
```json
{
  "commandExecutable": "cmd",
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "ok": true,
  "stdout": "...",
  "stderr": "...",
  "parsed": { <JSON output from cmd> },
  "error": null
}
```

### `POST /api/models`

Runs `cmd --list-models`.

**Request body:**
```json
{
  "commandExecutable": "cmd",
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "ok": true,
  "stdout": "...",
  "stderr": "",
  "models": ["anthropic/claude-sonnet-4-20250514", "openai/gpt-4o", "..."],
  "error": null
}
```

### `POST /api/ide-status`

Runs `cmd --ide-status`.

**Request body:**
```json
{
  "commandExecutable": "cmd",
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "ok": true,
  "stdout": "...",
  "stderr": "",
  "lines": ["✓ IDE connected", "VSCode detected", "..."],
  "error": null
}
```

---

## Session lifecycle

### `POST /api/sessions`

Starts a new interactive session. Spawns a PTY for real mode, or enters mock mode.

**Request body:**
```json
{
  "cwd": "/path/to/project",
  "commandExecutable": "cmd",
  "initialPrompt": "Build a GUI wrapper",
  "model": "anthropic/claude-sonnet-4-20250514",
  "permissionMode": "standard",
  "trust": true,
  "skipOnboarding": false,
  "addDirs": [],
  "cols": 120,
  "rows": 34,
  "useMock": false
}
```

**Response:**
```json
{
  "id": "uuid-v4",
  "command": "cmd",
  "args": ["Build a GUI wrapper", "--trust", ...],
  "cwd": "/path/to/project",
  "mock": false,
  "transcriptPath": "/Users/.../.commandcode-gui-starter/transcripts/..."
}
```

### `POST /api/sessions/:id/write`

Sends data to the session's PTY stdin.

**Request body:**
```json
{
  "data": "hello\r"
}
```

**Response:**
```json
{ "ok": true }
```

### `POST /api/sessions/:id/resize`

Resizes the PTY terminal dimensions.

**Request body:**
```json
{
  "cols": 120,
  "rows": 40
}
```

**Response:**
```json
{ "ok": true }
```

### `DELETE /api/sessions/:id`

Sends Ctrl-C (`\x03`) to the PTY. The same endpoint is used for force-kill by the session manager. The session exits naturally after the PTY process terminates.

**Response:**
```json
{ "ok": true }
```

### WebSocket `ws://host/ws/sessions/:id`

Streams PTY output in real time.

**Server → Client messages:**

Data event:
```json
{ "type": "data", "data": "ANSI-encoded terminal output" }
```

Exit event:
```json
{
  "type": "exit",
  "sessionId": "uuid",
  "exitCode": 0,
  "signal": null
}
```

**Client → Server messages (optional):**

Write:
```json
{ "type": "write", "data": "input\r" }
```

Resize:
```json
{ "type": "resize", "cols": 120, "rows": 40 }
```

---

## Headless execution

### `POST /api/headless`

Runs `cmd --print <prompt>` as a one-shot subprocess. Captures stdout, stderr, exit code, signal, timeout state, and duration.

**Request body:**
```json
{
  "cwd": "/path/to/project",
  "commandExecutable": "cmd",
  "prompt": "Summarize this project",
  "model": "anthropic/claude-sonnet-4-20250514",
  "permissionMode": "standard",
  "maxTurns": 10,
  "yolo": false,
  "trust": true,
  "plan": false,
  "skipOnboarding": false,
  "addDirs": [],
  "timeoutMs": 600000
}
```

**Response:**
```json
{
  "command": "cmd",
  "args": ["--print", "Summarize...", "--max-turns", "10", "--trust"],
  "cwd": "/path/to/project",
  "exitCode": 0,
  "signal": null,
  "stdout": "Project summary output...",
  "stderr": "",
  "timedOut": false,
  "durationMs": 4521
}
```

---

## File system

### `POST /api/files/list`

Lists directory contents. Dotfiles are excluded except `.commandcode`.

**Request body:**
```json
{
  "dir": "/path/to/project"
}
```

**Response:**
```json
{
  "entries": [
    { "name": "src", "path": "/path/to/project/src", "isDirectory": true },
    { "name": "README.md", "path": "/path/to/project/README.md", "isDirectory": false, "size": 2048 }
  ],
  "dir": "/path/to/project"
}
```

### `POST /api/files/read`

Reads a file's contents.

**Request body:**
```json
{
  "filePath": "/path/to/project/README.md"
}
```

**Response:**
```json
{
  "content": "# Project Title\n\nDescription...",
  "path": "/path/to/project/README.md",
  "ext": ".md"
}
```

Error case:
```json
{ "error": "File not found" }
```

---

## Discovery & management

### `POST /api/sessions/discover`

Scans `~/.commandcode/sessions/` and `~/.commandcode/transcripts/` for past session artifacts.

**Response:**
```json
{
  "sessions": [
    {
      "id": "2026-06-04T10-30-00-uuid.ansi",
      "timestamp": "2026-06-04T10:30:00.000Z",
      "transcriptPath": "/Users/.../.commandcode/transcripts/...",
      "sizeBytes": 45120
    }
  ]
}
```

### `POST /api/usage`

Runs a headless `cmd /usage --json` session to fetch usage data.

**Request body:**
```json
{
  "commandExecutable": "cmd",
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "totalTokens": 1250000,
  "totalCost": 42.50,
  "totalRuns": 89,
  "raw": "raw output from cmd...",
  "parsed": true
}
```

If JSON parsing fails, falls back to regex extraction from raw output.

### `POST /api/taste/list`

Parses `taste.md` files under `~/.commandcode/taste/` and `~/.commandcode/taste-profiles/`.

**Response:**
```json
{
  "packages": [
    {
      "path": "/Users/.../.commandcode/taste/workflow",
      "name": "workflow",
      "categories": [
        {
          "name": "workflow",
          "confidence": 0.7,
          "learnings": [
            "Mark completed tasks with ✅ emoji. Confidence: 0.70"
          ]
        }
      ]
    }
  ]
}
```

### `POST /api/agents/list`

Lists agent configs from `~/.commandcode/agents/` and `~/.agents/agents/`.

**Response:**
```json
{
  "agents": [
    {
      "path": "/Users/.../.commandcode/agents/my-agent.md",
      "name": "my-agent",
      "rawContent": "---\nsystem_prompt: You are...\n---\n\n# Agent\n...",
      "systemPrompt": "You are...",
      "description": "My custom agent"
    }
  ]
}
```

### `POST /api/agents/save`

Saves agent config content to a file path.

**Request body:**
```json
{
  "path": "/Users/.../.commandcode/agents/my-agent.md",
  "content": "---\nsystem_prompt: Updated prompt\n---"
}
```

**Response:**
```json
{ "ok": true }
```

Error:
```json
{ "ok": false, "error": "Failed to save agent config" }
```

### `POST /api/mcp/list`

Runs `cmd mcp list`.

**Request body:**
```json
{
  "commandExecutable": "cmd"
}
```

**Response:**
```json
{
  "servers": [
    {
      "name": "github",
      "status": "connected",
      "toolCount": 12,
      "raw": "github           connected   12 tools"
    }
  ]
}
```

### `POST /api/mcp/action`

Runs `cmd mcp connect|disconnect <serverName>`.

**Request body:**
```json
{
  "commandExecutable": "cmd",
  "action": "connect",
  "serverName": "github"
}
```

**Response:**
```json
{
  "ok": true,
  "stdout": "Connected to github",
  "stderr": "",
  "exitCode": 0
}
```

### `POST /api/skills/list`

Scans `~/.commandcode/skills/` and `~/.agents/skills/` for `SKILL.md` files.

**Response:**
```json
{
  "skills": [
    {
      "path": "/Users/.../.commandcode/skills/command-code-gui/SKILL.md",
      "name": "command-code-gui",
      "content": "# Command Code GUI\n\nBuild and harden...",
      "description": "Build and harden a desktop GUI adapter around the Command Code CLI"
    }
  ]
}
```

### `POST /api/memories/list`

Reads project memory files: `COMMANDCODE.md`, `AGENTS.md`, `CLAUDE.md`, and files under `.commandcode/memory/` in the project root.

**Request body:**
```json
{
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "memories": [
    {
      "path": "/path/to/project/AGENTS.md",
      "content": "# Agent Instructions\n\n...",
      "name": "AGENTS.md"
    }
  ]
}
```

### `POST /api/memories/save`

Writes content to a memory file.

**Request body:**
```json
{
  "path": "/path/to/project/AGENTS.md",
  "content": "# Updated instructions..."
}
```

**Response:**
```json
{ "ok": true }
```
