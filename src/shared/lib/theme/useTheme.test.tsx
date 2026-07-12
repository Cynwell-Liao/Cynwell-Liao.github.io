import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getInitialTheme, useTheme } from './useTheme'

const mockSystemTheme = (isDark: boolean) =>
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: isDark,
  } as MediaQueryList)

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
})
