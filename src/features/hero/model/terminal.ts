import type { ProfileData } from './profile.types'
import type { ThemeMode } from '@shared/types/common'
import type { Project } from '@shared/types/portfolio.types'

interface GithubContributionsResponse {
  totalContributions?: unknown
}

export type TerminalTone = 'default' | 'accent' | 'error' | 'success' | 'muted'

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
  projects: Project[]
  theme: ThemeMode
  commandHistory: string[]
}

export const terminalToneClasses: Record<TerminalTone, string> = {
  default: 'text-slate-600 dark:text-slate-300',
  accent: 'text-accent-600 dark:text-accent-400',
  error: 'text-rose-600 dark:text-rose-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  muted: 'text-slate-500 dark:text-slate-400',
}

export const parseContributionTotal = (value: unknown): number | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const payload = value as GithubContributionsResponse

  return typeof payload.totalContributions === 'number'
    ? payload.totalContributions
    : null
}

export const createInitialTerminalLines = (profile: ProfileData): TerminalLine[] => [
  { text: "Type 'help' to explore commands.", tone: 'muted' },
  { text: `${profile.heroTerminalPath} $ ls -la`, tone: 'accent' },
  ...profile.heroTerminalDirectories.map((directory) => ({
    text: `drwxr-xr-x ${directory}`,
  })),
]

const resolveOpenCommand = (
  token: string,
  projects: Project[]
): Pick<TerminalCommandResult, 'output' | 'openUrl'> => {
  const normalizedToken = token.toLowerCase()
  const index = Number.parseInt(normalizedToken, 10)

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

  const nextCommandHistory = [...commandHistory, input]
  const [command, ...args] = input.split(/\s+/)
  const normalizedCommand = command.toLowerCase()

  if (normalizedCommand === 'clear') {
    return {
      executedInput: input,
      nextCommandHistory,
      output: [],
      shouldClear: true,
      shouldToggleTheme: false,
    }
  }

  switch (normalizedCommand) {
    case 'help':
      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        output: [
          { text: 'Available commands:' },
          { text: 'help, ls, pwd, whoami, cat about.txt', tone: 'muted' },
          {
            text: 'projects, open <id|index>, theme <dark|light|toggle>',
            tone: 'muted',
          },
          { text: 'history, clear', tone: 'muted' },
        ],
      }
    case 'ls':
      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        output: [
          ...profile.heroTerminalDirectories.map((directory) => ({
            text: `drwxr-xr-x ${directory}`,
          })),
          { text: '-rw-r--r-- about.txt' },
        ],
      }
    case 'pwd':
      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        output: [{ text: profile.heroTerminalPath }],
      }
    case 'whoami':
      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        output: [{ text: `${profile.name} (${profile.title})` }],
      }
    case 'cat':
      return args[0]?.toLowerCase() === 'about.txt'
        ? {
            executedInput: input,
            nextCommandHistory,
            shouldClear: false,
            shouldToggleTheme: false,
            output: profile.about.map((line) => ({ text: `- ${line}` })),
          }
        : {
            executedInput: input,
            nextCommandHistory,
            shouldClear: false,
            shouldToggleTheme: false,
            output: [{ text: "Only 'cat about.txt' is supported.", tone: 'error' }],
          }
    case 'projects':
      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        output: projects.map((project, index) => ({
          text: `[${String(index + 1)}] ${project.id} - ${project.title}`,
        })),
      }
    case 'open':
      if (!args[0]) {
        return {
          executedInput: input,
          nextCommandHistory,
          shouldClear: false,
          shouldToggleTheme: false,
          output: [{ text: 'Usage: open <id|index>', tone: 'error' }],
        }
      }

      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        ...resolveOpenCommand(args[0], projects),
      }
    case 'theme': {
      const themeResult = resolveThemeCommand(args[0]?.toLowerCase(), theme)

      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        output: themeResult.output,
        shouldToggleTheme: themeResult.shouldToggleTheme,
      }
    }
    case 'history':
      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        output: nextCommandHistory.map((previousCommand, index) => ({
          text: `${String(index + 1)}  ${previousCommand}`,
          tone: 'muted',
        })),
      }
    default:
      return {
        executedInput: input,
        nextCommandHistory,
        shouldClear: false,
        shouldToggleTheme: false,
        output: [
          { text: `Command not found: ${command}`, tone: 'error' },
          { text: "Try 'help' for available commands.", tone: 'muted' },
        ],
      }
  }
}
