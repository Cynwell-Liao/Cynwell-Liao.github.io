import { describe, expect, it, vi } from 'vitest'

import { createTerminalLoader, loadTerminal } from './loadTerminal'

const TerminalWindow = () => null

describe('terminal module loading', () => {
  it('shares concurrent imports and caches the loaded component', async () => {
    const importModule = vi.fn().mockResolvedValue({ TerminalWindow })
    const load = createTerminalLoader(importModule)
    const components = await Promise.all([load(), load()])
    expect(components).toEqual([TerminalWindow, TerminalWindow])
    expect(await load()).toBe(TerminalWindow)
    expect(importModule).toHaveBeenCalledTimes(1)
  })

  it('allows a fresh import attempt after rejection', async () => {
    const importModule = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ TerminalWindow })
    const load = createTerminalLoader(importModule)
    await expect(load()).rejects.toThrow('Network unavailable')
    expect(await load()).toBe(TerminalWindow)
    expect(importModule).toHaveBeenCalledTimes(2)
  })

  it('loads the public terminal entrypoint', async () => {
    expect(await loadTerminal()).toEqual(expect.any(Function))
  })
})
