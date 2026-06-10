# Command Code Structured Event Stream Proposal

Date: 2026-06-09

This note covers `NCP-090` from `docs/reports/NATIVE_CONVERSATION_RECOVERY_PLAN.md`.

## Problem

Command Code GUI currently drives real interactive sessions through PTY because Command Code is terminal-first. PTY is useful for process control, live progress, approval prompts, and diagnostics, but terminal repaint output is not a stable source of assistant-message truth.

The GUI now uses saved Command Code JSONL transcripts for native chat when it can associate a GUI tab with the matching Command Code session. That is safer than PTY parsing, but it still has delay and association ambiguity.

## Recommended CLI Contract

Add a documented local structured event stream mode for interactive and print-style sessions, for example:

```bash
cmd --event-stream json
cmd "prompt" --event-stream json
cmd --resume "session name" --event-stream json
```

The stream should be newline-delimited JSON and should avoid terminal presentation details.

## Suggested Events

- `session.started`
- `session.ready`
- `session.exited`
- `user.message`
- `assistant.reasoning.delta`
- `assistant.reasoning.completed`
- `assistant.message.delta`
- `assistant.message.completed`
- `tool.call.started`
- `tool.call.completed`
- `tool.result`
- `usage.delta`
- `usage.completed`
- `input.required`
- `error`

## Required Fields

Every event should include:

- `event`: event name;
- `sessionId`: Command Code session id;
- `timestamp`: ISO timestamp;
- `cwd`: project path or canonical project identity when safe;
- `turnId`: stable turn id for prompt/response grouping when applicable.

Assistant message events should include:

- markdown/text content or deltas;
- final/completed marker;
- optional usage metadata only when structured usage is available.

Tool events should include:

- `toolCallId`;
- `toolName`;
- structured input/result summaries safe for UI display;
- file references where available.

Input-required events should include:

- prompt title;
- choices/actions when available;
- whether raw terminal fallback is required.

## GUI Boundary

The GUI should consume this stream as the live structured source and keep PTY only as a diagnostic or compatibility driver. The GUI should not depend on private or undocumented Command Code sandbox/internal APIs.

Until such a stream exists, the GUI should:

- bind GUI tabs to saved JSONL transcripts where possible;
- show live PTY progress as volatile status only;
- never promote PTY repaint output into assistant prose;
- expose raw terminal diagnostics explicitly.
