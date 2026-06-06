const ANSI_PATTERN = /\x1b\[[0-9;?]*[ -/]*[@-~]/g

export function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, '')
}

export function looksLikeCliSelectionPrompt(input: string): boolean {
  const text = stripAnsi(input)
  const hasNumberedChoices = /(?:^|\n|\r)\s*(?:❯\s*)?1\.\s+\S[\s\S]*(?:^|\n|\r)\s*2\.\s+\S/m.test(text)
  if (!hasNumberedChoices) return false

  return /Command Code needs to|Execute Shell Command|needs permission|allow all edits|tell Command Code what to do differently|choose|select|confirm/i.test(text)
}
