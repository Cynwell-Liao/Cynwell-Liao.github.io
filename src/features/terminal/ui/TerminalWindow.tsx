import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiFolder, FiTerminal } from 'react-icons/fi'

import { cn } from '@shared/lib/cn'

import {
  appendTerminalLines,
  createInitialTerminalLines,
  resolveTerminalCommand,
} from '../model/terminal'
import { getTerminalToneClass } from '../model/terminalTheme'
import { useTerminalWindow } from '../model/useTerminalWindow'

import { TerminalWindowControls } from './TerminalWindowControls'

import type { TerminalLine } from '../model/terminal'
import type { TerminalWindowProps } from '../model/terminal.types'
import type { KeyboardEvent, SyntheticEvent } from 'react'

import './TerminalWindow.css'

export function TerminalWindow({
  profile,
  projects,
  theme,
  onClose,
  onToggleTheme,
}: TerminalWindowProps) {
  const reducedMotion = useReducedMotion()
  const {
    mode,
    bounds,
    toggleExpanded,
    toggleZoom,
    restoreWindowed,
    tile,
    startDrag,
    startResize,
    resizeBy,
  } = useTerminalWindow()
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const characterRef = useRef<HTMLSpanElement>(null)
  const restoreRef = useRef<HTMLButtonElement>(null)
  const [minimized, setMinimized] = useState(false)
  const [active, setActive] = useState(true)
  const [inputFocused, setInputFocused] = useState(true)
  const [dimensions, setDimensions] = useState({ columns: 80, rows: 24 })
  const [terminalInput, setTerminalInput] = useState('')
  const [caret, setCaret] = useState({ position: 0, scroll: 0, selected: false })
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() =>
    appendTerminalLines([], createInitialTerminalLines(profile))
  )
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const historyIndex = useRef<number | null>(null)
  const historyDraft = useRef('')
  const minimizedView = useRef<{
    selectionStart: number
    selectionEnd: number
    selectionDirection: 'forward' | 'backward' | 'none'
    inputScroll: number
    outputScroll: number
  } | null>(null)

  useLayoutEffect(() => {
    if (minimized) {
      restoreRef.current?.focus()
      return
    }
    const input = inputRef.current
    input?.focus({ preventScroll: true })
    const savedView = minimizedView.current
    if (input && savedView) {
      input.setSelectionRange(
        savedView.selectionStart,
        savedView.selectionEnd,
        savedView.selectionDirection
      )
      input.scrollLeft = savedView.inputScroll
      if (screenRef.current) screenRef.current.scrollTop = savedView.outputScroll
    }
  }, [minimized])

  useEffect(() => {
    const terminalScreen = screenRef.current
    const character = characterRef.current
    if (!terminalScreen || !character) return

    const updateDimensions = () => {
      const cell = character.getBoundingClientRect()
      if (cell.width === 0 || cell.height === 0) return
      setDimensions({
        columns: Math.max(
          1,
          Math.floor((terminalScreen.clientWidth - 12) / cell.width)
        ),
        rows: Math.max(1, Math.floor((terminalScreen.clientHeight - 8) / cell.height)),
      })
    }
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(terminalScreen)
    updateDimensions()
    return () => {
      observer.disconnect()
    }
  }, [minimized])

  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight
    }
  }, [terminalLines])

  useEffect(() => {
    const updateActive = (event: globalThis.PointerEvent) => {
      setActive(
        event.target instanceof Node &&
          Boolean(dialogRef.current?.contains(event.target))
      )
    }
    const deactivate = () => {
      setActive(false)
    }
    const activate = () => {
      setActive(Boolean(dialogRef.current?.contains(document.activeElement)))
    }
    document.addEventListener('pointerdown', updateActive)
    window.addEventListener('blur', deactivate)
    window.addEventListener('focus', activate)
    return () => {
      document.removeEventListener('pointerdown', updateActive)
      window.removeEventListener('blur', deactivate)
      window.removeEventListener('focus', activate)
    }
  }, [])

  const resetInput = () => {
    setTerminalInput('')
    setCaret({ position: 0, scroll: 0, selected: false })
    historyIndex.current = null
    historyDraft.current = ''
  }

  const pushTerminalOutput = (input: string, output: TerminalLine[]) => {
    setTerminalLines((previousLines) =>
      appendTerminalLines(previousLines, [
        { text: `${profile.heroTerminalPath} % ${input}`, tone: 'default' },
        ...output,
      ])
    )
  }

  const runCommand = (rawInput: string) => {
    const commandResult = resolveTerminalCommand({
      rawInput,
      profile,
      projects,
      theme,
      commandHistory,
    })
    if (!commandResult) {
      pushTerminalOutput('', [])
      return
    }
    setCommandHistory(commandResult.nextCommandHistory)
    if (commandResult.shouldToggleTheme) onToggleTheme()
    if (commandResult.openUrl) {
      window.open(commandResult.openUrl, '_blank', 'noopener,noreferrer')
    }
    if (commandResult.shouldClear) {
      setTerminalLines([])
      return
    }
    pushTerminalOutput(commandResult.executedInput, commandResult.output)
  }

  const onTerminalSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    runCommand(terminalInput)
    resetInput()
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    const key = event.key.toLowerCase()
    if ((event.ctrlKey && key === 'l') || (event.metaKey && key === 'k')) {
      event.preventDefault()
      setTerminalLines([])
    } else if (event.ctrlKey && key === 'c' && !window.getSelection()?.toString()) {
      event.preventDefault()
      pushTerminalOutput(`${terminalInput}^C`, [])
      resetInput()
    } else if (event.ctrlKey && key === 'u') {
      event.preventDefault()
      resetInput()
    } else if (
      (key === 'arrowup' || key === 'arrowdown') &&
      commandHistory.length > 0
    ) {
      event.preventDefault()
      const current = historyIndex.current ?? commandHistory.length
      if (historyIndex.current === null) historyDraft.current = terminalInput
      const next = Math.max(
        0,
        Math.min(commandHistory.length, current + (key === 'arrowup' ? -1 : 1))
      )
      historyIndex.current = next === commandHistory.length ? null : next
      const nextInput = commandHistory[next] ?? historyDraft.current
      setTerminalInput(nextInput)
      setCaret({ position: nextInput.length, scroll: 0, selected: false })
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(nextInput.length, nextInput.length)
      })
    }
  }

  const expand = () => {
    toggleExpanded()
    inputRef.current?.focus()
  }

  const minimize = () => {
    const input = inputRef.current
    if (input) {
      minimizedView.current = {
        selectionStart: input.selectionStart ?? 0,
        selectionEnd: input.selectionEnd ?? 0,
        selectionDirection: input.selectionDirection ?? 'none',
        inputScroll: input.scrollLeft,
        outputScroll: screenRef.current?.scrollTop ?? 0,
      }
    }
    setMinimized(true)
  }

  return (
    <div className="terminal-desktop" data-theme={theme}>
      {minimized ? (
        <motion.button
          animate={{ opacity: 1, y: 0 }}
          aria-label="Restore terminal"
          className="terminal-dock-item"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          onClick={() => {
            setMinimized(false)
            setActive(true)
          }}
          ref={restoreRef}
          title="Restore Terminal"
          type="button"
        >
          <span aria-hidden className="terminal-dock-icon">
            <FiTerminal />
          </span>
          <span>Terminal</span>
          <span aria-hidden className="terminal-dock-indicator" />
        </motion.button>
      ) : (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          aria-label="Terminal"
          className={cn(
            'terminal-window',
            mode === 'fullscreen' && 'terminal-window--fullscreen'
          )}
          data-active={active}
          data-theme={theme}
          data-window-mode={mode}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setActive(false)
          }}
          onFocusCapture={() => {
            setActive(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && mode !== 'windowed') {
              event.preventDefault()
              event.stopPropagation()
              if (mode === 'fullscreen') toggleExpanded()
              else restoreWindowed()
              inputRef.current?.focus()
            } else if (event.metaKey && event.key.toLowerCase() === 'm') {
              event.preventDefault()
              minimize()
            }
          }}
          ref={dialogRef}
          role="dialog"
          style={{
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
        >
          <div
            className="terminal-titlebar"
            data-testid="terminal-titlebar"
            onDoubleClick={() => {
              toggleZoom()
              inputRef.current?.focus()
            }}
            onPointerDown={startDrag}
          >
            <div className="terminal-controls-position">
              <TerminalWindowControls
                expanded={mode === 'fullscreen'}
                onClose={onClose}
                onMinimize={minimize}
                onTile={(side) => {
                  tile(side)
                  inputRef.current?.focus()
                }}
                onToggleExpanded={expand}
              />
            </div>
            <span className="terminal-title">
              <FiFolder aria-hidden className="terminal-proxy-icon" />
              {profile.githubUsername} — -zsh — {dimensions.columns}×{dimensions.rows}
            </span>
          </div>
          <div
            className="terminal-screen"
            onPointerUp={(event) => {
              if (
                event.target !== inputRef.current &&
                !window.getSelection()?.toString()
              ) {
                inputRef.current?.focus()
              }
            }}
            ref={screenRef}
          >
            <span aria-hidden className="terminal-cell-measure" ref={characterRef}>
              M
            </span>
            <div aria-label="Terminal output" role="log">
              {terminalLines.map((line, index) => (
                <div
                  className={cn(
                    'terminal-line',
                    getTerminalToneClass(line.tone ?? 'default', theme)
                  )}
                  key={`${line.text}-${String(index)}`}
                >
                  {line.text || '\u00a0'}
                </div>
              ))}
            </div>
            <form className="terminal-command" onSubmit={onTerminalSubmit}>
              <label className="sr-only" htmlFor="floating-terminal-input">
                Terminal command input
              </label>
              <span className="terminal-prompt">
                {profile.heroTerminalPath} %&nbsp;
              </span>
              <span className="terminal-input-wrap">
                <input
                  aria-label="Terminal command input"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="terminal-input"
                  id="floating-terminal-input"
                  onBlur={() => {
                    setInputFocused(false)
                  }}
                  onChange={(event) => {
                    setTerminalInput(event.target.value)
                    historyIndex.current = null
                    setCaret({
                      position:
                        event.target.selectionStart ?? event.target.value.length,
                      scroll: event.target.scrollLeft,
                      selected: false,
                    })
                  }}
                  onFocus={() => {
                    setInputFocused(true)
                  }}
                  onKeyDown={onInputKeyDown}
                  onScroll={(event) => {
                    const scroll = event.currentTarget.scrollLeft
                    setCaret((previous) => ({ ...previous, scroll }))
                  }}
                  onSelect={(event) => {
                    const input = event.currentTarget
                    setCaret({
                      position: input.selectionStart ?? 0,
                      scroll: input.scrollLeft,
                      selected: input.selectionStart !== input.selectionEnd,
                    })
                  }}
                  ref={inputRef}
                  spellCheck={false}
                  type="text"
                  value={terminalInput}
                />
                {!caret.selected && (
                  <span
                    aria-hidden
                    className="terminal-caret-track"
                    style={{ left: -caret.scroll }}
                  >
                    <span className="terminal-caret-prefix">
                      {terminalInput.slice(0, caret.position)}
                    </span>
                    <span
                      className={cn(
                        'terminal-cursor',
                        (!inputFocused || !active) && 'terminal-cursor--inactive'
                      )}
                    />
                  </span>
                )}
              </span>
              <button
                aria-label="Run terminal command"
                className="sr-only"
                tabIndex={-1}
                type="submit"
              >
                Run command
              </button>
            </form>
          </div>
          {mode === 'windowed' && (
            <button
              aria-label="Resize terminal"
              className="terminal-resize-handle"
              onKeyDown={(event) => {
                const delta = event.shiftKey ? 48 : 16
                if (
                  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                    event.key
                  )
                ) {
                  event.preventDefault()
                  resizeBy(
                    event.key === 'ArrowRight'
                      ? delta
                      : event.key === 'ArrowLeft'
                        ? -delta
                        : 0,
                    event.key === 'ArrowDown'
                      ? delta
                      : event.key === 'ArrowUp'
                        ? -delta
                        : 0
                  )
                }
              }}
              onPointerDown={startResize}
              title="Resize terminal"
              type="button"
            />
          )}
        </motion.div>
      )}
    </div>
  )
}
