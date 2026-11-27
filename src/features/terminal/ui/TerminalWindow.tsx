import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FiFolder, FiTerminal } from 'react-icons/fi'

import { cn } from '@shared/lib/cn'

import { getTerminalToneClass } from '../model/terminalTheme'
import { useTerminalSession } from '../model/useTerminalSession'
import { useTerminalViewport } from '../model/useTerminalViewport'
import { useTerminalWindow } from '../model/useTerminalWindow'

import { TerminalPrompt } from './TerminalPrompt'
import { TerminalWindowControls } from './TerminalWindowControls'

import type { TerminalCaret } from './TerminalPrompt'
import type { TerminalWindowProps } from '../model/terminal.types'

import './TerminalWindow.css'

export function TerminalWindow(props: TerminalWindowProps) {
  const {
    theme,
    onClose,
    activationRequest = 0,
    onMinimizedChange,
    onFullscreenChange,
  } = props
  const reducedMotion = useReducedMotion()
  const session = useTerminalSession(props)
  const mobileViewport = useTerminalViewport()
  const isMobile = mobileViewport !== null
  const {
    mode,
    bounds,
    toggleExpanded,
    toggleZoom,
    restoreWindowed,
    startDrag,
    startResize,
    resizeBy,
  } = useTerminalWindow()
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const scrollbackRef = isMobile ? outputRef : screenRef
  const restoreRef = useRef<HTMLButtonElement>(null)
  const [minimized, setMinimized] = useState(false)
  const [hasMinimized, setHasMinimized] = useState(false)
  const [handledActivation, setHandledActivation] = useState(activationRequest)
  const [active, setActive] = useState(true)
  // Keep the caret snapshot when minimizing unmounts the prompt.
  const [caret, setCaret] = useState<TerminalCaret>({
    position: 0,
    scroll: 0,
    selected: false,
  })
  const minimizedView = useRef<{
    selectionStart: number
    selectionEnd: number
    selectionDirection: 'forward' | 'backward' | 'none'
    inputScroll: number
    outputScroll: number
  } | null>(null)

  // Clicking the app in the Dock un-minimizes the window and brings it forward.
  if (activationRequest !== handledActivation) {
    setHandledActivation(activationRequest)
    setMinimized(false)
    setActive(true)
  }

  useLayoutEffect(() => {
    if (minimized) {
      restoreRef.current?.focus()
      return
    }
    const input = inputRef.current
    // Touch users choose when to open the keyboard by tapping the prompt.
    const focusTarget = isMobile ? dialogRef.current : input
    focusTarget?.focus({ preventScroll: true })
    const savedView = minimizedView.current
    if (input && savedView) {
      const restoreView = () => {
        input.setSelectionRange(
          savedView.selectionStart,
          savedView.selectionEnd,
          savedView.selectionDirection
        )
        input.scrollLeft = savedView.inputScroll
        if (scrollbackRef.current) {
          scrollbackRef.current.scrollTop = savedView.outputScroll
        }
      }
      restoreView()
      // WebKit may apply focus-based scroll anchoring after layout effects.
      // Reapply the saved view on the next frame once that adjustment settles.
      let settledFrame = 0
      const frame = requestAnimationFrame(() => {
        settledFrame = requestAnimationFrame(restoreView)
      })
      minimizedView.current = null
      return () => {
        cancelAnimationFrame(frame)
        cancelAnimationFrame(settledFrame)
      }
    }
    return undefined
  }, [minimized, handledActivation, isMobile, scrollbackRef])

  useEffect(() => {
    onFullscreenChange?.(mode === 'fullscreen' && !minimized)
  }, [mode, minimized, onFullscreenChange])

  useEffect(() => {
    if (scrollbackRef.current) {
      scrollbackRef.current.scrollTop = scrollbackRef.current.scrollHeight
    }
  }, [session.lines, scrollbackRef])

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

  const focusWindow = () => {
    const target = isMobile ? dialogRef.current : inputRef.current
    target?.focus({ preventScroll: true })
  }

  const expand = () => {
    toggleExpanded()
    focusWindow()
  }

  const minimize = () => {
    const input = inputRef.current
    if (input) {
      minimizedView.current = {
        selectionStart: input.selectionStart ?? 0,
        selectionEnd: input.selectionEnd ?? 0,
        selectionDirection: input.selectionDirection ?? 'none',
        inputScroll: input.scrollLeft,
        outputScroll: scrollbackRef.current?.scrollTop ?? 0,
      }
    }
    setMinimized(true)
    setHasMinimized(true)
    onMinimizedChange?.(true)
  }

  // macOS "Scale effect": the window shrinks toward its minimized Dock tile,
  // which sits just right of the Dock's centre, and grows back out of it.
  const dockTransform = {
    opacity: 0,
    scale: 0.08,
    x: window.innerWidth / 2 + 72 - (bounds.x + bounds.width / 2),
    y: window.innerHeight - 48 - (bounds.y + bounds.height / 2),
  }

  const mobileMargin = mode === 'fullscreen' ? '0' : '12'
  const insetLeft = `max(${mobileMargin}px, env(safe-area-inset-left))`
  const insetRight = `max(${mobileMargin}px, env(safe-area-inset-right))`
  const insetTop = `max(${mobileMargin}px, env(safe-area-inset-top))`
  const insetBottom = `max(${mobileMargin}px, env(safe-area-inset-bottom))`
  const mobileHeight = mobileViewport
    ? `max(1px, calc(${String(mobileViewport.height)}px - ${insetTop} - ${insetBottom}))`
    : ''
  const windowStyle = mobileViewport
    ? {
        left: `calc(${String(mobileViewport.offsetLeft)}px + ${insetLeft})`,
        top: `calc(${String(mobileViewport.offsetTop)}px + ${insetTop})`,
        width: `max(1px, calc(${String(mobileViewport.width)}px - ${insetLeft} - ${insetRight}))`,
        height: mode === 'fullscreen' ? mobileHeight : `min(560px, ${mobileHeight})`,
      }
    : { left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }

  return (
    <div className="terminal-desktop" data-mobile={isMobile} data-theme={theme}>
      {minimized && !onMinimizedChange && (
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
          transition={{ duration: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}
          type="button"
        >
          <span aria-hidden className="terminal-dock-icon">
            <FiTerminal />
          </span>
          <span>Terminal</span>
          <span aria-hidden className="terminal-dock-indicator" />
        </motion.button>
      )}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            aria-label="Terminal"
            className={cn(
              'terminal-window',
              mode === 'fullscreen' && 'terminal-window--fullscreen'
            )}
            data-active={active}
            data-theme={theme}
            data-window-mode={mode}
            exit={reducedMotion || isMobile ? { opacity: 0 } : dockTransform}
            initial={
              reducedMotion
                ? false
                : isMobile
                  ? { opacity: 0 }
                  : hasMinimized
                    ? dockTransform
                    : { opacity: 0, scale: 0.97 }
            }
            key="terminal-window"
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
                focusWindow()
              } else if (event.metaKey && event.key.toLowerCase() === 'm') {
                event.preventDefault()
                minimize()
              }
            }}
            ref={dialogRef}
            role="dialog"
            style={{
              ...windowStyle,
              transformOrigin: 'center',
            }}
            tabIndex={-1}
            transition={{
              duration: reducedMotion ? 0 : hasMinimized ? 0.38 : 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className="terminal-titlebar"
              data-testid="terminal-titlebar"
              onDoubleClick={() => {
                if (isMobile) return
                toggleZoom()
                focusWindow()
              }}
              onPointerDown={isMobile ? undefined : startDrag}
            >
              <div className="terminal-controls-position">
                <TerminalWindowControls
                  expanded={mode === 'fullscreen'}
                  onClose={onClose}
                  onMinimize={minimize}
                  onToggleExpanded={expand}
                />
              </div>
              <span className="terminal-title">
                <FiFolder aria-hidden className="terminal-proxy-icon" />
                {props.profile.githubUsername} — Portfolio Shell
              </span>
            </div>
            <div
              className="terminal-screen"
              onPointerUp={(event) => {
                if (
                  event.pointerType === 'mouse' &&
                  event.target !== inputRef.current &&
                  !window.getSelection()?.toString() &&
                  !(event.target instanceof Element && event.target.closest('a'))
                ) {
                  inputRef.current?.focus({ preventScroll: true })
                }
              }}
              ref={screenRef}
            >
              <div
                aria-label="Terminal output"
                className="terminal-output"
                ref={outputRef}
                role="log"
              >
                {session.lines.map((line, index) => (
                  <div
                    className={cn(
                      'terminal-line',
                      getTerminalToneClass(line.tone ?? 'default')
                    )}
                    key={`${line.text}-${String(index)}`}
                  >
                    {line.url ? (
                      <a
                        className="terminal-link"
                        href={line.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {line.text}
                      </a>
                    ) : (
                      line.text || '\u00a0'
                    )}
                  </div>
                ))}
              </div>
              <TerminalPrompt
                active={active}
                caret={caret}
                inputRef={inputRef}
                onCaretChange={setCaret}
                session={session}
              />
            </div>
            {mode === 'windowed' && !isMobile && (
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
      </AnimatePresence>
    </div>
  )
}
