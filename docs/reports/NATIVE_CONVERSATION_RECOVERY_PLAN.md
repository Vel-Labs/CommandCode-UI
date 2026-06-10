# Native Conversation Recovery Plan

Date: 2026-06-09

Source inventory: `docs/reports/NATIVE_CONVERSATION_DOGFOOD_REGRESSIONS.md`

## Decision Summary

The native conversation layer should be rebuilt around Command Code's structured session transcript, not around terminal repaint parsing.

PTY is not a product requirement. PTY is only one possible process driver for the Command Code CLI. The GUI should define a replaceable runtime adapter so the current PTY path can be swapped later for a documented structured event stream, non-PTY local driver, or upstream GUI integration without rewriting the renderer.

Near-term recommendation:

- Keep the current PTY process driver only where the installed Command Code CLI requires an interactive terminal.
- Stop using PTY output as assistant-message truth.
- Use Command Code's structured per-session JSONL as the native chat source of truth once rows are persisted.
- Use PTY output only for live transport, volatile progress, input prompts, errors, and raw diagnostic fallback.

This follows the project ethos: Command Code CLI remains the engine and execution source of truth; the GUI is an adapter that owns shell, session display, operator controls, transcripts, and local preferences.

## Non-Negotiable Product Semantics

### Session Isolation

Every tab is a unique session instance. Starting or using one tab must not block, reuse, mutate, or relabel another tab.

Each real session must have its own:

- runtime process or upstream session handle;
- GUI tab id;
- Command Code transcript association;
- raw diagnostic transcript path;
- active prompt/turn state;
- readiness state;
- unread state;
- activity/progress state;
- visible conversation cache.

### Assistant Message

Only model-authored markdown/text is an assistant message.

Not assistant messages:

- PTY repaint fragments;
- ANSI/control fragments;
- `Ask your question...` prompt chrome;
- `esc to interrupt` progress rows;
- token counters;
- tool-call rows;
- tool-result rows;
- reasoning/thinking detail unless explicitly opened in an inspector.

### Readiness

Use these operator-facing states:

- `attaching`: runtime/session is starting and project/model binding is not fully established.
- `ready`: project is attached, model is selected, and the session can accept input.
- `thinking`: an active prompt is being processed by the LLM or tools.
- `input`: Command Code is waiting for user approval, a terminal/menu choice, or other operator input.
- `error`: runtime, PTY, transcript, auth, or transport failure.

`ready` has two internal causes:

- `ready:idle`: session is attached and ready for a first/new prompt.
- `ready:response`: the prior prompt has a persisted assistant response.

The UI can label both as `ready`, but the reducer must keep the causes separate so unread response indicators and timers behave correctly.

### Unread Indicator

Replace ambiguous `new` with one of:

- compact unread dot when space is tight;
- `response ready` when a background tab has a new assistant response;
- `input needed` when a background tab needs operator action.

Recommended default:

- tab pill: unread blue dot + tooltip `Response ready`;
- sidebar metadata: `response ready` or `input needed`.

### Token Display

Token/progress counters are useful but must not leak into assistant chat.

Current finding:

- inspected Command Code JSONL rows do not include token usage fields in normal saved message metadata;
- terminal progress text does include counters such as `↓ 76`, but that is volatile terminal presentation data.

Plan:

- show terminal-derived counters only in a volatile live-progress surface;
- label them as `live output` or `terminal progress`, not final usage;
- leave a structured `usage` slot in the projection model for future upstream token metadata;
- never render token fragments as assistant text.

## Successful Terminal Flow Anatomy

The terminal can still be the best diagnostic view for real Command Code behavior. A successful terminal prompt flow shows several distinct classes of output that the GUI must not collapse into one assistant bubble.

Observed terminal sequence:

1. Session banner:
   - Command Code logo/version;
   - selected model/taste line;
   - cwd/project path.
2. User prompt:
   - `❯ <prompt text>`.
3. Reasoning/thinking summaries:
   - `Thought for N seconds [ctrl+o to expand]`.
4. Live natural-language progress:
   - `I'll verify...`;
   - `Let me update...`;
   - `All green...`.
5. Tool and activity rows:
   - `READ [file] N lines`;
   - `SEARCH ["query" in files]`;
   - `SHELL [command]`;
   - `EDIT [file]`;
   - `TODOS [N items]`.
