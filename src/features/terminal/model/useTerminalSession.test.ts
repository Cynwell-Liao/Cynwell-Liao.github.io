import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ThemeMode } from '@shared/types/common'

import { MAX_COMMAND_HISTORY, MAX_TERMINAL_OUTPUT_LINES } from './terminal'
import { terminalTestProfile, terminalTestProjects } from './terminal.test-fixtures'
import { useTerminalSession } from './useTerminalSession'

function renderSession(effects?: {
  onSetTheme: (theme: ThemeMode) => void
  onFollowSystemTheme: () => void
  onClose: () => void
}) {
  const onToggleTheme = vi.fn()
  const hook = renderHook(
    ({ theme }: { theme: ThemeMode }) =>
      useTerminalSession({
        profile: terminalTestProfile,
        projects: terminalTestProjects,
        theme,
        onToggleTheme,
        ...effects,
      }),
    { initialProps: { theme: 'light' as ThemeMode } }
  )

  const edit = (input: string) => {
    act(() => {
      hook.result.current.editInput(input)
    })
  }
  const submit = (input: string) => {
    edit(input)
    act(() => {
      hook.result.current.submit()
    })
  }
  const recall = (direction: 'previous' | 'next') => {
    let recalled: string | null = null
    act(() => {
      recalled = hook.result.current.recallHistory(direction)
    })
    return recalled
  }

  return { ...hook, edit, submit, recall, onToggleTheme }
}

