import type { ThemeMode } from '@shared/types/common'

export type TerminalTone = 'default' | 'accent' | 'error' | 'success' | 'muted'

export interface TerminalThemeClasses {
  chrome: string
  titleBar: string
  title: string
  icon: string
  closeButton: string
  body: string
  prompt: string
  promptSymbol: string
  input: string
  cursor: string
  tones: Record<TerminalTone, string>
}

export const terminalThemeClasses: Record<ThemeMode, TerminalThemeClasses> = {
  light: {
    chrome:
      'border-slate-300/80 bg-[#f7f7f7] text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.22)]',
    titleBar: 'border-slate-300/80 bg-[#ececec]',
    title: 'text-slate-600',
    icon: 'text-secondary-700',
    closeButton:
      'text-slate-500 hover:bg-slate-200/80 hover:text-slate-950 focus-visible:outline-secondary-600',
    body: 'bg-[#fbfbfb]',
    prompt: 'text-secondary-700',
    promptSymbol: 'text-slate-500',
    input: 'text-slate-900 placeholder:text-slate-400',
    cursor: 'text-secondary-700',
    tones: {
      default: 'text-slate-800',
      accent: 'text-secondary-700',
      error: 'text-rose-700',
      success: 'text-emerald-700',
      muted: 'text-slate-500',
    },
  },
  dark: {
    chrome:
      'border-slate-700/70 bg-slate-950 text-slate-100 shadow-[0_24px_80px_rgba(15,23,42,0.45)]',
    titleBar: 'border-slate-800 bg-slate-900',
    title: 'text-slate-300',
    icon: 'text-cyan-300',
    closeButton:
      'text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-cyan-300',
    body: 'bg-slate-950',
    prompt: 'text-cyan-300',
    promptSymbol: 'text-slate-400',
    input: 'text-slate-100 placeholder:text-slate-500',
    cursor: 'text-cyan-300',
    tones: {
      default: 'text-slate-200',
      accent: 'text-cyan-300',
      error: 'text-rose-300',
      success: 'text-emerald-300',
      muted: 'text-slate-400',
    },
  },
}

export const getTerminalToneClass = (tone: TerminalTone, theme: ThemeMode) =>
  terminalThemeClasses[theme].tones[tone]
