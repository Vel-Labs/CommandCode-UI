import type { CommandPaletteItem } from '../appTypes'

export type CommandExecutionIntent = 'send-active-session' | 'insert-composer' | 'headless-run'
export type CommandPreviewBadge = 'runtime' | 'active-session' | 'composer' | 'plan-mode' | 'command-code-owned'

export type CommandExecutionPreview = {
  intent: CommandExecutionIntent
  summary: string
  badges: CommandPreviewBadge[]
}

export function getCommandExecutionPreview(
  item: CommandPaletteItem,
  options: { hasActiveSession: boolean }
): CommandExecutionPreview {
  if (item.action === 'run-headless') {
    return {
      intent: 'headless-run',
      summary: 'Runs the visible composer prompt once through the headless Command Code path.',
      badges: ['runtime']
    }
  }

  const badges = getCommandBadges(item, options.hasActiveSession)

  if (options.hasActiveSession) {
    return {
      intent: 'send-active-session',
      summary: 'Sends this visible slash command to the active Command Code session.',
      badges
    }
  }

  return {
    intent: 'insert-composer',
    summary: 'Inserts this slash command into the composer until a session is active.',
    badges
  }
}

function getCommandBadges(item: CommandPaletteItem, hasActiveSession: boolean): CommandPreviewBadge[] {
  const badges: CommandPreviewBadge[] = [hasActiveSession ? 'active-session' : 'composer']

  if (item.id === 'plan') {
    badges.push('plan-mode')
  }

  if (item.id === 'configure-models' || item.id === 'model') {
    badges.push('command-code-owned')
  }

  return badges
}
