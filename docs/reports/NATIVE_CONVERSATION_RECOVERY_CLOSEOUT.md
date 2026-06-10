# Native Conversation Recovery Closeout

Date: 2026-06-09

This is the running implementation closeout for `docs/reports/NATIVE_CONVERSATION_RECOVERY_PLAN.md`.

## Batch 1: Structured Transcript Projection And Binding

### Scope

- Task IDs advanced: `NCP-000`, `NCP-010`, `NCP-020`, `NCP-030`, partial `NCP-050`, partial `NCP-060`.
- Files changed:
  - `src/core/nativeConversationProjector.ts`
  - `src/core/nativeTranscriptBinding.ts`
  - `src/core/types.ts`
  - `src/core/transport.ts`
  - `src/server/sessionRoutes.ts`
  - `src/renderer/src/browserAdapter.ts`
  - `src/renderer/src/appTypes.ts`
  - `src/renderer/src/hooks/useSessionActions.ts`
  - `src/renderer/src/components/LiveConversationPane.tsx`
  - `src/renderer/src/workspaces/SessionWorkspace.tsx`
  - `tests/native-conversation-projector.test.ts`
  - `tests/native-transcript-binding.test.ts`
  - `tests/fixtures/native-conversation/`

### Behavior Implemented

- `NCP-000`: Added sanitized fixtures for the three dogfood transcript ids named in the recovery plan:
  - `f8f3b448-b607-4ba6-bbbd-36479c8a6357`
  - `8e368167-93c1-47fa-a1a7-0f2c36c2ad13`
  - `3be8341f-2d6f-44f1-8039-8df8eeb2ef5f`
- `NCP-010`: Added explicit tab fields for structured transcript binding:
  - `structuredTranscriptPath`
  - `commandCodeSessionId`
  - `transcriptBindingStatus`
- `NCP-020`: Added a pure Command Code JSONL projector. It promotes only `role: "assistant"` + `content[].type: "text"` to assistant bubbles. Reasoning and tool parts become thinking/activity events.
- `NCP-030`: Added a project-slug transcript matcher and a narrow authenticated server route, `POST /api/sessions/structured-transcript-match`, that matches by cwd, prompt text, and timestamp window.
- `NCP-050`: `LiveConversationPane` now prefers structured JSONL projection when a tab has a bound transcript path. Bound sessions filter PTY-derived assistant messages out of the native chat path and keep PTY only as status/raw diagnostic fallback.
- `NCP-060`: Activity-only structured rows report `thinking`; assistant text rows report `ready` through the existing readiness reducer.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | TypeScript contract passed after transport/server/renderer changes. |
| `npx vitest run tests/native-conversation-projector.test.ts tests/native-transcript-binding.test.ts` | Pass | 2 files / 8 tests. |
| `npx vitest run tests/native-conversation-projector.test.ts tests/native-transcript-binding.test.ts tests/live-conversation.test.ts tests/server-security.test.ts` | Pass | 4 files / 79 tests. |
| `npx vitest run` | Pass | 36 files / 245 tests. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Browser integration smoke complete. |
| `npm run smoke:pty` | Pass | node-pty healthy, shell `/bin/zsh`, output `ok`. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | Command Code `v0.33.2`, auth ok, 27 models, PTY healthy. |
| Built WebGUI receipt | Pass | `npm run serve -- --port 5232`; Playwright loaded WebGUI and `POST /api/sessions/structured-transcript-match` bound `what is this project repo about?` to `f8f3b448-b607-4ba6-bbbd-36479c8a6357.jsonl`. Screenshot: `/tmp/ccgui-ncp-webgui-home.png`. |
| Electron three-session dogfood | Not run | Still required for `NCP-080`. |
| WSL/Linux/native Windows | Not run | Operator/environment required; no platform claim made. |

### Residual Risks

- New real sessions bind after Command Code persists a matching user row. Until then, the GUI remains in live status/raw-terminal mode.
- Ambiguous transcript matches are explicit, but the UI currently records the status in tab metadata and work events rather than showing a dedicated diagnostic card.
- This batch does not implement the full driver boundary in `NCP-040`.
- The real three-session Electron dogfood receipt remains the completion gate for native conversation recovery.

