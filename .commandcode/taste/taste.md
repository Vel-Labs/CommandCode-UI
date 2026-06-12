# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# workflow
- Mark completed tasks with ✅ emoji inside brackets, e.g. [✅]. Confidence: 0.70
- App should check for available Command Code updates on startup and surface an update indicator in the sidebar. Confidence: 0.70

# ux
See [ux/taste.md](ux/taste.md)

# security
- Never display auth tokens directly in the UI — mask, truncate, or use a copy-to-clipboard pattern instead. Confidence: 0.75

# ui-architecture
- Terminal should be a secondary tool accessible from the top-right corner, not the primary interaction surface — users type into chat, and terminal work is presented as output rather than requiring direct terminal input. The top-right terminal button opens a fresh terminal for that repo so users can run commands like `npm run dev`. Confidence: 0.75
- Left sidebar items should be collapsible, showing only a few recent chats with a "show more" option to reveal the rest. Label sessions as "Active Sessions" instead of "Sessions". Confidence: 0.65
- Both left and right sidebars should be resizable; shrinking them far enough should collapse them. Confidence: 0.70
- Files, browser previews, transcripts, and docs should open in a persistent right inspector panel, not in modal overlays. Confidence: 0.70

# persistence
- User preferences, recent projects, and favorite models should be persisted to the .commandcode folder so settings survive app restarts. Confidence: 0.75
- The app should hydrate its session list and project context from existing .commandcode data when available. Confidence: 0.75

# chat-ui
- Chat message bubbles should have distinct background colors for user vs assistant, with semi-transparent backgrounds. Colors should follow the settings color profile but remain manually customizable. Confidence: 0.70
- Repeated PTY status lines with cycling symbols and incrementing timers (e.g., Organizing, Working, Crafting, Hocuspocusing) should be collapsed into a single aggregated status row with cumulative activity info, not rendered as individual lines that spam the chat view. Confidence: 0.75

# git
- After each coherent/validated package: verify (typecheck/tests/build/smoke), then git commit before continuing to the next package. Run git diff --check before each commit and stage only files belonging to the package. Push after completing a phase or runtime/security boundary package. Confidence: 0.80

# settings
- Settings content panes must be properly scrollable with content fitting the visible viewport — the right pane should use min-height: 0, height: 100%, and overflow-y: auto so users can see all content at their chosen window size. Confidence: 0.70

# tooling
- Playwright should be installed globally at the workspace level (e.g., /Users/steven/Workspace) for cross-project accessibility, not per-project. Confidence: 0.70
