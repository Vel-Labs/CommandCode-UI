# Native Conversation Dogfood Regression Inventory

Date: 2026-06-09

Source: Electron dogfood appshots from the real PTY path around `03:46`-`03:48`.

This report is an issue inventory, not a fix plan and not a completion receipt. The screenshots show progressive regressions in the native conversation projection after the hardening sprint. The Command Code CLI remains the execution engine and source of truth; these issues are GUI presentation/session-state failures unless proven otherwise.

Recovery plan: `docs/reports/NATIVE_CONVERSATION_RECOVERY_PLAN.md`.

## Current Blocker Summary

Native conversation rendering is not trustworthy enough for dogfooding as the default real-session view. Multiple tabs can run, but the projected chat layer is mixing terminal repaint fragments, progress/status text, prompt chrome, and partial ANSI/control sequences into assistant bubbles. Readiness labels also report `ready` for sessions that do not show a coherent assistant answer.

Raw PTY output may still contain the true session state, but the GUI adapter is presenting a distorted conversation.

## Observed Problems

### NCR-001: `ready` can mean "terminal is quiet" instead of "assistant answer is usable"

Observed examples:

- Session 1, Session 2, and Session 3 all show `ready` while their visible conversation panes contain fragments rather than coherent assistant responses.
- Session 3 is marked `ready` with activity cards and a fragment bubble like `[39m129`.
- Session 2 is marked `ready` while the visible content is mostly progress-counter debris such as `to interrupt • 47s • ↓ 76`.

Why it matters:

- The operator cannot trust tab state.
- `ready` should mean the session can accept a follow-up because the prior turn reached an intelligible response or an explicit terminal/input state.
- A false `ready` state makes background tabs look successful when they may have failed projection.

Expected boundary:

- `ready`: attached session with no active prompt, or completed turn with a coherent assistant answer.
- `thinking`: any active prompt with progress/tool activity but no coherent assistant answer.
- `input`: explicit approval/terminal input required.
- `error`: PTY/session/transport failure.

### NCR-002: PTY repaint fragments still become assistant chat bubbles

Observed fragments:

- `TE`
- `m63`
- `[38;2;9✻ Thinking...`
- `[27msk your question...`
- `[39m129`
- `m• 14s • ↓ 76`
- `m ↓ 76`
- `39m 49s • ↓ 76`
- `? forto interrupt • 48s • ↓ 76`
- `o interrupt • 47s • ↓ 76`
- `nterrupt • 50s • ↓ 76`

Why it matters:

- These are terminal presentation artifacts, not assistant content.
- They bloat the conversation and hide the actual response.
- Each new regex patch catches one symptom but misses the broader repaint/control-sequence failure mode.

Likely boundary failure:

- The native conversation parser is consuming a PTY stream that includes partial frame updates. It is trying to reconstruct semantic chat by filtering lines after the fact, but partial chunks can split ANSI/color/progress/prompt chrome into plausible-looking text.

### NCR-003: Thinking/progress vocabulary is leaking into assistant content

Observed examples:

- `✧ Constructing... esc to interrup`
- `Thinking... (1 line) [ctrl+o to expand]`
- long separator lines glued to thinking labels
- repeated `to interrupt • Ns • ↓ N` rows

Why it matters:

- Progress belongs in a compact activity/status layer, not assistant prose.
- Seeing internal progress vocabulary as a chat answer makes the app feel less reliable than the raw terminal.

Expected boundary:

- Progress rows should collapse to one active status indicator such as `Constructing...`.
- Full raw details can remain available behind `Show details` or raw terminal.
- No progress row should be promoted to assistant text.

### NCR-004: Prompt chrome and terminal placeholders leak into chat

Observed examples:

- `[27msk your question...`
- `msk your question...`
- fragments of the terminal prompt footer mixed into assistant bubbles.

Why it matters:

- Prompt chrome is not model output.
- Once prompt chrome appears in an assistant bubble, turn boundary detection is suspect.

Expected boundary:

- Prompt/footer/chrome lines should be suppressed from native conversation rendering.
- If the parser cannot confidently suppress them, the GUI should degrade to a diagnostic/raw-terminal fallback instead of showing them as assistant text.

