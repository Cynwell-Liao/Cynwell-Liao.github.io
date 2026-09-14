import { useEffect, useRef, useState } from 'react'

import type { TerminalWindowProps } from '@features/terminal'

import { loadTerminal } from './loadTerminal'

import type { ComponentType } from 'react'

type TerminalLoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; Component: ComponentType<TerminalWindowProps> }

interface TerminalHostProps extends TerminalWindowProps {
  opener: HTMLElement
}

function TerminalLoadNotice({
  failed,
  onClose,
  onRetry,
}: {
  failed: boolean
  onClose: () => void
  onRetry: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [failed])

  const buttonClass =
    'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-600 dark:border-slate-600 dark:focus-visible:outline-accent-300'

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-start justify-center px-3 py-20 sm:px-6 sm:py-24">
      <div
        aria-label="Terminal loading"
        className="pointer-events-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        role="dialog"
      >
        <p role={failed ? 'alert' : 'status'}>
          {failed
            ? 'The terminal could not load. Try again or reload this page.'
            : 'Loading terminal…'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className={buttonClass}
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            Close terminal
          </button>
          {failed ? (
            <>
              <button className={buttonClass} onClick={onRetry} type="button">
                Retry
              </button>
              <button
                className={buttonClass}
                onClick={() => {
                  window.location.reload()
                }}
                type="button"
              >
                Reload page
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function TerminalHost({ opener, onClose, ...terminalProps }: TerminalHostProps) {
  const [attempt, setAttempt] = useState(0)
  const [loadState, setLoadState] = useState<TerminalLoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    void loadTerminal().then(
      (Component) => {
        if (active) setLoadState({ status: 'ready', Component })
      },
      () => {
        if (active) setLoadState({ status: 'error' })
      }
    )
    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      opener.focus()
    }
  }, [onClose, opener])

  if (loadState.status === 'ready') {
    return <loadState.Component {...terminalProps} onClose={onClose} />
  }

  return (
    <TerminalLoadNotice
      failed={loadState.status === 'error'}
      onClose={onClose}
      onRetry={() => {
        setLoadState({ status: 'loading' })
        setAttempt((current) => current + 1)
      }}
    />
  )
}
