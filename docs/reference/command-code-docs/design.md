# Command Code Design Reference

Retrieved: 2026-06-06

Source page:

- https://commandcode.ai/docs/design

This page records the local GUI implications of Command Code `/design`. It is an implementation reference for the adapter, not a replacement for the official docs.

## Command Shape

Documented shape:

```text
/design <mode> [target]
```

Known modes from the local docs index:

- `redesign`
- `setup`
- `tokenize`
- `review`
- `checkup`
- `smell`
- `finish`
- `voice`
- `surface`
- `refine`
- `typeset`
- `recolor`
- `relayout`
- `motion`
- `responsive`
- `interaction`

`/design help` shows the usage guide inside Command Code.

## GUI Status

Implemented:

- Settings > Design includes a preview-only helper.
- The helper lets operators choose a mode and optional target.
- The helper previews the exact `/design ...` command.
- Goal and selected-element context remain visible in the GUI and are not appended as hidden prompt text.
- Command Code remains responsible for executing `/design`.

Not implemented:

- Sending the helper directly to an active session from the Settings page.
- Visual element selection.
- Drawing over a frozen frame.
- Screenshot or DOM capture.
- Vision-model routing for design context.
- Hidden prompt mutation.

## GUI Requirements

- Prefer `surface` as the default for this app because it is an operator tool, not a marketing page.
- Keep visible command preview before any send action.
- Do not silently attach screenshots, DOM state, selected elements, or design guidance to the prompt.
- Treat visual capture and vision-model conversion as post-V1/plugin-owned unless a scoped adapter contract exists.
- Record any project-specific design rules in visible docs, not in hidden runtime state.

## Validation Boundary

Current `/design` GUI work is preview-only. A package that sends `/design`, captures visual context, or routes image/DOM context into Command Code must add Browser/Electron receipts and must document whether the path changes session lifecycle, file access, or runtime prompt content.
