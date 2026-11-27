import type { ThemeMode } from '@shared/types/common'
import type { Project } from '@shared/types/portfolio.types'

import {
  commandNames,
  commands,
  findCommand,
  openFlags,
  suggestCommand,
  themeTargets,
  tokenize,
} from './terminalCommands'
import {
  completePath,
  createTerminalFs,
  HOME_PATH,
  listEntries,
  resolvePath,
  skillLines,
} from './terminalFs'

import type { TerminalContent } from './terminal.types'
import type { TerminalTone } from './terminalTheme'

export type { TerminalTone } from './terminalTheme'

export interface TerminalLine {
  text: string
  tone?: TerminalTone
  url?: string
}

export interface TerminalCommandResult {
  executedInput: string
  nextCommandHistory: string[]
  output: TerminalLine[]
  shouldClear: boolean
  shouldToggleTheme: boolean
  shouldFollowSystemTheme?: boolean
  themeTarget?: ThemeMode
  shouldExit?: boolean
  nextPath?: string
  openUrl?: string
}

interface ResolveTerminalCommandParams extends TerminalContent {
  rawInput: string
  theme: ThemeMode
  commandHistory: readonly string[]
  cwd?: string
}

export const MAX_COMMAND_HISTORY = 50
export const MAX_TERMINAL_OUTPUT_LINES = 200

export const appendTerminalLines = (
  existingLines: readonly TerminalLine[],
  newLines: readonly TerminalLine[]
): TerminalLine[] => [...existingLines, ...newLines].slice(-MAX_TERMINAL_OUTPUT_LINES)

export const displayPath = (cwd: string) =>
  cwd === HOME_PATH || cwd.startsWith(`${HOME_PATH}/`)
    ? `~${cwd.slice(HOME_PATH.length)}`
    : cwd

export const createInitialTerminalLines = (): TerminalLine[] => [
  { text: 'Portfolio shell · read-only virtual filesystem', tone: 'accent' },
  { text: "Type 'help' for commands or 'ls' to explore.", tone: 'muted' },
]