6. Tool result previews:
   - command output tail;
   - collapsed `... +N lines`;
   - edit diffs;
   - errors.
7. Volatile terminal progress and counters:
   - `Weaving... esc to interrupt`;
   - elapsed time;
   - output counters such as `↓ 6.5k`.
8. Prompt/footer chrome:
   - `Ask your question...`;
   - accept-edits hints;
   - continuous learning/taste hints;
   - shortcuts and IDE status.
9. Final assistant response:
   - model-authored markdown/text answering the user.

Native projection contract:

- Session banner becomes environment metadata.
- User prompt becomes a user message.
- Reasoning summaries become collapsed reasoning indicators.
- Live natural-language progress becomes transient status only.
- Tool rows and tool results become activity cards and details.
- Terminal counters become volatile progress metadata only.
- Prompt/footer chrome remains diagnostic-only and never appears in chat.
- Final assistant markdown/text becomes the assistant message.

The pasted successful terminal flow is useful as a regression fixture because it includes both clean final answer prose and many terminal-only rows. A valid projector should preserve the final answer while excluding prompt chrome, progress counters, tool diffs, collapsed-output labels, ANSI residue, and repaint fragments from assistant bubbles.

## Target Architecture

### 1. Runtime Driver Layer

Purpose: start/stop/write/resize sessions.

Interface name: `CommandCodeSessionDriver`.

Required methods:

- `start(options): SessionStartResult`
- `write(sessionId, data): void`
- `stop(sessionId): void`
- `interrupt(sessionId): void`
- `forceKill(sessionId): void`
- `resize(sessionId, cols, rows): void`
- `onData(sessionId, callback): unsubscribe`
- `onExit(sessionId, callback): unsubscribe`
- `isActive(sessionId): boolean`

Initial implementation:

- `PtyCommandCodeSessionDriver`, backed by current `CoreSessionManager` behavior.

Future implementation:

- `StructuredCommandCodeSessionDriver`, if Command Code exposes documented local event streaming.

Rule:

- The renderer must not care which driver is underneath.

### 2. Runtime Diagnostic Layer

Purpose: preserve raw terminal evidence.

Responsibilities:

- append raw PTY bytes to `.ansi` diagnostic transcript;
- expose raw transcript path;
- show raw terminal on demand;
- support debugging unsupported states.

Non-responsibilities:

- no assistant message rendering;
- no final readiness claims;
- no structured tool truth.

### 3. Structured Transcript Layer

Purpose: read Command Code's saved session JSONL.

Source:

`~/.commandcode/projects/<project-slug>/<command-code-session-id>.jsonl`

Existing repo surfaces to reuse:

- `src/core/discovery.ts`
- `src/core/transcriptParser.ts`
- `src/server/sessionRoutes.ts`
- `transport.readTranscript(...)`

New responsibilities:

- associate each GUI tab with the matching Command Code JSONL transcript;
- poll or watch the transcript while a session runs;
- parse rows incrementally;
- emit structured conversation events.

JSONL row contract observed in Command Code `0.33.2`:

- `id`
- `timestamp`
- `sessionId`
- `parentId`
- `role`
- `content`
- `gitBranch`
- `metadata.source`
- `metadata.version`

Supported content parts:

- `text`
- `reasoning`
- `tool-call`
- `tool-result`

### 4. Conversation Projection Layer

Purpose: transform structured transcript rows into UI events.

Projected event types:

- `user_message`
- `assistant_message`
- `tool_activity`
- `tool_result`
- `reasoning_available`
- `input_required`
- `runtime_error`
- `diagnostic_notice`
- `usage_progress`

Strict rule:

- PTY residual text can never be promoted into `assistant_message`.

Assistant message promotion:

- only transcript row `role === "assistant"` with `content[].type === "text"`;
- render the joined text parts as markdown;
- do not include reasoning/tool-call text in the assistant bubble.

Tool activity:

- transcript row `role === "assistant"` with `tool-call` parts creates compact activity cards;
- transcript row `role === "tool"` with `tool-result` parts updates the matching activity card and referenced files.

Reasoning:

- transcript `reasoning` parts are hidden by default;
- show as `Reasoning available` or behind the existing thinking/transcript inspector.

### 5. Live Status Layer

Purpose: keep the UI lively before transcript rows land.

Inputs:

- runtime attach events;
- process liveness;
- explicit write/submission events;
- conservative PTY progress parser;
- transcript-row arrival.

