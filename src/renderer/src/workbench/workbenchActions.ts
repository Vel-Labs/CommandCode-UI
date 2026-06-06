export type WorkbenchActionCategory = 'files' | 'ide' | 'git' | 'terminal' | 'theme' | 'release'

export type WorkbenchActionStatus = 'implemented-read-only' | 'gated-preview-only' | 'blocked'

export type WorkbenchAction = {
  id: string
  category: WorkbenchActionCategory
  title: string
  status: WorkbenchActionStatus
  summary: string
  gate: string
  requiredProof: string[]
}

export const workbenchActions: WorkbenchAction[] = [
  {
    id: 'file-browse-preview',
    category: 'files',
    title: 'Project file browsing',
    status: 'implemented-read-only',
    summary: 'Existing scoped file browser and transcript artifact preview paths remain read-only from the workbench.',
    gate: 'Existing scoped file preview policy',
    requiredProof: ['approved project root', 'bounded file preview', 'outside-root rejection']
  },
  {
    id: 'file-create-rename-delete',
    category: 'files',
    title: 'File create, rename, delete',
    status: 'blocked',
    summary: 'Workbench file mutations require exact target paths, affected-file counts, confirmation, and path-policy tests.',
    gate: 'docs/reports/WORKBENCH_POLISH_GATE.md#required-before-file-actions',
    requiredProof: ['target path', 'project root', 'confirmation', 'post-action validation', 'symlink and outside-root rejection']
  },
  {
    id: 'ide-open-configure',
    category: 'ide',
    title: 'IDE launch and configuration',
    status: 'blocked',
    summary: 'Opening or configuring external IDE integrations needs an explicit command/target preview and failure-tolerant diagnostics.',
    gate: 'docs/reports/WORKBENCH_POLISH_GATE.md#required-before-ide-actions',
    requiredProof: ['integration target', 'project path', 'external-app disclosure', 'no broad renderer shell capability']
  },
  {
    id: 'git-mutations',
    category: 'git',
    title: 'Git branch, diff, and mutation actions',
    status: 'blocked',
    summary: 'Git actions that mutate refs, index, working tree, or remotes require isolated-repo tests and confirmation.',
    gate: 'docs/reports/WORKBENCH_POLISH_GATE.md#required-before-git-actions',
    requiredProof: ['repository path', 'exact git operation', 'dirty-state summary', 'confirmation', 'isolated repo tests']
  },
  {
    id: 'terminal-tabs-profiles',
    category: 'terminal',
    title: 'Terminal tabs, profiles, and history',
    status: 'blocked',
    summary: 'Terminal lifecycle/profile work is gated because it can affect PTY ownership, shell selection, and persisted terminal state.',
    gate: 'docs/reports/WORKBENCH_POLISH_GATE.md#blocked-actions',
    requiredProof: ['PTY lifecycle contract', 'profile destination', 'shell selection boundary', 'smoke:pty receipt']
  },
  {
    id: 'theme-token-controls',
    category: 'theme',
    title: 'Editable theme token controls',
    status: 'gated-preview-only',
    summary: 'Theme controls must stay token-based and show GUI preference destinations before any save path is added.',
    gate: 'docs/reports/WORKBENCH_POLISH_GATE.md#required-before-theme-token-controls',
    requiredProof: ['preference destination', 'token name', 'default value', 'sanitization tests', 'contrast and reduced-motion impact']
  },
  {
    id: 'release-fetching',
    category: 'release',
    title: 'Release-note fetching and update behavior',
    status: 'blocked',
    summary: 'Release fetching remains gated until network/update behavior, dismissal persistence, and failure handling are explicit.',
    gate: 'docs/reports/WORKBENCH_POLISH_GATE.md#blocked-actions',
    requiredProof: ['network behavior', 'update transport boundary', 'dismissal persistence', 'failure-tolerant receipt']
  }
]

export function workbenchActionsByCategory(actions: WorkbenchAction[] = workbenchActions): Record<WorkbenchActionCategory, WorkbenchAction[]> {
  return actions.reduce<Record<WorkbenchActionCategory, WorkbenchAction[]>>((groups, action) => {
    groups[action.category].push(action)
    return groups
  }, {
    files: [],
    ide: [],
    git: [],
    terminal: [],
    theme: [],
    release: []
  })
}

export function gatedWorkbenchActions(actions: WorkbenchAction[] = workbenchActions): WorkbenchAction[] {
  return actions.filter((action) => action.status !== 'implemented-read-only')
}
