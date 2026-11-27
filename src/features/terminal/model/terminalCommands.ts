export const commands = {
  help: ['help [command]', 'List commands or show command help.'],
  man: ['man <command>', 'Read the manual for a command.'],
  ls: [
    'ls [-a] [-l] [path]',
    'List entries. Use -a for dot entries and -l for virtual metadata.',
  ],
  cd: [
    'cd [directory]',
    'Change directory. With no argument, return to the portfolio root.',
  ],
  pwd: ['pwd', 'Print the absolute virtual working directory.'],
  cat: ['cat <file>...', 'Print one or more virtual files. Quote paths with spaces.'],
  whoami: ['whoami', 'Show the portfolio owner and role.'],
  projects: ['projects', 'List project titles, IDs, and numeric shortcuts.'],
  skills: ['skills', 'Show the portfolio tech stack.'],
  open: [
    'open [--live|--source] <path|id|index>',
    'Open a configured project or social link. The default prefers the live site.',
  ],
  gh: ['gh repo view --web', 'Open the source repository for this portfolio.'],
  fastfetch: ['fastfetch', 'Show a summary of the portfolio and site.'],
  theme: ['theme [dark|light|system|toggle]', 'Read or change the website theme.'],
  date: ['date', 'Show the current time in the browser’s timezone.'],
  uname: ['uname [-a]', 'Identify the simulated portfolio environment.'],
  echo: ['echo [text]...', 'Print text. Shell expansion is disabled.'],
  history: ['history', 'List commands from this browser tab.'],
  clear: ['clear', 'Clear the terminal display.'],
  exit: ['exit', 'Close the terminal window.'],
} as const

export type Command = keyof typeof commands
export const commandNames = Object.keys(commands) as Command[]
export const themeTargets = ['dark', 'light', 'system', 'toggle']
export const openFlags = ['--live', '--source']

export function findCommand(name: string): Command | undefined {
  const normalized = name.toLowerCase()
  return normalized === 'neofetch'
    ? 'fastfetch'
    : commandNames.find((key) => key === normalized)
}

export function tokenize(input: string): string[] | null {
  const tokens =
    input.match(
      /(?:[^\s'"\\]+|\\[\s\S]|"[^"\\]*(?:\\[\s\S][^"\\]*)*"|'[^']*')+|\S/gu
    ) ?? []
  if (tokens.some((token) => token === "'" || token === '"' || token === '\\'))
    return null
  return tokens.map((token) =>
    token.replace(
      /'([^']*)'|"([^"\\]*(?:\\[\s\S][^"\\]*)*)"|\\([\s\S])/gu,
      (
        _match: string,
        single: string | undefined,
        double: string | undefined,
        escaped: string | undefined
      ) => single ?? double?.replace(/\\([\s\S])/gu, '$1') ?? escaped ?? ''
    )
  )
}

// Recognize one insertion, deletion, substitution, or adjacent transposition.
export function suggestCommand(input: string) {
  const name = input.toLowerCase()
  return commandNames.find((candidate) => {
    if (Math.abs(name.length - candidate.length) > 1) return false
    let index = 0
    while (index < name.length && name[index] === candidate[index]) index++
    const left = name.slice(index)
    const right = candidate.slice(index)
    if (left.length < right.length) return left === right.slice(1)
    if (left.length > right.length) return left.slice(1) === right
    return (
      left.slice(1) === right.slice(1) ||
      (left[0] === right[1] && left[1] === right[0] && left.slice(2) === right.slice(2))
    )
  })
}