Allowed PTY-derived signals:

- progress label: `Thinking`, `Constructing`, `Resolving`, etc.;
- elapsed time;
- provisional output counter;
- approval/menu/input required;
- runtime error;
- projection degraded.

Disallowed PTY-derived signals:

- assistant markdown;
- final response readiness;
- tool result truth;
- file references as truth unless also present in structured transcript.

### 6. Readiness Reducer

Input events:

- `runtime_attaching`
- `runtime_attached`
- `project_bound`
- `model_bound`
- `user_submitted`
- `pty_progress`
- `transcript_tool_call`
- `transcript_tool_result`
- `transcript_assistant_text`
- `input_required`
- `runtime_error`
- `session_exit`

Reducer rules:

- `runtime_attaching` -> `attaching`
- `runtime_attached + project_bound + model_bound + no active prompt` -> `ready:idle`
- `user_submitted` -> `thinking`
- `pty_progress` while active prompt exists -> `thinking`
- `transcript_tool_call` or `transcript_tool_result` without assistant text -> `thinking`
- `input_required` -> `input`
- `transcript_assistant_text` for active prompt -> `ready:response`
- `runtime_error` -> `error`
- normal `session_exit` after `/exit` -> `completed` or closed, depending existing tab behavior

### 7. Renderer Presentation Layer

Default view:

- native chat from structured transcript projection;
- compact live progress row while active;
- activity cards for tools;
- clean assistant markdown bubbles;
- raw terminal hidden behind an explicit button.

Fallback view:

- if transcript association fails or no structured rows arrive within the timeout, show:
  - current status;
  - `Projection waiting for Command Code transcript`;
  - raw terminal link;
  - diagnostic transcript link.

Degraded view:

- if PTY noise is detected but no structured transcript can be matched:
  - show `Projection degraded`;
  - do not show low-confidence text as chat;
  - keep input/stop controls functional.

## Transcript Association Strategy

Problem:

- GUI session ids are currently generated by `CoreSessionManager`.
- Command Code also generates its own session ids for `~/.commandcode/projects/<slug>/*.jsonl`.
- They are not guaranteed to be the same.

Decision:

- Add an explicit `structuredTranscriptPath?: string` and `commandCodeSessionId?: string` to the GUI session record once discovered.
- Keep existing GUI `transcriptPath` for `.ansi` diagnostics.
- Do not overload one field for both raw PTY and structured Command Code JSONL.

Association algorithm for new sessions:

1. Before starting Command Code, snapshot known JSONL files in the project slug directory.
2. Start the runtime driver.
3. When the first user prompt is submitted, record:
   - GUI session id;
   - prompt text;
   - cwd;
   - model;
   - timestamp.
4. Poll the project slug directory for new or modified `.jsonl` files.
5. Candidate match requires:
   - file modified after runtime start;
   - at least one `user` row;
   - latest or first unmatched `user` row text equals the submitted prompt after trim/normalization;
   - `timestamp` within a bounded window around submission time.
6. If one candidate matches, bind it to the GUI session.
7. If multiple candidates match, choose the one with nearest user-row timestamp and log a diagnostic notice.
8. If no candidate matches within timeout, keep the session usable in live-status/raw-terminal mode and show `Transcript not associated yet`.

Association algorithm for resumed sessions:

1. Use the selected `DiscoveredSession.transcriptPath`.
2. Bind that path immediately as `structuredTranscriptPath`.
3. Start Command Code with documented `--resume` arguments.
4. Continue tailing the same JSONL if it updates; if Command Code creates a new JSONL on resume, detect the new prompt match and rebind with a diagnostic note.

Security constraints:

- Only read under existing allowed transcript roots.
- Keep canonical containment checks.
- Cap read/tail size.
- Do not expose arbitrary file read.

## Implementation Phases

### Gate 0: Evidence Freeze (`NCP-000`)

Goal:

- Preserve the current failing evidence before changing behavior.

Tasks:

- `NCP-000A`: Copy the current `NATIVE_CONVERSATION_DOGFOOD_REGRESSIONS.md` into the plan references.
- `NCP-000B`: Save representative raw `.ansi` diagnostic transcript tails from the current GUI sessions if available.
- `NCP-000C`: Save sanitized structured JSONL fixtures for the three known dogfood sessions:
  - `f8f3b448-b607-4ba6-bbbd-36479c8a6357`
  - `8e368167-93c1-47fa-a1a7-0f2c36c2ad13`
  - `3be8341f-2d6f-44f1-8039-8df8eeb2ef5f`
