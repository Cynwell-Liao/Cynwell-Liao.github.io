import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getInitialTheme, useTheme } from './useTheme'

const mockSystemTheme = (isDark: boolean) => {
  const preference = Object.assign(new EventTarget(), {
    matches: isDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
  }) as unknown as MediaQueryList
  vi.spyOn(window, 'matchMedia').mockReturnValue(preference)
  return preference
}

describe('getInitialTheme', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it.each(['light', 'dark'] as const)('prefers a stored %s theme', (theme) => {
    localStorage.setItem('portfolio-theme', theme)
    mockSystemTheme(theme !== 'dark')

    expect(getInitialTheme()).toBe(theme)
  })

  it('falls back to the system preference for missing or invalid storage', () => {
    mockSystemTheme(true)
    expect(getInitialTheme()).toBe('dark')

    localStorage.setItem('portfolio-theme', 'sepia')
    expect(getInitialTheme()).toBe('dark')
  })

  it('falls back to the system preference when storage reads throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    mockSystemTheme(false)

    expect(getInitialTheme()).toBe('light')
  })
})

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('resumes system updates and can pin the current system color explicitly', () => {
    const preference = mockSystemTheme(true)
    localStorage.setItem('portfolio-theme', 'light')
    const { result } = renderHook(useTheme)
    act(() => {
      result.current.followSystemTheme()
    })
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('portfolio-theme')).toBeNull()
    act(() => {
      result.current.setPreferredTheme('dark')
    })
    expect(localStorage.getItem('portfolio-theme')).toBe('dark')
    act(() => {
      Object.defineProperty(preference, 'matches', { value: false })
      preference.dispatchEvent(new Event('change'))
    })
    expect(result.current.theme).toBe('dark')
  })

  it('applies, persists, and toggles the active theme', () => {
    localStorage.setItem('portfolio-theme', 'light')
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem('portfolio-theme')).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
  })

  it('still updates the document when storage writes throw', () => {
    mockSystemTheme(false)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('follows system changes until the visitor explicitly chooses a theme', () => {
    const preference = mockSystemTheme(false)
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
    const { result } = renderHook(() => useTheme())

    expect(localStorage.getItem('portfolio-theme')).toBeNull()
    act(() => {
      Object.defineProperty(preference, 'matches', { value: true })
      preference.dispatchEvent(new Event('change'))
    })
    expect(result.current.theme).toBe('dark')
    expect(meta).toHaveAttribute('content', '#020617')

    act(() => {
      result.current.toggleTheme()
    })
    expect(localStorage.getItem('portfolio-theme')).toBe('light')
    meta.remove()
  })
})
