export type ModelRoutingTaskId = 'compaction' | 'title-generation' | 'background-work'

export type ModelRoutingTaskPreview = {
  id: ModelRoutingTaskId
  label: string
  command: '/configure-models'
  currentAssignment: 'Command Code-owned'
  applyEffect: 'Opens Command Code helper'
  status: 'preview-only'
}

const TASKS: Array<{ id: ModelRoutingTaskId; label: string }> = [
  { id: 'compaction', label: 'Compaction' },
  { id: 'title-generation', label: 'Title generation' },
  { id: 'background-work', label: 'Background work' }
]

export function modelRoutingCommand(): '/configure-models' {
  return '/configure-models'
}

export function modelRoutingTaskPreviews(): ModelRoutingTaskPreview[] {
  return TASKS.map((task) => ({
    id: task.id,
    label: task.label,
    command: modelRoutingCommand(),
    currentAssignment: 'Command Code-owned',
    applyEffect: 'Opens Command Code helper',
    status: 'preview-only'
  }))
}