- `NCP-000D`: Save a sanitized successful terminal-flow fixture based on the pasted `cmd` session that includes banner, prompt, thoughts, tool rows, progress counters, prompt footer, and final answer.

Acceptance:

- Fixtures exist in `tests/fixtures/native-conversation/`.
- Fixtures contain no secrets.
- Fixtures include user, assistant text, tool call, and tool result rows.
- Terminal-flow fixture assertions classify every line as one of: metadata, user, reasoning, activity, progress, prompt chrome, final assistant, or diagnostic.

Validation:

- `npx vitest run tests/transcript-parser.test.ts tests/live-conversation.test.ts`

### Gate 1: Data Model Split (`NCP-010`)

Goal:

- Separate raw PTY diagnostics from structured Command Code transcript state.

Tasks:

- `NCP-010A`: Add types:
  - `GuiSessionId`
  - `CommandCodeSessionId`
  - `RawDiagnosticTranscript`
  - `StructuredCommandCodeTranscript`
  - `SessionTranscriptBinding`
- `NCP-010B`: Add optional structured transcript fields to session/tab metadata:
  - `structuredTranscriptPath?: string`
  - `commandCodeSessionId?: string`
  - `transcriptBindingStatus: "unbound" | "binding" | "bound" | "ambiguous" | "failed"`
- `NCP-010C`: Keep existing `.ansi` path as `diagnosticTranscriptPath` or equivalent.

Acceptance:

- No UI reads `.ansi` as native chat by default.
- Existing transcript reveal still works.
- Existing raw diagnostic transcript remains available.

Validation:

- `npm run typecheck`
- `npx vitest run tests/discovery.test.ts tests/transcript-parser.test.ts`

### Gate 2: Structured Transcript Projector (`NCP-020`)

Goal:

- Build pure functions that convert Command Code JSONL into native conversation events.

Tasks:

- `NCP-020A`: Extend or add a parser separate from the existing generic transcript preview parser.
- `NCP-020B`: Map:
  - user text parts -> user bubbles;
  - assistant text parts -> assistant markdown bubbles;
  - assistant tool-call parts -> activity rows;
  - tool-result parts -> activity details/results;
  - reasoning parts -> hidden reasoning/detail indicator.
- `NCP-020C`: Add stable ids based on transcript row ids and content indexes.
- `NCP-020D`: Add fixture tests from Gate 0.

Acceptance:

- The three dogfood JSONL fixtures render clean assistant messages with no PTY artifacts.
- The successful terminal-flow fixture preserves the final answer as assistant prose and suppresses prompt/footer/progress/tool-diff rows from assistant bubbles.
- Tool calls/results appear as compact activity, not assistant prose.
- Reasoning is not shown as normal assistant text.

Validation:

- `npx vitest run tests/transcript-parser.test.ts tests/native-conversation-projector.test.ts`

### Gate 3: Transcript Association Service (`NCP-030`)

Goal:

- Bind a running GUI session to the correct Command Code JSONL transcript.

Tasks:

- `NCP-030A`: Add a pure project slug/path resolver that matches Command Code's observed project path convention.
- `NCP-030B`: Add a file scanner that lists candidate JSONL transcripts for a cwd.
- `NCP-030C`: Add `matchTranscriptForPrompt(...)`.
- `NCP-030D`: Add server route or existing transport method to expose transcript candidates without broad file access.
- `NCP-030E`: Add polling/tailing logic with bounded reads.

Acceptance:

- Given the three known dogfood prompts, the matcher selects the correct JSONL files.
- Ambiguous matches return an explicit ambiguous result, not a silent best guess.
- No route can read outside allowed Command Code transcript roots.

Validation:

- `npx vitest run tests/discovery.test.ts tests/server-security.test.ts tests/native-transcript-binding.test.ts`

### Gate 4: Runtime Driver Boundary (`NCP-040`)

Goal:

- Make PTY replaceable.

Tasks:

- `NCP-040A`: Introduce `CommandCodeSessionDriver` interface.
- `NCP-040B`: Wrap current `CoreSessionManager` as `PtyCommandCodeSessionDriver`.
- `NCP-040C`: Keep current behavior behind the interface without changing CLI args.
- `NCP-040D`: Add a placeholder `StructuredCommandCodeSessionDriver` design note, but do not use private sandbox APIs.

