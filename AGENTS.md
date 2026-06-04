# Agent Instructions

This repository is a GUI adapter around the Command Code CLI. The GUI must not pretend to be the agent runtime. Command Code remains the engine and source of execution truth.

## Boundaries

The app owns:

- Desktop shell
- PTY lifecycle
- Headless run orchestration
- Session display
- Operator controls
- Transcripts and local GUI preferences

The app does not own:

- Command Code model selection semantics beyond documented flags
- Tool permission semantics beyond documented flags
- Taste learning internals
- Checkpoint internals
- IDE extension internals
- Private command-code APIs

## Done means

- TypeScript passes
- Mock mode still works
- Real CLI path is smoke-tested or clearly marked untested
- Renderer IPC does not gain broad shell capability
- Risky execution modes remain visually explicit
- README and docs are updated when behavior changes

## Code style

- Keep main-process code defensive and small.
- Keep renderer components presentation-focused.
- Put CLI argument building in testable pure functions.
- Avoid terminal output scraping in UI components.
- Prefer explicit status cards over hidden heuristics.
