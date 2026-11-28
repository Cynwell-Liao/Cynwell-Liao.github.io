import { motion, useReducedMotion } from 'framer-motion'

import { useTerminalControlPress } from '../model/useTerminalControlPress'

import './TerminalWindowControls.css'

interface TerminalWindowControlsProps {
  expanded: boolean
  onClose: () => void
  onMinimize: () => void
  onToggleExpanded: (() => void) | undefined
}

export function TerminalWindowControls({
  expanded,
  onClose,
  onMinimize,
  onToggleExpanded,
}: TerminalWindowControlsProps) {
  const reducedMotion = useReducedMotion()
  const closePress = useTerminalControlPress(reducedMotion)
  const minimizePress = useTerminalControlPress(reducedMotion)
  const expandPress = useTerminalControlPress(reducedMotion)
  const expandDisabled = onToggleExpanded === undefined
  const pressTransition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 650, damping: 35 }

  return (
    <div
      aria-label="Terminal window controls"
      className="terminal-window-controls"
      onDoubleClick={(event) => {
        event.stopPropagation()
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
      }}
      role="group"
    >
      <button
        {...closePress.handlers}
        aria-label="Close terminal"
        className="terminal-window-control terminal-window-control--close"
        data-hovered={closePress.hovered}
        data-pressed={closePress.pressed}
        onClick={onClose}
        type="button"
      >
        <motion.span
          animate={closePress.animation}
          className="terminal-window-control-dot"
          initial={false}
          transition={pressTransition}
        >
          <svg
            aria-hidden="true"
            className="terminal-window-control__glyph"
            viewBox="0 0 12 12"
          >
            <path d="m3.7 3.7 4.6 4.6m0-4.6L3.7 8.3" />
          </svg>
        </motion.span>
      </button>
      <button
        {...minimizePress.handlers}
        aria-label="Minimize terminal"
        className="terminal-window-control terminal-window-control--minimize"
        data-hovered={minimizePress.hovered}
        data-pressed={minimizePress.pressed}
        onClick={onMinimize}
        type="button"
      >
        <motion.span
          animate={minimizePress.animation}
          className="terminal-window-control-dot"
          initial={false}
          transition={pressTransition}
        >
          <svg
            aria-hidden="true"
            className="terminal-window-control__glyph"
            viewBox="0 0 12 12"
          >
            <path d="M3 6h6" />
          </svg>
        </motion.span>
      </button>
      <button
        {...(expandDisabled ? {} : expandPress.handlers)}
        aria-label={
          expandDisabled
            ? 'Full screen locked'
            : expanded
              ? 'Exit full screen'
              : 'Enter full screen'
        }
        className="terminal-window-control terminal-window-control--expand"
        data-hovered={!expandDisabled && expandPress.hovered}
        data-pressed={!expandDisabled && expandPress.pressed}
        disabled={expandDisabled}
        onClick={onToggleExpanded}
        type="button"
      >
        <motion.span
          animate={expandDisabled ? { scale: 1, x: 0, y: 0 } : expandPress.animation}
          className="terminal-window-control-dot"
          initial={false}
          transition={pressTransition}
        >
          {!expandDisabled && (
            <svg
              aria-hidden="true"
              className="terminal-window-control__glyph"
              viewBox="0 0 12 12"
            >
              <path
                className="terminal-window-expand-glyph"
                d={
                  expanded
                    ? 'M6.5 2.5v3h3zM2.5 6.5h3v3z'
                    : 'M2.5 2.5h4l-4 4zM9.5 9.5h-4l4-4z'
                }
              />
            </svg>
          )}
        </motion.span>
      </button>
    </div>
  )
}
