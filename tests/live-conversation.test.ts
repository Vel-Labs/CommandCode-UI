import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { compactPtyDiagnosticTranscript, conversationReadinessFromEvents, mergeLiveConversationTurnHistory, parseLiveConversation, stripTerminalControl } from '../src/renderer/src/services/liveConversation'

function liveConversationFixture(name: string): string {
  return readFileSync(new URL(`./fixtures/live-conversation/${name}.txt`, import.meta.url), 'utf8')
}

describe('parseLiveConversation', () => {
  it('renders user and assistant events without terminal chrome', () => {
    const parsed = parseLiveConversation([
      '\u001b[35mCommand Code v0.33.0\u001b[0m',
      'models: nemotron-3-ultra · taste-1',
      '~/Workspace/40_Code/projects/command-code-gui',
      '> test',
      '* Thought for 1 second [ctrl+o to expand]',
      'Hey! I am ready. What do you need help with?',
      '> Ask your question...',
      '? for shortcuts                  [ctrl+t] continuous learning TASTE'
    ].join('\n'), 'test')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'test' },
      {
        id: 'thinking-live',
        kind: 'thinking',
        text: 'Thought for 1 second',
        detail: ['Thought for 1 second']
      },
      { id: 'assistant-live', kind: 'assistant_message', text: 'Hey! I am ready. What do you need help with?' }
    ])
  })

  it('falls back to a session event when only shell framing has arrived', () => {
    expect(parseLiveConversation('attaching session abc\nCommand Code GUI mock session\ncwd: /repo\nbinary: cmd')).toEqual([
      { id: 'session-live', kind: 'session_event', text: 'Waiting for a prompt.' }
    ])
  })

  it('does not render mock echo framing as assistant content', () => {
    const parsed = parseLiveConversation([
      '> hello',
      'received: hello',
      'Mock agent: I would send this prompt to Command Code in a real session.'
    ].join('\n'), 'hello')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'hello' },
      { id: 'assistant-live', kind: 'assistant_message', text: 'Mock agent: I would send this prompt to Command Code in a real session.' }
    ])
  })

  it('treats mock received framing as a prompt echo for the current turn', () => {
    const parsed = parseLiveConversation([
      'received: hello',
      'Mock agent: I would send this prompt to Command Code in a real session.'
    ].join('\n'), 'hello')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'hello' },
      { id: 'assistant-live', kind: 'assistant_message', text: 'Mock agent: I would send this prompt to Command Code in a real session.' }
    ])
  })

  it('turns real TUI output into native user and assistant events', () => {
    const parsed = parseLiveConversation([
      '# Command Code v0.33.0',
      '# models: nemotron-3-ultra · taste-1',
      '# ~/Workspace/40_Code/projects/command-code-gui',
      '> test',
      '* Thought for 1 second [ctrl+o to expand]',
      "Hey! I'm ready. What do you need help with?",
      '> Ask your question...',
      '? for shortcuts                                      [ctrl+t] continuous learning TASTE'
    ].join('\n'), 'test')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'test' },
      {
        id: 'thinking-live',
        kind: 'thinking',
        text: 'Thought for 1 second',
        detail: ['Thought for 1 second']
      },
      { id: 'assistant-live', kind: 'assistant_message', text: "Hey! I'm ready. What do you need help with?" }
    ])
  })

  it('collapses organizing counters and filters the Command Code banner', () => {
    const parsed = parseLiveConversation([
      '> test',
      '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',
      '░░░███████░███████░███████████░███████████░███████░████████░░░░████░░░',
      '────────────────────────────────────────────────────────────',
      '· Organizing… esc to interrupt • 0s • ↓ 0',
      '○ Organizing… esc to interrupt • 1s • ↓ 0',
      '◇ Organizing… esc to interrupt • 3s • ↓ 2',
      '✻ Thinking… (1 line) [ctrl+o to expand]',
      '✻ Thought for 1 second [ctrl+o to expand]',
      "⠶ I'm here and ready. What would you like to work on?"
    ].join('\n'), 'test')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'test' },
      {
        id: 'thinking-live',
        kind: 'thinking',
        text: 'Thought for 1 second',
        detail: [
          'Thinking... (1 line) [ctrl+o to expand]',
          'Thought for 1 second'
        ]
      },
      { id: 'assistant-live', kind: 'assistant_message', text: "I'm here and ready. What would you like to work on?" }
    ])
  })

  it('collapses generic spinner progress counters into one working event', () => {
    const parsed = parseLiveConversation([
      '> test',
      '· Inspecting… esc to interrupt • 0s • ↓ 0',
      '○ Inspecting… esc to interrupt • 0s • ↓ 0',
      '◇ Inspecting… esc to interrupt • 1s • ↓ 0',
      '☆ Inspecting… esc to interrupt • 2s • ↓ 0',
      '✧ Inspecting… esc to interrupt • 2s • ↓ 1',
      '⌘ Inspecting… esc to interrupt • 2s • ↓ 3'
    ].join('\n'), 'test')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'test' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Inspecting',
        detail: ['Inspecting... esc to interrupt • 2s • ↓ 3']
      }
    ])
  })

  it('collapses working and crafting counters with abbreviated output counts', () => {
    const parsed = parseLiveConversation([
      '> can you explain this project',
      '○ Working… esc to interrupt • 13s • ↓ 4.2k',
      '◇ Working… esc to interrupt • 13s • ↓ 4.2k',
      '☆ Working… esc to interrupt • 13s • ↓ 4.2k',
      '✧ Working… esc to interrupt • 13s • ↓ 4.3k',
      '☆ Crafting… esc to interrupt • 14s • ↓ 4.3k',
      '◇ Crafting… esc to interrupt • 15s • ↓ 4.4k',
      '○ Crafting… esc to interrupt • 20s • ↓ 4.8k',
      'This is a desktop GUI wrapper around the Command Code CLI.'
    ].join('\n'), 'can you explain this project')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'can you explain this project' },
      { id: 'assistant-live', kind: 'assistant_message', text: 'This is a desktop GUI wrapper around the Command Code CLI.' }
    ])
  })

  it('hides transient progress after assistant output arrives', () => {
    const parsed = parseLiveConversation([
      '> summarize',
      '◇ Synthesizing… esc to interrupt • 42s • ↓ 2.1k',
      'The answer is ready.'
    ].join('\n'), 'summarize')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'summarize' },
      { id: 'assistant-live', kind: 'assistant_message', text: 'The answer is ready.' }
    ])
  })

  it('collapses minute-based whimsical progress lines by the esc-to-interrupt marker', () => {
    const parsed = parseLiveConversation([
      '> tell me about this repo',
      '· Hocuspocusing… esc to interrupt • 1m 34s • ↓ 97',
      '☆ Hocuspocusing… esc to interrupt • 1m 34s • ↓ 97',
      '✧ Hocuspocusing… esc to interrupt • 1m 34s • ↓ 97',
      '○ Hocuspocusing… esc to interrupt • 1m 35s • ↓ 97',
      '☆ Conceptualizing… esc to interrupt • 1m 51s • ↓ 3.4k',
      '✧ Conceptualizing… esc to interrupt • 1m 51s • ↓ 3.4k',
      '○ Refining… esc to interrupt • 1m 51s • ↓ 3.4k',
      '· Refining… esc to interrupt • 1m 52s • ↓ 3.4k',
      'Demystifying… esc to interrupt • 1m 53s • ↓ 3.5k',
      '28;204;255mg... esc to interrupt • 25s • ↓ 97'
    ].join('\n'), 'tell me about this repo')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'tell me about this repo' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Demystifying',
        detail: [
          'Hocuspocusing... esc to interrupt • 1m 35s • ↓ 97',
          'Conceptualizing... esc to interrupt • 1m 51s • ↓ 3.4k',
          'Refining... esc to interrupt • 1m 52s • ↓ 3.4k',
          'Demystifying... esc to interrupt • 1m 53s • ↓ 3.5k'
        ]
      }
    ])
  })

  it('does not replay old restored transcript as the fresh turn before the prompt echoes', () => {
    const parsed = parseLiveConversation([
      '> old question',
      '* Thought for 1 second [ctrl+o to expand]',
      'Old answer from the restored session.'
    ].join('\n'), 'new question')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'new question' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Sending to Command Code',
        detail: ['Waiting for the current prompt to appear in the PTY stream.']
      }
    ])
  })

  it('keeps pre-echo progress visible without leaking old assistant text', () => {
    const parsed = parseLiveConversation([
      '> old question',
      'Old answer from the restored session.',
      '○ Resolving… esc to interrupt • 3s • ↓ 18'
    ].join('\n'), 'new question')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'new question' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Resolving',
        detail: ['Resolving... esc to interrupt • 3s • ↓ 18']
      }
    ])
  })

  it('shows assistant output after pre-echo progress when the CLI never echoes the prompt text', () => {
    const parsed = parseLiveConversation([
      '❯ Ask your question...',
      '○ Deciphering… esc to interrupt • 1m 5s • ↓ 2.3k',
      'EXPLORE (Understand this repository)',
      'READ (src/main/index.ts)',
      '⠶ This is Command Code GUI — a native desktop app that wraps the Command Code CLI.',
      '- Composer-first chat',
      '- PTY-backed terminals'
    ].join('\n'), 'what is this project repo about?')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'what is this project repo about?' },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: explore 1, read 1',
        detail: [
          'EXPLORE (Understand this repository)',
          'READ (src/main/index.ts)'
        ]
      },
      {
        id: 'assistant-live',
        kind: 'assistant_message',
        text: 'This is Command Code GUI — a native desktop app that wraps the Command Code CLI.\n- Composer-first chat\n- PTY-backed terminals'
      }
    ])
  })

  it('filters one-character terminal fragments out of assistant chat', () => {
    const parsed = parseLiveConversation([
      '> status',
      'L READ (src/renderer/src/App.tsx)',
      'm'
    ].join('\n'), 'status')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'status' },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: read 1',
        detail: ['READ (src/renderer/src/App.tsx)']
      }
    ])
  })

  it('classifies sub-agent tool rows as activity instead of assistant text', () => {
    const parsed = parseLiveConversation([
      '> explain the project',
      'Pondering… esc to interrupt • 26s [38;2;99;109;',
      '2K EXPLORE (Find what this repository does and its architecture)',
      '⎿ Running (18s | 15.1k tokens)..',
      '⎿ LIST (src/preload)',
      '⎿ LIST (src/shared)',
      '⎿ LIST (src/cli)',
      'EXPLORE (Find what this repository does and its architecture)',
      '⎿ Running (21s | 15.8k tokens)..',
      '⎿ READ (src/main/index.ts)',
      '⎿ LIST (src/renderer/src)',
      '⎿ READ (src/core/types.ts)',
      'This is a desktop GUI wrapper around the Command Code CLI.'
    ].join('\n'), 'explain the project')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'explain the project' },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: explore 1, list 4, read 2',
        detail: [
          'EXPLORE (Find what this repository does and its architecture)',
          'LIST (src/preload)',
          'LIST (src/shared)',
          'LIST (src/cli)',
          'READ (src/main/index.ts)',
          'LIST (src/renderer/src)',
          'READ (src/core/types.ts)'
        ]
      },
      { id: 'assistant-live', kind: 'assistant_message', text: 'This is a desktop GUI wrapper around the Command Code CLI.' }
    ])
  })

  it('keeps completed explore tool summaries out of assistant text', () => {
    const parsed = parseLiveConversation([
      '> explain this repo and what it objectively assists with',
      '* Thought for 1 second [ctrl+o to expand]',
      'EXPLORE [Understand what this repository is, its purpose, architecture, and what it as.]',
      '└ Done (57s | 100.7k tokens)',
      'This is Command Code GUI — an Electron + React desktop adapter.'
    ].join('\n'), 'explain this repo and what it objectively assists with')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'explain this repo and what it objectively assists with' },
      {
        id: 'thinking-live',
        kind: 'thinking',
        text: 'Thought for 1 second',
        detail: ['Thought for 1 second']
      },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: explore 1',
        detail: [
          'EXPLORE [Understand what this repository is, its purpose, architecture, and what it as.]',
          'Done (57s | 100.7k tokens)'
        ]
      },
      { id: 'assistant-live', kind: 'assistant_message', text: 'This is Command Code GUI — an Electron + React desktop adapter.' }
    ])
  })

  it('does not surface transient terminal-required state after progress appears', () => {
    const parsed = parseLiveConversation([
      '> continue',
      'Choose a model',
      'deepseek/deepseek-v4-pro',
      '○ Working… esc to interrupt • 1s • ↓ 1.1k'
    ].join('\n'), 'continue')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'continue' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Working',
        detail: ['Working... esc to interrupt • 1s • ↓ 1.1k']
      }
    ])
  })

  it('collapses repeated running lines and separates activity', () => {
    const parsed = parseLiveConversation([
      '> can you describe the project?',
      '✧ Articulating...',
      '◇ Articulating...',
      '○ Articulating...',
      '⌘ Articulating...',
      'L Running (25s | 6.6k tokens)..',
      'L Running (26s | 6.6k tokens)..',
      'L Running (26s | 6.7k tokens)...',
      'L READ (README.md)',
      'L LIST (command-code-gui)',
      '· Articulating...',
      'L Running (26s | 6.7k tokens).'
    ].join('\n'), 'can you describe the project?')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'can you describe the project?' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Thinking',
        detail: [
          'Articulating...',
          'Running (26s | 6.7k tokens).'
        ]
      },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: read 1, list 1',
        detail: [
          'READ (README.md)',
          'LIST (command-code-gui)'
        ]
      }
    ])
  })

  it('classifies permission prompts as inline approval choices', () => {
    const parsed = parseLiveConversation([
      '> run tests',
      'Execute Shell Command',
      'Command Code needs to execute npm test.',
      '❯ 1. Yes',
      '  2. Yes, allow all edits during this session [shift+tab]',
      '  3. No, and tell Command Code what to do differently'
    ].join('\n'), 'run tests')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'run tests' },
      {
        id: 'approval-live',
        kind: 'approval',
        text: 'Execute Shell Command',
        detail: [
          'Execute Shell Command',
          'Command Code needs to execute npm test.'
        ],
        options: [
          { key: '1', label: 'Yes' },
          { key: '2', label: 'Yes, allow all edits during this session [shift+tab]' },
          { key: '3', label: 'No, and tell Command Code what to do differently' }
        ]
      }
    ])
  })

  it('classifies taste analysis and plan mode prompts as inline actions', () => {
    const parsed = parseLiveConversation([
      '> what can this project do to help command code community?',
      'Structuring… esc to interrupt • 0s • ↓ 0',
      '* Thought for 1 second [ctrl+o to expand]',
      '┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐',
      'Found one session from Codex for this project.',
      'Analyze that session to build your coding taste package?',
      '↑↓ · enter ok · esc skip · n never',
      '└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘',
      '└ Processing…',
      'Enter plan mode for read-only exploration and planning?',
      'Switch to plan mode — explore codebase and create an implementation plan'
    ].join('\n'), 'what can this project do to help command code community?')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'what can this project do to help command code community?' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Structuring',
        detail: [
          'Structuring... esc to interrupt • 0s • ↓ 0',
          'Processing...'
        ]
      },
      {
        id: 'approval-taste-live',
        kind: 'approval',
        text: 'Analyze Codex session?',
        detail: [
          'Found one session from Codex for this project.',
          'Analyze that session to build your coding taste package?'
        ],
        options: [
          { key: 'enter', label: 'Analyze session' },
          { key: 'esc', label: 'Skip' },
          { key: 'n', label: 'Never' }
        ]
      },
      {
        id: 'approval-plan-live',
        kind: 'approval',
        text: 'Enter plan mode?',
        detail: ['Enter plan mode for read-only exploration and planning?'],
        options: [
          { key: 'enter', label: 'Switch to plan mode — explore codebase and create an implementation plan' },
          { key: 'esc', label: 'Stay in standard mode' }
        ]
      }
    ])
  })

  it('renders the titled taste-learning prompt as an approval button card', () => {
    const parsed = parseLiveConversation([
      '> what is this repo about? how does it help me',
      'Build Your Coding Taste',
      'Found one session from Codex for this project.',
      'Analyze that session to build your coding taste package?',
      '↑↓ · enter ok · esc skip · n never'
    ].join('\n'), 'what is this repo about? how does it help me')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'what is this repo about? how does it help me' },
      {
        id: 'approval-taste-live',
        kind: 'approval',
        text: 'Analyze Codex session?',
        detail: [
          'Build Your Coding Taste',
          'Found one session from Codex for this project.',
          'Analyze that session to build your coding taste package?'
        ],
        options: [
          { key: 'enter', label: 'Analyze session' },
          { key: 'esc', label: 'Skip' },
          { key: 'n', label: 'Never' }
        ]
      }
    ])
  })

  it('collapses Codex taste-learning scan output out of assistant chat', () => {
    const parsed = parseLiveConversation([
      '> review production readiness',
      '* Thought for 1 second [ctrl+o to expand]',
      'EXPLORE (Review the project)',
      '⎿ READ (src/main/index.ts)',
      ';131m(package.json)',
      '● Scanning Codex: 390/454 files (0 matched)',
      '● Scanning Codex: 454/454 files (0 matched)',
      '● Codex: 1 sessions',
      '◯ Learning your coding taste',
      'ESC to cancel',
      '⎿ materializing...',
      '█ Organizing your sessions',
      '◉ Learning your coding taste',
      '⎿ synthesizing...',
      '⎿ learned your coding taste',
      '█ Taste Already Learned',
      '█ Learning Complete',
      '⎿ Learned 14 preferences across 10 categories',
      'Command Code automatically uses & updates taste files.'
    ].join('\n'), 'review production readiness')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'review production readiness' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Synthesizing',
        detail: [
          'materializing...',
          'synthesizing...'
        ]
      },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Learned 14 preferences across 10 categories',
        detail: [
          '◯ Learning your coding taste',
          '█ Organizing your sessions',
          '◉ Learning your coding taste',
          'learned your coding taste',
          '█ Taste Already Learned',
          '█ Learning Complete',
          'Learned 14 preferences across 10 categories',
          'Command Code automatically uses & updates taste files.'
        ]
      }
    ])
  })

  it('keeps PTY repaint fragments and thinking vocabulary out of assistant chat', () => {
    const parsed = parseLiveConversation([
      '> what is this project about',
      'READ[1] [README.md, package.json]',
      'READ[2] [README.md, package.json]',
      '──────── EXPLORE (Find what this repository does and give a comprehensive overview of the project)',
      '[38;2;99;109;131m↓ 198',
      '⌘ Hypothesizing… esc to interrupt EXPLORE (Find what this repository does and give a comprehensive overview of the project)',
      '⌘ Hypothesizing… esc to interrupt [38 EXPLORE (Find what this repository does and give a comprehensive overview of the project)',
      '• 1m 3s • ↓ 198'
    ].join('\n'), 'what is this project about')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'what is this project about' },
      {
        id: 'working-live',
        kind: 'working',
        text: 'Hypothesizing',
        detail: ['Hypothesizing...']
      },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: read 1, explore 1',
        detail: [
          'READ [README.md, package.json]',
          'EXPLORE (Find what this repository does and give a comprehensive overview of the project)'
        ]
      }
    ])
  })

  it('filters isolated token-count tail fragments out of assistant chat', () => {
    const parsed = parseLiveConversation([
      '> what is this repo about',
      'READ[1] [README.md, package.json]',
      'READ[2] [README.md, package.json]',
      '• ↓ 91',
      'tokens).',
      ')'
    ].join('\n'), 'what is this repo about')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'what is this repo about' },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: read 1',
        detail: ['READ [README.md, package.json]']
      }
    ])
  })

  it('promotes write activity into a file reference event', () => {
    const parsed = parseLiveConversation([
      '> edit parser',
      'L WRITE (src/renderer/src/services/liveConversation.ts)',
      'Updated src/renderer/src/services/liveConversation.ts.'
    ].join('\n'), 'edit parser')

    expect(parsed).toContainEqual({
      id: 'file-live-0',
      kind: 'file_reference',
      text: 'src/renderer/src/services/liveConversation.ts',
      path: 'src/renderer/src/services/liveConversation.ts'
    })
  })

  it('classifies unknown TUI states as terminal required instead of assistant text', () => {
    const parsed = parseLiveConversation([
      '> configure',
      'Choose a model',
      '❯ nemotron-3-ultra',
      '  qwen3-coder'
    ].join('\n'), 'configure')

    expect(parsed).toEqual([
      { id: 'user-live', kind: 'user_message', text: 'configure' },
      {
        id: 'terminal-live',
        kind: 'terminal_required',
        text: 'Command Code needs terminal input.',
        detail: [
          'Choose a model',
          '❯ nemotron-3-ultra',
          'qwen3-coder'
        ]
      }
    ])
  })

  it('strips common terminal control sequences', () => {
    expect(stripTerminalControl('\u001b[2J\u001b[35mhello\u001b[0m\r\nworld')).toBe('hello\n\nworld')
  })

  it('compacts repeated PTY repaint frames in diagnostic transcript previews', () => {
    const compacted = compactPtyDiagnosticTranscript([
      '✻ Thinking… (1 line) [ctrl+o to expand]',
      '· Reviewing…  esc to interrupt • 3s • ↓ 16',
      '────────────────────────────────────────────────────────────────',
      '❯ Ask your question...',
      '? for shortcuts                  [ctrl+t] updating weights ◼ TASTE',
      '✻ Thinking… (4 lines) [ctrl+o to expand]',
      '○ Reviewing…  esc to interrupt • 4s • ↓ 92',
      '────────────────────────────────────────────────────────────────',
      '❯ Ask your question...',
      '? for shortcuts                  [ctrl+t] updating weights ◼ TASTE',
      '✻ Thought for 1 second [ctrl+o to expand]',
      '⌘ Reviewing…  esc to interrupt • 5s • ↓ 149',
      '────────────────────────────────────────────────────────────────',
      '❯ Ask your question...',
      '? for shortcuts                  [ctrl+t] updating weights ◼ TASTE'
    ].join('\n'))

    expect(compacted).toBe([
      'Latest thinking: Thought for 1 second',
      'Latest progress: Reviewing... esc to interrupt • 5s • ↓ 149'
    ].join('\n'))
  })

  it('preserves completed turns when a follow-up prompt becomes active', () => {
    const firstTurn = parseLiveConversation([
      '> first',
      'First answer.'
    ].join('\n'), 'first')
    const history = mergeLiveConversationTurnHistory([], firstTurn, 'first')
    const secondTurn = parseLiveConversation([
      '> first',
      'First answer.',
      '> second',
      'Second answer.'
    ].join('\n'), 'second')

    expect([...history.flatMap((turn) => turn.events), ...secondTurn].map((event) => event.text)).toEqual([
      'first',
      'First answer.',
      'second',
      'Second answer.'
    ])
  })

  it('does not freeze a turn that only has a pending working state', () => {
    const pending = parseLiveConversation([
      '> first',
      '○ Working… esc to interrupt • 1s • ↓ 1'
    ].join('\n'), 'first')

    expect(mergeLiveConversationTurnHistory([], pending, 'first')).toEqual([])
  })

  describe('real Command Code fixture corpus', () => {
    it.each([
      {
        name: 'install-prompt',
        prompt: undefined,
        kinds: ['terminal_required'],
        text: 'Command Code needs terminal input.'
      },
      {
        name: 'auth-prompt',
        prompt: undefined,
        kinds: ['terminal_required'],
        text: 'Command Code needs terminal input.'
      },
      {
        name: 'model-selection',
        prompt: 'configure model',
        kinds: ['user_message', 'terminal_required'],
        text: 'Command Code needs terminal input.'
      },
      {
        name: 'mcp-prompt',
        prompt: 'configure mcp',
        kinds: ['user_message', 'terminal_required'],
        text: 'Command Code needs terminal input.'
      },
      {
        name: 'plan-mode-prompt',
        prompt: 'build an implementation plan',
        kinds: ['user_message', 'approval'],
        text: 'Enter plan mode?'
      },
      {
        name: 'permission-prompt',
        prompt: 'run tests',
        kinds: ['user_message', 'approval'],
        text: 'Execute Shell Command'
      },
      {
        name: 'interrupted-session',
        prompt: 'continue the implementation',
        kinds: ['user_message', 'assistant_message'],
        text: 'Interrupted by user.'
      },
      {
        name: 'failed-command',
        prompt: 'run the failing command',
        kinds: ['user_message', 'activity', 'assistant_message'],
        text: 'Command failed with exit code 1.'
      },
      {
        name: 'long-running-no-token-progress',
        prompt: 'explain this repository',
        kinds: ['user_message', 'working'],
        text: 'Inspecting'
      }
    ])('classifies $name without promoting terminal UI to assistant truth', ({ name, prompt, kinds, text }) => {
      const parsed = parseLiveConversation(liveConversationFixture(name), prompt)
      expect(parsed.map((event) => event.kind)).toEqual(kinds)
      expect(parsed.some((event) => event.text.includes(text))).toBe(true)
    })
  })
})

describe('conversationReadinessFromEvents', () => {
  it('keeps activity-only turns thinking instead of marking them ready', () => {
    expect(conversationReadinessFromEvents([
      { id: 'user-live', kind: 'user_message', text: 'what is this repo about' },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: read 1',
        detail: ['READ [README.md, package.json]']
      }
    ])).toBe('thinking')
  })

  it('marks a turn ready only after assistant text arrives', () => {
    expect(conversationReadinessFromEvents([
      { id: 'user-live', kind: 'user_message', text: 'what is this repo about' },
      {
        id: 'activity-live',
        kind: 'activity',
        text: 'Activity: read 1',
        detail: ['READ [README.md, package.json]']
      },
      { id: 'assistant-live', kind: 'assistant_message', text: 'This repo is a GUI adapter for Command Code.' }
    ])).toBe('ready')
  })
})
