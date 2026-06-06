import { motion, useDragControls } from 'framer-motion'
import {
  type PointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { FiX } from 'react-icons/fi'

import {
  createInitialTerminalLines,
  resolveTerminalCommand,
  type TerminalLine,
} from '../model/terminal'
import { getTerminalToneClass, terminalThemeClasses } from '../model/terminalTheme'

import type { ThemeMode } from '@shared/types/common'
import type { ProfileData, Project } from '@shared/types/portfolio.types'

interface TerminalWindowProps {
  profile: ProfileData
  projects: Project[]
  theme: ThemeMode
  onClose: () => void
  onToggleTheme: () => void
}

export function TerminalWindow({
  profile,
  projects,
  theme,
  onClose,
  onToggleTheme,
}: TerminalWindowProps) {
  const terminalTheme = terminalThemeClasses[theme]
  const dragControls = useDragControls()
  const constraintsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() =>
    createInitialTerminalLines(profile)
  )
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [terminalLines])

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragControls.start(event)
  }

  const pushTerminalOutput = (input: string, output: TerminalLine[]) => {
    setTerminalLines((previousLines) => [
      ...previousLines,
      { text: `${profile.heroTerminalPath} % ${input}`, tone: 'default' },
      ...output,
    ])
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
      return
    }

    setCommandHistory(commandResult.nextCommandHistory)

    if (commandResult.shouldToggleTheme) {
      onToggleTheme()
    }

    if (commandResult.openUrl) {
      window.open(commandResult.openUrl, '_blank', 'noopener,noreferrer')
    }

    if (commandResult.shouldClear) {
      setTerminalLines([])
      return
    }

    pushTerminalOutput(commandResult.executedInput, commandResult.output)
  }

  const executeCurrentInput = () => {
    runCommand(inputRef.current?.value ?? terminalInput)
    setTerminalInput('')
  }

  const onTerminalSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    executeCurrentInput()
  }

  const onTerminalInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      executeCurrentInput()
    }
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[70] flex items-start justify-center overflow-hidden px-3 py-20 sm:px-6 sm:py-24"
      ref={constraintsRef}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        aria-label="Linux terminal"
        className={`pointer-events-auto flex h-[min(68vh,32rem)] w-[min(calc(100vw-1.5rem),48rem)] flex-col overflow-hidden rounded-lg border ${terminalTheme.chrome}`}
        data-theme={theme}
        drag
        dragConstraints={constraintsRef}
        dragControls={dragControls}
        dragElastic={0}
        dragListener={false}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.96 }}
        role="dialog"
      >
        <div
          className={`relative flex h-11 cursor-grab touch-none items-center justify-center px-4 active:cursor-grabbing ${terminalTheme.titleBar}`}
          onPointerDown={startDrag}
        >
          <div className="absolute left-4 flex gap-2">
            <button
              aria-label="Close terminal"
              className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f56] transition-colors hover:bg-[#ff5f56]"
              onClick={onClose}
              type="button"
            >
              <FiX className="hidden h-2 w-2 text-black/60 group-hover:block" />
            </button>
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>

          <div
            className={`flex items-center justify-center text-[13px] font-medium tracking-normal ${terminalTheme.title}`}
          >
            <span>cynwell — -zsh — 80x24</span>
          </div>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 py-4 font-mono text-sm leading-relaxed ${terminalTheme.body}`}
          ref={outputRef}
          role="log"
        >
          {terminalLines.map((line, index) => {
            const tone = line.tone ?? 'default'

            return (
              <div
                className={`${getTerminalToneClass(tone, theme)} break-words`}
                key={`${line.text}-${String(index)}`}
              >
                {line.text}
              </div>
            )
          })}

          <form
            className="mt-2 flex flex-wrap items-center gap-2 sm:flex-nowrap"
            onSubmit={onTerminalSubmit}
          >
            <label className="sr-only" htmlFor="floating-terminal-input">
              Terminal command input
            </label>
            <span className={`break-all ${terminalTheme.prompt}`}>
              {profile.heroTerminalPath}
            </span>
            <span className={`mr-2 ${terminalTheme.promptSymbol}`}>%</span>
            <input
              aria-label="Terminal command input"
              autoComplete="off"
              className={`min-w-0 flex-1 bg-transparent outline-none ${terminalTheme.input}`}
              id="floating-terminal-input"
              onChange={(event) => {
                setTerminalInput(event.target.value)
              }}
              onKeyDown={onTerminalInputKeyDown}
              placeholder="help"
              ref={inputRef}
              spellCheck={false}
              type="text"
              value={terminalInput}
            />
            <button
              aria-label="Run terminal command"
              className="sr-only"
              onClick={executeCurrentInput}
              tabIndex={-1}
              type="button"
            >
              Run command
            </button>
            <span aria-hidden className={`animate-pulse ${terminalTheme.cursor}`}>
              {profile.heroTerminalPrompt}
            </span>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
