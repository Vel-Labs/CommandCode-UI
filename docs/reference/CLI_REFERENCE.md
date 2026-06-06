# Command Code CLI Reference

Every `cmd` flag, subcommand, and slash command relevant to the GUI. Sourced from the Command Code CLI.

---

## CLI Subcommands (standalone)

| Subcommand | Description |
|---|---|
| `cmd` | Start interactive session |
| `cmd "message"` | Start interactive session with initial message |
| `cmd info` | Display system information |
| `cmd status` | Show authentication status |
| `cmd status --json` | Show authentication status as JSON |
| `cmd help` | Display help information |
| `cmd whoami` | Show current user |
| `cmd update` | Update Command Code to the latest version |
| `cmd update --check-only` | Check for Command Code updates without installing |
| `cmd feedback [title]` | Share feedback or report bugs |
| `cmd login` | Login with Command Code account |
| `cmd logout` | Log out of Command Code |
| `cmd -c` | Continue last conversation |
| `cmd -r` | Resume a past session |
| `cmd --resume "name"` | Resume a named session |
| `cmd --list-models` | List available models |
| `cmd taste` | Manage taste learning packages |
| `cmd taste learn <source>` | Learn taste from a local or GitHub repo |
| `cmd learn-taste` | Learn command structure from repositories |
| `cmd mcp` | Manage MCP servers |
| `cmd skills` | Manage skills from GitHub |

---

## CLI Flags (session startup)

| Flag | Description | GUI mapping |
|---|---|---|
| `-p, --print [query]` | Non-interactive mode, output and exit | Command palette: Run headless |
| `-t, --trust` | Auto-trust project | Trust checkbox |
| `-m, --model <model>` | Run on a specific model | Model input |
| `--max-turns <n>` | Cap turns in `-p` mode | Headless max turns |
| `--permission-mode <mode>` | `standard`, `plan`, `auto-accept` | Access menu for `standard` and `auto-accept`; `/plan` command for plan mode |
| `--plan` | Start in plan mode | `/plan` command or plan suggestion |
| `--auto-accept` | Start in auto-accept mode | Access menu: Full access |
| `--yolo` | Bypass all permission prompts | Headless runtime checkbox |
| `--add-dir <dir>` | Add directory to workspace context | Future |
| `--skip-onboarding` | Skip taste onboarding | Skip onboarding checkbox |
| `--ide-setup` | Connect IDE | Future diagnostics |
| `-v, --version` | Output version number | Doctor check |
| `-h, --help` | Display help | Doctor check |

---

## Slash Commands (interactive sessions)

Commands typed during an interactive PTY session.

| Command | Description | GUI quick command |
|---|---|---|
| `/help` | Display help | ✅ |
| `/plan <task>` | Enter plan mode for a task | ✅ |
| `/design surface` | Run design-surface pass | ✅ |
| `/model` | Switch models | ✅ |
| `/configure-models` | Choose models for background tasks such as compaction and session titles | ✅ |
| `/rewind` | Restore to previous checkpoint | ✅ |
| `/skills` | Browse agent skills | ✅ |
| `/taste` | Manage taste learning | ✅ |
| `/exit` | Exit Command Code | ✅ |
| `/memory` | Manage Command Code memory | |
| `/resume` | Resume a past conversation | |
| `/rename [name]` | Rename current session | |
| `/clear` | Clear conversation history | |
| `/share` | Share conversation link | |
| `/unshare` | Stop sharing | |
| `/learn-taste` | Learn taste from other agents | |
| `/agents` | Manage agent configs | |
| `/mcp` | Manage MCP servers | |
| `/effort` | Set reasoning effort | |
| `/provider` | Select AI provider | |
| `/compact` | Compact conversation | |
| `/compact-mode` | Select compact mode | |
| `/context` | Show context window usage | |
| `/login` | Log in | |
| `/logout` | Log out | |
| `/courses` | Open courses in browser | |
| `/feedback [title]` | Share feedback | |
| `/review [pr]` | Review pull request | |
| `/pr-comments` | Fetch PR comments | |
| `/add-dir` | Manage additional dirs | |
| `/status` | Environment status | |
| `/usage` | Credits and usage | |
| `/update` | Update Command Code | |
| `/init` | Initialize AGENTS.md | |
| `/ide` | Connect IDE | |

---

## Keyboard Shortcuts (interactive sessions)

| Shortcut | Action | GUI relevance |
|---|---|---|
| `Shift+Tab` | Toggle mode (standard→auto-accept→plan) | Mode pill visibility |
| `Ctrl+T` | Toggle learning feed | |
| `Ctrl+O` | Toggle expanded tool output | |
| `Alt+P` (Option+P macOS) | Quick model switch | Model dropdown |
| `Ctrl+G` | Open input in external editor | |
| `Esc × 2` | Rewind to previous checkpoint | |
| `/` | Open command menu | Command palette |

---

## Exit / Stop Ladder

The GUI must handle session termination gracefully across these stages:

1. **Send `/exit`** — graceful shutdown requested inside the PTY
2. **Send Ctrl-C (`\x03`)** — interrupt the running process
3. **PTY kill** — force terminate the pseudo-terminal
4. **Process kill** — SIGTERM then SIGKILL for headless runs

The Stop/Force Stop button in the GUI follows this sequence automatically.

---

## Doctor Checks

What `npm run doctor` verifies:

| Check | Command |
|---|---|
| Node.js version | `node --version` |
| Command Code binary | `cmd --version` |
| Authentication status | `cmd status --json` |
| Available models | `cmd --list-models` |
| Command Code updates | `cmd update --check-only` |
| Platform | `process.platform` |

---

## Windows Notes

- `cmd` is ambiguous on Windows (collides with `cmd.exe`). The **Command binary** field should be set to the full npm shim path.
- Native Windows support is experimental. WSL is recommended for Windows users.
- `SIGTSTP` is not available on Windows — force-kill must use `SIGTERM`/`SIGKILL`.
