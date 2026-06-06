# Hooks And Notifications Gate

**Date:** 2026-06-06
**Scope:** Phase 3 Hooks And Notifications

This gate defines the boundary before Settings can edit Command Code hooks or reintroduce response-ready notifications.

## Implemented

- `src/core/hooksConfig.ts` parses documented Command Code hook settings from raw `settings.json` text.
- The parser recognizes documented events: `PreToolUse`, `PostToolUse`, and `Stop`.
- The parser extracts command hooks, matchers, timeout values, enabled state, source scope, source path, order, and whether the event can block.
- Project hooks are ordered before user hooks for display because project scope takes precedence over user scope.
- Invalid JSON and invalid hook shapes are rejected before any future write path can use them.
- Unknown events are preserved for diagnostics with warnings instead of silently dropped.

## Not Implemented

- No hook config files are read by the app yet.
- No hook config files are written by the app yet.
- No server routes, renderer IPC, or file access permissions were added.
- No hook execution or test-payload runner was added.
- No OS notifications, hook-triggered alerts, quiet mode, response-ready state, input-required state, or session readiness model was added.

## Required Before Hook Writes

- File access must be scoped to `~/.commandcode/settings.json` and `<project>/.commandcode/settings.json`.
- The UI must show destination path, source scope, and project-over-user precedence before writes.
- Writes must preserve unrelated `settings.json` keys.
- Invalid hook JSON must fail before write.
- Changes need preview, confirmation, and undo/revert or backup behavior.
- Tests must cover malformed JSON, unsupported event names, direct command entries, grouped matcher entries, empty configs, user-only configs, project-only configs, and merged configs.

## Required Before Notification Readiness

- Session readiness must be based on explicit session lifecycle or protocol state, not terminal byte-length changes.
- Opening, attaching, or returning to a session must not fire response-ready notifications.
- Background session output, response-ready state, and input-required state must be distinguishable.
- Notification preferences must suppress or enable each category predictably.
- Audio must remain off unless enabled by user-owned GUI preferences.

## Validation Receipts

- `npm run typecheck`
- `npx vitest run` -> `64/64`
- `npm run build`
