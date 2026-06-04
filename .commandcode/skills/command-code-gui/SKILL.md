---
name: command-code-gui
description: Build and harden a desktop GUI adapter around the Command Code CLI while preserving the CLI as the execution boundary.
---

# Command Code GUI Adapter Skill

Use this skill when working on this repository's desktop wrapper for Command Code.

## Core rule

The GUI is an adapter. It may spawn documented CLI commands and display output. It must not depend on private Command Code internals.

## Checklist

- Use a PTY for interactive sessions.
- Use `cmd --print` for headless jobs.
- Keep renderer IPC narrow.
- Make permission modes visible.
- Treat Windows signal and binary-path behavior as high risk.
- Avoid parsing ANSI output as stable structured state.
- Add smoke notes after real CLI testing.

## When changing UI

Run a surface pass:

- Does the terminal remain primary?
- Are risky controls obvious?
- Are command buttons useful rather than decorative?
- Does the black-grid style still serve operator clarity?

## When changing main process code

Check:

- Does any renderer API allow arbitrary shell execution?
- Can a failed transcript write crash a session?
- Does session exit always update UI state?
- Is there a force-stop path?
