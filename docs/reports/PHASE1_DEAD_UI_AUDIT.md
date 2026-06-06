# Phase 1 Dead UI Path Audit

**Date:** 2026-06-06
**Scope:** renderer presentation paths after Phase 1 extraction slices.

## Summary

This audit documents dead or legacy UI paths before removal. No files were removed in this audit package.

## Findings

| Path | Status | Evidence | Recommended action |
|---|---|---|---|
| `src/renderer/src/components/ControlPanel.tsx` | Unreferenced legacy component | `rg` found no imports/usages outside the component file. It still owns legacy quick-command UI and status blocks. | Remove in a cleanup package after confirming no external story/test imports exist. |
| `src/renderer/src/components/ModeRail.tsx` | Unreferenced legacy component | `rg` found no imports/usages outside the component file. The current risky-mode/status presentation is in `SessionWorkspace`, `SettingsWorkspace`, and popovers. | Remove in the same cleanup package as stale mode-rail CSS. |
| `src/renderer/src/components/RecentProjects.tsx` | Unreferenced legacy component | `rg` found no imports/usages outside the component file. Recent project presentation now lives in `ShellLayout` and `AppPopovers`. | Remove after confirming no intended reuse in Phase 2 Settings Center. |
| `src/renderer/src/components/DocsSidecar.tsx` | Unreferenced legacy component | `rg` found no imports/usages outside the component file. Docs are currently surfaced through `RightInspectorPanel` iframe and settings/runtime links. | Remove or replace with a right-inspector-specific docs component in a cleanup package. |
| `src/renderer/src/components/HeadlessRunner.tsx` | Unreferenced legacy component | `rg` found no imports/usages outside the component file. Headless runs are now launched through composer/command palette and recorded by `HeadlessHistory`. | Remove after verifying Phase 2 does not need the old modal runner surface. |
| `openPopover === 'mode'` branch in `AppPopovers` | Unreachable branch | `PopoverKey` includes `mode`, but `rg "setOpenPopover\\('mode'"` found no opener. Runtime mode is opened through `runtime`. | Remove the branch and `.mode-popover` CSS in a cleanup package. |
| `.control-panel`, `.quick-command-list`, `.mode-rail`, `.mode-popover` CSS | Likely stale CSS | Selectors only support unreferenced components or the unreachable `mode` popover. | Remove after the corresponding components/branch are removed. |

## Not Dead

| Path | Status | Evidence |
|---|---|---|
| `src/renderer/src/components/CommandHistory.tsx` | Partially used | `pushCommandHistory` is imported by `App.tsx`; the `CommandHistory` component itself is not rendered. Keep the storage helper until command history UI is either restored or split. |
| `src/renderer/src/components/AdvancedPanel.tsx` | Used | Rendered from `App.tsx` behind `advancedOpen`. |
| `src/renderer/src/components/StatusPill.tsx` | Used | Rendered by `SessionWorkspace` and legacy `ControlPanel`. |

## Cleanup Gate

Removal should be a separate package with:

- `npm run typecheck`
- `npm run build`
- `npm run smoke:browser`
- Browser/Electron route receipts if CSS or visible workbench layout changes

Do not combine removal with Phase 2 Settings Center expansion.
