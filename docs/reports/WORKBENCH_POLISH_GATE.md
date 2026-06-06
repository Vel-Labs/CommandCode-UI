# Workbench Polish Gate

Date: 2026-06-06

This gate defines the remaining Phase 9 boundary before native workbench polish can add file actions, IDE actions, git actions, theme-token controls, or release-fetching behavior.

## Implemented

- Native popovers have desktop attachment cues, viewport-contained narrow layouts, safer text wrapping, and revalidated Escape/outside-click dismissal.
- Home and active-session headers show read-only git state from the existing `transport.gitStatus(cwd)` route.
- Home and active-session headers show PTY doctor state from the existing PTY health result.
- The right inspector exposes existing Files, Transcript, Docs, Environment, and IDE modes through a compact switcher.
- The right-inspector resize handle exposes the existing drag-to-collapse path with an accessible label and visible grip.
- Right-inspector motion is CSS-only and includes a reduced-motion override.
- Read-only Settings discovery cards show shared loading skeletons from existing loading state.

## Blocked Actions

The GUI must not implement these Phase 9 actions until each has an explicit route contract, preview, and validation receipt:

- File create, rename, delete, or write actions from the workbench.
- File search that reads beyond the current scoped file-browser/project roots or indexes unbounded project content.
- IDE launch, IDE configuration writes, or Finder/open-in-editor actions beyond existing validated adapter paths.
- Git branch switching, checkout, pull, push, commit, diff mutation, staging, reset, or merge actions.
- Terminal tab/profile/history behavior that changes PTY lifecycle, shell selection, live resize protocol, or persisted terminal state beyond current renderer-local presentation preferences.
- Theme token controls that rewrite shared CSS tokens, add new persistent theme settings, or change cross-theme color semantics.
- Release-note fetching or update behavior that changes network calls, install behavior, dismissal persistence, or update transport.

## Required Before File Actions

Each future file action must show:

- exact target path
- project root and whether the target is GUI-owned, project-owned, or Command Code-owned
- action type and affected file count
- preview or confirmation before execution
- validation result after execution
- security tests proving paths stay inside approved roots and reject symlinks, binary files, oversized files, and outside-root targets where applicable

Read-only project browsing and transcript artifact preview remain allowed through existing scoped paths.

## Required Before IDE Actions

Each future IDE action must show:

- command or integration target before execution
- selected project path
- whether the action opens an external app, writes config, or only reads status
- failure-tolerant diagnostics
- tests or receipts proving no broad shell capability is exposed to the renderer

Read-only IDE status display remains allowed through existing diagnostics.

## Required Before Git Actions

Each future git action must show:

- repository path
- exact git command or adapter operation
- current branch and dirty-state summary before action
- whether the action mutates working tree, index, local refs, or remotes
- confirmation before mutation
- validation result after execution
- tests using isolated repositories for success, dirty-state refusal, outside-root rejection, and failure diagnostics

Read-only git status display remains allowed through the existing `transport.gitStatus(cwd)` route.

## Required Before Theme Token Controls

Theme work must stay token-based and avoid one-off color overrides. Each future editable theme control must show:

- GUI preference destination
- token name or setting key
- default value and current value
- preview behavior before save when practical
- reduced-motion and contrast impact where relevant
- tests for preference sanitization and corrupt-storage fallback

CSS-only polish that does not add settings or rewrite shared token semantics remains allowed.

## Current Decision

Keep the remaining Phase 9 workbench actions gated.

Phase 9 can continue with presentation-only validation, docs, and read-only status improvements. Workbench file, IDE, git, terminal lifecycle, theme-token, and release-fetching changes need a dedicated package with the contracts above before implementation.
