# Phase 1 Dead UI Path Audit

**Date:** 2026-06-06
**Scope:** renderer presentation paths after Phase 1 extraction slices.

## Summary

This audit documents dead or legacy UI paths before removal. The initial audit package documented the paths without removal. A follow-up cleanup package removed the documented unreferenced components, the unreachable `mode` popover branch, and the matching stale CSS selectors.

## Findings

| Path | Status | Evidence | Recommended action |
|---|---|---|---|
| `src/renderer/src/components/ControlPanel.tsx` | Removed | `rg` found no imports/usages outside the component file. It owned legacy quick-command UI and status blocks. | Complete. |
| `src/renderer/src/components/ModeRail.tsx` | Removed | `rg` found no imports/usages outside the component file. The current risky-mode/status presentation is in `SessionWorkspace`, `SettingsWorkspace`, and popovers. | Complete. |
| `src/renderer/src/components/RecentProjects.tsx` | Removed | `rg` found no imports/usages outside the component file. Recent project presentation now lives in `ShellLayout` and `AppPopovers`. | Complete. |
| `src/renderer/src/components/DocsSidecar.tsx` | Removed | `rg` found no imports/usages outside the component file. Docs are currently surfaced through `RightInspectorPanel` iframe and settings/runtime links. | Complete. |
| `src/renderer/src/components/HeadlessRunner.tsx` | Removed | `rg` found no imports/usages outside the component file. Headless runs are now launched through composer/command palette and recorded by `HeadlessHistory`. | Complete. |
| `openPopover === 'mode'` branch in `AppPopovers` | Removed | `PopoverKey` included `mode`, but `rg "setOpenPopover\\('mode'"` found no opener. Runtime mode is opened through `runtime`. | Complete. |
| `.control-panel`, `.quick-command-list`, `.mode-rail`, `.mode-popover` CSS | Removed | Selectors only supported unreferenced components or the unreachable `mode` popover. | Complete. |

## Not Dead

| Path | Status | Evidence |
|---|---|---|
| `src/renderer/src/components/CommandHistory.tsx` | Partially used | `pushCommandHistory` is imported by `App.tsx`; the `CommandHistory` component itself is not rendered. Keep the storage helper until command history UI is either restored or split. |
| `src/renderer/src/components/AdvancedPanel.tsx` | Used | Rendered from `App.tsx` behind `advancedOpen`. |
| `src/renderer/src/components/StatusPill.tsx` | Used | Rendered by `SessionWorkspace` and legacy `ControlPanel`. |

## Cleanup Receipts

Cleanup validation on 2026-06-06:

- `npm run typecheck`
- `npm run build`
- `npm run smoke:browser`
- Built browser route token proof at `http://127.0.0.1:5192/`
- Electron dev startup with embedded app server `http://127.0.0.1:61897`

## Future Cleanup Gate

Any further UI removal should be a separate package with:

- `npm run typecheck`
- `npm run build`
- `npm run smoke:browser`
- Browser/Electron route receipts if CSS or visible workbench layout changes

Do not combine removal with Phase 2 Settings Center expansion.
