import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ThemeMode } from '@shared/types/common'

import { MAX_COMMAND_HISTORY, MAX_TERMINAL_OUTPUT_LINES } from './terminal'
import { terminalTestProfile, terminalTestProjects } from './terminal.test-fixtures'
import { useTerminalSession } from './useTerminalSession'

function renderSession() {
  const onToggleTheme = vi.fn()
  const hook = renderHook(
    ({ theme }: { theme: ThemeMode }) =>
      useTerminalSession({
        profile: terminalTestProfile,
        projects: terminalTestProjects,
        theme,
        onToggleTheme,
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
  it('records an empty prompt without adding a blank command to history', () => {
    const { result, submit, recall } = renderSession()

    submit('   ')

    expect(result.current.lines.at(-1)?.text).toBe(
      `${terminalTestProfile.heroTerminalPath} % `
    )
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

    expect(result.current.lines.at(-1)?.text).toBe(
      `${terminalTestProfile.heroTerminalPath} % pwd^C`
    )
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

    submit('open 1')
    rerender({ theme: 'dark' })

    expect(open).toHaveBeenCalledExactlyOnceWith(
      terminalTestProjects[0].liveUrl,
      '_blank',
      'noopener,noreferrer'
    )
    expect(result.current.input).toBe('')
  })

  it('bounds a long-running transcript and its navigable command history', () => {
    const { result, submit, recall } = renderSession()
    const submittedCount = MAX_COMMAND_HISTORY + 5

    for (let index = 0; index < submittedCount; index += 1) {
      submit(`help ${String(index)}`)
    }

    expect(result.current.lines).toHaveLength(MAX_TERMINAL_OUTPUT_LINES)
    for (let index = 0; index < submittedCount; index += 1) {
      recall('previous')
    }
    expect(result.current.input).toBe('help 5')
  })
})
