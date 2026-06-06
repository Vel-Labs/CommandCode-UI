const ENTER = '\r'

export function buildPtySubmitChunks(input: string): string[] {
  const prompt = input.trim()
  if (!prompt) return [ENTER]

  const normalized = prompt.replace(/\r\n?/g, '\n')
  return [...normalized, ENTER]
}
