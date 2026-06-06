# V1 Implementation Guide

Date: 2026-06-06

This guide is the contributor handoff for V1 work in this repository. It summarizes how to use the roadmap, where to record proof, and which gates must stop implementation until the boundary is explicit.

## Source Of Truth

- `docs/roadmaps/v1/ROADMAP_V1.md` is the execution contract.
- `docs/architecture/V1_ARCHITECTURE.md` explains current module ownership and runtime boundaries.
- `docs/reports/SMOKE_TEST_REPORT.md` is the durable receipt log for package validation.
- `docs/reports/V1_VALIDATION_TEMPLATE.md` is the package receipt template.
- `docs/reference/command-code-docs/` records local Command Code docs implications for GUI work.

## Package Loop

Use this loop for every V1 package:

```text
preflight -> implement slice -> verify -> update roadmap/docs -> git commit -> continue
```

Required preflight:

- Run `git status --short --branch`.
- Identify unrelated changes and leave them alone.
- Confirm whether the package is presentation-only, transport-affecting, config-writing, file-accessing, session-lifecycle-affecting, or runtime-truth-affecting.
- Read the relevant gate report before implementing gated work.

Required closeout:

- Run `npm run typecheck`.
- Run `npx vitest run` when parser, transport, config, session, or shared helper behavior changes.
- Run `npm run build` for renderer, server, main-process, package, or bundled-output changes.
- Run the matching smoke command for browser, headless, PTY, or session UI behavior.
- Capture Browser/Electron receipts for UI layout, session workbench, settings navigation, or inspector behavior.
- Update the roadmap, architecture, and smoke report with implemented, validated, blocked, deferred, and planned kept separate.
- Run `git diff --check`.
- Stage only files belonging to the package and commit after validation.

## Current Gates

- `docs/reports/SETTINGS_PERSISTENCE_GATE.md` controls new Settings writes and ownership labels.
- `docs/reports/DATA_CONTROLS_GATE.md` controls transcript deletion, cache clearing, preference reset, export, and import.
- `docs/reports/HOOKS_NOTIFICATIONS_GATE.md` controls hook execution, hook creation/import/export, OS notifications, quiet mode, and runtime-integrated readiness dispatch.
- `docs/reports/WORKBENCH_POLISH_GATE.md` controls file actions, IDE actions, git mutations, terminal lifecycle/profile work, editable theme-token controls, and release-fetching behavior.
- `docs/reports/ADVANCED_PANEL_REMOVAL_GATE.md` records the AdvancedPanel replacement/removal boundary.

## Runtime Boundary

Command Code remains the engine and source of execution truth. The GUI owns the desktop shell, PTY lifecycle, headless run orchestration, session display, operator controls, transcripts, and local GUI preferences.

The GUI must not claim ownership of:

- Command Code model semantics beyond documented flags and commands.
- Tool permission semantics beyond documented flags and visible mode labels.
- Taste, checkpoint, IDE, MCP, or hook internals beyond documented config and command surfaces.
- Private runtime state inferred from terminal output.

## Status Language

Use these terms consistently:

- Implemented: code or docs exist in the worktree.
- Validated: the relevant command, test, receipt, or screenshot proves the behavior.
- Blocked: implementation must not proceed until a named gate condition is met.
- Deferred: intentionally out of the current package or phase contract.
- Planned: desired future behavior without implementation or validation.

Do not use passing tests to claim behavior they do not cover.

## Real CLI And Mock Mode

Mock mode must keep working after every package.

Real CLI paths must be smoke-tested when a package changes command building, session lifecycle, PTY behavior, headless execution, auth/runtime transport, or Command Code invocation behavior. If a real CLI path is not tested, mark it explicitly untested in the roadmap or smoke report before committing.

## Phase Handoff

When closing a phase:

- Mark the phase status in `ROADMAP_V1.md`.
- Name what is complete for the current V1 contract.
- Name what remains gated, blocked, deferred, or planned.
- Run the broadest relevant validation set.
- Push after the phase completion commit.
