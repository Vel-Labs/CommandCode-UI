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

### `POST /api/update`

Runs `cmd update --check-only` by default. When `checkOnly` is explicitly `false`, runs `cmd update`.

The app uses this as a fixed-purpose update surface: startup checks are read-only, and the sidebar Update chip is the explicit operator action that can install an available Command Code CLI update.

**Request body:**
```json
{
  "commandExecutable": "cmd",
  "cwd": "/path/to/project",
  "checkOnly": true
}
```

**Response:**
```json
{
  "ok": true,
  "command": "cmd",
  "stdout": "Checking for updates...\nUp to date (0.32.3)\n",
  "stderr": "",
  "exitCode": 0,
  "checkOnly": true,
  "upToDate": true,
  "updateAvailable": false,
  "version": "0.32.3",
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

### `POST /api/project/preferences`

Reads GUI adapter preferences from `<project>/.commandcode/gui-preferences.json`.

This is project-scoped GUI state only. It does not change Command Code runtime semantics.

**Request body:**
```json
{
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "ok": true,
  "path": "/path/to/project/.commandcode/gui-preferences.json",
  "preferences": {
    "version": 1,
    "projectPath": "/path/to/project",
    "model": "deepseek/deepseek-v4-pro",
    "runtimeMode": "real-session",
    "permissionMode": "standard",
    "trust": false
  }
}
```

### `POST /api/app/preferences`

Reads app-level GUI preferences from `~/.commandcode/gui-preferences.json`.

This stores shell-level state that must survive Electron dev-server port changes: the last selected project, recent projects, command binary, default model, model favorites by project, appearance theme, dismissed release notes, and resizable shell widths.

**Response:**
```json
{
  "ok": true,
  "path": "/Users/name/.commandcode/gui-preferences.json",
  "preferences": {
    "version": 1,
    "cwd": "/path/to/project",
    "recentProjects": ["/path/to/project"],
    "commandExecutable": "cmd",
    "model": "deepseek/deepseek-v4-pro",
    "appearanceTheme": "cc-spectrum",
    "sidebarWidth": 292,
    "rightInspectorWidth": 420
  }
}
```

### `POST /api/app/preferences/save`

Writes sanitized app-level GUI preferences to `~/.commandcode/gui-preferences.json`. The route writes only this fixed file and does not accept an arbitrary output path.

**Request body:**
```json
{
  "preferences": {
    "version": 1,
    "cwd": "/path/to/project",
    "recentProjects": ["/path/to/project"],
    "commandExecutable": "cmd",
    "model": "deepseek/deepseek-v4-pro",
    "projectModels": {
      "/path/to/project": "deepseek/deepseek-v4-pro"
    },
    "appearanceTheme": "cc-spectrum",
    "releaseNotesSeen": ["0.32.3"],
    "sidebarWidth": 292,
    "rightInspectorWidth": 420
  }
}
```

**Response:**
```json
{
  "ok": true,
  "path": "/Users/name/.commandcode/gui-preferences.json",
  "preferences": { "version": 1, "cwd": "/path/to/project" }
}
```

### `POST /api/project/preferences/save`

Writes sanitized GUI adapter preferences to `<project>/.commandcode/gui-preferences.json`. The route never accepts an arbitrary output path.

**Request body:**
```json
{
  "cwd": "/path/to/project",
  "preferences": {
    "version": 1,
    "model": "deepseek/deepseek-v4-pro",
    "runtimeMode": "real-session",
    "permissionMode": "standard",
    "trust": false,
    "skipOnboarding": false,
    "headlessMaxTurns": 10,
    "headlessYolo": false,
    "appearanceTheme": "cc-spectrum"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "path": "/path/to/project/.commandcode/gui-preferences.json",
  "preferences": { "version": 1, "projectPath": "/path/to/project" }
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

### `POST /api/git/status`

Runs fixed git diagnostics for the selected project: `git rev-parse --show-toplevel`, `git status --porcelain=v1 --branch`, `git diff --numstat`, and `git diff --cached --numstat`.

This endpoint does not accept arbitrary git arguments. It exists to back the Environment inspector with branch, ahead/behind, changed-file, insertion, and deletion counts.

**Request body:**
```json
{
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "ok": true,
  "cwd": "/path/to/project",
  "root": "/path/to/project",
  "branch": "main",
  "ahead": 0,
  "behind": 0,
  "filesChanged": 8,
  "insertions": 204,
  "deletions": 16,
  "added": 0,
  "modified": 8,
  "deleted": 0,
  "untracked": 0,
  "files": [
    { "status": "M", "path": "README.md" }
  ],
  "raw": "## main\n M README.md\n"
}
```

---

## Session lifecycle

### `POST /api/sessions`

Starts a new PTY-backed session. The default `terminalMode` starts Command Code. `terminalMode: "shell"` starts the operating-system shell in the selected project and is used only by the repo terminal panel.

**Request body:**
```json
{
  "cwd": "/path/to/project",
  "terminalMode": "command-code",
  "commandExecutable": "cmd",
  "initialPrompt": "Build a GUI wrapper",
  "resume": "6d716ec0-aba3-48f9-b03c-d6ed381c190c",
  "continueLast": false,
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

`resume` maps to `cmd --resume <value>`. `continueLast` maps to `cmd --continue` and takes precedence over `resume`. The GUI must not append directly to existing `.jsonl` chat context files.

For the repo terminal panel, the renderer sends only:

```json
{
  "cwd": "/path/to/project",
  "terminalMode": "shell",
  "cols": 120,
  "rows": 22,
  "useMock": false
}
```

The server chooses the shell executable from the local OS environment. The renderer does not provide an arbitrary command for this path.

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
  "cwd": "/path/to/project",
  "dir": "/path/to/project"
}
```

`cwd` is the workspace boundary. If `cwd` is omitted, the server uses an active session's registered workspace root. If neither is available, the route fails closed.

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
  "cwd": "/path/to/project",
  "filePath": "/path/to/project/README.md"
}
```

`filePath` must be inside `cwd` or inside an active session's registered workspace root.

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

Scans `~/.commandcode/sessions/` and `~/.commandcode/transcripts/` for global past session artifacts. When `cwd` is provided, also scans `~/.commandcode/projects/<project-slug>/` for project chat contexts (`*.jsonl` plus optional `*.meta.json` titles).

**Request body:**
```json
{
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "6d716ec0-aba3-48f9-b03c-d6ed381c190c",
      "title": "Verify roadmap layers",
      "timestamp": "2026-06-04T10:30:00.000Z",
      "transcriptPath": "/Users/.../.commandcode/projects/users-name-workspace-project/session.jsonl",
      "sizeBytes": 45120,
      "source": "project"
    }
  ]
}
```

Project sessions are runtime-owned Command Code context files. The GUI may reveal them for audit, but interactive continuation should happen by starting a real PTY session with `cmd --resume <session-id>` through `/api/sessions`.

### `POST /api/sessions/transcript`

Reads a transcript for the read-only transcript/history view. The route only accepts paths under Command Code transcript stores such as `~/.commandcode/projects/`, `~/.commandcode/sessions/`, `~/.commandcode/transcripts/`, or GUI transcript output.

**Request body:**
```json
{
  "transcriptPath": "/Users/name/.commandcode/projects/project-slug/session.jsonl"
}
```

**Response:**
```json
{
  "content": "...",
  "path": "/Users/name/.commandcode/projects/project-slug/session.jsonl",
  "ext": ".jsonl"
}
```

### `POST /api/project/commandcode-reference`

Returns the canonical project-state map for repo-local `.commandcode` files plus the user-level Command Code context store for the selected project.

**Request body:**
```json
{
  "cwd": "/path/to/project"
}
```

**Response:**
```json
{
  "reference": {
    "projectPath": "/path/to/project",
    "projectCommandCodePath": "/path/to/project/.commandcode",
    "userProjectContextPath": "/Users/name/.commandcode/projects/path-to-project",
    "sections": [
      {
        "key": "commands",
        "label": "Project commands",
        "description": "Repo-local slash command prompt files owned by Command Code.",
        "path": "/path/to/project/.commandcode/commands",
        "exists": true,
        "files": [
          {
            "name": "roadmap-next.md",
            "path": "/path/to/project/.commandcode/commands/roadmap-next.md",
            "sizeBytes": 420,
            "updatedAt": "2026-06-05T00:00:00.000Z"
          }
        ]
      }
    ]
  }
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
  "cwd": "/Users/.../project",
  "path": "/Users/.../.commandcode/agents/my-agent.md",
  "content": "---\nsystem_prompt: Updated prompt\n---"
}
```

The path must be under `<cwd>/.commandcode/agents/`. Requests without a project root are denied.

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
  "cwd": "/path/to/project",
  "path": "/path/to/project/AGENTS.md",
  "content": "# Updated instructions..."
}
```

The path must be one of the allowed project memory files or under `<cwd>/.commandcode/memory/`. Requests without a project root are denied.

**Response:**
```json
{ "ok": true }
```