Acceptance:

- Renderer/server call driver interface, not PTY-specific internals.
- PTY remains available but is no longer conceptually the native chat source.
- No generic shell execution is added.

Validation:

- `npm run typecheck`
- `npx vitest run tests/cli.test.ts tests/browser-transport.test.ts`
- `npm run smoke:pty`

### Gate 5: Native Conversation Renderer Switch (`NCP-050`)

Goal:

- Render native chat from structured transcript projection.

Tasks:

- `NCP-050A`: Replace `LiveConversationPane` assistant rendering source with structured projection when bound.
- `NCP-050B`: Keep live PTY status as a compact progress row only.
- `NCP-050C`: Hide raw PTY text behind explicit raw-terminal/diagnostic controls.
- `NCP-050D`: Add degraded/waiting states:
  - `Binding transcript...`
  - `Waiting for Command Code transcript...`
  - `Projection degraded - open raw terminal`
- `NCP-050E`: Remove or quarantine permissive fallback that turns arbitrary PTY residual text into assistant messages.

Acceptance:

- No visible assistant bubble can contain known terminal artifacts from the regression report.
- Clean JSONL assistant markdown renders as one assistant bubble.
- Progress remains visible while waiting.
- Raw PTY remains one click away.

Validation:

- `npx vitest run tests/native-conversation-projector.test.ts tests/live-conversation.test.ts`
- Built WebGUI receipt if browser session UI changes.
- Electron UI receipt because this changes the dogfood path.

### Gate 6: Readiness And Unread Semantics (`NCP-060`)

Goal:

- Make tab states match user expectations.

Tasks:

- `NCP-060A`: Split internal `ready` cause into `ready:idle` and `ready:response`.
- `NCP-060B`: Activity/tool rows without assistant text keep session `thinking`.
- `NCP-060C`: Persisted assistant text for active turn marks `ready:response`.
- `NCP-060D`: Project attached + model selected + no active prompt marks `ready:idle`.
- `NCP-060E`: Rename UI unread label from `new` to unread dot or `response ready`.
- `NCP-060F`: Add `input needed` label for approval/terminal choices.

Acceptance:

- A new session with project/model selected shows `ready`.
- A submitted prompt with only tool activity shows `thinking`.
- A background tab with assistant text shows unread response indicator.
- No activity-only tab shows `response ready`.

Validation:

- `npx vitest run tests/session-readiness.test.ts tests/native-conversation-projector.test.ts`
- Electron three-session receipt.

### Gate 7: Token And Progress Metadata (`NCP-070`)

Goal:

- Preserve useful progress/token visibility without chat corruption.

Tasks:

- `NCP-070A`: Add `LiveProgressSnapshot` with fields:
  - `label`
  - `elapsedMs`
  - `outputCounter`
  - `source: "terminal-progress"`
  - `confidence`
- `NCP-070B`: Add optional `usage` fields to structured projection for future upstream metadata:
  - `inputTokens`
  - `outputTokens`
  - `cachedInputTokens`
  - `totalTokens`
  - `source`
- `NCP-070C`: Render terminal-derived counters in status/activity chrome only.
- `NCP-070D`: If structured usage is unavailable, show no final token usage claim.

Acceptance:

- `↓ 76`-style counters may appear only in live progress/status UI.
- Token/counter fragments never appear in assistant bubbles.
- Final usage is blank/unknown unless structured data exists.

Validation:

- projector tests;
- visual receipt with long-running real session.

### Gate 8: Three-Session Real Dogfood Receipt (`NCP-080`)

Goal:

- Prove the core user expectation: independent sessions that work like separate terminal tabs but render like native chat.

Manual receipt steps:

1. Launch Electron.
2. Select `command-code-gui` project.
3. Confirm model selected.
4. Start three real sessions.
5. Submit one prompt per session:
   - `what is this project repo about?`
   - `how does this project repo help people in command code community`
   - `what quality of life improvements can be made to this project`
6. Switch among tabs while they run.
7. Confirm each tab keeps its own prompt and structured transcript binding.
8. Confirm each tab transitions:
   - ready idle -> thinking -> response ready.