### NCR-005: Assistant answers are duplicated or glued to terminal separators/spinners

Observed example:

- Session 1 eventually shows a real answer:
  `This is Command Code GUI - a native desktop workbench...`
- The same pane also shows separator/spinner fragments before and after that answer, including a duplicate answer prefixed by terminal decoration:
  `------------------------... This is Command Code GUI - a native...`

Why it matters:

- Even when the model produces a good answer, the projection corrupts it.
- The user cannot tell where the answer begins or ends.

Expected boundary:

- Assistant message should be one clean bubble.
- Decoration, spinner, separators, prompt chrome, and duplicate repaints should not join the message.

### NCR-006: Activity cards are useful, but they are not enough to indicate completion

Observed examples:

- Activity cards such as `Activity: explore 1, read 15, list 4` appear correctly.
- Sessions still show no coherent answer below those cards.
- Some sessions show multiple activity summaries for one prompt without a clear live status transition.

Why it matters:

- Tool activity means the agent is doing work. It does not prove the turn completed.
- Activity-only turns should not produce a `ready` claim.

Expected boundary:

- Activity-only projection keeps the tab in `thinking`.
- Activity plus coherent assistant answer can become `ready`.
- Activity plus explicit terminal prompt becomes `input`.

### NCR-007: Session independence remains unproven after the regressions

Observed state:

- Current screenshots show separate tabs and separate prompts, but all three panes exhibit similar projection corruption.
- Earlier dogfood showed messages folding into one session and readiness updates mutating the wrong active tab.

Why it matters:

- The app goal is independent real sessions.
- Unit/browser smoke saying "multi-session independence" is not enough if real Electron PTY projection can still cross-update, stale-update, or mislabel tabs.

Expected boundary:

- Each session has its own PTY process, stream subscription, parser state, turn history, activity memory, readiness state, and UI cache.
- Delayed stream events from Session A must never mutate Session B's readiness or visible conversation.

Current proof gap:

- We do not yet have a real Electron receipt with three simultaneous real PTY sessions proving clean per-session isolation and coherent outputs.

### NCR-008: `new` badges can appear without a usable response

Observed examples:

- Background tabs show `new` while their visible content is activity/progress debris or corrupted assistant text.

Why it matters:

- `new` should draw attention to useful new output.
- If `new` fires on any activity or corrupted projection, it becomes noise.

Expected boundary:

- `new` should be tied to a meaningful unread event:
  - coherent assistant response,
  - explicit input required,
  - explicit error,
  - or possibly raw live activity only if the label says activity/progress rather than implying response-ready.

### NCR-009: Tests are passing while the dogfood UX is failing

Observed state:

- Typecheck, Vitest, build, browser smoke, PTY smoke, headless smoke, and doctor can pass.
- The real Electron native conversation layer is still visibly broken.

Why it matters:

- Current tests are too synthetic for the failure mode.
- Passing tests prove helpers behave for known strings, not that real PTY repaint streams project cleanly.

Required test gap closure:

- Capture raw PTY transcript snippets from these real failures.
- Add golden parser fixtures for the exact bad streams, not only hand-built minimized strings.
- Add an Electron multi-real-session receipt that checks visible DOM text does not contain known terminal artifacts.
- Add an assertion that `ready` is not shown when a session has activity/progress but no coherent answer.

### NCR-010: The current parser strategy may be too permissive

Observed pattern:

- Each patch filters a few more bad fragments.
- New terminal artifacts continue to leak through in adjacent forms.

Why it matters:

- A denylist of malformed terminal fragments is likely to keep regressing.
- Native chat should be conservative. It is better to show compact activity plus raw-terminal fallback than to display corrupted assistant prose.

Potential direction to evaluate:

- Switch assistant-message promotion from "anything left after filtering" to a stricter confidence gate.
- Treat low-confidence residual text as diagnostic/raw detail, not assistant content.
- Keep activity/progress rendering native and compact.
- Preserve raw PTY as the escape hatch for ambiguous output.

## Guardrails For The Fix

