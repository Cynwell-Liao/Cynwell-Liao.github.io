import { useState } from 'react'

import { cn } from '@shared/lib/cn'

import type { TerminalSession } from '../model/useTerminalSession'
import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react'

export interface TerminalCaret {
  position: number
  scroll: number
  selected: boolean
}

interface TerminalPromptProps {
  active: boolean
  session: TerminalSession
  inputRef: RefObject<HTMLInputElement | null>
  caret: TerminalCaret
  onCaretChange: Dispatch<SetStateAction<TerminalCaret>>
}

export function TerminalPrompt({
  active,
  session,
  inputRef,
  caret,
  onCaretChange,
}: TerminalPromptProps) {
  const [focused, setFocused] = useState(false)

  const resetCaret = () => {
    onCaretChange({ position: 0, scroll: 0, selected: false })
  }

  const moveCaret = (position: number) => {
    onCaretChange({ position, scroll: 0, selected: false })
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(position, position)
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    const key = event.key.toLowerCase()
    if (
      key === 'tab' &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey
    ) {
      const input = event.currentTarget
      if (
        input.selectionStart !== null &&
        input.selectionStart === input.selectionEnd
      ) {
        const position = session.complete(input.selectionStart)
        if (position !== null) {
          event.preventDefault()
          moveCaret(position)
        }
      }
    } else if (event.ctrlKey && key === 'r') {
      event.preventDefault()
      session.reverseSearch()
      if (!session.searching) resetCaret()
    } else if (session.searching && key === 'escape') {
      event.preventDefault()
      event.stopPropagation()
      session.cancelInput()
      resetCaret()
    } else if ((event.ctrlKey && key === 'l') || (event.metaKey && key === 'k')) {
      event.preventDefault()
      session.clearOutput()
    } else if (event.ctrlKey && key === 'c' && !window.getSelection()?.toString()) {
      event.preventDefault()
      session.cancelInput()
      resetCaret()
    } else if (event.ctrlKey && key === 'u') {
      event.preventDefault()
      session.clearInput()
      resetCaret()
    } else if (key === 'arrowup' || key === 'arrowdown') {
      const nextInput = session.recallHistory(key === 'arrowup' ? 'previous' : 'next')
      if (nextInput === null) return
      event.preventDefault()
      moveCaret(nextInput.length)
    }
  }

  return (
    <form
      className="terminal-command"
      onSubmit={(event) => {
        event.preventDefault()
        session.submit()
        if (session.searching) moveCaret(session.searchMatch?.length ?? 0)
        else resetCaret()
      }}
    >
      <label className="sr-only" htmlFor="floating-terminal-input">
        Terminal command input
      </label>
      <span className="terminal-prompt">
        {session.searching ? 'reverse-i-search:' : `${session.path} %`}&nbsp;
      </span>
      <span className="terminal-input-wrap">
        <span className="terminal-input-surface">
          <input
            aria-label="Terminal command input"
            aria-describedby={session.searching ? 'terminal-search-match' : undefined}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="terminal-input"
            enterKeyHint="enter"
            id="floating-terminal-input"
            onBlur={() => {
              setFocused(false)
            }}
            onChange={(event) => {
              const input = event.target
              session.editInput(input.value)
              onCaretChange({
                position: input.selectionStart ?? input.value.length,
                scroll: input.scrollLeft,
                selected: false,
              })
              // Chromium can update the insertion point after the change event,
              // especially when focus has just been restored after minimizing.
              requestAnimationFrame(() => {
                onCaretChange({
                  position: input.selectionStart ?? input.value.length,
                  scroll: input.scrollLeft,
                  selected: input.selectionStart !== input.selectionEnd,
                })
              })
            }}
            onFocus={() => {
              setFocused(true)
            }}
            onKeyDown={onKeyDown}
            onScroll={(event) => {
              const scroll = event.currentTarget.scrollLeft
              onCaretChange((previous) => ({ ...previous, scroll }))
            }}
            onSelect={(event) => {
              const input = event.currentTarget
              const syncCaret = () => {
                const position = input.selectionStart ?? 0
                const selected = position !== input.selectionEnd
                if (
                  !selected &&
                  position === input.value.length &&
                  input.scrollWidth > input.clientWidth
                ) {
                  // WebKit scrolls only the native insertion point into view. The
                  // custom block caret occupies one additional cell, so use the
                  // trailing input padding to reveal that cell as well.
                  input.scrollLeft = input.scrollWidth
                }
                onCaretChange({
                  position,
                  scroll: input.scrollLeft,
                  selected,
                })
              }
              syncCaret()
              // WebKit updates an input's horizontal scroll after dispatching its
              // selection event. Read it again once layout has settled.
              requestAnimationFrame(syncCaret)
            }}
            ref={inputRef}
            spellCheck={false}
            type="text"
            value={session.input}
          />
          {!caret.selected && (
            <span
              aria-hidden
              className="terminal-caret-track"
              style={{ left: -caret.scroll }}
            >
              <span className="terminal-caret-prefix">
                {session.input.slice(0, caret.position)}
              </span>
              <span
                className={cn(
                  'terminal-cursor',
                  (!focused || !active) && 'terminal-cursor--inactive'
                )}
              />
            </span>
          )}
        </span>
      </span>
      {session.searching && (
        <span
          className="terminal-search-match"
          id="terminal-search-match"
          role="status"
        >
          {session.searchMatch ?? 'No matching command'} · Enter to recall · Esc to
          cancel
        </span>
      )}
      <button
        aria-label="Run terminal command"
        className="sr-only"
        tabIndex={-1}
        type="submit"
      >
        Run command
      </button>
    </form>
  )
}
