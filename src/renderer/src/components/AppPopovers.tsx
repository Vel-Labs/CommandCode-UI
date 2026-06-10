import { useEffect, useMemo, useState } from 'react'
import type { JSX, RefObject } from 'react'
import { Folder, FolderOpen } from 'lucide-react'
import type { PermissionMode } from '../../../shared/types'
import type { PtyDoctorResult } from '../../../core/ptyDoctor'
import type { TransportAPI } from '../../../core/transport'
import type { CommandPaletteItem, PopoverKey, RuntimeMode, SettingsSection } from '../appTypes'
import type { HeadlessJob } from './HeadlessHistory'
import { AuthCard } from './AuthCard'
import { HeadlessHistory } from './HeadlessHistory'
import { IdePanel } from './IdePanel'
import { ModelDropdown } from './ModelDropdown'
import { getCommandExecutionPreview } from '../commandPalette/commandPreview'
import { commandPaletteDocs } from '../commandPalette/docs'
import { searchCommandPalette } from '../commandPalette/search'
import type { WorkflowRecipe } from '../commandPalette/workflowRecipes'
import { workflowRecipes } from '../commandPalette/workflowRecipes'
import { settingsRegistry } from '../settings/settingsRegistry'

export function AppPopovers({
  popoverRef,
  openPopover,
  recentProjects,
  runtimeMode,
  ptyHealth,
  commandExecutable,
  cwd,
  transport,
  skipOnboarding,
  headlessYolo,
  headlessMaxTurns,
  model,
  permissionMode,
  trust,
  headlessJobs,
  commandGroups,
  commandPaletteItems,
  hasActiveSession,
  openSettingsSection,
  chooseProject,
  setCwd,
  setOpenPopover,
  setRuntimeMode,
  setCommandExecutable,
  runCheck,
  openDocs,
  setSkipOnboarding,
  setHeadlessYolo,
  setHeadlessMaxTurns,
  setModel,
  openConfigureModels,
  setPermissionMode,
  setTrust,
  clearHeadlessJobs,
  runCommand
}: {
  popoverRef: RefObject<HTMLDivElement | null>
  openPopover: PopoverKey
  recentProjects: string[]
  runtimeMode: RuntimeMode
  ptyHealth: PtyDoctorResult | null
  commandExecutable: string
  cwd: string
  transport: TransportAPI
  skipOnboarding: boolean
  headlessYolo: boolean
  headlessMaxTurns: number
  model: string
  permissionMode: PermissionMode
  trust: boolean
  headlessJobs: HeadlessJob[]
  commandGroups: CommandPaletteItem['group'][]
  commandPaletteItems: CommandPaletteItem[]
  hasActiveSession: boolean
  openSettingsSection: (section: SettingsSection) => void
  chooseProject: () => Promise<void>
  setCwd: (project: string) => void
  setOpenPopover: (value: PopoverKey) => void
  setRuntimeMode: (mode: RuntimeMode) => void
  setCommandExecutable: (value: string) => void
  runCheck: () => Promise<void>
  openDocs: () => void
  setSkipOnboarding: (value: boolean) => void
  setHeadlessYolo: (value: boolean) => void
  setHeadlessMaxTurns: (value: number) => void
  setModel: (value: string) => void
  openConfigureModels: () => Promise<void>
  setPermissionMode: (value: PermissionMode) => void
  setTrust: (value: boolean) => void
  clearHeadlessJobs: () => void
  runCommand: (item: CommandPaletteItem) => Promise<void>
}): JSX.Element | null {
  const [paletteQuery, setPaletteQuery] = useState('')
  const [serverPathDraft, setServerPathDraft] = useState(cwd)
  const [serverPathError, setServerPathError] = useState('')
  const [serverPathValidating, setServerPathValidating] = useState(false)
  const paletteResults = useMemo(
    () => searchCommandPalette(commandPaletteItems, workflowRecipes, paletteQuery, settingsRegistry, recentProjects, commandPaletteDocs),
    [commandPaletteItems, paletteQuery, recentProjects]
  )
  const visibleCommands = paletteResults.filter((result) => result.kind === 'command')
  const visibleRecipes = paletteResults.filter((result) => result.kind === 'recipe')
  const visibleSettings = paletteResults.filter((result) => result.kind === 'settings')
  const visibleProjects = paletteResults.filter((result) => result.kind === 'project')
  const visibleDocs = paletteResults.filter((result) => result.kind === 'docs')
  const browserProjectPicker = !transport.supportsNativeDirectoryPicker

  useEffect(() => {
    if (openPopover === 'project') {
      setServerPathDraft(cwd)
      setServerPathError('')
    }
  }, [cwd, openPopover])

  async function applyServerPath(): Promise<void> {
    const nextPath = serverPathDraft.trim()
    if (!nextPath) {
      setServerPathError('Enter a path on the machine running ccgui serve.')
      return
    }

    setServerPathValidating(true)
    setServerPathError('')
    try {
      const result = await transport.listFiles(nextPath, nextPath)
      if (result.error) {
        setServerPathError(result.error)
        return
      }
      setCwd(nextPath)
      setOpenPopover(null)
    } catch (err) {
      setServerPathError(err instanceof Error ? err.message : 'Project path validation failed')
    } finally {
      setServerPathValidating(false)
    }
  }

  return (
    <>
      {openPopover === 'project' && (
        <div ref={popoverRef} className="native-popover project-popover">
          <div className="popover-title">Project</div>
          {browserProjectPicker ? (
            <div className="server-path-picker">
              <label className="field-label">Server-side project path</label>
              <input
                className="native-input"
                value={serverPathDraft}
                onChange={(event) => setServerPathDraft(event.target.value)}
                placeholder="/home/user/project"
                aria-label="Server-side project path"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void applyServerPath()
                }}
              />
              <p className="popover-help">Use a path on the machine running `ccgui serve`. In WSL, enter the Linux path, not the Windows browser path.</p>
              {serverPathError && <div className="popover-error">{serverPathError}</div>}
              <button className="popover-row" onClick={() => void applyServerPath()} disabled={serverPathValidating}>
                <FolderOpen size={16} /> {serverPathValidating ? 'Validating...' : 'Set server-side project path'}
              </button>
            </div>
          ) : (
            <button className="popover-row" onClick={() => void chooseProject()}><FolderOpen size={16} /> Choose folder...</button>
          )}
          {recentProjects.map((project) => (
            <button key={project} className="popover-row" onClick={() => { setCwd(project); setOpenPopover(null) }} title={project}>
              <Folder size={16} /> {displayPath(project)}
            </button>
          ))}
        </div>
      )}

      {openPopover === 'permission' && (
        <div ref={popoverRef} className="native-popover permission-popover">
          <div className="popover-title">Access</div>
          <button className={`popover-row ${permissionMode === 'standard' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(false); setOpenPopover(null) }}>
            Standard
            <span className="popover-row-description">Prompt before risky tool use.</span>
          </button>
          <button className={`popover-row popover-row--warn ${permissionMode === 'auto-accept' && !trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('auto-accept'); setTrust(false); setOpenPopover(null) }}>
            Full access
            <span className="popover-row-description">Auto-accept Command Code tool prompts.</span>
          </button>
          <button className={`popover-row popover-row--warn ${trust ? 'popover-row--active' : ''}`} onClick={() => { setPermissionMode('standard'); setTrust(true); setOpenPopover(null) }}>
            Trust project
            <span className="popover-row-description">Pass --trust for this project.</span>
          </button>
        </div>
      )}

      {openPopover === 'runtime' && (
        <div ref={popoverRef} className="native-popover runtime-popover">
          <div className="popover-title">Runtime</div>
          <label className="field-label">Command binary</label>
          <input className="native-input" value={commandExecutable} onChange={(event) => setCommandExecutable(event.target.value)} />
          <div className="runtime-grid">
            <button className="ghost-button native-ghost" onClick={() => void runCheck()}>Check CLI</button>
            <button className="ghost-button native-ghost" onClick={() => transport.openExternal('https://commandcode.ai/docs/reference/cli')}>CLI docs</button>
            <button className="ghost-button native-ghost" onClick={openDocs}>Docs</button>
          </div>
          <label className="checkbox-row"><input type="checkbox" checked={skipOnboarding} onChange={(event) => setSkipOnboarding(event.target.checked)} /> Skip onboarding</label>
          <label className="checkbox-row"><input type="checkbox" checked={runtimeMode === 'mock'} onChange={(event) => setRuntimeMode(event.target.checked ? 'mock' : 'real-session')} disabled={!ptyHealth?.healthy && runtimeMode === 'mock'} /> Use Demo mode</label>
          <label className="checkbox-row"><input type="checkbox" checked={headlessYolo} onChange={(event) => setHeadlessYolo(event.target.checked)} /> Allow write tools in headless commands</label>
          <label className="field-label">Headless max turns</label>
          <input className="native-input" type="number" min={1} max={100} value={headlessMaxTurns} onChange={(event) => setHeadlessMaxTurns(Number(event.target.value) || 1)} />
          <ModelDropdown transport={transport} model={model} setModel={setModel} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
          <AuthCard transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
          <IdePanel transport={transport} commandExecutable={commandExecutable} cwd={cwd} />
          <HeadlessHistory jobs={headlessJobs} onClear={clearHeadlessJobs} />
        </div>
      )}

      {openPopover === 'model' && (
        <div ref={popoverRef} className="native-popover model-popover">
          <div className="popover-title">Model</div>
          <ModelDropdown transport={transport} model={model} setModel={(value) => { setModel(value); setOpenPopover(null) }} commandExecutable={commandExecutable} cwd={cwd} onConfigureModels={openConfigureModels} />
        </div>
      )}

      {openPopover === 'slash' && (
        <div ref={popoverRef} className="native-popover slash-popover">
          <div className="popover-title">Commands</div>
          <input
            className="native-input command-palette-search"
            value={paletteQuery}
            onChange={(event) => setPaletteQuery(event.target.value)}
            placeholder="Search commands and workflows"
            aria-label="Search commands and workflows"
          />
          {commandGroups.map((group) => (
            <div key={group} className="command-group">
              <div className="command-group-title">{group}</div>
              {visibleCommands.filter((result) => result.item.group === group).map((result) => (
                <CommandPaletteButton
                  key={result.item.id}
                  item={result.item}
                  hasActiveSession={hasActiveSession}
                  runCommand={runCommand}
                />
              ))}
            </div>
          ))}
          {visibleRecipes.length > 0 && (
            <div className="command-group command-group--recipes">
              <div className="command-group-title">Workflow recipes</div>
              {visibleRecipes.map((result) => (
                <WorkflowRecipeRow key={result.item.id} recipe={result.item} openSettingsSection={openSettingsSection} />
              ))}
            </div>
          )}
          {visibleSettings.length > 0 && (
            <div className="command-group command-group--settings">
              <div className="command-group-title">Settings</div>
              {visibleSettings.map((result) => (
                <button
                  key={result.item.id}
                  className="popover-row command-row command-row--actionable"
                  onClick={() => openSettingsSection(result.item.id)}
                >
                  <span className="command-row-main">
                    <strong>{result.item.label}</strong>
                    <code>Settings</code>
                  </span>
                  <span className="popover-row-description">{result.item.description}</span>
                </button>
              ))}
            </div>
          )}
          {visibleProjects.length > 0 && (
            <div className="command-group command-group--projects">
              <div className="command-group-title">Recent projects</div>
              {visibleProjects.map((result) => (
                <button
                  key={result.item.path}
                  className="popover-row command-row command-row--actionable"
                  onClick={() => { setCwd(result.item.path); setOpenPopover(null) }}
                  title={result.item.path}
                >
                  <span className="command-row-main">
                    <strong>{result.item.label}</strong>
                    <code>Project</code>
                  </span>
                  <span className="popover-row-description">{result.item.path}</span>
                </button>
              ))}
            </div>
          )}
          {visibleDocs.length > 0 && (
            <div className="command-group command-group--docs">
              <div className="command-group-title">Docs</div>
              {visibleDocs.map((result) => (
                <button
                  key={result.item.id}
                  className="popover-row command-row command-row--actionable"
                  onClick={() => { openDocs(); setOpenPopover(null) }}
                >
                  <span className="command-row-main">
                    <strong>{result.item.title}</strong>
                    <code>Docs</code>
                  </span>
                  <span className="popover-row-description">{result.item.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function WorkflowRecipeRow({
  recipe,
  openSettingsSection
}: {
  recipe: WorkflowRecipe
  openSettingsSection: (section: SettingsSection) => void
}): JSX.Element {
  const content = (
    <>
      <span className="command-row-main">
        <strong>{recipe.title}</strong>
        <code>{recipe.command ?? recipe.intent}</code>
      </span>
      <span className="popover-row-description">{recipe.description}</span>
      <span className="command-recipe-preview">{recipe.preview}</span>
      <span className="command-preview-badges">
        <span className="command-preview-badge command-preview-badge--intent">{recipe.intent}</span>
        <span className={`command-recipe-risk command-recipe-risk--${recipe.risk}`}>{recipe.risk}</span>
      </span>
    </>
  )

  if (recipe.intent === 'open-settings' && recipe.settingsSection) {
    return (
      <button
        className="popover-row command-row command-row--recipe command-row--actionable"
        onClick={() => openSettingsSection(recipe.settingsSection as SettingsSection)}
      >
        {content}
      </button>
    )
  }

  return <div className="popover-row command-row command-row--recipe">{content}</div>
}

function CommandPaletteButton({
  item,
  hasActiveSession,
  runCommand
}: {
  item: CommandPaletteItem
  hasActiveSession: boolean
  runCommand: (item: CommandPaletteItem) => Promise<void>
}): JSX.Element {
  const preview = getCommandExecutionPreview(item, { hasActiveSession })

  return (
    <button className="popover-row command-row" onClick={() => void runCommand(item)}>
      <span className="command-row-main">
        <strong>{item.label}</strong>
        <code>{item.command}</code>
      </span>
      <span className="popover-row-description">{item.description}</span>
      <span className="command-preview-summary">{preview.summary}</span>
      <span className="command-preview-badges" aria-label={`Command behavior: ${preview.intent}`}>
        <span className="command-preview-badge command-preview-badge--intent">{preview.intent}</span>
        {preview.badges.map((badge) => (
          <span key={badge} className={`command-preview-badge command-preview-badge--${badge}`}>
            {badge}
          </span>
        ))}
      </span>
    </button>
  )
}

function displayPath(input: string): string {
  if (!input.trim()) return 'No project selected'
  const parts = input.split('/').filter(Boolean)
  return parts.at(-1) || input
}
