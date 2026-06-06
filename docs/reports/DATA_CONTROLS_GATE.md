# Data Controls Gate

Date: 2026-06-06

This gate defines the minimum boundary before Settings can add transcript deletion, cache clearing, preference reset, export, or import actions.

## Implemented

- Settings > Data shows project `.commandcode` paths and user-level runtime context roots through the existing read-only project state discovery path.
- Settings > Data names the destructive and file-producing controls as blocked until each action has a scoped route, preview, and validation receipt.

## Blocked Actions

The GUI must not implement these actions until each action has an explicit route contract and test coverage:

- Transcript deletion.
- Cache clearing.
- Preference reset.
- Data export.
- Data import.

## Required Before Writes Or Deletes

Each future data action must show:

- exact target path or output path
- whether the target is GUI-owned or Command Code-owned
- project/user scope
- count and type of affected files
- confirmation affordance before execution
- cancel path before execution
- validation result after execution
- security tests proving paths stay inside approved roots

## Current Decision

Keep data controls read-only.

Data Settings may surface paths, counts, and planned actions, but it must not delete, reset, export, import, or clear cache until the route contract and tests above exist.
