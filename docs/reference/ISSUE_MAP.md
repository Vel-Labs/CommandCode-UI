# Upstream Issue Map For GUI Planning

These are current upstream issues that directly influence a GUI wrapper design. Use them as requirements, not as blockers.

## GUI demand

- `#455 Add a GUI application` requests a proper desktop app because GUI workflows can provide more versatile input, easier navigation, better overview, and less fatigue.

## Terminal/PTY risks

- `#453 use the alternate screen buffer` points to editor and terminal quirks while the model is reasoning.
- `#451 Scroll buggy terminal` reports inconsistent scrolling in long Windows sessions.
- `#452 /exit doesn't exit Command Code properly` reports exit requiring manual Ctrl-C.
- `#447 Uncaught error for terminal command` reports a Windows `SIGTSTP` signal crash.

## Runtime resilience risks

- `#454 harness keeps the model looping forever` reports repeated continuation nudges when reasoning tags are malformed.
- `#450 Last few GCs` reports out-of-memory behavior.

## IDE risks

- `#448 /ide Extension Installed but IDE Context Not Detected` reports IDE context not flowing in Cursor on Windows.

## Product implications

- Build Stop and Force Stop controls from day one.
- Keep transcripts local for debugging.
- Treat Windows as a first-class test target.
- Avoid output parsing that breaks on alternate screen behavior.
- Keep `/ide` as a diagnostics surface until the integration is proven.
- Add job/session timeouts and visible liveness indicators.
