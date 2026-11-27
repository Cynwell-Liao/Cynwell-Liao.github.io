import { useRef, useState } from 'react'

import { openExternalUrl } from '@shared/lib/browser/openExternalUrl'

import {
  appendTerminalLines,
  createInitialTerminalLines,
  displayPath,
  getCompletions,
  MAX_COMMAND_HISTORY,
  resolveTerminalCommand,
} from './terminal'
import { HOME_PATH } from './terminalFs'

import type { TerminalLine } from './terminal'
import type { TerminalWindowProps } from './terminal.types'

type TerminalSessionOptions = Omit<TerminalWindowProps, 'onClose'> & {
  onClose?: () => void
}

const HISTORY_KEY = 'portfolio-terminal-history'

function readHistory(): string[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]')
    return Array.isArray(stored)
      ? stored
          .filter((item): item is string => typeof item === 'string')
          .slice(-MAX_COMMAND_HISTORY)
      : []
  } catch {
    return []
  }
}

function saveHistory(history: string[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // In-memory history is still available if storage is restricted.
  }
}

function findHistoryMatch(history: readonly string[], query: string, before: number) {
  for (let index = before - 1; index >= 0; index--) {
    if (history[index]?.includes(query)) return index
  }
  return -1
}

export function useTerminalSession(options: TerminalSessionOptions) {
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<TerminalLine[]>(createInitialTerminalLines)
  const [history, setHistory] = useState(readHistory)
  const [cwd, setCwd] = useState(HOME_PATH)
  const [search, setSearch] = useState<{ query: string; before: number } | null>(null)
  const historyIndex = useRef<number | null>(null)
  const historyDraft = useRef('')
  const completionNotice = useRef<string | null>(null)
  const searchIndex = search
    ? findHistoryMatch(history, search.query, search.before)
    : -1
  const searchMatch = history[searchIndex]

  const editInput = (value: string) => {
    if (search) setSearch({ query: value, before: history.length })
    else setInput(value)
    completionNotice.current = null
    historyIndex.current = null
  }

  const clearInput = () => {
    setInput('')
    setSearch(null)
    completionNotice.current = null
    historyIndex.current = null
    historyDraft.current = ''
  }

  const clearOutput = () => {
    setLines([])
  }

  const appendOutput = (executedInput: string, output: TerminalLine[]) => {
    setLines((previousLines) =>
      appendTerminalLines(previousLines, [
        { text: `${displayPath(cwd)} % ${executedInput}`, tone: 'default' },
        ...output,
      ])
    )
  }

  const submit = () => {
    if (search) {
      setSearch(null)
      if (searchMatch !== undefined) editDraft(searchMatch)
      return
    }
    const result = resolveTerminalCommand({
      ...options,
      rawInput: input,
      cwd,
      commandHistory: history,
    })

    if (result) {
      setHistory(result.nextCommandHistory)
      saveHistory(result.nextCommandHistory)
      if (result.shouldFollowSystemTheme) options.onFollowSystemTheme?.()
      if (result.themeTarget && options.onSetTheme)
        options.onSetTheme(result.themeTarget)
      else if (result.shouldToggleTheme) options.onToggleTheme()
      if (result.nextPath) setCwd(result.nextPath)
      if (result.shouldExit) options.onClose?.()
      if (result.openUrl) {
        openExternalUrl(result.openUrl)
      }
      if (result.shouldClear) clearOutput()
      else appendOutput(result.executedInput, result.output)
    } else {
      appendOutput('', [])
    }

    clearInput()
  }

  const cancelInput = () => {
    if (search) {
      setSearch(null)
      return
    }
    appendOutput(`${input}^C`, [])
    clearInput()
  }

  const recallHistory = (direction: 'previous' | 'next'): string | null => {
    if (search) return null
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
    completionNotice.current = null
    return nextInput
  }

  const editDraft = (value: string) => {
    setInput(value)
    historyIndex.current = null
    completionNotice.current = null
  }

  const reverseSearch = () => {
    if (!search) setSearch({ query: '', before: history.length })
    else if (findHistoryMatch(history, search.query, searchIndex) >= 0) {
      setSearch({ ...search, before: searchIndex })
    }
  }

  const complete = (position: number): number | null => {
    if (search || !input.trim() || /\S/u.test(input.charAt(position))) return null
    const before = input.slice(0, position)
    const { prefix, candidates } = getCompletions(options, cwd, before)
    const first = candidates[0]
    if (!first) return null
    let common = first
    for (const candidate of candidates) {
      while (!candidate.startsWith(common)) common = common.slice(0, -1)
    }
    const after = input.slice(position)
    const suffix = candidates.length === 1 && !common.endsWith('/') && !after ? ' ' : ''
    if (common !== prefix || suffix) {
      editDraft(
        before.slice(0, before.length - prefix.length) + common + suffix + after
      )
      return position - prefix.length + common.length + suffix.length
    }
    if (candidates.length > 1 && completionNotice.current !== before) {
      completionNotice.current = before
      setLines((previous) =>
        appendTerminalLines(previous, [{ text: candidates.join('  '), tone: 'muted' }])
      )
      return position
    }
    return null
  }

  return {
    input: search?.query ?? input,
    lines,
    path: displayPath(cwd),
    searching: search !== null,
    searchMatch,
    reverseSearch,
    complete,
    editInput,
    clearInput,
    clearOutput,
    submit,
    cancelInput,
    recallHistory,
  }
}

export type TerminalSession = ReturnType<typeof useTerminalSession>
