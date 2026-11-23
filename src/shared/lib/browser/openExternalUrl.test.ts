import { describe, expect, it, vi } from 'vitest'

import { openExternalUrl } from './openExternalUrl'

describe('openExternalUrl', () => {
  const url = 'https://example.com/project'

  it('opens a desktop destination in an isolated tab during user activation', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const assign = vi.fn()

    openExternalUrl(url, { assign })

    expect(open).toHaveBeenCalledExactlyOnceWith(url, '_blank', 'noopener,noreferrer')
    expect(assign).not.toHaveBeenCalled()
  })

  it('uses the current context for touch and embedded browsers', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const assign = vi.fn()
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string): MediaQueryList =>
        Object.assign(new EventTarget(), {
          matches: query === '(pointer: coarse), (hover: none)',
          media: query,
          onchange: null,
        }) as unknown as MediaQueryList
    )

    openExternalUrl(url, { assign })

    expect(assign).toHaveBeenCalledExactlyOnceWith(url)
    expect(open).not.toHaveBeenCalled()
  })
})
