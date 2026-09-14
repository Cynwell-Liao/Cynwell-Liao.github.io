import type { TerminalWindowProps } from '@features/terminal'

import type { ComponentType } from 'react'

type TerminalModule = { TerminalWindow: ComponentType<TerminalWindowProps> }

export function createTerminalLoader(importTerminal: () => Promise<TerminalModule>) {
  let pending: Promise<TerminalModule> | undefined

  return async () => {
    pending ??= importTerminal().catch((error: unknown) => {
      pending = undefined
      throw error
    })

    return (await pending).TerminalWindow
  }
}

export const loadTerminal = createTerminalLoader(() => import('@features/terminal'))