- Do not broaden renderer IPC.
- Do not add generic shell execution.
- Do not treat terminal output as structured execution truth.
- Do not mutate Command Code CLI semantics.
- Do not hide live progress behind a generic "waiting" line.
- Do not default to Demo/mock mode.
- Do not claim WSL/Linux/native Windows validation from macOS Electron dogfood.
- Do not claim the hardening sprint is fully dogfood-ready until the real Electron path has a clean receipt.

## Immediate Containment Criteria

Before more feature work, the real Electron path should satisfy these checks:

1. Start three real sessions against the same project.
2. Submit one prompt per session.
3. Confirm each tab retains its own prompt, output, activity, readiness, and unread state.
4. Confirm no visible assistant bubble contains terminal artifacts matching:
   - ANSI fragments such as `[38`, `[39m`, `;131m`
   - prompt chrome such as `Ask your question`
   - progress tails such as `to interrupt`, `↓ 76`, `48s • ↓`
   - single-token debris such as `TE`, `m63`, `msk your question`
5. Confirm activity-only turns remain `thinking`.
6. Confirm coherent assistant answers become exactly one clean assistant bubble.
7. Confirm `ready` appears only after a coherent answer, explicit idle attach state, or after a terminal/input path resolves.
8. Confirm raw PTY remains available for ambiguous cases.

## Suggested Next Work Package

Create a focused `NCR` fix package rather than continuing broad hardening:

- `NCR-001`: Save raw failure transcripts from the current Electron sessions.
- `NCR-002`: Add golden parser fixtures from those transcripts.
- `NCR-003`: Replace permissive assistant fallback with stricter assistant-confidence promotion.
- `NCR-004`: Add readiness tests for activity-only, low-confidence-output, coherent-answer, input-required, and error states.
- `NCR-005`: Add a real Electron three-session dogfood receipt.

Completion boundary:

- The package is not complete until the real Electron receipt shows three independent real sessions with clean native conversation projection, or the remaining failure is explicitly listed with raw evidence and exact next steps.

## Clarified Product Semantics

These clarifications came from follow-up dogfood discussion on 2026-06-09.

### Session Independence

Every real session must behave like a unique terminal instance:

- starting Session B must not block, constrain, reuse, or mutate Session A;
- each tab needs an isolated PTY process, prompt state, transcript handle, readiness state, parser/projection state, and unread state;
- delayed output from one session must never update the active tab if the active tab is a different session;
- opening many sessions quickly should feel as reliable as opening many terminal tabs.

### Assistant Message Definition

The assistant message is the model's markdown/text response, not terminal leftovers. Tool calls, tool results, progress counters, prompt chrome, and terminal repaint artifacts are not assistant messages.

### Readiness Labels

- `ready`: project attached and model selected, or the prior turn has completed and the session is waiting for the operator.
- `thinking`: the LLM is actively working on a response.
- `input`: the session is waiting for user input, approval, or terminal choice.
- `error`: PTY/session/transport failure.

Activity alone should not imply an assistant response exists. Activity can coexist with `thinking`; the transition to `ready` should be based on a coherent assistant response or a known idle/input boundary.

### Unread Indicator

`new` is ambiguous. Prefer a clearer unread-response indicator, such as `new message`, `response ready`, or a compact unread dot similar to ChatGPT's blue-circle treatment.

### Token Display

The UI should preserve useful token/progress visibility, but token counters must not leak as assistant text. If token counts are available from a structured source, show them in session status or activity metadata. If the only current source is terminal progress text, treat it as provisional live progress, not transcript truth.

## Structured Source Investigation

### Local Project `.commandcode`

The repo-local `.commandcode` directory contains commands, taste, skills, design notes, and GUI preferences. It does not contain the dogfood chat transcripts.

### Global Command Code Session Store

Command Code writes structured per-project session transcripts under:

`~/.commandcode/projects/users-steven-workspace-40-code-projects-command-code-gui/`

The three dogfood sessions from the screenshots map to separate structured JSONL files:

