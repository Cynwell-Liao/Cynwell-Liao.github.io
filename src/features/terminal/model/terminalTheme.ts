import type { ThemeMode } from '@shared/types/common'

export type TerminalTone = 'default' | 'error' | 'success' | 'muted'

const terminalTones: Record<ThemeMode, Record<TerminalTone, string>> = {
  light: {
    default: 'text-[#161616]',
    error: 'text-[#b42318]',
    success: 'text-[#237524]',
    muted: 'text-[#161616]',
  },
  dark: {
    default: 'text-[#f0f0f0]',
    error: 'text-[#ff817b]',
    success: 'text-[#87d68a]',
    muted: 'text-[#f0f0f0]',
  },
}

export const getTerminalToneClass = (tone: TerminalTone, theme: ThemeMode) =>
  terminalTones[theme][tone]
