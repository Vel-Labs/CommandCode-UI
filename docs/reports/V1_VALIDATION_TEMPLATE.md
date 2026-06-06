# V1 Validation Template

Use this template for every V1 package before committing. Keep `implemented`, `validated`, `untested`, `deferred`, and `blocked` separate.

## Package

| Field | Value |
|---|---|
| Date | YYYY-MM-DD |
| Package | Phase N: package name |
| Scope | Files/modules touched |
| Boundary | Presentation / transport / session lifecycle / config write / runtime truth / docs |
| Commit | Pending |

## Implementation Summary

- Implemented:
- Not changed:
- Deferred:
- Blocked:

## Hard Gate Check

| Gate | Answer | Notes |
|---|---:|---|
| Runtime truth changed? | No | If yes, stop before continuing. |
| Transport or session lifecycle changed? | No | If yes, run focused transport/session tests and smoke. |
| Config/shared settings persistence changed? | No | If yes, show scope, destination path, and owner. |
| Renderer IPC or filesystem capability broadened? | No | If yes, stop and security-review. |
| Command Code semantics inferred or redefined? | No | If yes, mark blocked unless documented upstream. |
| Risky modes still visually explicit? | Yes | Required for any session/settings UI package. |

## Required Receipts

| Check | Required When | Result | Receipt |
|---|---|---:|---|
| `git status --short --branch` | Package start and before commit | Pending | |
| `npm run typecheck` | Always | Pending | |
| `npx vitest run` | Parser, transport, config, session, shared helper changes | N/A | |
| `npm run build` | Renderer, server, main, package changes | N/A | |
| `npm run smoke:browser` | Browser transport, auth, mock, or session UI changes | N/A | |
| `npm run smoke:headless` | Headless or command-builder changes | N/A | |
| `npm run smoke:pty` | PTY/session lifecycle changes | N/A | |
| Browser route receipt | UI layout, settings navigation, session workbench, inspector behavior | N/A | |
| Electron route receipt | UI layout, settings navigation, session workbench, inspector behavior | N/A | |
| Real CLI path | Runtime packages | Untested | Mark explicitly if not run. |
| `git diff --check` | Before commit | Pending | |

## Route Receipts

| Surface | Result | Receipt |
|---|---:|---|
| Built browser route | Pending | |
| Electron startup | Pending | |
| Browser screenshot automation | Not run | Playwright is not installed unless this changes. |

## Documentation Updates

- `docs/roadmaps/v1/ROADMAP_V1.md`:
- `docs/architecture/V1_ARCHITECTURE.md`:
- `docs/reports/SMOKE_TEST_REPORT.md`:
- User-facing docs:

## Commit Note

Commit message:

```text
type: concise package summary
```
