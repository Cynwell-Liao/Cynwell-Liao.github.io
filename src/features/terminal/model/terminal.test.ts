import { describe, expect, it } from 'vitest'

import type { Project } from '@shared/types/portfolio.types'

import { getRequired } from '../../../test/getRequired'

import {
  appendTerminalLines,
  createInitialTerminalLines,
  getCompletions,
  MAX_COMMAND_HISTORY,
  MAX_TERMINAL_OUTPUT_LINES,
  resolveTerminalCommand,
} from './terminal'
import { terminalTestProfile, terminalTestProjects } from './terminal.test-fixtures'

const profile = terminalTestProfile
const projects = terminalTestProjects
const firstProject = getRequired(projects, 0, 'terminal project')
const secondProject = getRequired(projects, 1, 'terminal project')

const runCommand = (
  rawInput: string,
  options?: {
    theme?: 'light' | 'dark'
    commandHistory?: string[]
    commandProjects?: Project[]
    cwd?: string
  }
) =>
  resolveTerminalCommand({
    rawInput,
    profile,
    projects: options?.commandProjects ?? projects,
    theme: options?.theme ?? 'light',
    commandHistory: options?.commandHistory ?? [],
    ...(options?.cwd ? { cwd: options.cwd } : {}),
  })

describe('terminal', () => {
  it('identifies the read-only shell and shows discovery hints', () => {
    const startup = createInitialTerminalLines()
      .map(({ text }) => text)
      .join('\n')
    expect(startup).toContain('read-only virtual filesystem')
    expect(startup).toContain('help')
  })

  it('returns null for empty command input', () => {
    expect(runCommand('   ')).toBeNull()
  })

  it('resolves core informational commands', () => {
    const help = runCommand('help')
    expect(help?.output[0]?.text).toBe('Available commands:')
    expect(help?.shouldClear).toBe(false)

    const ls = runCommand('ls')
    expect(ls?.output).toContainEqual({ text: 'about.md' })
    expect(ls?.output).toContainEqual({ text: 'projects/' })
    expect(ls?.output).not.toContainEqual({ text: './' })

    const pwd = runCommand('pwd')
    expect(pwd?.output).toEqual([{ text: '/portfolio' }])

    const whoami = runCommand('whoami')
    expect(whoami?.output).toEqual([{ text: `${profile.name} (${profile.title})` }])

    const listedProjects = runCommand('projects')
    expect(listedProjects?.output[0]?.text).toContain('[1]')
  })

  it('resolves cat command variants', () => {
    const supported = runCommand('cat about.txt')
    expect(supported?.output[0]?.text).toBe(
      getRequired(profile.about, 0, 'profile paragraph')
    )

    const unsupported = runCommand('cat notes.txt')
    expect(unsupported?.output).toEqual([
      { text: 'cat: notes.txt: No such file or directory', tone: 'error' },
    ])
  })

  it('resolves open command variants', () => {
    const noArg = runCommand('open')
    expect(noArg?.output[0]?.text).toMatch(/^Usage: open /u)

    const byIndex = runCommand('open 1')
    expect(byIndex?.openUrl).toBe(firstProject.liveUrl)
    expect(byIndex?.output[0]?.tone).toBe('success')

    const byId = runCommand(`open ${secondProject.id.toUpperCase()}`)
    expect(byId?.openUrl).toBe(secondProject.liveUrl ?? secondProject.repoUrl)

    const missing = runCommand('open missing')
    expect(missing?.output[0]?.text).toContain("Project 'missing' not found")
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

  it.each(['3d-editor', '1abc', '123'])('opens the valid project id %s', (id) => {
    const project = { ...firstProject, id }
    expect(
      runCommand(`open ${id.toUpperCase()}`, { commandProjects: [project] })?.openUrl
    ).toBe(project.liveUrl)
  })

  it('prefers a matching numeric id over the positional index', () => {
    const numericIdProject = { ...secondProject, id: '1' }
    expect(
      runCommand('open 1', { commandProjects: [firstProject, numericIdProject] })
        ?.openUrl
    ).toBe(numericIdProject.repoUrl)
  })

  it.each(['0', '99', '9007199254740992'])(
    'rejects the out-of-range index %s',
    (selector) => {
      expect(runCommand(`open ${selector}`)?.openUrl).toBeUndefined()
      expect(runCommand(`open ${selector}`)?.output[0]?.text).toContain('not found')
    }
  )

  it('resolves theme command variants', () => {
    const noArg = runCommand('theme', { theme: 'light' })
    expect(noArg?.output[0]?.text).toBe('Current theme: light')
    expect(noArg?.shouldToggleTheme).toBe(false)

    const invalid = runCommand('theme bad', { theme: 'light' })
    expect(invalid?.output).toEqual([
      { text: 'Usage: theme [dark|light|system|toggle]', tone: 'error' },
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

  it('resolves relative, home, and absolute paths within the virtual filesystem', () => {
    const cwd = '/portfolio/projects/alpha-project'
    expect(runCommand('cd projects/alpha-project')?.nextPath).toBe(cwd)
    expect(runCommand('cd ../beta-project', { cwd })?.nextPath).toBe(
      '/portfolio/projects/beta-project'
    )
    expect(runCommand('cd ~', { cwd })?.nextPath).toBe('/portfolio')
    expect(runCommand('cd /../../', { cwd })?.nextPath).toBe('/')
    expect(runCommand('cd /etc', { cwd })?.nextPath).toBeUndefined()
    expect(runCommand('cd missing/..', { cwd })?.nextPath).toBeUndefined()
    expect(runCommand('cd ~/about.md/..', { cwd })?.output[0]?.text).toContain(
      'Not a directory'
    )
    expect(runCommand('cat "README.md"', { cwd })?.output).toContainEqual({
      text: firstProject.summary,
    })
    expect(runCommand("cat 'README.md", { cwd })?.output[0]?.tone).toBe('error')
    expect(runCommand('ls -la', { cwd })?.output.map(({ text }) => text)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/dr-xr-xr-x.* \.\.\/$/u),
        expect.stringMatching(/-r--r--r--.*README\.md$/u),
      ])
    )
  })

  it('uses shared usage and completion data and suggests misspelled commands', () => {
    expect(runCommand('man open')?.output[0]?.text).toBe('OPEN(1)')
    expect(runCommand('help cd')?.output).toEqual(runCommand('cd --help')?.output)
    expect(runCommand('proejcts')?.output[1]?.text).toBe("Did you mean 'projects'?")
    const complete = (input: string, cwd = '/portfolio') =>
      getCompletions({ profile, projects }, cwd, input).candidates
    expect(complete('man fas')).toEqual(['fastfetch'])
    expect(complete('cd a')).toEqual([])
    expect(complete('cd projects/a')).toEqual(['projects/alpha-project/'])
    expect(complete('cat R', '/portfolio/projects/alpha-project')).toEqual([
      'README.md',
    ])
    expect(complete('theme sys')).toEqual(['system'])
    expect(complete('open --source be')).toEqual(['beta-project'])
  })

  it('opens only configured paths and supports explicit project links', () => {
    expect(runCommand('open links/github')?.openUrl).toBe(profile.githubUrl)
    expect(runCommand('open --source projects/alpha-project')?.openUrl).toBe(
      firstProject.repoUrl
    )
    expect(runCommand('open --live beta-project')?.openUrl).toBeUndefined()
    expect(runCommand('open https://example.com')?.openUrl).toBeUndefined()
    expect(runCommand('gh repo view --web')?.openUrl).toBe(profile.repositoryUrl)
    expect(runCommand('cat links/source')?.output).toEqual([
      { text: profile.repositoryUrl, url: profile.repositoryUrl },
    ])
    expect(runCommand('neofetch')?.output).toEqual(runCommand('fastfetch')?.output)
    expect(runCommand('theme system')?.shouldFollowSystemTheme).toBe(true)
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
