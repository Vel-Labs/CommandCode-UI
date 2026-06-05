# Smoke Test Report

**Date:** 2026-06-04
**Scope:** current worktree in `/Users/steven/Workspace/40_Code/projects/command-code-gui`
**Related gate:** [HARDENING_GATE.md](HARDENING_GATE.md)

## Environment

| Item | Value |
|---|---|
| OS | macOS / darwin-arm64 |
| Node.js | v22.22.2 |
| Command Code binary | `/opt/homebrew/bin/cmd` |
| Command Code version | `0.32.2` |
| Default repo path | `/Users/steven/Workspace/40_Code/projects/command-code-gui` |

## Automated Results

| Check | Result | Receipt |
|---|---:|---|
| TypeScript | Pass | `npm run typecheck` |
| Unit tests | Pass | `npx vitest run` -> `26/26` |
| Build | Pass | `npm run build` |
| Server smoke | Pass with caveats | `npm run smoke:server` |
| Browser/API smoke | Pass with caveats | `npm run smoke:browser` |
| Real headless | Pass | `npm run smoke:headless` -> `cmd --print` exit `0` |

## Dogfood Results

| Surface | Result | Notes |
|---|---:|---|
| Browser production route | Pass | Tokenized `http://127.0.0.1:5183?token=...` loaded the app with no initial console errors |
| Browser mock session start | Blocked | Session tab appears, but terminal only shows `attaching session ...`; initial mock banner is lost |
| Browser mock `/help` after attach | Pass | `/help` output streams after the socket is attached |
| Browser file browser | Pass with risk | Project files render after cwd is set; server-side path boundaries still need hardening |
| Browser mock headless | Blocked | Renderer does not pass `useMock`, so Mock mode can still invoke real CLI |
| Browser real headless | Pass | `cmd --print` works through smoke script |
| Browser real interactive PTY | Blocked | `POST /api/sessions` with `useMock:false` returned `{"error":"posix_spawnp failed."}` |
| Electron dev startup | Pass with caveats | `npm run dev` starts Electron and an embedded localhost server |
| Electron backend health | Pass with risk | Embedded server responds to `/health`; `/health` also sets auth cookie, which is unsafe |
| Electron visual UI smoke | Not verified | OS screenshot captured the lock screen, not the Electron window |

## Security Results

| Check | Result | Notes |
|---|---:|---|
| API without token rejects first request | Pass | `POST /api/check` without auth returns `401` |
| `/health` does not grant auth | Fail | `/health` sets `ccgui-token` |
| Cookie from `/health` cannot call protected API | Fail | Cookie acquired from `/health` allowed `POST /api/check` to return `200` |
| WebSocket requires auth | Needs regression test | Server checks token, but automated negative WS test is not yet in suite |
| File APIs constrained to explicit root | Needs hardening | Current behavior depends on registered workspace roots and needs deny-by-default tests |

## PTY Results

| Check | Result | Notes |
|---|---:|---|
| `cmd --version` via child process | Pass | `0.32.2` |
| `cmd --print` via child process | Pass | Headless smoke exit `0` |
| `cmd` via `node-pty` | Fail | `posix_spawnp failed.` |
| `/bin/zsh` via `node-pty` | Fail | `posix_spawnp failed.` |
| `/bin/bash` via `node-pty` | Fail | `posix_spawnp failed.` |
| `/usr/bin/env` via `node-pty` | Fail | `posix_spawnp failed.` |

## Script Coverage Gaps

- `npm run smoke:server` starts mock sessions but does not prove real interactive PTY startup.
- `npm run smoke:browser` labels one check "Headless mock" but does not pass `useMock: true`.
- No `smoke:pty` script exists yet.
- No automated auth test proves `/health` cannot issue an auth cookie.
- No automated replay test proves late WebSocket attach receives initial output.
- No automated test proves browser and Electron paths share the same fixed behavior.

## Current Release Blockers

- Fix auth-cookie issuance before claiming token-gated localhost security.
- Restore or clearly gate real interactive PTY support.
- Fix WebSocket replay/subscription ordering so initial output appears.
- Propagate Mock mode into headless runs.
- Restrict file, memory, and agent read/write routes.
- Make runtime receipts report actual bound ports and port-collision behavior.

## Required Re-run Before Marking Green

```bash
npm run typecheck
npx vitest run
npm run build
npm run smoke:server
npm run smoke:browser
npm run smoke:headless
npm run smoke:pty
```

Browser and Electron manual dogfood must then pass the scenarios listed in [HARDENING_GATE.md](HARDENING_GATE.md).