9. Confirm no assistant bubble contains:
   - `[38`
   - `[39m`
   - `Ask your question`
   - `to interrupt`
   - `esc to interrupt`
   - `↓ 76`
   - `TE`
   - `m63`
10. Confirm raw terminal/diagnostic transcript is still available.

Acceptance:

- All three sessions show coherent independent answers.
- Background response indicators are meaningful.
- No unvalidated Linux/WSL/native Windows claim is made.

Validation:

- Screenshot paths and notes recorded in this plan or a closeout report.

### Gate 9: Upstream Structured Stream Recommendation (`NCP-090`)

Goal:

- Define what would let the GUI retire PTY as the live driver.

Recommendation to Command Code upstream:

Add a documented local event stream mode, for example:

```bash
cmd --event-stream json
cmd "prompt" --event-stream json
cmd --resume "session name" --event-stream json
```

Suggested NDJSON event contract:

- `session.started`
- `session.ready`
- `user.message`
- `assistant.reasoning.delta`
- `assistant.message.delta`
- `assistant.message.completed`
- `tool.call.started`
- `tool.call.completed`
- `tool.result`
- `usage.delta`
- `usage.completed`
- `input.required`
- `error`
- `session.exited`

Why:

- avoids terminal repaint parsing;
- preserves Command Code as execution truth;
- gives GUI and WebGUI a stable adapter contract;
- supports token display cleanly;
- enables non-PTY environments.

Current boundary:

- Do not use internal sandbox stream as the normal GUI driver unless upstream documents it for local interactive sessions.

Acceptance:

- Add this as a docs/reference proposal or upstream issue draft.

## Validation Matrix

Run after each implementation gate as applicable:

- `npm run typecheck`
- `npx vitest run`
- `npm run build`
- `npm run smoke:browser`
- `npm run smoke:pty`
- `npm run smoke:headless`
- `npm run doctor`
- Electron UI receipt for native session UI changes
- Built WebGUI receipt for browser/WebGUI session UI changes

Specific new tests:

- `tests/native-conversation-projector.test.ts`
- `tests/native-transcript-binding.test.ts`
- extended `tests/session-readiness.test.ts`
- extended `tests/server-security.test.ts`

## Explicit Non-Goals

- Do not implement a generic shell runner.
- Do not broaden renderer IPC.
- Do not make the GUI the agent runtime.
- Do not parse PTY residual text into assistant markdown.
- Do not remove raw terminal diagnostics.
- Do not default to Demo/mock.
- Do not use undocumented internal Command Code APIs as product dependencies.
- Do not claim platform validation beyond the environment actually tested.

## Remaining Risks

### Transcript Write Delay

Command Code may persist JSONL only after tool calls complete or after an assistant response. The GUI must show live progress while waiting.

Mitigation:

- keep live status from runtime events;
- show `Waiting for Command Code transcript...` after a bounded delay;
- never fill the gap with low-confidence PTY text.

### Transcript Association Ambiguity

Multiple sessions can start with similar prompts.

Mitigation:

- match prompt + timestamp + cwd/project slug;
- show ambiguous state instead of silently binding wrong transcript;
- include session title/meta as an additional signal when available.

### Resume Behavior

Command Code may update the original JSONL or create a new one on resume.

Mitigation:

- bind selected transcript immediately;
- monitor for a newer matching transcript after prompt submission;
- preserve a visible diagnostic note when rebinding.

### Token Counts

Current JSONL rows do not expose usage.

Mitigation:

- volatile terminal progress only;
- no final usage claim;
- upstream event-stream proposal includes `usage` events.

## Recommended First Implementation Batch

Start with the smallest batch that changes the failure mode without a full runtime rewrite:

1. `NCP-000`: freeze fixtures.
2. `NCP-020`: structured projector from Command Code JSONL.
3. `NCP-030`: transcript association service.
4. `NCP-050`: render native chat from structured projection, with PTY only as live status/raw fallback.
5. `NCP-060`: readiness/unread semantics.

Defer `NCP-040` driver abstraction until after the transcript-first path is proven, unless implementation pressure shows PTY assumptions are still leaking into renderer code.

Completion definition:

- three real Electron sessions run independently;
- all three render clean native chat from structured transcript rows;
- PTY artifacts no longer appear as assistant messages;
- raw terminal remains available;
- validation matrix passes;
- any unproven platform claims remain explicitly blocked/operator-required.
