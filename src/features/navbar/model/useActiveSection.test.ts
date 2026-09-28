import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useActiveSection } from './useActiveSection'

import type { NavLink } from './nav.types'

const links = [
  { href: '#about', label: 'About' },
  { href: '#tech-stack', label: 'Tech Stack' },
  { href: '#projects', label: 'Projects' },
  { href: '#education', label: 'Education' },
] as const satisfies readonly NavLink[]

function flushFrame() {
  act(() => {
    vi.advanceTimersByTime(20)
  })
}

function scrollTo(y: number) {
  vi.stubGlobal('scrollY', y)
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
  flushFrame()
}

function changeHash(hash: string) {
  window.history.replaceState(null, '', hash || window.location.pathname)
  act(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('useActiveSection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('scrollY', 0)
    vi.stubGlobal('innerHeight', 1000)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(4600)
    window.history.replaceState(null, '', window.location.pathname)

    for (const [index, id] of [
      'home',
      'about',
      'tech-stack',
      'projects',
      'education',
    ].entries()) {
      const section = document.createElement('section')
      section.id = id
      section.getBoundingClientRect = () =>
        new DOMRect(0, index * 1000 - window.scrollY, 1000, 1000)
      document.body.append(section)
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
    window.history.replaceState(null, '', window.location.pathname)
  })

  it('tracks the viewport activation line, the last section at the bottom, and the hero', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    expect(result.current.activeHref).toBeNull()

    scrollTo(699)
    expect(result.current.activeHref).toBeNull()
    scrollTo(700)
    expect(result.current.activeHref).toBe('#about')
    scrollTo(1700)
    expect(result.current.activeHref).toBe('#tech-stack')
    scrollTo(2700)
    expect(result.current.activeHref).toBe('#projects')
    scrollTo(3600)
    expect(result.current.activeHref).toBe('#education')
    scrollTo(0)
    expect(result.current.activeHref).toBeNull()
  })

  it('selects a deep link immediately and holds it until scrolling reaches the target', () => {
    window.history.replaceState(null, '', '#projects')
    const { result } = renderHook(() => useActiveSection(links))
    expect(result.current.activeHref).toBe('#projects')
    flushFrame()

    scrollTo(800)
    expect(result.current.activeHref).toBe('#projects')
    scrollTo(2800)
    expect(result.current.activeHref).toBe('#projects')
    scrollTo(1800)
    expect(result.current.activeHref).toBe('#tech-stack')
  })

  it('selects clicked destinations before the native hash changes and skips intervening sections', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    act(() => {
      result.current.selectSection('#education')
    })
    expect(result.current.activeHref).toBe('#education')

    changeHash('#education')
    scrollTo(800)
    expect(result.current.activeHref).toBe('#education')
    scrollTo(2800)
    expect(result.current.activeHref).toBe('#education')
    scrollTo(3600)
    expect(result.current.activeHref).toBe('#education')
    scrollTo(2800)
    expect(result.current.activeHref).toBe('#projects')
  })

  it('handles hash history navigation and keeps the pill hidden while returning home', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    scrollTo(2800)
    changeHash('#about')
    expect(result.current.activeHref).toBe('#about')
    scrollTo(1800)
    expect(result.current.activeHref).toBe('#about')
    scrollTo(800)
    expect(result.current.activeHref).toBe('#about')

    changeHash('#home')
    expect(result.current.activeHref).toBeNull()
    scrollTo(750)
    expect(result.current.activeHref).toBeNull()
    scrollTo(0)
    expect(result.current.activeHref).toBeNull()
    scrollTo(800)
    expect(result.current.activeHref).toBe('#about')
  })

  it('does not lock a destination that is already in view', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    scrollTo(800)
    act(() => {
      result.current.selectSection('#about')
    })
    scrollTo(1800)
    expect(result.current.activeHref).toBe('#tech-stack')
  })

  it.each(['wheel', 'touchstart', 'scrollend'])(
    'releases a pending navigation on %s',
    (event) => {
      const { result } = renderHook(() => useActiveSection(links))
      flushFrame()
      scrollTo(800)
      act(() => {
        result.current.selectSection('#education')
      })
      expect(result.current.activeHref).toBe('#education')

      act(() => {
        window.dispatchEvent(new Event(event))
      })
      expect(result.current.activeHref).toBe('#about')
    }
  )

  it('releases a pending navigation for scrolling keys while ignoring typing and other keys', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    scrollTo(800)
    act(() => {
      result.current.selectSection('#education')
    })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    })
    expect(result.current.activeHref).toBe('#education')

    const input = document.createElement('input')
    document.body.append(input)
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    })
    expect(result.current.activeHref).toBe('#education')
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }))
    })
    expect(result.current.activeHref).toBe('#about')
  })

  it('falls back to the visible section when a navigation never completes', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    scrollTo(800)
    act(() => {
      result.current.selectSection('#education')
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.activeHref).toBe('#about')
  })

  it('updates the active section after the viewport resizes', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    scrollTo(650)
    expect(result.current.activeHref).toBeNull()
    vi.stubGlobal('innerHeight', 1200)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    flushFrame()
    expect(result.current.activeHref).toBe('#about')
  })

  it('keeps the anchor target selected after scrolling ends in a short viewport', () => {
    vi.stubGlobal('innerHeight', 300)
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    act(() => {
      result.current.selectSection('#projects')
    })
    scrollTo(3000 - 96)
    act(() => {
      window.dispatchEvent(new Event('scrollend'))
    })
    expect(result.current.activeHref).toBe('#projects')
  })

  it('ignores missing sections and unknown fragments without leaving a stale selection', () => {
    const { result } = renderHook(() => useActiveSection(links))
    flushFrame()
    scrollTo(800)
    document.getElementById('education')?.remove()
    act(() => {
      result.current.selectSection('#education')
    })
    expect(result.current.activeHref).toBe('#about')
    changeHash('#missing')
    expect(result.current.activeHref).toBe('#about')

    act(() => {
      result.current.selectSection('#projects')
    })
    document.getElementById('projects')?.remove()
    scrollTo(900)
    expect(result.current.activeHref).toBe('#about')
  })

  it('removes listeners, queued frames, and pending timeouts when unmounted', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const { result, unmount } = renderHook(() => useActiveSection(links))
    act(() => {
      result.current.selectSection('#education')
    })
    unmount()

    expect(vi.getTimerCount()).toBe(0)
    for (const name of [
      'scroll',
      'resize',
      'hashchange',
      'scrollend',
      'wheel',
      'touchstart',
      'keydown',
    ]) {
      expect(removeEventListener).toHaveBeenCalledWith(name, expect.any(Function))
    }
  })
})
