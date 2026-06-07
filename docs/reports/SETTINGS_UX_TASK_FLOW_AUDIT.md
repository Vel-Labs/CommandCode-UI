# Settings UX Task-Flow Audit

Date: 2026-06-06

## Summary

Settings is functionally complete for the current V1 contract, but the user flow still reads like a configuration catalog. The sidebar, Profile shortcuts, Integrations hub, Advanced hub, command palette, and page-local CTAs all provide overlapping handoffs. That creates a redundant experience even when each individual surface is clean.

This audit defines the target UX: Settings should lead with operator jobs, make current scope and status obvious, and keep implemented, gated, planned, blocked, and deferred states visually separate without turning every page into an implementation report.

## Section Handoff Map

| Section | Primary operator job | Current entry points | Redundant handoffs | Current state | Proposed role |
|---|---|---|---|---|---|
| Profile | See current adapter/runtime status and likely next actions | Sidebar, Settings default, command palette | Routes to General, Runtime, Usage, Sessions, Data, Integrations as another launcher grid | Implemented status overview | Task overview |
| General | Set app startup and Command Code binary basics | Sidebar, Profile, command palette | Check CLI is useful; no hub handoff problem | Implemented GUI preferences | Task page |
| Appearance | Choose adapter theme | Sidebar, command palette | None | Implemented GUI preference | Reference/task page |
| Runtime | Check PTY/auth/IDE and choose permissions/model | Sidebar, Profile, command palette, Models CTA | Models also points back to Runtime | Implemented GUI/project preferences and diagnostics | Task page |
| Models | Understand single-session model selection and `/configure-models` | Sidebar, Runtime model picker, command palette | Runtime and Models cross-link; keep direct task wording | Implemented preview/helper surface | Task page |
| Notifications | Control GUI toast/audio preferences | Sidebar, command palette, Hooks references | Hook notification copy can over-explain gated work | Implemented renderer-local preferences; readiness dispatch gated | Reference/task page |
| Terminal | Control xterm presentation | Sidebar, command palette | None | Implemented renderer-local preferences; profile/history planned | Reference/task page |
| Keyboard | Learn shortcuts | Sidebar, command palette | None | Implemented reference | Reference page |
| Data | Inspect project state and gated data actions | Sidebar, Profile, Advanced | Advanced duplicates Data as diagnostics launcher | Read-only/gated actions | Diagnostic page |
| Usage | Inspect run counters and usage summary | Sidebar, Profile, Advanced | Profile and Advanced both route here | Implemented read-only summary/history | Diagnostic page |
| Sessions | Find, resume, or reveal project sessions | Sidebar, Profile, Advanced | Profile and Advanced both route here | Implemented project resume/reveal | Project task page |
| Integrations | Set up or inspect external Command Code extension surfaces | Sidebar, Profile, command palette | Acts as hub to MCP, Hooks, Agents, Skills, Design, Memory, Taste | Implemented hub | Task landing page |
| Hooks | Inspect hook scopes, commands, logs, and gated edits | Sidebar, Integrations, command palette | Dense copy repeats gate reports | Implemented discovery/readable rows; execution/notifications gated | Task page |
| MCP | Inspect and connect/disconnect known MCP servers | Sidebar, Integrations, Advanced, command palette | Advanced duplicates MCP route | Implemented scoped actions | Task page |
| Agents | Create/edit project agents and inspect read-only user agents | Sidebar, Integrations, Advanced, command palette | Advanced duplicates Agents route | Implemented project agent creation/edit | Task page |
| Skills | Inspect installed skills | Sidebar, Integrations, Advanced, command palette | Advanced duplicates Skills route | Read-only previews | Reference page |
| Design | Preview `/design` helper | Sidebar, Integrations, command palette | Integrations handoff is useful; no duplicate Advanced route | Preview-only helper | Task page |
| Memory | Inspect/edit scoped project memory | Sidebar, Integrations, Advanced, command palette | Advanced duplicates Memory route | Implemented scoped project writes | Task page |
| Taste | Inspect taste profile discovery | Sidebar, Integrations, Advanced, command palette | Advanced duplicates Taste route | Read-only | Reference page |
| Advanced | Find low-level diagnostics and scoped tools | Sidebar, command palette | Duplicates Integrations, Data, Sessions, Usage, MCP, Agents, Skills, Memory, Taste | Implemented replacement for removed modal | De-emphasized Diagnostics |
| About | Confirm version, release notes, update state | Sidebar, command palette | None | Implemented read-only | Reference page |

## Journey Review

### Get Command Code running

Best path should be: Profile overview -> Runtime or General -> direct action. The current Profile grid sends users into another broad menu. Improve by showing a compact setup checklist: command binary, PTY, auth, model, permissions, and project.

### Configure project/session behavior

Best path should be: Project task group -> Sessions, Memory, Agents, Data. The current handoff is split between Profile, Advanced, and the sidebar. Improve by adding a Settings overview and making Sessions/Agents/Memory/Data purpose and scope visible at the top of each page.

### Set up integrations

Best path should be: Integrations landing -> grouped setup/edit/inspect tasks. The current Integrations page is a flat grid. Improve by grouping MCP, Hooks, Agents, Memory, Design, Skills, and Taste by what the operator can do now.

### Diagnose or inspect local state

Best path should be: Diagnostics -> Data, Usage, About, low-level state. The current Advanced page duplicates primary integration routes. Improve by renaming/de-emphasizing Advanced as diagnostics and keeping it focused on local state, usage, and low-level references.

## Improvement Principles

- Each Settings page should answer: what is this for, what scope am I looking at, what can I do now, and what is gated.
- Hubs should route to tasks, not to other hubs.
- Primary action should be visually obvious and singular where possible.
- Gated/planned/blocked state should be compact status metadata, not long explanatory body copy.
- Existing section IDs, transport calls, routes, save paths, and runtime ownership boundaries should stay stable.

## Validation Targets

- Profile reads as status plus next actions, not a duplicate navigation index.
- Integrations reads as setup/edit/inspect workflows, not a flat catalog.
- Advanced reads as diagnostics and no longer competes with Integrations.
- Hooks, Agents, MCP, Data, and Sessions show purpose, scope/status, and next action above dense detail.
- Browser and Electron receipts confirm no clipping, inaccessible actions, or unreadable text at the current app size.
