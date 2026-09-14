import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useCallback, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { profile, projects } from '@content'
import type { TerminalWindowProps } from '@features/terminal'

import { loadTerminal } from './loadTerminal'
import { TerminalHost } from './TerminalHost'

vi.mock('./loadTerminal', () => ({ loadTerminal: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function LoadedTerminal({ onClose, theme }: TerminalWindowProps) {
  return (
    <div aria-label="Loaded terminal" data-theme={theme} role="dialog">
      <button onClick={onClose} type="button">
        Close terminal
      </button>
    </div>
  )
}

function HostHarness() {
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const close = useCallback(() => {
    setOpener(null)
  }, [])
  return (
    <>
      <h1>Portfolio stays available</h1>
      <button
        onClick={(event) => {
          setOpener(event.currentTarget)
        }}
        type="button"
      >
        Open terminal
      </button>
      <button
        onClick={() => {
          setTheme('dark')
        }}
        type="button"
      >
        Dark theme
      </button>
      {opener ? (
        <TerminalHost
          opener={opener}
          onClose={close}
          onToggleTheme={() => {
            setTheme('dark')
          }}
          profile={profile}
          projects={projects}
          theme={theme}
        />
      ) : null}
    </>
  )
}

beforeEach(() => {
  vi.mocked(loadTerminal).mockReset()
})

describe('TerminalHost', () => {
  it('announces loading, dismisses with Escape, and ignores late success', async () => {
    const pending = deferred<typeof LoadedTerminal>()
    vi.mocked(loadTerminal).mockReturnValue(pending.promise)
    const user = userEvent.setup()
    render(<HostHarness />)
    const opener = screen.getByRole('button', { name: 'Open terminal' })
    await user.click(opener)
    expect(screen.getByRole('status')).toHaveTextContent('Loading terminal')
    expect(screen.getByRole('button', { name: 'Close terminal' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(opener).toHaveFocus()
    await act(async () => {
      pending.resolve(LoadedTerminal)
      await pending.promise
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading')).toHaveTextContent('Portfolio stays available')
  })

  it('contains rejected downloads and supports a successful retry', async () => {
    vi.mocked(loadTerminal)
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(LoadedTerminal)
    const user = userEvent.setup()
    render(<HostHarness />)
    const opener = screen.getByRole('button', { name: 'Open terminal' })
    await user.click(opener)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not load')
    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(
      await screen.findByRole('dialog', { name: 'Loaded terminal' })
    ).toHaveAttribute('data-theme', 'light')
    await user.click(screen.getByRole('button', { name: 'Dark theme' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-theme', 'dark')
    expect(loadTerminal).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: 'Close terminal' }))
    expect(opener).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps a persistent failure dismissible and offers explicit reload recovery', async () => {
    vi.mocked(loadTerminal).mockRejectedValue(new Error('Stale asset'))
    const user = userEvent.setup()
    render(<HostHarness />)
    const opener = screen.getByRole('button', { name: 'Open terminal' })
    await user.click(opener)
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeEnabled()
    await user.keyboard('{Escape}')
    expect(opener).toHaveFocus()
  })

  it('ignores rejection after dismissal and allows reopening', async () => {
    const pending = deferred<typeof LoadedTerminal>()
    vi.mocked(loadTerminal)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(LoadedTerminal)
    const user = userEvent.setup()
    render(<HostHarness />)
    const opener = screen.getByRole('button', { name: 'Open terminal' })
    await user.click(opener)
    await user.click(screen.getByRole('button', { name: 'Close terminal' }))
    await act(async () => {
      pending.reject(new Error('Offline'))
      await pending.promise.catch(() => undefined)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(opener)
    expect(
      await screen.findByRole('dialog', { name: 'Loaded terminal' })
    ).toBeInTheDocument()
  })

  it('handles effect replay in StrictMode', async () => {
    vi.mocked(loadTerminal).mockResolvedValue(LoadedTerminal)
    const user = userEvent.setup()
    render(
      <StrictMode>
        <HostHarness />
      </StrictMode>
    )
    await user.click(screen.getByRole('button', { name: 'Open terminal' }))
    await screen.findByRole('dialog', { name: 'Loaded terminal' })
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Open terminal' })).toHaveFocus()
  })
})
