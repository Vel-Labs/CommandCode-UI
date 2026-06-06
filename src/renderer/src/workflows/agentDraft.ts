export type AgentTemplateId = 'reviewer' | 'implementer' | 'researcher'

export type AgentTemplate = {
  id: AgentTemplateId
  label: string
  description: string
  systemPrompt: string
}

export type AgentDraftPreviewInput = {
  templateId: AgentTemplateId
  name: string
  description?: string
  cwd?: string
}

export type AgentDraftPreview = {
  name: string
  slug: string
  scope: 'project'
  destination?: string
  content: string
  canWrite: false
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: 'reviewer',
    label: 'Reviewer',
    description: 'Inspect changes and surface risks, missing tests, and behavioral regressions.',
    systemPrompt: 'Review the current change for bugs, regressions, missing tests, and unclear ownership. Lead with findings and cite files.'
  },
  {
    id: 'implementer',
    label: 'Implementer',
    description: 'Make scoped code changes from an existing plan or issue.',
    systemPrompt: 'Implement the requested scoped change using existing project patterns. Verify with focused tests and report exact receipts.'
  },
  {
    id: 'researcher',
    label: 'Researcher',
    description: 'Inspect docs, code, and evidence before recommending implementation steps.',
    systemPrompt: 'Gather repo-grounded evidence, separate confirmed facts from assumptions, and recommend the next implementation step.'
  }
]

export function buildAgentDraftPreview(input: AgentDraftPreviewInput): AgentDraftPreview {
  const template = agentTemplates.find((candidate) => candidate.id === input.templateId) ?? agentTemplates[0]!
  const name = normalize(input.name) || template.label
  const description = normalize(input.description) || template.description
  const slug = slugify(name)
  const cwd = normalize(input.cwd)

  return {
    name,
    slug,
    scope: 'project',
    destination: cwd ? `${cwd}/.commandcode/agents/${slug}.md` : undefined,
    content: [
      '---',
      `description: ${description}`,
      `system_prompt: ${template.systemPrompt}`,
      '---',
      '',
      template.systemPrompt,
      ''
    ].join('\n'),
    canWrite: false
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'agent'
}

function normalize(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}