### Follow-Up

- Finish `NCP-050` diagnostic UI for binding/ambiguous/failed states.
- Finish `NCP-060` visible unread label replacement from `new` to response/input-specific affordances.
- Run `NCP-080` with three simultaneous real Electron sessions and capture screenshots proving clean independent structured transcript rendering.
- Add the `NCP-090` upstream structured event stream recommendation as a separate reference note.

## Batch 2: Bound-Session Rendering Fixes, Visible Status, And Event Stream Proposal

### Scope

- Task IDs advanced: `NCP-050`, `NCP-060`, `NCP-080` evidence prep, `NCP-090`.
- Files changed:
  - `src/renderer/src/components/LiveConversationPane.tsx`
  - `src/renderer/src/components/TabBar.tsx`
  - `src/renderer/src/layout/ShellLayout.tsx`
  - `docs/reference/COMMAND_CODE_STRUCTURED_EVENT_STREAM_PROPOSAL.md`
  - `docs/INDEX.md`
  - `docs/reports/NATIVE_CONVERSATION_RECOVERY_CLOSEOUT.md`

### Behavior Implemented

- `NCP-050`: Real native sessions without a structured transcript binding no longer render PTY-derived assistant bubbles. They render user prompt, live status/activity, and transcript-binding diagnostics instead. Mock/demo sessions still use the existing live parser.
- `NCP-050`: Bound structured sessions now bypass the old live-history merge and live activity memory. This fixed a real receipt issue where a clean structured final answer rendered twice.
- `NCP-050`: Binding states now produce visible native diagnostics:
  - binding;
  - unbound/waiting;
  - ambiguous;
  - failed.
- `NCP-060`: Tab and sidebar unread affordances no longer say `new`. They show `response ready` or `input needed` only when those readiness causes are present.
- `NCP-090`: Added `docs/reference/COMMAND_CODE_STRUCTURED_EVENT_STREAM_PROPOSAL.md` and indexed it in `docs/INDEX.md`.

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Renderer prop/status changes typechecked. |
| `npx vitest run tests/native-conversation-projector.test.ts tests/native-transcript-binding.test.ts tests/live-conversation.test.ts tests/session-readiness.test.ts` | Pass | 4 files / 59 tests. |
| `npx vitest run` | Pass | 36 files / 245 tests. |
| `npm run build` | Pass | Electron, renderer, and CLI bundle built. |
| `npm run smoke:browser` | Pass | Browser integration smoke complete. |
| `npm run smoke:pty` | Pass | node-pty healthy, shell `/bin/zsh`, output `ok`. |
| `npm run smoke:headless` | Pass | Real `cmd --print` exited 0. |
| `npm run doctor` | Pass | Command Code `v0.33.2`, auth ok, 27 models, PTY healthy. |
| Built WebGUI one-real-session receipt | Partial pass | `npm run serve -- --port 5233`; WebGUI selected this repo, submitted `what is this project repo about?`, showed user + live progress/activity without PTY artifact strings, then reached `ready` with a clean structured assistant answer and no known artifact strings. Initial receipt exposed duplicate final answer rendering, which was fixed in this batch. Screenshots: `/tmp/ccgui-ncp-webgui-one-real-start.png`, `/tmp/ccgui-ncp-webgui-one-real-later.png`, `/tmp/ccgui-ncp-webgui-one-real-final.png`. |
| Built WebGUI resumed structured receipt | Pass | `npm run serve -- --port 5234`; opened existing `Explain project repository` context. Final answer phrase `This is **Command Code GUI**` appeared once, and known PTY artifact strings were absent. Screenshot: `/tmp/ccgui-ncp-webgui-resumed-structured-once.png`. |
| Electron startup receipt | Pass | Playwright Electron launched built `out/main/index.js`; visible app loaded, preload surface remained `chooseDirectory`, `getServerInfo`, `openExternal`, `revealPath`, `revealTranscript`. Screenshot: `/tmp/ccgui-ncp-electron-startup.png`. |
| Electron three-session dogfood | Not run | Still required for `NCP-080` completion. |
| WSL/Linux/native Windows | Not run | Operator/environment required; no platform claim made. |

