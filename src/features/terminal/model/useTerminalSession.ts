import { useRef, useState } from 'react'

import {
  appendTerminalLines,
  createInitialTerminalLines,
  resolveTerminalCommand,
} from './terminal'

import type { TerminalLine } from './terminal'
import type { TerminalWindowProps } from './terminal.types'

type TerminalSessionOptions = Pick<
  TerminalWindowProps,
  'profile' | 'projects' | 'theme' | 'onToggleTheme'
>

export function useTerminalSession({
  profile,
  projects,
  theme,
  onToggleTheme,
}: TerminalSessionOptions) {
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<TerminalLine[]>(() =>
    appendTerminalLines([], createInitialTerminalLines(profile))
  )
  const [history, setHistory] = useState<string[]>([])
  const historyIndex = useRef<number | null>(null)
  const historyDraft = useRef('')

  const editInput = (value: string) => {
    setInput(value)
    historyIndex.current = null
  }

  const clearInput = () => {
    setInput('')
    historyIndex.current = null
    historyDraft.current = ''
  }

  const clearOutput = () => {
    setLines([])
  }

  const appendOutput = (executedInput: string, output: TerminalLine[]) => {
    setLines((previousLines) =>
      appendTerminalLines(previousLines, [
        { text: `${profile.heroTerminalPath} % ${executedInput}`, tone: 'default' },
        ...output,
      ])
    )
  }

  const submit = () => {
    const result = resolveTerminalCommand({
      rawInput: input,
      profile,
      projects,
      theme,
      commandHistory: history,
    })

    if (result) {
      setHistory(result.nextCommandHistory)
      if (result.shouldToggleTheme) onToggleTheme()
      if (result.openUrl) {
        window.open(result.openUrl, '_blank', 'noopener,noreferrer')
      }
      if (result.shouldClear) clearOutput()
      else appendOutput(result.executedInput, result.output)
    } else {
      appendOutput('', [])
    }

    clearInput()
  }

  const cancelInput = () => {
    appendOutput(`${input}^C`, [])
    clearInput()
  }

  const recallHistory = (direction: 'previous' | 'next'): string | null => {
    if (history.length === 0) return null

    const current = historyIndex.current ?? history.length
    if (historyIndex.current === null) historyDraft.current = input
    const next = Math.max(
      0,
      Math.min(history.length, current + (direction === 'previous' ? -1 : 1))
    )
    historyIndex.current = next === history.length ? null : next
    const nextInput = history[next] ?? historyDraft.current
    setInput(nextInput)
    return nextInput
  }

  return {
    input,
    lines,
    editInput,
    clearInput,
    clearOutput,
    submit,
    cancelInput,
    recallHistory,
  }
}

export type TerminalSession = ReturnType<typeof useTerminalSession>
