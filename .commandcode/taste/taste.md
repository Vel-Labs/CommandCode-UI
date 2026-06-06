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
