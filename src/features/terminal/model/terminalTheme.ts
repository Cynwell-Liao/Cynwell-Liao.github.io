export type TerminalTone = 'default' | 'error' | 'success' | 'muted' | 'accent'

export const getTerminalToneClass = (tone: TerminalTone) => `terminal-tone--${tone}`
