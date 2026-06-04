Harden the PTY session handling for this Command Code GUI adapter.

Requirements:

- graceful stop ladder: send `/exit`, then Ctrl-C, then kill
- no renderer access to arbitrary shell commands
- transcript persistence must not crash sessions
- window resize must not flood resize calls
- Windows signal handling must avoid unsupported POSIX-only signals
- session exit must always clear active UI state

Use $ARGUMENTS as additional context.
