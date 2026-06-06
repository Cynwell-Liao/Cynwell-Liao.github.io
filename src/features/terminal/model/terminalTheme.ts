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
      'border-slate-300/50 bg-white/85 backdrop-blur-xl text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)] ring-1 ring-black/5',
    titleBar: 'border-b border-black/5 bg-transparent',
    title: 'text-slate-600',
    icon: 'text-slate-500',
    closeButton: 'hidden',
    body: 'bg-transparent',
    prompt: 'text-emerald-600 font-bold',
    promptSymbol: 'text-slate-600 font-bold',
    input: 'text-slate-900 placeholder:text-slate-400',
    cursor: 'text-slate-900',
    tones: {
      default: 'text-slate-900',
      accent: 'text-blue-600',
      error: 'text-red-600',
      success: 'text-emerald-600',
      muted: 'text-slate-500',
    },
  },
  dark: {
    chrome:
      'border-slate-700/50 bg-[#1e1e1e]/80 backdrop-blur-xl text-slate-100 shadow-[0_30px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10',
    titleBar: 'border-b border-white/10 bg-transparent',
    title: 'text-slate-300',
    icon: 'text-slate-400',
    closeButton: 'hidden',
    body: 'bg-transparent',
    prompt: 'text-emerald-400 font-bold',
    promptSymbol: 'text-slate-300 font-bold',
    input: 'text-slate-100 placeholder:text-slate-500',
    cursor: 'text-slate-100',
    tones: {
      default: 'text-slate-100',
      accent: 'text-blue-400',
      error: 'text-red-400',
      success: 'text-emerald-400',
      muted: 'text-slate-400',
    },
  },
}

export const getTerminalToneClass = (tone: TerminalTone, theme: ThemeMode) =>
  terminalThemeClasses[theme].tones[tone]