### Residual Risks

- `NCP-080` is still incomplete. The recovery is not complete until three simultaneous real Electron sessions prove clean independent structured transcript rendering.
- The WebGUI one-session receipt proved the main rendering failure mode and found/fixed duplicate structured rendering, but it is not a substitute for Electron three-session dogfood.
- Binding ambiguity/failure is visible, but no dedicated ambiguity resolution picker exists yet.

### Follow-Up

- Run `NCP-080` in Electron with the three specified prompts and capture a dated screenshot receipt.
- Add a DOM assertion receipt for three tabs that checks no assistant bubble contains `[38`, `[39m`, `Ask your question`, `to interrupt`, `esc to interrupt`, `↓ 76`, `TE`, or `m63`.
- Consider a small transcript-binding inspector action for ambiguous matches.

## Batch 3: Electron Three-Session Dogfood And Operator Menu Fix

### Scope

- Task IDs advanced: `NCP-080`.
- Files changed:
  - `src/renderer/src/styles.css`
  - `docs/reports/NATIVE_CONVERSATION_RECOVERY_CLOSEOUT.md`

### Behavior Implemented

- Raised `.native-session-actions` above the native conversation surface so the advanced session tools menu remains clickable while the conversation pane is active.
- This fixes a real dogfood failure where `Open terminal transcript` was visible but pointer events were intercepted by the native conversation pane.

### Electron Dogfood Receipts

| Prompt | Command Code JSONL | Result |
|---|---|---|
| `what is this project repo about?` | `/Users/steven/.commandcode/projects/users-steven-workspace-40-code-projects-command-code-gui/5b2fa0e5-01e2-4f76-91fc-e016e6d2d865.jsonl` | Final structured assistant text row present; tab rendered native session content from the bound transcript. |
| `how does this project repo help people in command code community` | `/Users/steven/.commandcode/projects/users-steven-workspace-40-code-projects-command-code-gui/3d484958-18ed-4230-a2e7-cd1c9ce60840.jsonl` | Final structured assistant text row present; separate real session and transcript. |
| `what quality of life improvements can be made to this project` | `/Users/steven/.commandcode/projects/users-steven-workspace-40-code-projects-command-code-gui/066f56df-e5ef-45f8-95bd-34a7d0bc7e01.jsonl` | Final structured assistant text row present after a longer real CLI run; native tab reached `ready`. |

Screenshots:

- `/tmp/ccgui-ncp080-fresh-start.png`
- `/tmp/ccgui-ncp080-submit-1.png`
- `/tmp/ccgui-ncp080-submit-2.png`
- `/tmp/ccgui-ncp080-submit-3.png`
- `/tmp/ccgui-ncp080-final.png`
- `/tmp/ccgui-ncp080-third-start.png`
- `/tmp/ccgui-ncp080-third-submitted.png`
- `/tmp/ccgui-ncp080-third-final.png`

Machine-readable receipts:

- `/tmp/ccgui-ncp080-proof.json`
- `/tmp/ccgui-ncp080-third-proof.json`

### Validation

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Latest renderer CSS-only fix plus existing TypeScript changes. |
| `npx vitest run tests/live-conversation.test.ts tests/session-readiness.test.ts tests/native-conversation-projector.test.ts tests/native-transcript-binding.test.ts` | Pass | 4 files / 59 tests. |
| `npm run build` | Pass | Fresh built Electron app used for the NCP-080 proof. |
| Electron real-session dogfood | Pass | Three distinct real Command Code sessions were submitted from the built Electron app and produced distinct structured JSONL transcripts with final assistant text rows. |

### Residual Risks

- The third prompt took longer than the first two and produced a final raw PTY answer before the structured JSONL final row appeared; the GUI correctly treated the structured row as the final source once it landed.
- Cross-platform Electron proof remains untested on WSL/Linux/native Windows in this environment.
