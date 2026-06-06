export type SessionModelSource = 'session-start' | 'transcript-metadata' | 'default-at-start'

export type SessionModelIdentityInput = {
  model?: string
  transcriptModel?: string
}

export type SessionModelIdentity = {
  label: string
  source: SessionModelSource
  commandValue?: string
}

export function resolveSessionModelIdentity(input: SessionModelIdentityInput): SessionModelIdentity {
  const model = normalizeModel(input.model)
  if (model) {
    return {
      label: model,
      source: 'session-start',
      commandValue: model
    }
  }

  const transcriptModel = normalizeModel(input.transcriptModel)
  if (transcriptModel) {
    return {
      label: transcriptModel,
      source: 'transcript-metadata',
      commandValue: transcriptModel
    }
  }

  return {
    label: 'Default at start',
    source: 'default-at-start'
  }
}

export function sessionModelLabel(input: SessionModelIdentityInput): string {
  return resolveSessionModelIdentity(input).label
}

function normalizeModel(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}
