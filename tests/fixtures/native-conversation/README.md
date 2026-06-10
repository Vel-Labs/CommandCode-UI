# Native Conversation Fixture Corpus

These fixtures are sanitized Command Code JSONL transcript rows from the three-session dogfood regression inventory. They preserve the observed row shape without copying full private transcript output.

The native conversation projector must treat these JSONL rows as structured conversation truth. Assistant prose can only come from `role: "assistant"` rows with `content[].type: "text"`.