const resolveOpenCommand = (
  token: string,
  projects: readonly Project[],
  flag?: string
): Pick<TerminalCommandResult, 'output' | 'openUrl'> => {
  const normalizedToken = token.toLowerCase()
  const matchingId = projects.find(
    (project) => project.id.toLowerCase() === normalizedToken
  )
  const isNumericSelector = /^\d+$/u.test(normalizedToken)
  const isMalformedNumericSelector = /^\d/u.test(normalizedToken) && !isNumericSelector

  if (!matchingId && isMalformedNumericSelector) {
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
    matchingId ??
    (Number.isInteger(index) && index >= 1 && index <= projects.length
      ? projects[index - 1]
      : undefined)

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

  const targetUrl =
    flag === '--source'
      ? selectedProject.repoUrl
      : flag === '--live'
        ? selectedProject.liveUrl
        : (selectedProject.liveUrl ?? selectedProject.repoUrl)
  if (!targetUrl) {
    return {
      output: [
        {
          text: `Project '${selectedProject.id}' has no configured ${flag?.slice(2) ? `${flag.slice(2)} ` : ''}link to open.`,
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
): Pick<
  TerminalCommandResult,
  'output' | 'shouldToggleTheme' | 'shouldFollowSystemTheme' | 'themeTarget'
> => {
  if (!target) {
    return {
      output: [
        { text: `Current theme: ${theme}` },
        { text: `Usage: ${commands.theme[0]}`, tone: 'muted' },
      ],
      shouldToggleTheme: false,
    }
  }

  if (target === 'system') {
    return {
      output: [{ text: 'Theme follows system preference.', tone: 'success' }],
      shouldToggleTheme: false,
      shouldFollowSystemTheme: true,
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
      output: [{ text: `Usage: ${commands.theme[0]}`, tone: 'error' }],
      shouldToggleTheme: false,
    }
  }

  if (target === theme) {
    return {
      output: [{ text: `Theme already set to ${theme}.`, tone: 'muted' }],
      shouldToggleTheme: false,
      themeTarget: target,
    }
  }

  return {
    output: [{ text: `Theme set to ${target}.`, tone: 'success' }],
    shouldToggleTheme: true,
    themeTarget: target,
  }
}

export const resolveTerminalCommand = ({
  rawInput,
  theme,
  commandHistory,
  cwd = HOME_PATH,
  ...content
}: ResolveTerminalCommandParams): TerminalCommandResult | null => {
  const input = rawInput.trim()
  if (!input) {
    return null
  }

  const nextCommandHistory = [...commandHistory, input].slice(-MAX_COMMAND_HISTORY)
  const tokens = tokenize(input)
  const [command = '', ...args] = tokens ?? []
  const normalizedCommand = findCommand(command)
  const { profile, projects } = content

  const createResult = (
    output: TerminalLine[],
    options: Partial<
      Omit<TerminalCommandResult, 'executedInput' | 'nextCommandHistory' | 'output'>
    > = {}
  ): TerminalCommandResult => ({
    executedInput: input,
    nextCommandHistory,
    output,
    shouldClear: false,
    shouldToggleTheme: false,
    ...options,
  })

  const fail = (message: string) => createResult([{ text: message, tone: 'error' }])
  const manual = (name: string, full: boolean) => {
    const key = findCommand(name)
    if (!key) return fail(`No manual entry for ${name}`)
    const [usage, description] = commands[key]
    return createResult(
      full
        ? [
            { text: `${key.toUpperCase()}(1)`, tone: 'accent' },
            { text: `NAME        ${key} — ${description}` },
            { text: `SYNOPSIS    ${usage}` },
          ]
        : [{ text: `Usage: ${usage}` }, { text: description, tone: 'muted' }]
    )
  }
  const usage = () =>
    fail(`Usage: ${normalizedCommand ? commands[normalizedCommand][0] : 'help'}`)
  if (!tokens) return fail('Unclosed quote or trailing escape.')
  if (normalizedCommand && args.length === 1 && args[0] === '--help')
    return manual(command, false)
  const path = (operand: string) => resolvePath(createTerminalFs(content), cwd, operand)
  const first = args[0]
  if (
    normalizedCommand &&
    [
      'pwd',
      'whoami',
      'projects',
      'skills',
      'fastfetch',
      'date',
      'history',
      'clear',
      'exit',
    ].includes(normalizedCommand) &&
    args.length
  )
    return usage()

  switch (normalizedCommand) {
    case 'clear':
      return createResult([], { shouldClear: true })
    case 'exit':
      return createResult([], { shouldExit: true })
    case 'man':
      return first && args.length === 1 ? manual(first, true) : usage()
    case 'help':
      if (args.length > 1) return usage()
      if (first) return manual(first, false)
      return createResult([
        { text: 'Available commands:' },
        ...commandNames.map((key) => ({
          text: `${key.padEnd(11)}${commands[key][1]}`,
        })),
        {
          text: 'Tab completes · ↑/↓ recalls · Ctrl-R searches history',
          tone: 'muted',
        },
      ])
    case 'ls': {
      const flags = args.filter((arg) => arg.startsWith('-'))
      const operands = args.filter((arg) => !arg.startsWith('-'))
      if (flags.some((arg) => !/^-[al]+$/u.test(arg)) || operands.length > 1)
        return usage()
      const operand = operands[0] ?? '.'
      const target = path(operand)
      if (!target.entry) return fail(`ls: ${operand}: ${target.error}`)
      const options = flags.join('')
      return createResult(
        listEntries(
          target.entry,
          operand,
          options.includes('a'),
          options.includes('l')
        ).map((text) => ({ text }))
      )
    }
    case 'cd': {
      if (args.length > 1) return usage()
      const operand = first ?? '~'
      const target = path(operand)
      return target.ok && target.entry.kind === 'directory'
        ? createResult([], { nextPath: target.path })
        : fail(`cd: ${operand}: ${target.error ?? 'Not a directory'}`)
    }
    case 'pwd':
      return createResult([{ text: cwd }])
    case 'whoami':
      return createResult([{ text: `${profile.name} (${profile.title})` }])
    case 'cat':
      return first
        ? createResult(
            args.flatMap((operand): TerminalLine[] => {
              const target = path(operand)
              if (target.entry?.kind !== 'file')
                return [
                  {
                    text: `cat: ${operand}: ${target.error ?? 'Is a directory'}`,
                    tone: 'error',
                  },
                ]
              const { url, lines } = target.entry
              return lines.map((text) => ({ text, ...(url ? { url } : {}) }))
            })
          )
        : usage()
    case 'skills':
      return createResult(skillLines(content).map((text) => ({ text })))
    case 'fastfetch':
      return createResult([
        { text: `[ >_ ]  ${profile.name}`, tone: 'accent' },
        { text: `Role     ${profile.title}` },
        { text: 'Host     GitHub Pages · browser portfolio' },
        {
          text: `Stack    ${(content.skillCategories ?? []).map(({ title }) => title).join(' / ') || 'See skills'}`,
        },
        { text: `Projects ${String(projects.length)}` },
        { text: `Theme    ${theme}` },
        ...(content.version ? [{ text: `Version  ${content.version}` }] : []),
      ])
    case 'gh':
      return args.length === 3 &&
        first === 'repo' &&
        args[1] === 'view' &&
        args[2] === '--web'
        ? createResult([{ text: 'Opening portfolio source…', tone: 'success' }], {
            openUrl: profile.repositoryUrl,
          })
        : usage()
    case 'date':
      return createResult([{ text: new Date().toString() }])
    case 'uname':
      return args.length === 0 || (args.length === 1 && first === '-a')
        ? createResult([
            {
              text: first
                ? 'PortfolioShell browser-based virtual environment'
                : 'PortfolioShell',
            },
          ])
        : usage()
    case 'echo':
      return createResult([{ text: args.join(' ') }])
    case 'projects':
      return createResult(
        projects.map((project, index) => ({
          text: `[${String(index + 1)}] ${project.id} - ${project.title}`,
        }))
      )
    case 'open': {
      const flag = first && openFlags.includes(first) ? first : undefined
      const operand = args[flag ? 1 : 0]
      if (!operand || operand.startsWith('-') || args.length !== (flag ? 2 : 1))
        return usage()
      if (flag) {
        const project = path(operand)
        const selector =
          project.ok &&
          project.entry.kind === 'directory' &&
          /^\/portfolio\/projects\/[^/]+$/u.test(project.path)
            ? (project.path.split('/').at(-1) ?? operand)
            : operand
        const result = resolveOpenCommand(selector, projects, flag)
        const { output, openUrl } = result
        return createResult(output, openUrl ? { openUrl } : {})
      }
      const target = path(operand)
      if (target.entry?.url) {
        return createResult([{ text: `Opening ${operand}…`, tone: 'success' }], {
          openUrl: target.entry.url,
        })
      }
      if (target.entry || /[~/]/u.test(operand))
        return fail(`open: ${operand}: ${target.error ?? 'No configured link'}`)
      const result = resolveOpenCommand(operand, projects)
      const { output, openUrl } = result
      return createResult(output, openUrl ? { openUrl } : {})
    }
    case 'theme': {
      if (args.length > 1) return usage()
      const themeResult = resolveThemeCommand(first?.toLowerCase(), theme)
      const { output, ...effects } = themeResult
      return createResult(output, effects)
    }
    case 'history':
      return createResult(
        nextCommandHistory.map((previousCommand, index) => ({
          text: `${String(index + 1)}  ${previousCommand}`,
          tone: 'muted',
        }))
      )
    default: {
      const suggestion = suggestCommand(command)
      return createResult([
        { text: `Command not found: ${command}`, tone: 'error' },
        {
          text: suggestion
            ? `Did you mean '${suggestion}'?`
            : "Try 'help' for available commands.",
          tone: 'muted',
        },
      ])
    }
  }
}

export function getCompletions(
  content: TerminalContent,
  cwd: string,
  beforeCursor: string
) {
  const prefix = beforeCursor.match(/\S*$/u)?.[0] ?? ''
  const context = beforeCursor.slice(0, beforeCursor.length - prefix.length)
  const words = tokenize(context)
  if (!words || /['"\\]/u.test(prefix)) return { prefix, candidates: [] }
  const [first, ...args] = words
  const command = findCommand(first ?? '')
  const paths = (directoriesOnly = false) =>
    completePath(createTerminalFs(content), cwd, prefix, directoriesOnly)
  let options: readonly string[] = []
  if (!first) options = commandNames
  else if (args.length === 0 && prefix.startsWith('--h') && command)
    options = ['--help']
  else if (args.length === 0 && (command === 'help' || command === 'man'))
    options = commandNames
  else if (args.length === 0 && command === 'theme') options = themeTargets
  else if (command === 'cd' && !args.length) options = paths(true)
  else if (command === 'ls' && /^-/u.test(prefix)) options = ['-a', '-l', '-la', '-al']
  else if (command === 'cat' || command === 'ls') options = paths()
  else if (command === 'gh') {
    if (!args.length) options = ['repo']
    else if (args.length === 1 && args[0] === 'repo') options = ['view']
    else if (args.length === 2 && args[0] === 'repo' && args[1] === 'view')
      options = ['--web']
  } else if (
    command === 'open' &&
    (!args.length || (args.length === 1 && openFlags.includes(args[0] ?? '')))
  ) {
    options = [
      ...paths(),
      ...content.projects.map(({ id }) => id),
      ...(!args.length ? openFlags : []),
    ]
  }
  return {
    prefix,
    candidates: [...new Set(options)]
      .filter((option) => option.startsWith(prefix))
      .sort(),
  }
}