describe('useTerminalSession', () => {
  it('completes a shared prefix and offers ambiguous matches before releasing Tab', () => {
    const { result, edit, submit } = renderSession()
    const complete = (position = result.current.input.length) => {
      let nextPosition: number | null = null
      act(() => {
        nextPosition = result.current.complete(position)
      })
      return nextPosition
    }
    expect(complete()).toBeNull()
    edit('cd ~/pr')
    expect(complete()).toBe('cd ~/projects/'.length)
    expect(result.current.input).toBe('cd ~/projects/')
    submit(result.current.input)
    expect(result.current.path).toBe('~/projects')
    expect(result.current.lines.at(-1)?.text).toBe('~ % cd ~/projects/')
    edit('cd ')
    expect(complete()).toBe(3)
    expect(result.current.lines.at(-1)?.text).toBe('alpha-project/  beta-project/')
    expect(complete()).toBeNull()
    edit('cat unknown')
    expect(complete()).toBeNull()
    edit('man ca')
    expect(complete(5)).toBeNull()
    expect(complete()).toBe(8)
    expect(result.current.input).toBe('man cat ')
  })

  it('cycles backward through matching history and leaves commands staged for editing', () => {
    const { result, edit, submit, recall } = renderSession()
    submit('echo first')
    submit('pwd')
    submit('echo second')
    edit('draft')
    act(result.current.reverseSearch)
    edit('echo')
    expect(result.current.searchMatch).toBe('echo second')
    expect(recall('previous')).toBeNull()
    act(result.current.reverseSearch)
    expect(result.current.searchMatch).toBe('echo first')
    act(result.current.reverseSearch)
    expect(result.current.searchMatch).toBe('echo first')
    const transcript = result.current.lines
    act(result.current.submit)
    expect(result.current.input).toBe('echo first')
    expect(result.current.lines).toBe(transcript)
    act(result.current.reverseSearch)
    edit('no match')
    expect(result.current.searchMatch).toBeUndefined()
    act(result.current.cancelInput)
    expect(result.current.input).toBe('echo first')
  })

  it('preserves history across terminal instances and tolerates restricted storage', () => {
    const first = renderSession()
    first.submit('pwd')
    first.unmount()
    const reopened = renderSession()
    expect(reopened.recall('previous')).toBe('pwd')
    reopened.unmount()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    const restricted = renderSession()
    expect(restricted.recall('previous')).toBeNull()
    restricted.submit('help')
    expect(restricted.recall('previous')).toBe('help')
  })

  it('passes explicit theme settings and exit through to the app', () => {
    const onSetTheme = vi.fn()
    const onFollowSystemTheme = vi.fn()
    const onClose = vi.fn()
    const { submit, onToggleTheme } = renderSession({
      onSetTheme,
      onFollowSystemTheme,
      onClose,
    })
    submit('theme light')
    expect(onSetTheme).toHaveBeenCalledExactlyOnceWith('light')
    expect(onToggleTheme).not.toHaveBeenCalled()
    submit('theme system')
    expect(onFollowSystemTheme).toHaveBeenCalledOnce()
    submit('exit')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('records an empty prompt without adding a blank command to history', () => {
    const { result, submit, recall } = renderSession()

    submit('   ')

    expect(result.current.lines.at(-1)?.text).toBe('~ % ')
    expect(result.current.input).toBe('')
    expect(recall('previous')).toBeNull()
  })

  it('restores a newly edited draft after browsing previously executed commands', () => {
    const { result, submit, edit, recall } = renderSession()
    submit('pwd')
    submit('help')
    edit('unfinished')

    expect(recall('previous')).toBe('help')
    expect(recall('previous')).toBe('pwd')
    edit('edited pwd')
    expect(recall('previous')).toBe('help')
    expect(recall('next')).toBe('edited pwd')
    expect(result.current.input).toBe('edited pwd')
  })

  it('cancels a recalled command without executing or adding it to history', () => {
    const { result, submit, recall } = renderSession()
    submit('pwd')
    submit('help')
    recall('previous')
    recall('previous')

    act(() => {
      result.current.cancelInput()
    })

    expect(result.current.lines.at(-1)?.text).toBe('~ % pwd^C')
    expect(result.current.input).toBe('')
    expect(recall('previous')).toBe('help')
    expect(recall('next')).toBe('')
  })

  it('clears output independently of input and command history', () => {
    const { result, submit, edit, recall } = renderSession()
    submit('pwd')
    edit('draft')

    act(() => {
      result.current.clearOutput()
    })

    expect(result.current.lines).toEqual([])
    expect(result.current.input).toBe('draft')
    expect(recall('previous')).toBe('pwd')
    expect(recall('next')).toBe('draft')
    submit('clear')
    expect(result.current.lines).toEqual([])
    expect(recall('previous')).toBe('clear')
  })

  it('clears a draft without modifying the transcript', () => {
    const { result, submit, edit, recall } = renderSession()
    submit('pwd')
    const transcript = result.current.lines
    edit('draft')
    recall('previous')

    act(() => {
      result.current.clearInput()
    })

    expect(result.current.lines).toBe(transcript)
    expect(result.current.input).toBe('')
    expect(recall('previous')).toBe('pwd')
    expect(recall('next')).toBe('')
  })

  it('uses the current theme without replaying command side effects on rerender', () => {
    const { result, submit, rerender, onToggleTheme } = renderSession()
    submit('theme dark')
    expect(onToggleTheme).toHaveBeenCalledTimes(1)

    rerender({ theme: 'dark' })
    expect(onToggleTheme).toHaveBeenCalledTimes(1)
    submit('theme dark')
    expect(onToggleTheme).toHaveBeenCalledTimes(1)
    expect(result.current.lines.at(-1)?.text).toBe('Theme already set to dark.')
  })

  it('opens a project once during submission and resets the input', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { result, submit, rerender } = renderSession()
    const project = terminalTestProjects[0]
    if (!project) throw new Error('Expected a terminal project fixture')

    submit('open 1')
    rerender({ theme: 'dark' })

    expect(open).toHaveBeenCalledExactlyOnceWith(
      project.liveUrl,
      '_blank',
      'noopener,noreferrer'
    )
    expect(result.current.input).toBe('')
  })

  it('bounds a long-running transcript and its navigable command history', () => {
    const { result, submit, recall } = renderSession()
    const submittedCount = MAX_TERMINAL_OUTPUT_LINES + 5

    for (let index = 0; index < submittedCount; index += 1) {
      submit(`echo ${String(index)}`)
    }

    expect(result.current.lines).toHaveLength(MAX_TERMINAL_OUTPUT_LINES)
    for (let index = 0; index < submittedCount; index += 1) {
      recall('previous')
    }
    expect(result.current.input).toBe(
      `echo ${String(submittedCount - MAX_COMMAND_HISTORY)}`
    )
  })
})
