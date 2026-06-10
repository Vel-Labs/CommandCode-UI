# Docs Index

---

## Architecture (`docs/architecture/`)

| File | Description |
|---|---|
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | Two-path integration model (interactive PTY vs headless spawn), state model, session lifecycle, security posture |
| [V1_ARCHITECTURE.md](architecture/V1_ARCHITECTURE.md) | Post-hardening architecture direction for component layers, settings, workflow helpers, and local docs |
| [CROSS_PLATFORM_STRATEGY.md](architecture/CROSS_PLATFORM_STRATEGY.md) | Why Electron is a shell, not the engine. Localhost server strategy for macOS, Linux, WSL, and native Windows. Phase-by-phase pivot plan |
| [SECURITY.md](architecture/SECURITY.md) | Security principles: no renderer Node.js, narrow IPC, argument assembly from UI controls, risky-mode visibility, recommended hardening |

---

## Guides (`docs/guides/`)

| File | Description |
|---|---|
| [DESIGN_STYLE_GUIDE.md](guides/DESIGN_STYLE_GUIDE.md) | Visual design system: black grid, purple glow, monospace pills, mode visibility. UI rules for controls, terminals, and operator panels |

---

## Reference (`docs/reference/`)

| File | Description |
|---|---|
| [CLI_REFERENCE.md](reference/CLI_REFERENCE.md) | Exhaustive Command Code CLI index: every `cmd` subcommand, flag, slash command, keyboard shortcut, exit ladder, doctor checks, and Windows notes |
| [CLI_INTEGRATION_NOTES.md](reference/CLI_INTEGRATION_NOTES.md) | How Command Code CLI flags and subcommands map to GUI controls. Important limitations of headless mode vs interactive |
| [COMMAND_CODE_STRUCTURED_EVENT_STREAM_PROPOSAL.md](reference/COMMAND_CODE_STRUCTURED_EVENT_STREAM_PROPOSAL.md) | Proposed Command Code JSON event stream contract for replacing PTY repaint parsing as native chat truth |
| [ISSUE_MAP.md](reference/ISSUE_MAP.md) | Current upstream Command Code issues that directly influence GUI design decisions. Used as requirements, not blockers |
| [KNOWN_LIMITATIONS.md](reference/KNOWN_LIMITATIONS.md) | Current limitations: no bundled CLI, no internal state parsing, `node-pty` rebuilds, Windows `cmd` ambiguity, headless isolation |
| [REFERENCE_LINKS.md](reference/REFERENCE_LINKS.md) | Curated links to Command Code docs, GitHub issues, and relevant resources |
| [command-code-docs/README.md](reference/command-code-docs/README.md) | Local implementation index for Command Code hooks, MCP, design, and tools docs |
| [command-code-docs/design.md](reference/command-code-docs/design.md) | Local `/design` command implications for preview helpers, visual context boundaries, and GUI validation |
| [command-code-docs/gui-implications.md](reference/command-code-docs/gui-implications.md) | Cross-cutting GUI adapter rules for runtime ownership, gated surfaces, and validation receipts |
| [command-code-docs/hooks.md](reference/command-code-docs/hooks.md) | Local hooks reference for settings scopes, dry-run behavior, diagnostics, and non-implemented execution boundaries |
| [command-code-docs/mcp.md](reference/command-code-docs/mcp.md) | Local MCP reference for command shapes, scopes, redacted previews, and gated mutation boundaries |
| [command-code-docs/models.md](reference/command-code-docs/models.md) | Local model selection and `/configure-models` implications for GUI display and routing boundaries |
| [command-code-docs/tools.md](reference/command-code-docs/tools.md) | Local tools reference for permissions, risky modes, and why GUI helpers must not mirror arbitrary Command Code tools |

---

## Reports (`docs/reports/`)

| File | Description |
|---|---|
| [PHASE1_DEAD_UI_AUDIT.md](reports/PHASE1_DEAD_UI_AUDIT.md) | Phase 1 audit and validated cleanup record for unreferenced renderer components, unreachable popovers, and stale CSS selectors |
| [ADVANCED_PANEL_REMOVAL_GATE.md](reports/ADVANCED_PANEL_REMOVAL_GATE.md) | Phase 2 removal gate for AdvancedPanel replacement coverage and remaining advanced-only behavior |
| [DATA_CONTROLS_GATE.md](reports/DATA_CONTROLS_GATE.md) | Phase 2 data control boundary for deletion, cache clearing, preference reset, export, and import actions |
| [HARDENING_GATE.md](reports/HARDENING_GATE.md) | v0 hardening closeout evidence, pass/fail status, and v1 handoff boundary |
| [HOOKS_NOTIFICATIONS_GATE.md](reports/HOOKS_NOTIFICATIONS_GATE.md) | Phase 3 boundary for hook config writes, hook execution, readiness state, and notification dispatch |
| [SETTINGS_PERSISTENCE_GATE.md](reports/SETTINGS_PERSISTENCE_GATE.md) | Phase 2 Settings ownership contract for GUI-owned preferences, Command Code-owned config, and future editable write gates |
| [SMOKE_TEST_REPORT.md](reports/SMOKE_TEST_REPORT.md) | Environment details and pass/fail results for mock mode, real CLI, typecheck, tests, and graceful shutdown |
| [TEST_PLAN.md](reports/TEST_PLAN.md) | Unit test coverage, manual smoke matrix (macOS/Windows/Linux), and real Command Code smoke sequence |
| [V1_VALIDATION_TEMPLATE.md](reports/V1_VALIDATION_TEMPLATE.md) | Reusable package validation receipt template for V1 implementation packages |
| [WORKBENCH_POLISH_GATE.md](reports/WORKBENCH_POLISH_GATE.md) | Phase 9 boundary for file, IDE, git, terminal lifecycle, theme-token, and release-fetching workbench actions |

---

## Contributors (`docs/contributors/`)

| File | Description |
|---|---|
| [V1_IMPLEMENTATION_GUIDE.md](contributors/V1_IMPLEMENTATION_GUIDE.md) | Contributor handoff for V1 package loops, validation receipts, gates, status language, and phase closeout |

---

## Root

| File | Description |
|---|---|
| [ROADMAP.md](../ROADMAP.md) | Full implementation plan across 9 phases — from starter stabilization through core extraction, local server, CLI entry point, Electron-as-shell, and daily-driver features |
| [README.md](../README.md) | Project overview, prerequisites, run/build instructions, architecture diagram, design decisions, and smoke checks |

---

## Roadmaps (`docs/roadmaps/`)

| File | Description |
|---|---|
| [v1/LLM_SUGGESTION_MATRIX.md](roadmaps/v1/LLM_SUGGESTION_MATRIX.md) | Staging matrix for Codex, Deepseek-v4-Pro, Kimi2.6, Nemotron-3-ultra, operator dogfood, and community hook suggestions |
| [v1/ROADMAP_V1.md](roadmaps/v1/ROADMAP_V1.md) | Draft post-hardening v1 roadmap sequenced from the suggestion matrix |
