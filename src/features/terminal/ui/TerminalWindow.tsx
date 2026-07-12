import { motion, useDragControls } from 'framer-motion'
import {
  type PointerEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { FiX } from 'react-icons/fi'

import type { ThemeMode } from '@shared/types/common'
import type { ProfileData, Project } from '@shared/types/portfolio.types'

import {
  appendTerminalLines,
  createInitialTerminalLines,
  resolveTerminalCommand,
  type TerminalLine,
} from '../model/terminal'
import { getTerminalToneClass, terminalThemeClasses } from '../model/terminalTheme'

interface TerminalWindowProps {
  profile: ProfileData
  projects: readonly Project[]
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
  const openerRef = useRef<HTMLElement | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() =>
    appendTerminalLines([], createInitialTerminalLines(profile))
  )
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  useEffect(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()

    return () => {
      openerRef.current?.focus()
    }
  }, [])

  const closeTerminal = useCallback(() => {
    openerRef.current?.focus()
    onClose()
  }, [onClose])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTerminal()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closeTerminal])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [terminalLines])

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragControls.start(event)
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

  const onTerminalSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    runCommand(terminalInput)
    setTerminalInput('')
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
              className="group flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
              onClick={closeTerminal}
              onPointerDown={(event) => {
                event.stopPropagation()
              }}
              type="button"
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f56]">
                <FiX className="hidden h-2 w-2 text-black/60 group-hover:block group-focus-visible:block" />
              </span>
            </button>
            <div aria-hidden className="my-1.5 h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div aria-hidden className="my-1.5 h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>

          <div
            className={`flex items-center justify-center text-[13px] font-medium tracking-normal ${terminalTheme.title}`}
          >
            <span>{profile.githubUsername} — -zsh — 80x24</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-transparent font-mono text-sm leading-relaxed">
          <div
            aria-label="Terminal output"
            className="min-h-0 flex-1 overflow-y-auto px-4 pt-4"
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
          </div>

          <form
            className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-4 sm:flex-nowrap"
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
              className={`min-w-0 flex-1 rounded-sm bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${terminalTheme.input}`}
              id="floating-terminal-input"
              onChange={(event) => {
                setTerminalInput(event.target.value)
              }}
              placeholder="help"
              ref={inputRef}
              spellCheck={false}
              type="text"
              value={terminalInput}
            />
            <button
              aria-label="Run terminal command"
              className="sr-only"
              tabIndex={-1}
              type="submit"
            >
              Run command
            </button>
            <span
              aria-hidden
              className={`animate-pulse motion-reduce:animate-none ${terminalTheme.cursor}`}
            >
              {profile.heroTerminalPrompt}
            </span>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
