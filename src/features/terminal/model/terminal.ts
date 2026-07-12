import type { ThemeMode } from '@shared/types/common'
import type { ProfileData, Project } from '@shared/types/portfolio.types'

import type { TerminalTone } from './terminalTheme'

export type { TerminalTone } from './terminalTheme'

export interface TerminalLine {
  text: string
  tone?: TerminalTone
}

export interface TerminalCommandResult {
  executedInput: string
  nextCommandHistory: string[]
  output: TerminalLine[]
  shouldClear: boolean
  shouldToggleTheme: boolean
  openUrl?: string
}

interface ResolveTerminalCommandParams {
  rawInput: string
  profile: ProfileData
  projects: readonly Project[]
  theme: ThemeMode
  commandHistory: readonly string[]
}

export const MAX_COMMAND_HISTORY = 50
export const MAX_TERMINAL_OUTPUT_LINES = 200

export const appendTerminalLines = (
  existingLines: readonly TerminalLine[],
  newLines: readonly TerminalLine[]
): TerminalLine[] => [...existingLines, ...newLines].slice(-MAX_TERMINAL_OUTPUT_LINES)

export const createInitialTerminalLines = (profile: ProfileData): TerminalLine[] => [
  { text: 'Last login: Wed May 15 10:24:08 on ttys001', tone: 'muted' },
  { text: "Type 'help' to explore commands.", tone: 'muted' },
  { text: `${profile.heroTerminalPath} % ls -la`, tone: 'default' },
  ...profile.heroTerminalDirectories.map((directory) => ({
    text: `drwxr-xr-x ${directory}`,
  })),
]

const resolveOpenCommand = (
  token: string,
  projects: readonly Project[]
): Pick<TerminalCommandResult, 'output' | 'openUrl'> => {
  const normalizedToken = token.toLowerCase()
  const isNumericSelector = /^\d+$/u.test(normalizedToken)
  const isMalformedNumericSelector = /^\d/u.test(normalizedToken) && !isNumericSelector

  if (isMalformedNumericSelector) {
    return {
      output: [
        {
          text: `Invalid project selector '${token}'. Use a project id or positive index.`,
          tone: 'error',
        },
      ],
    }
  }

  const index = isNumericSelector ? Number(normalizedToken) : Number.NaN

  const selectedProject =
    Number.isInteger(index) && index >= 1 && index <= projects.length
      ? projects[index - 1]
      : projects.find((project) => project.id.toLowerCase() === normalizedToken)

  if (!selectedProject) {
    return {
      output: [
        {
          text: `Project '${token}' not found. Use 'projects' to list available entries.`,
          tone: 'error',
        },
      ],
    }
  }

  const targetUrl = selectedProject.liveUrl ?? selectedProject.repoUrl
  if (!targetUrl) {
    return {
      output: [
        {
          text: `Project '${selectedProject.id}' has no configured link to open.`,
          tone: 'error',
        },
      ],
    }
  }

  return {
    openUrl: targetUrl,
    output: [{ text: `Opening ${selectedProject.title}...`, tone: 'success' }],
  }
}

const resolveThemeCommand = (
  target: string | undefined,
  theme: ThemeMode
): Pick<TerminalCommandResult, 'output' | 'shouldToggleTheme'> => {
  if (!target) {
    return {
      output: [
        { text: `Current theme: ${theme}` },
        { text: 'Usage: theme <dark|light|toggle>', tone: 'muted' },
      ],
      shouldToggleTheme: false,
    }
  }

  if (target === 'toggle') {
    return {
      output: [
        {
          text: `Theme toggled to ${theme === 'dark' ? 'light' : 'dark'}.`,
          tone: 'success',
        },
      ],
      shouldToggleTheme: true,
    }
  }

  if (target !== 'dark' && target !== 'light') {
    return {
      output: [{ text: 'Usage: theme <dark|light|toggle>', tone: 'error' }],
      shouldToggleTheme: false,
    }
  }

  if (target === theme) {
    return {
      output: [{ text: `Theme already set to ${theme}.`, tone: 'muted' }],
      shouldToggleTheme: false,
    }
  }

  return {
    output: [{ text: `Theme set to ${target}.`, tone: 'success' }],
    shouldToggleTheme: true,
  }
}

export const resolveTerminalCommand = ({
  rawInput,
  profile,
  projects,
  theme,
  commandHistory,
}: ResolveTerminalCommandParams): TerminalCommandResult | null => {
  const input = rawInput.trim()
  if (!input) {
    return null
  }

  const nextCommandHistory = [...commandHistory, input].slice(-MAX_COMMAND_HISTORY)
  const [command, ...args] = input.split(/\s+/)
  const normalizedCommand = command.toLowerCase()

  const createResult = (
    output: TerminalLine[],
    options: {
      shouldClear?: boolean
      shouldToggleTheme?: boolean
      openUrl?: string
    } = {}
  ): TerminalCommandResult => ({
    executedInput: input,
    nextCommandHistory,
    output,
    shouldClear: options.shouldClear ?? false,
    shouldToggleTheme: options.shouldToggleTheme ?? false,
    ...(options.openUrl ? { openUrl: options.openUrl } : {}),
  })

  if (normalizedCommand === 'clear') {
    return createResult([], { shouldClear: true })
  }

  switch (normalizedCommand) {
    case 'help':
      return createResult([
        { text: 'Available commands:' },
        { text: 'help, ls, pwd, whoami, cat about.txt', tone: 'muted' },
        {
          text: 'projects, open <id|index>, theme <dark|light|toggle>',
          tone: 'muted',
        },
        { text: 'history, clear', tone: 'muted' },
      ])
    case 'ls':
      return createResult([
        ...profile.heroTerminalDirectories.map((directory) => ({
          text: `drwxr-xr-x ${directory}`,
        })),
        { text: '-rw-r--r-- about.txt' },
      ])
    case 'pwd':
      return createResult([{ text: profile.heroTerminalPath }])
    case 'whoami':
      return createResult([{ text: `${profile.name} (${profile.title})` }])
    case 'cat':
      return args[0]?.toLowerCase() === 'about.txt'
        ? createResult(profile.about.map((line) => ({ text: `- ${line}` })))
        : createResult([{ text: "Only 'cat about.txt' is supported.", tone: 'error' }])
    case 'projects':
      return createResult(
        projects.map((project, index) => ({
          text: `[${String(index + 1)}] ${project.id} - ${project.title}`,
        }))
      )
    case 'open':
      if (!args[0]) {
        return createResult([{ text: 'Usage: open <id|index>', tone: 'error' }])
      }

      {
        const openResult = resolveOpenCommand(args[0], projects)
        return createResult(openResult.output, { openUrl: openResult.openUrl })
      }
    case 'theme': {
      const themeResult = resolveThemeCommand(args[0]?.toLowerCase(), theme)

      return createResult(themeResult.output, {
        shouldToggleTheme: themeResult.shouldToggleTheme,
      })
    }
    case 'history':
      return createResult(
        nextCommandHistory.map((previousCommand, index) => ({
          text: `${String(index + 1)}  ${previousCommand}`,
          tone: 'muted',
        }))
      )
    default:
      return createResult([
        { text: `Command not found: ${command}`, tone: 'error' },
        { text: "Try 'help' for available commands.", tone: 'muted' },
      ])
  }
}
