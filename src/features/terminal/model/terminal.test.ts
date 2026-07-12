import { describe, expect, it } from 'vitest'

import type { Project } from '@shared/types/portfolio.types'

import {
  appendTerminalLines,
  createInitialTerminalLines,
  MAX_COMMAND_HISTORY,
  MAX_TERMINAL_OUTPUT_LINES,
  resolveTerminalCommand,
} from './terminal'
import { terminalTestProfile, terminalTestProjects } from './terminal.test-fixtures'
import { getTerminalToneClass, terminalThemeClasses } from './terminalTheme'

const profile = terminalTestProfile
const projects = terminalTestProjects

const runCommand = (
  rawInput: string,
  options?: {
    theme?: 'light' | 'dark'
    commandHistory?: string[]
    commandProjects?: Project[]
  }
) =>
  resolveTerminalCommand({
    rawInput,
    profile,
    projects: options?.commandProjects ?? projects,
    theme: options?.theme ?? 'light',
    commandHistory: options?.commandHistory ?? [],
  })

describe('terminal', () => {
  it('defines theme-aware tone class mappings', () => {
    expect(getTerminalToneClass('default', 'light')).toContain('text-slate-900')
    expect(getTerminalToneClass('default', 'dark')).toContain('text-slate-100')
    expect(getTerminalToneClass('error', 'light')).toContain('text-red-600')
    expect(getTerminalToneClass('success', 'dark')).toContain('text-emerald-400')
    expect(terminalThemeClasses.light.chrome).toContain('bg-white')
    expect(terminalThemeClasses.dark.chrome).toContain('bg-[#1e1e1e]')
  })

  it('builds initial terminal lines from profile content', () => {
    const lines = createInitialTerminalLines(profile)

    expect(lines[0]).toEqual({
      text: 'Last login: Wed May 15 10:24:08 on ttys001',
      tone: 'muted',
    })
    expect(lines[1]).toEqual({
      text: "Type 'help' to explore commands.",
      tone: 'muted',
    })
    expect(lines[2]).toEqual({
      text: `${profile.heroTerminalPath} % ls -la`,
      tone: 'default',
    })
    expect(lines).toContainEqual({
      text: `drwxr-xr-x ${profile.heroTerminalDirectories[0]}`,
    })
  })

  it('returns null for empty command input', () => {
    expect(runCommand('   ')).toBeNull()
  })

  it('resolves core informational commands', () => {
    const help = runCommand('help')
    expect(help?.output[0].text).toBe('Available commands:')
    expect(help?.shouldClear).toBe(false)

    const ls = runCommand('ls')
    expect(ls?.output.some((line) => line.text === '-rw-r--r-- about.txt')).toBe(true)

    const pwd = runCommand('pwd')
    expect(pwd?.output).toEqual([{ text: profile.heroTerminalPath }])

    const whoami = runCommand('whoami')
    expect(whoami?.output).toEqual([{ text: `${profile.name} (${profile.title})` }])

    const listedProjects = runCommand('projects')
    expect(listedProjects?.output[0].text).toContain('[1]')
  })

  it('resolves cat command variants', () => {
    const supported = runCommand('cat about.txt')
    expect(supported?.output[0].text).toBe(`- ${profile.about[0]}`)

    const unsupported = runCommand('cat notes.txt')
    expect(unsupported?.output).toEqual([
      { text: "Only 'cat about.txt' is supported.", tone: 'error' },
    ])
  })

  it('resolves open command variants', () => {
    const noArg = runCommand('open')
    expect(noArg?.output).toEqual([{ text: 'Usage: open <id|index>', tone: 'error' }])

    const byIndex = runCommand('open 1')
    expect(byIndex?.openUrl).toBe(projects[0].liveUrl)
    expect(byIndex?.output[0].tone).toBe('success')

    const byId = runCommand(`open ${projects[1].id.toUpperCase()}`)
    expect(byId?.openUrl).toBe(projects[1].liveUrl ?? projects[1].repoUrl)

    const missing = runCommand('open missing')
    expect(missing?.output[0].text).toContain("Project 'missing' not found")
    expect(missing?.openUrl).toBeUndefined()

    const malformedIndex = runCommand('open 1abc')
    expect(malformedIndex?.output).toEqual([
      {
        text: "Invalid project selector '1abc'. Use a project id or positive index.",
        tone: 'error',
      },
    ])
    expect(malformedIndex?.openUrl).toBeUndefined()
  })

  it('returns error when opening a project without links', () => {
    const projectsWithoutUrl: Project[] = [
      {
        id: 'no-link',
        title: 'No Link',
        summary: 'No link configured',
        highlights: ['Deterministic fixture'],
        stack: ['TypeScript'],
      },
    ]

    const noLink = runCommand('open no-link', {
      commandProjects: projectsWithoutUrl,
    })

    expect(noLink?.output).toEqual([
      {
        text: "Project 'no-link' has no configured link to open.",
        tone: 'error',
      },
    ])
    expect(noLink?.openUrl).toBeUndefined()
  })

  it('resolves theme command variants', () => {
    const noArg = runCommand('theme', { theme: 'light' })
    expect(noArg?.output[0].text).toBe('Current theme: light')
    expect(noArg?.shouldToggleTheme).toBe(false)

    const invalid = runCommand('theme bad', { theme: 'light' })
    expect(invalid?.output).toEqual([
      { text: 'Usage: theme <dark|light|toggle>', tone: 'error' },
    ])

    const same = runCommand('theme light', { theme: 'light' })
    expect(same?.output).toEqual([
      { text: 'Theme already set to light.', tone: 'muted' },
    ])
    expect(same?.shouldToggleTheme).toBe(false)

    const switchExplicit = runCommand('theme dark', { theme: 'light' })
    expect(switchExplicit?.output).toEqual([
      { text: 'Theme set to dark.', tone: 'success' },
    ])
    expect(switchExplicit?.shouldToggleTheme).toBe(true)

    const toggle = runCommand('theme toggle', { theme: 'dark' })
    expect(toggle?.output).toEqual([
      { text: 'Theme toggled to light.', tone: 'success' },
    ])
    expect(toggle?.shouldToggleTheme).toBe(true)
  })

  it('resolves history, clear, and unknown commands', () => {
    const history = runCommand('history', {
      commandHistory: ['help', 'pwd'],
    })
    expect(history?.nextCommandHistory).toEqual(['help', 'pwd', 'history'])
    expect(history?.output).toEqual([
      { text: '1  help', tone: 'muted' },
      { text: '2  pwd', tone: 'muted' },
      { text: '3  history', tone: 'muted' },
    ])

    const clear = runCommand('clear', {
      commandHistory: ['help'],
    })
    expect(clear?.shouldClear).toBe(true)
    expect(clear?.output).toEqual([])

    const unknown = runCommand('not-a-command')
    expect(unknown?.output).toEqual([
      { text: 'Command not found: not-a-command', tone: 'error' },
      { text: "Try 'help' for available commands.", tone: 'muted' },
    ])
  })

  it('caps command history and terminal output growth', () => {
    const fullHistory = Array.from(
      { length: MAX_COMMAND_HISTORY },
      (_, index) => `command-${String(index + 1)}`
    )
    const history = runCommand('history', { commandHistory: fullHistory })

    expect(history?.nextCommandHistory).toHaveLength(MAX_COMMAND_HISTORY)
    expect(history?.nextCommandHistory[0]).toBe('command-2')
    expect(history?.nextCommandHistory.at(-1)).toBe('history')
    expect(history?.output).toHaveLength(MAX_COMMAND_HISTORY)

    const fullOutput = Array.from(
      { length: MAX_TERMINAL_OUTPUT_LINES },
      (_, index) => ({ text: `line-${String(index + 1)}` })
    )
    const appendedOutput = appendTerminalLines(fullOutput, [
      { text: 'new-line-1' },
      { text: 'new-line-2' },
    ])

    expect(appendedOutput).toHaveLength(MAX_TERMINAL_OUTPUT_LINES)
    expect(appendedOutput[0]?.text).toBe('line-3')
    expect(appendedOutput.at(-1)?.text).toBe('new-line-2')
  })
})
