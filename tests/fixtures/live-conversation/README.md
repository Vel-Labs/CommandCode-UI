# Live Conversation Fixture Corpus

These fixtures are sanitized Command Code terminal recordings and minimized TUI excerpts for parser coverage. Project paths, prompts, and command names may be shortened, but each file preserves the terminal state shape the renderer parser must handle.

The corpus intentionally keeps terminal state as presentation input only. Tests assert broad event classification and key labels; the GUI must not treat these recordings as structured execution truth.
