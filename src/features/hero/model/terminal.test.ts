import { describe, expect, it } from 'vitest'

import { profile } from '@content/profile'
import { loadProjects } from '@content/projects'

import {
  createInitialTerminalLines,
  parseContributionTotal,
  resolveTerminalCommand,
  terminalToneClasses,
} from './terminal'

import type { Project } from '@shared/types/portfolio.types'

const projects = loadProjects()

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
  it('defines known tone class mappings', () => {
    expect(terminalToneClasses.default).toContain('text-slate-600')
    expect(terminalToneClasses.accent).toContain('text-accent-600')
    expect(terminalToneClasses.error).toContain('text-rose-600')
    expect(terminalToneClasses.success).toContain('text-emerald-600')
    expect(terminalToneClasses.muted).toContain('text-slate-500')
  })

  it('parses contribution totals safely', () => {
    expect(parseContributionTotal({ totalContributions: 99 })).toBe(99)
    expect(parseContributionTotal({ totalContributions: '99' })).toBeNull()
    expect(parseContributionTotal({})).toBeNull()
    expect(parseContributionTotal(null)).toBeNull()
    expect(parseContributionTotal('bad')).toBeNull()
  })

  it('builds initial terminal lines from profile content', () => {
    const lines = createInitialTerminalLines(profile)

    expect(lines[0]).toEqual({
      text: "Type 'help' to explore commands.",
      tone: 'muted',
    })
    expect(lines[1]).toEqual({
      text: `${profile.heroTerminalPath} $ ls -la`,
      tone: 'accent',
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

    const byId = runCommand(`open ${projects[2].id.toUpperCase()}`)
    expect(byId?.openUrl).toBe(projects[2].repoUrl)

    const missing = runCommand('open missing')
    expect(missing?.output[0].text).toContain("Project 'missing' not found")
    expect(missing?.openUrl).toBeUndefined()
  })

  it('returns error when opening a project without links', () => {
    const projectsWithoutUrl: Project[] = [
      {
        id: 'no-link',
        title: 'No Link',
        summary: 'No link configured',
        highlights: [],
        stack: [],
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
})