| Session title | Session id | Prompt | Rows | Structured answer present |
|---|---|---|---:|---|
| Explain project repository | `f8f3b448-b607-4ba6-bbbd-36479c8a6357` | `what is this project repo about?` | 4 | Yes |
| Explain project benefits to community | `8e368167-93c1-47fa-a1a7-0f2c36c2ad13` | `how does this project repo help people in command code community` | 4 | Yes |
| Discuss quality of life improvements | `3be8341f-2d6f-44f1-8039-8df8eeb2ef5f` | `what quality of life improvements can be made to this project` | 8 | Yes |

Each row includes:

- `id`
- `timestamp`
- `sessionId`
- `parentId`
- `role`: `user`, `assistant`, or `tool`
- `content`: structured parts such as `text`, `reasoning`, `tool-call`, and `tool-result`
- `gitBranch`
- `metadata` with `source: "cli"` and `version: 2`

Important finding:

- The structured JSONL contains the clean assistant markdown/text responses that the GUI failed to render cleanly.
- The corruption is therefore in the GUI native projection layer, not necessarily in Command Code's saved conversation.

### GUI PTY Diagnostic Transcript Store

The GUI writes raw PTY diagnostic transcripts under:

`~/.commandcode-gui-starter/transcripts/*.ansi`

Those files capture terminal repaint/control output and are valuable for diagnostics, but they are not a reliable native-chat source. They should remain available as raw detail/fallback.

### Installed CLI Structured Stream Check

`cmd --help`, `cmd --print --help`, `cmd --experimental --help`, and `cmd --help --json` on Command Code `0.33.2` do not advertise a normal interactive JSON/NDJSON event-stream mode.

The installed bundled code contains an internal/experimental sandbox WebSocket stream path, but that is not the documented local interactive session interface. It should not be used as the GUI's normal real-session transport without an explicit upstream contract.

Current conclusion:

- No documented structured live stream was found for local interactive PTY sessions.
- A documented structured transcript exists on disk after Command Code saves messages.
- The best near-term architecture is a hybrid:
  - PTY for live input, progress, approvals, and raw fallback;
  - Command Code JSONL transcript tailing/polling for clean native chat messages once persisted.

### Token Count Source

The inspected JSONL rows did not include token usage fields in normal saved message metadata. The terminal TUI shows progress counters like `↓ 76`, but these are terminal presentation data, not saved message metadata.

Token display should therefore be treated as a separate requirement:

- first preference: use an upstream documented token/usage field if Command Code exposes one later;
- interim: show terminal-derived counters only as volatile live progress metadata;
- never promote token/progress fragments into assistant bubbles.

## Revised Layering Recommendation

Use two truth surfaces instead of forcing PTY to be both transport and transcript:

1. **Session Runtime Layer**
   - owns one PTY process per GUI tab;
   - writes input and receives live bytes;
   - exposes stop, interrupt, resize, and force-kill;
   - stores raw `.ansi` diagnostic transcript.

2. **Live Status Layer**
   - conservatively extracts only low-risk volatile state from PTY bytes:
     - attached,
     - thinking/progress label,
     - approval/input required,
     - PTY error,
     - provisional token/progress counters.
   - does not produce assistant markdown.

3. **Structured Transcript Layer**
   - tails or polls Command Code's per-project JSONL transcript for the session;
   - maps `user` rows to user bubbles;
   - maps assistant `content[].type === "text"` to assistant markdown bubbles;
   - maps `tool-call` and `tool-result` parts to activity/detail cards;
   - ignores or hides `reasoning` by default unless explicitly opened in details.

4. **Projection Confidence Layer**
   - if JSONL is available, native chat uses JSONL;
   - if JSONL is not yet available, show live progress from PTY;
   - if PTY text is ambiguous, show `Projection degraded` plus raw terminal link;
   - never show low-confidence residual PTY text as assistant prose.

5. **Readiness Reducer**
   - `attached + project + model + no active prompt` => `ready`;
   - `active prompt + PTY progress or transcript tool activity without assistant text` => `thinking`;
   - `assistant text row persisted for the active turn` => `ready` / response-ready unread;
   - `approval or terminal choice detected` => `input`;
   - PTY/session failure => `error`.

This gives non-terminal users a native chat experience without pretending terminal repaint output is structured truth.
