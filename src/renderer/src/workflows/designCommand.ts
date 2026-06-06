export const designModes = [
  'surface',
  'redesign',
  'setup',
  'tokenize',
  'review',
  'checkup',
  'smell',
  'finish',
  'voice',
  'refine',
  'typeset',
  'recolor',
  'relayout',
  'motion',
  'responsive',
  'interaction'
] as const

export type DesignMode = typeof designModes[number]

export type DesignHelperContext = {
  goal?: string
  selectedElement?: string
  screenshotPath?: string
  annotationSummary?: string
  voiceTranscript?: string
}

export type DesignCommandPreviewInput = {
  mode: DesignMode
  target?: string
  context?: DesignHelperContext
}

export type DesignCommandPreview = {
  command: string
  mode: DesignMode
  target?: string
  context: DesignHelperContext
  contextIncludedInCommand: false
}

export function buildDesignCommandPreview(input: DesignCommandPreviewInput): DesignCommandPreview {
  const mode = input.mode
  const target = normalizeOptional(input.target)
  const command = ['/design', mode, target ? shellToken(target) : undefined].filter(Boolean).join(' ')

  return {
    command,
    mode,
    target,
    context: normalizeContext(input.context),
    contextIncludedInCommand: false
  }
}

function normalizeContext(context: DesignHelperContext = {}): DesignHelperContext {
  return {
    goal: normalizeOptional(context.goal),
    selectedElement: normalizeOptional(context.selectedElement),
    screenshotPath: normalizeOptional(context.screenshotPath),
    annotationSummary: normalizeOptional(context.annotationSummary),
    voiceTranscript: normalizeOptional(context.voiceTranscript)
  }
}

function normalizeOptional(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function shellToken(value: string): string {
  if (/^[a-zA-Z0-9_./:@-]+$/.test(value)) return value
  return JSON.stringify(value)
}
