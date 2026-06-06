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
- `/api/hooks/configs` reads exactly the documented user and selected-project settings paths and returns parsed source status for Settings > Hooks.
- Settings > Hooks displays discovered project/user source status, parsed command rows, warnings, and errors without edit controls.
- `setHookCommandEnabled` can toggle a matching direct or grouped command hook's `enabled` field in raw `settings.json` content while preserving unrelated settings keys for future preview/write flows.
- `/api/hooks/preview-toggle` and Settings > Hooks `Preview enable/disable` controls return formatted JSON for a scoped hook toggle without writing the source file.
- `/api/hooks/apply-toggle` and Settings > Hooks `Apply preview` write only previewed enable/disable toggles to derived user/project `settings.json` paths after writing a sibling `.ccgui.bak` backup.
- `updateHookCommand` and `removeHookCommand` provide pure broader-edit scaffolding for future command, matcher, timeout, and delete previews without file reads, writes, routes, or UI controls.
- `/api/hooks/preview-edit` and `transport.previewHookEdit(...)` return scoped command/matcher/timeout/delete previews for the same derived project/user settings paths without writing files.
- `/api/hooks/apply-edit`, `transport.applyHookEdit(...)`, and Settings > Hooks `Apply edit preview` write only previewed broader edit/delete changes to derived user/project `settings.json` paths after writing a sibling `.ccgui.bak` backup.
- `src/core/hooksPayload.ts` and Settings > Hooks `Sample payload` controls build explicitly marked dry-run JSON samples without executing hook commands or starting sessions.
- `src/renderer/src/services/sessionReadiness.ts` adds a pure session readiness reducer for background, unread, response-ready, and input-required state.
- The readiness reducer keeps attach, replay, and foreground transitions non-notifying, separates live background output from response-ready state, and emits notification intent only for explicit background `assistant-ready` or `input-required` events.
- Session data callbacks include `live` versus `replay` metadata, and active tabs/sidebar rows display reducer-backed unread/readiness state without firing toast, audio, or OS notifications.

## Not Implemented

- Broader hook creation and import/export are not implemented.
- Broader hook deletion, command editing, matcher editing, and timeout editing are implemented only through preview-confirmed scoped writes with `.ccgui.bak` backups.
- No arbitrary hook config path is accepted from the renderer.
- No renderer IPC or broad file access permission was added.
- No hook command execution or real-session test-payload runner was added.
- No OS notifications, hook-triggered alerts, quiet mode, runtime-integrated response-ready notifications, or runtime-integrated input-required notifications were added.

## Required Before Hook Writes

- File access must be scoped to `~/.commandcode/settings.json` and `<project>/.commandcode/settings.json`.
- The UI must show destination path, source scope, and project-over-user precedence before writes.
- Writes must preserve unrelated `settings.json` keys.
- Invalid hook JSON must fail before write.
- Changes need preview, confirmation, and undo/revert or backup behavior.
- Implemented for enable/disable toggles and preview-confirmed command/matcher/timeout/delete edits.
- Tests must cover malformed JSON, unsupported event names, direct command entries, grouped matcher entries, empty configs, user-only configs, project-only configs, and merged configs.

## Required Before Notification Readiness

- Session readiness must be based on explicit session lifecycle or protocol state, not terminal byte-length changes.
- Opening, attaching, or returning to a session must not fire response-ready notifications.
- Background session output, response-ready state, and input-required state must be distinguishable.
- Implemented as a pure reducer plus tab/sidebar unread display only; explicit Command Code readiness events remain required before OS or toast notifications can use response-ready or input-required state.
- Notification preferences must suppress or enable each category predictably.
- Audio must remain off unless enabled by user-owned GUI preferences.

## Validation Receipts

- `npm run typecheck`
- `npx vitest run` -> `89/89`
- `npm run build`
- `npm run smoke:browser`
- Built browser route token proof at `http://127.0.0.1:5224/`
- Authenticated `/api/hooks/configs` proof against isolated temp project
- Authenticated `/api/hooks/preview-toggle` proof against isolated temp project with unchanged source file
- Authenticated `/api/hooks/apply-toggle` proof against isolated temp project with sibling backup
- Authenticated `/api/hooks/preview-edit` proof against isolated temp project with unchanged source file
- Authenticated `/api/hooks/apply-edit` proof against isolated temp project with sibling backup
- Built browser route token proof at `http://127.0.0.1:5227/`
- Electron dev startup with embedded server `http://127.0.0.1:54048`
